import { useFrame } from "@react-three/fiber";
import React from "react";
import * as THREE from "three";
import { faceUwU } from "../texture/sprite";

export const Face = (props: React.ComponentProps<"mesh">) => {
  return (
    <mesh {...props}>
      <meshStandardMaterial map={faceUwU} depthTest={false} transparent />
      <planeGeometry args={[1.6, 1.6]} />
    </mesh>
  );
};
