import React from "react";
import * as THREE from "three";
import { textures } from "../texture/sprite";
import { useFrame } from "@react-three/fiber";

export const FlowerParticles = ({
  getT,
  width,
  height,

  ...props
}: {
  getT: () => number;
  width: number;
  height: number;
} & React.ComponentProps<"group">) => {
  const n = width * height;

  const geometry = React.useMemo(() => {
    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        Array.from({ length: n * 3 }, () => 0),
        3
      )
    );

    return geometry;
  }, [n]);

  React.useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    const t = getT();

    const positions = geometry.getAttribute("position");

    let i = 0;
    for (let x = width; x--; )
      for (let y = height; y--; ) {
        const A = 0.3;
        const theta = 0.5;
        const offset = (y * 45 + x ** 2 + (x * y) ** 3 * 13) % 17;

        positions.setXYZ(
          i,
          x + Math.cos(t * theta + offset) * A,
          y + Math.sin(t * theta + offset) * A,
          -100
        );

        i++;
      }

    positions.needsUpdate = true;
  });

  return (
    <group {...props}>
      <points geometry={geometry}>
        <pointsMaterial
          size={31}
          map={textures.flower1}
          depthTest
          transparent
          opacity={0.6}
          color={"#ff7300"}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};
