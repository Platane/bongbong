import React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Input } from "../../state/game";
import * as THREE from "three";
import { Terry } from "../Terry/Terry";

export const MascotPanel = ({
  style,
  className,
  ...props
}: {
  combo: number;
  inputs: Input[];

  style?: React.CSSProperties;
  className?: string;
}) => (
  <Canvas
    {...props}
    dpr={[1, 2]}
    gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
    linear
    style={style}
    className={className}
  >
    <Camera />

    <group>
      <ambientLight intensity={Math.PI / 2} />
      <directionalLight position={[1, 4, 2]} intensity={10} color={"#eee"} />
    </group>

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
  </Canvas>
);

const Camera = (props: React.ComponentProps<"perspectiveCamera">) => {
  const ref = React.useRef<THREE.PerspectiveCamera | null>(null);

  useFrame(({ gl: renderer, set }) => {
    const camera = ref.current;

    if (!camera) return;

    set({ camera });

    const s = new THREE.Vector2();
    renderer.getSize(s);

    const width = s.x;
    const height = s.y;

    camera.updateProjectionMatrix();
  });

  return (
    <perspectiveCamera
      position={[0, 1, 8]}
      far={30}
      near={2}
      {...props}
      ref={ref}
    />
  );
};