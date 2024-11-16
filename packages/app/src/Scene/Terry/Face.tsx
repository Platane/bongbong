import { useFrame } from "@react-three/fiber";
import React from "react";
import * as THREE from "three";
import { faceMischief, faceOpenMouth, faceUwU } from "../texture/sprite";

export const Face = ({
  stance,
  ...props
}: {
  stance: "uwu" | "openMouth" | "mischief";
} & React.ComponentProps<"mesh">) => {
  return (
    <mesh {...props}>
      <meshStandardMaterial
        map={
          (stance === "mischief" && faceMischief) ||
          (stance === "openMouth" && faceOpenMouth) ||
          faceUwU
        }
        depthTest={false}
        transparent
      />
      <planeGeometry args={[1.6, 1.6]} />
    </mesh>
  );
};
