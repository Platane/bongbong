import { useFrame } from "@react-three/fiber";
import React from "react";
import * as THREE from "three";
import { textures } from "../texture/sprite";

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
          (stance === "mischief" && textures.faceMischief) ||
          (stance === "openMouth" && textures.faceOpenMouth) ||
          textures.faceUwU
        }
        depthTest={false}
        transparent
      />
      <planeGeometry args={[1.5, 1.5]} />
    </mesh>
  );
};
