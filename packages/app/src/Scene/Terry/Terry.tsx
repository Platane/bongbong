import { useFrame } from "@react-three/fiber";
import React from "react";
import { MeshToonMaterial } from "three";
import * as THREE from "three";
import { Face } from "./Face";

export const Terry = ({
  pose,
}: {
  pose: {
    face: "happy";
    leftHand: { vy: number; vx: number };
    rightHand: { vy: number; vx: number };
  };
}) => {
  const ref = React.useRef<THREE.Mesh | null>(null);
  //   useFrame((state, delta) => (ref.current.rotation.x += delta));

  return (
    <group
      //
      rotation={[1.2, 0, 0.2]}
      ref={ref}
    >
      <Body />
      <Face rotation={[-Math.PI / 2, 0, 0]} position={[0, 1, 0]} />
    </group>
  );

  return null;
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

  console.log(positions);

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(positions), 3)
  );

  geometry.computeVertexNormals();

  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();

  console.log(geometry.drawRange, geometry, geometry.boundingBox);

  return geometry;

  return new THREE.CylinderGeometry(1, 1, 1, 5, 1);

  return geometry;
};
const drumGeometry = createDrumGeometry();
