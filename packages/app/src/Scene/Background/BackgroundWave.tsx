import React from "react";
import * as THREE from "three";
import { textures } from "../texture/sprite";
import { useFrame } from "@react-three/fiber";

export const BackgroundWave = ({
  getT,
  width,
  height,

  ...props
}: {
  getT: () => number;
  width: number;
  height: number;
} & React.ComponentProps<"group">) => {
  const ref = React.useRef<THREE.Group | null>(null);

  const waves = React.useMemo(() => {
    const n = width * height;

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        Array.from({ length: n * 3 }, () => 0),
        3
      )
    );

    const material = new THREE.PointsMaterial({
      size: 3,
      map: textures.roundWave,
      depthTest: true,
      transparent: true,
      depthWrite: true,
    });

    const particles = new THREE.Points(geometry, material);

    return { particles, geometry, material };
  }, [width, height]);

  React.useEffect(() => {
    ref.current?.add(waves.particles);

    return () => {
      waves.particles.parent?.remove(waves.particles);
      waves.geometry.dispose();
      waves.material.dispose();
    };
  }, [waves]);

  useFrame(() => {
    const t = getT();

    const positions = waves.particles.geometry.getAttribute("position");

    let i = 0;
    for (let y = height; y--; )
      for (let x = width; x--; ) {
        const A = 0.2;
        const theta = 1;
        const offset = (i * 17 + i ** 3 * 13 + i ** 7 * 11) % 3;

        positions.setXYZ(
          i,
          (x - width * 0.5 + (y % 2) * 0.5) * 2,
          (y - height * 0.5) * 0.5 + Math.sin(t * theta + offset) * A,
          -(y - height * 0.5) * 0.05 + 1
        );
        i++;
      }

    positions.needsUpdate = true;
  });

  return <group {...props} ref={ref}></group>;
};
