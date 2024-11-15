import { createRoot } from "react-dom/client";
import React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Terry } from "./Terry/Terry";
import * as THREE from "three";
import { Note } from "./PlayTrack/Note";

export const Scene = (props: React.ComponentProps<"div">) => {
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
        <div
          style={{
            width: "min(  300px , 30%  )",
            height: "100%",
            backgroundColor: "#8a8",
            flexGrow: "10",
          }}
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
        dpr={2}
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
        <Inside containerDom={containerDom} />
      </Canvas>
    </div>
  );
};

const Inside = ({
  containerDom,
}: {
  containerDom: {
    container: React.RefObject<HTMLElement | null>;
    playTrack: React.RefObject<HTMLElement | null>;
    background: React.RefObject<HTMLElement | null>;
    terry: React.RefObject<HTMLElement | null>;
  };
}) => {
  // const renderTargets = React.useMemo(() => {
  //   const playTrack = new THREE.WebGLRenderTarget(128, 128);
  //   const background = new THREE.WebGLRenderTarget(128, 128);
  //   const terry = new THREE.WebGLRenderTarget(128, 128);

  //   return { playTrack, background, terry };
  // }, []);
  // React.useEffect(
  //   () => () => {
  //     renderTargets.terry.dispose();
  //     renderTargets.background.dispose();
  //     renderTargets.playTrack.dispose();
  //   },
  //   [renderTargets]
  // );

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

      const advance = 1.5;

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
        <orthographicCamera position={[0, 0, -1]} />

        {Array.from({ length: 100 }, (_, i) => (
          <Note key={i} stance={""} kind={"ring"} position={[i * 0.6, 0, 0]} />
        ))}
        <Note stance={""} kind={"skin"} position={[-3, 0, 0]} />
      </scene>

      <scene name="terry">
        <perspectiveCamera position={[0, 0, 7]} far={100} near={1} />
        <Terry />
      </scene>
    </group>
  );
};
