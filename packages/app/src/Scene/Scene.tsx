import { createRoot } from "react-dom/client";
import React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Terry } from "./Terry/Terry";
import * as THREE from "three";
import { Note } from "./PlayTrack/Note";

export const Scene = (props: React.ComponentProps<"div">) => {
  const containerDom = {
    playTrack: React.useRef<HTMLDivElement | null>(null),
    background: React.useRef<HTMLDivElement | null>(null),
    terry: React.useRef<HTMLDivElement | null>(null),
  };

  return (
    <div
      {...props}
      ref={containerDom.background}
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
          ref={containerDom.playTrack}
          style={{
            width: "min(  300px , 30%  )",
            height: "100%",
            backgroundColor: "#8a8",
            flexGrow: "10",
          }}
        />
        <div
          style={{
            width: "100%",
            height: "100%",
            flexGrow: "1",
            backgroundColor: "#e38",
          }}
        />
      </div>

      <Canvas
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
    playTrack: React.RefObject<HTMLDivElement | null>;
    background: React.RefObject<HTMLDivElement | null>;
    terry: React.RefObject<HTMLDivElement | null>;
  };
}) => {
  const renderTargets = React.useMemo(() => {
    const playTrack = new THREE.WebGLRenderTarget(128, 128);
    const background = new THREE.WebGLRenderTarget(128, 128);
    const terry = new THREE.WebGLRenderTarget(128, 128);

    return { playTrack, background, terry };
  }, []);
  React.useEffect(
    () => () => {
      renderTargets.terry.dispose();
      renderTargets.background.dispose();
      renderTargets.playTrack.dispose();
    },
    [renderTargets]
  );

  useFrame(({ gl, scene: globalScene }) => {
    gl.autoClear = false;

    {
      const scene = globalScene.getObjectByName("background") as THREE.Scene;

      const camera = scene.children[0] as THREE.OrthographicCamera;

      camera.lookAt(new THREE.Vector3(0, 0, 0));

      // scene.background = new THREE.Color("#a34");

      gl.render(scene, camera);
    }
    {
      const scene = globalScene.getObjectByName("terry") as THREE.Scene;

      const camera = scene.children[0] as THREE.PerspectiveCamera;

      camera.lookAt(new THREE.Vector3(0, 0, 0));

      gl.clearDepth();
      gl.clearStencil();
      gl.render(scene, camera);
    }

    gl.autoClear = true;

    // /** Render scene from camera A to a render target */
    // scene.overrideMaterial = mnm;
    // gl.setRenderTarget(aTarget);
    // gl.render(scene, ACam.current);

    // /** Render scene from camera B to a different render target */
    // scene.overrideMaterial = dmm;
    // gl.setRenderTarget(bTarget);
    // gl.render(scene, BCam.current);

    // scene.background = originalBg;
    // // render main scene
    // scene.overrideMaterial = null;
    // gl.setRenderTarget(null);
    // gl.render(scene, camera);

    // // render GUI panels on top of main scene
    // gl.render(guiScene, guiCamera.current);
    // gl.autoClear = true;
  }, 1);

  const lightRig = (
    <group>
      <ambientLight intensity={Math.PI / 2} />
      <directionalLight position={[1, 4, 2]} intensity={10} color={"#eee"} />
    </group>
  );

  return (
    <group>
      <scene name="background">
        <orthographicCamera position={[0, 0, -1]} />

        {Array.from({ length: 100 }, (_, i) => (
          <Note key={i} stance={""} kind={"ring"} position={[i * 0.6, 0, 0]} />
        ))}
      </scene>

      <scene name="terry">
        <perspectiveCamera position={[0, 0, 20]} far={100} near={1} />
        {lightRig}
        <Terry />
      </scene>
    </group>
  );
};
