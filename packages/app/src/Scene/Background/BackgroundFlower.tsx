import React from "react";
import * as THREE from "three";
import { textures } from "../texture/sprite";
import { useFrame } from "@react-three/fiber";

export const BackgroundFlower = ({
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

  const flowers = React.useMemo(() => {
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
      size: 0.8,
      sizeAttenuation: true,
      map: textures.flower1,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      transparent: true,
      opacity: 0.6,
      color: "#ff7300",
    });

    const particles = new THREE.Points(geometry, material);

    return { particles, geometry, material };
  }, [width, height]);

  React.useEffect(() => {
    ref.current?.add(flowers.particles);

    return () => {
      flowers.particles.parent?.remove(flowers.particles);
      flowers.geometry.dispose();
      flowers.material.dispose();
    };
  }, [flowers]);

  useFrame(() => {
    const t = getT();

    const positions = flowers.particles.geometry.getAttribute("position");

    let i = 0;
    for (let x = width; x--; )
      for (let y = height; y--; ) {
        const A = 0.3;
        const theta = 4;
        const offset = (i * 17 + i ** 3 * 13 + i ** 7 * 11) % 3;

        positions.setXYZ(
          i,
          x - width * 0.5 + Math.cos(t * theta + offset) * A,
          y - height * 0.5 + Math.sin(t * theta + offset) * A,
          -(y - height * 0.5) * 0.04
        );
        i++;
      }

    positions.needsUpdate = true;
  });

  return <group {...props} ref={ref}></group>;
};
