import React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Terry } from "./Terry/Terry";
import * as THREE from "three";
import { PlayTrack } from "./PlayTrack/PlayTrack";
import { Hit, Input, Track } from "../state/game";

type Props = {
  inputs: Input[];
  hits: Hit[];
  nextNoteIndex: number;
  track: Track;
  score: number;
  combo: number;
  multiplier: number;
};

export const Scene = ({
  track,
  hits,
  nextNoteIndex,
  score,
  combo,
  ...props
}: Props & React.ComponentProps<"div">) => {
  const containerDom = {
    container: React.useRef<HTMLCanvasElement | null>(null),
    playTrack: React.useRef<HTMLDivElement | null>(null),
    background: React.useRef<HTMLDivElement | null>(null),
    terry: React.useRef<HTMLDivElement | null>(null),
  };

  return (
    <div
      {...props}
      ref={containerDom.background}
      id="background"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f61",
        ...props.style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "min( 30% , 300px )",
          display: "flex",
          flexDirection: "row",
        }}
      >
        <div
          id="terry"
          ref={containerDom.terry}
          style={{
            width: "min(  200px , 80% , 90% )",
            height: "100%",
            backgroundColor: "#154",
          }}
        />
      </div>

      <div
        style={{
          width: "100%",
          height: "min( 30% , 300px )",
          display: "flex",
          flexDirection: "row",
        }}
      >
        <Score
          id="score"
          style={{
            width: "min(  300px , 30%  )",
            height: "100%",
            backgroundColor: "#8a8",
            flexGrow: "10",
          }}
          score={score}
          combo={combo}
        />
        <div
          id="playTrack"
          ref={containerDom.playTrack}
          style={{
            width: "100%",
            height: "100%",
            flexGrow: "1",
            backgroundColor: "#e38",
          }}
        />
      </div>

      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
        linear
        ref={containerDom.container}
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          zIndex: 2,
        }}
      >
        <InsideCanvas
          containerDom={containerDom}
          track={track}
          hits={hits}
          nextNoteIndex={nextNoteIndex}
        />
      </Canvas>
    </div>
  );
};

const InsideCanvas = ({
  containerDom,
  ...props
}: Props & {
  containerDom: {
    container: React.RefObject<HTMLElement | null>;
    playTrack: React.RefObject<HTMLElement | null>;
    background: React.RefObject<HTMLElement | null>;
    terry: React.RefObject<HTMLElement | null>;
  };
}) => {
  useFrame(({ gl: renderer, scene: globalScene }) => {
    renderer.autoClear = false;

    if (
      !containerDom.playTrack.current ||
      !containerDom.terry.current ||
      !containerDom.container.current
    )
      return;

    const rectContainer =
      containerDom.container.current.getBoundingClientRect();

    const size = new THREE.Vector2();
    renderer.getDrawingBufferSize(size);

    {
      const scene = globalScene.getObjectByName("playTrack") as THREE.Scene;

      const camera = scene.children[0] as THREE.OrthographicCamera;

      camera.lookAt(new THREE.Vector3(0, 0, 0));

      const rect = containerDom.playTrack.current.getBoundingClientRect();

      const left = Math.floor(rect.left - rectContainer.left);
      const bottom = Math.floor(rectContainer.bottom - rect.bottom);
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      scene.background = null;

      renderer.setViewport(left, bottom, width, height);
      renderer.setScissor(left, bottom, width, height);
      renderer.setScissorTest(true);

      const advance = 1.2;

      camera.top = 1;
      camera.bottom = -1;
      camera.left = -advance;
      camera.right =
        width / (height / (camera.top - camera.bottom)) + camera.left;

      camera.updateProjectionMatrix();

      renderer.render(scene, camera);
    }

    {
      const scene = globalScene.getObjectByName("terry") as THREE.Scene;

      const camera = scene.children[0] as THREE.PerspectiveCamera;

      const rect = containerDom.terry.current.getBoundingClientRect();

      const left = Math.floor(rect.left - rectContainer.left);
      const bottom = Math.floor(rectContainer.bottom - rect.bottom);
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      renderer.setViewport(left, bottom, width, height);
      renderer.setScissor(left, bottom, width, height);
      renderer.setScissorTest(true);

      const aspect = width / height;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();

      camera.position.z = 7 + (Math.max(1, 1 / aspect) - 1) * 12;

      renderer.clearDepth();
      renderer.clearStencil();
      renderer.render(scene, camera);
    }
  }, 1);

  const lightRig = (
    <group>
      <ambientLight intensity={Math.PI / 2} />
      <directionalLight position={[1, 4, 2]} intensity={10} color={"#eee"} />
    </group>
  );

  return (
    <group>
      <scene name="playTrack">
        <orthographicCamera position={[0, 0, 1]} />

        <PlayTrack {...props} />
      </scene>

      <scene name="terry">
        <perspectiveCamera position={[0, 1, 7]} far={100} near={1} />
        <Terry
          pose={{
            face: "happy",
            leftHand: {
              vy: 0,
              vx: 0,
            },
            rightHand: {
              vy: 0,
              vx: 0,
            },
          }}
        />
        {lightRig}
      </scene>
    </group>
  );
};

const Score = ({
  score,
  combo,
  ...props
}: {
  score: number;
  combo: number;
} & React.ComponentProps<"div">) => (
  <div
    {...props}
    style={{
      ...props.style,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "10px 20px",
    }}
  >
    <span style={{ fontFamily: "cursive", fontSize: "50px" }}>{combo}</span>
    <span
      style={{
        alignSelf: "flex-start",
        fontFamily: "cursive",
        fontSize: "20px",
      }}
    >
      {score}
    </span>
  </div>
);
