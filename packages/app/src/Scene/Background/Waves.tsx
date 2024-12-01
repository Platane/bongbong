import React from "react";
import * as THREE from "three";
import { textures } from "../texture/sprite";
import { useFrame } from "@react-three/fiber";

export const Waves = ({
  getT,
  width,
  height,

  ...props
}: {
  getT: () => number;
  width: number;
  height: number;
} & React.ComponentProps<"group">) => {
  const W = 2.2;
  const H = 0.5;

  const nw = Math.ceil(width / W);
  const nh = Math.ceil(height / H);

  const n = nw * nh;

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
    for (let y = nw; y--; )
      for (let x = nh; x--; ) {
        const A = H * 0.5;
        const theta = 1;
        const offset = (y * 45 + x ** 2 + (x * y) ** 3 * 13) % 17;

        positions.setXYZ(
          i,
          (x - nw * 0.5 + (y % 2) * 0.5) * W,
          (y - nh * 0.5) * H + Math.sin(t * theta + offset) * A,
          0
        );
        i++;
      }

    positions.needsUpdate = true;
  });

  return (
    <group {...props}>
      <points geometry={geometry}>
        <pointsMaterial
          size={140}
          map={textures.roundWave}
          depthTest
          depthWrite
          transparent
        />
      </points>
    </group>
  );
};
