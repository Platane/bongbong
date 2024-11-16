import { useFrame } from "@react-three/fiber";
import React from "react";
import { MeshToonMaterial } from "three";
import * as THREE from "three";
import { Face } from "./Face";
import { Arm } from "./Arm";
import { createDrumGeometry } from "./drum";

export const Terry = ({
  pose,
}: {
  pose: {
    face: "happy";
    leftHand: { vy: number; vx: number };
    rightHand: { vy: number; vx: number };
  };
}) => {
  const ref = React.useRef<THREE.Group | null>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;

    ref.current.userData.t = (ref.current.userData.t ?? 0) + delta;

    ref.current.rotation.y =
      Math.sin(ref.current.userData.t * 1.4) * 0.5 - 0.35;
  });

  const [B, setB] = React.useState(() => new THREE.Vector3(3, 0, -1));
  const [stance, setRandomStance] = React.useReducer(
    () =>
      (["uwu", "openMouth", "mischief"] as const)[
        Math.floor(Math.random() * 3)
      ],
    "uwu"
  );

  return (
    <group
      ref={ref}
      position={[0, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        console.log("ccc");

        const angle = Math.random() * 2 - 1;

        setRandomStance();
        setB(
          new THREE.Vector3(1 + Math.cos(angle) * 2, 0, Math.sin(angle) * 2)
        );
      }}
    >
      <group
        //
        rotation={[1.4, 0, 0.1]}
      >
        <Body />
        <Face
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 1, 0]}
          stance={stance}
        />
        <Arm
          A={new THREE.Vector3(0.85, 0.72, 0.2)}
          B={B}
          particleCount={10}
          restingLength={2}
        />
        <Arm
          A={new THREE.Vector3(-0.85, 0.72, 0.2)}
          B={{ x: -B.x, y: -B.y, z: B.z }}
          particleCount={10}
          restingLength={1.8}
        />
      </group>
    </group>
  );
};

const Body = () => {
  return (
    <mesh geometry={drumGeometry}>
      {/* <meshToonMaterial color={"blue"} /> */}
      {/* <meshStandardMaterial color="blue" /> */}
      <meshNormalMaterial />
    </mesh>
  );
};

const drumGeometry = createDrumGeometry();
