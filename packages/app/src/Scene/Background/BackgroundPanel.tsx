import React from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { BackgroundFlower } from "./BackgroundFlower";
import { BackgroundWave } from "./BackgroundWave";

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
    onCreated={({ scene }) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 8;
      const ctx = canvas.getContext("2d")!;

      const linearGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      linearGradient.addColorStop(0, "#ffddbe");
      linearGradient.addColorStop(1, "#ff7300");

      ctx.fillStyle = linearGradient;

      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const texture = new THREE.CanvasTexture(canvas);

      scene.background = texture;
    }}
    {...props}
  >
    <Scene getT={getT} />
  </Canvas>
);

const Scene = ({ getT }: { getT: () => number }) => {
  const { size } = useThree();

  const width = 30;
  const height = 30;
  return (
    <>
      <PerspectiveCamera position={[0, 0, 3]} />
      <BackgroundFlower width={width} height={height} getT={getT} />;
      <BackgroundWave
        width={width}
        height={10}
        position={[0, -4.5, 0]}
        rotation={[0, 0, -0.18]}
        getT={getT}
      />
      ;
    </>
  );
};
