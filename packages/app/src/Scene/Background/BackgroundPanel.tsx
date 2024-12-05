import React from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera, Tetrahedron } from "@react-three/drei";
import { FlowerParticles } from "./FlowerParticles";
import { Waves } from "./Waves";
import { Daruma } from "../Daruma/Daruma";
import { DarumaScene } from "./DarumaScene";

export const BackgroundPanel = ({
  getT,

  ...props
}: {
  getT: () => number;

  style?: React.CSSProperties;
  className?: string;
}) => (
  <Canvas
    dpr={[1, 2]}
    gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
    linear
    {...props}
  >
    <Scene getT={getT} />
  </Canvas>
);

const Scene = ({ getT }: { getT: () => number }) => {
  const { size, scene, set } = useThree();

  React.useLayoutEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 12;
    const ctx = canvas.getContext("2d")!;

    const linearGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    linearGradient.addColorStop(0, "#ffddbe");
    linearGradient.addColorStop(1, "#ff7300");

    ctx.fillStyle = linearGradient;

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);

    scene.background = texture;

    return () => texture.dispose();
  }, []);

  const aspectRatio = size.height / size.width;

  const width = size.width / 63;
  const height = width * aspectRatio;

  const viewport = { x: -width / 2, y: -height / 2, width, height };

  React.useLayoutEffect(() => {
    const camera = new THREE.OrthographicCamera();

    camera.left = viewport.x;
    camera.right = viewport.x + viewport.width;

    camera.bottom = viewport.y;
    camera.top = viewport.y + viewport.height;

    camera.position.set(0, 0, 1);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    camera.updateProjectionMatrix();

    set({ camera });
  }, [viewport.x, viewport.y, viewport.width, viewport.height]);

  const darumaScale = THREE.MathUtils.clamp(viewport.width / 26, 0.4, 1);

  return (
    <>
      <OrthographicCamera
        left={viewport.x}
        right={viewport.x + viewport.width}
        bottom={viewport.y}
        top={viewport.y + viewport.height}
      />

      <FlowerParticles
        width={Math.ceil(viewport.width) + 2}
        height={Math.ceil(viewport.height) + 2}
        getT={getT}
        position={[viewport.x - 1, viewport.y - 1, 0]}
      />

      <Waves
        size={50 + Math.min(120, (viewport.width / viewport.height) * 80)}
        width={viewport.width * 1.1}
        height={viewport.width * 0.1 + 2}
        position={[0, viewport.y + 2.5 - (viewport.width * 0.1 + 2) / 2, 0]}
        rotation={[0, 0, -0.12]}
        getT={getT}
      />

      <group>
        <ambientLight intensity={3} />
        <directionalLight
          position={[1, 4, 2]}
          intensity={2}
          color={"#ceb153"}
        />
      </group>

      <DarumaScene
        layers={perspective}
        getT={getT}
        width={viewport.width / darumaScale}
        scale={[darumaScale, darumaScale, darumaScale]}
        position={[viewport.x, viewport.y + 5, -2]}
      />
    </>
  );
};

const perspective = new THREE.Layers();
perspective.set(3);
