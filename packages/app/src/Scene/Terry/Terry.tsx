import { useFrame } from "@react-three/fiber";
import React from "react";
import { MeshToonMaterial } from "three";
import * as THREE from "three";
import { Face } from "./Face";
import { Arm } from "./Arm";

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

  return (
    <group
      ref={ref}
      position={[0, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        console.log("ccc");

        const angle = Math.random() * 2 - 1;

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
        <Face rotation={[-Math.PI / 2, 0, 0]} position={[0, 1, 0]} />
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
      <meshStandardMaterial color="blue" />
    </mesh>
  );
};

const createDrumGeometry = () => {
  const geometry = new THREE.BufferGeometry();

  // constant

  const radialSegments = 10;
  const heightSegments = 10;

  const radius = 0.7;
  const radiusBumpsRatio = 0.5;
  const height = 2;

  const getRadius = (k) =>
    radius * ((1 - ((k - 0.5) * 2) ** 2) * radiusBumpsRatio + 1);

  // buffers

  const positions: number[] = [];
  const normals: number[] = [];
  const uv: number[] = [];

  for (let i = 0; i < heightSegments; i++) {
    const k1 = i / heightSegments;
    const k2 = (i + 1) / heightSegments;

    const h1 = (k1 - 0.5) * height;
    const h2 = (k2 - 0.5) * height;

    const r1 = getRadius(k1);
    const r2 = getRadius(k2);

    for (let j = 0; j < radialSegments; j++) {
      const a0 = Math.PI * 2 * (j / radialSegments);
      const a1 = Math.PI * 2 * ((j + 1) / radialSegments);

      const a = [Math.sin(a0) * r1, h1, Math.cos(a0) * r1];
      const b = [Math.sin(a1) * r1, h1, Math.cos(a1) * r1];
      const c = [Math.sin(a1) * r2, h2, Math.cos(a1) * r2];
      const d = [Math.sin(a0) * r2, h2, Math.cos(a0) * r2];

      positions.push(...a, ...b, ...c);
      positions.push(...c, ...d, ...a);
    }
  }

  for (let j = 0; j < radialSegments; j++) {
    const a0 = Math.PI * 2 * (j / radialSegments);
    const a1 = Math.PI * 2 * ((j + 1) / radialSegments);

    const h = height * 0.5;
    positions.push(
      //
      0,
      h,
      0,

      Math.sin(a0) * radius,
      h,
      Math.cos(a0) * radius,

      Math.sin(a1) * radius,
      h,
      Math.cos(a1) * radius
    );

    positions.push(
      //
      0,
      -h,
      0,

      Math.sin(a1) * radius,
      -h,
      Math.cos(a1) * radius,

      Math.sin(a0) * radius,
      -h,
      Math.cos(a0) * radius
    );
  }

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(positions), 3)
  );

  geometry.computeVertexNormals();

  return geometry;
};
const drumGeometry = createDrumGeometry();
