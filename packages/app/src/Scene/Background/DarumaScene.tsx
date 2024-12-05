import React from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Daruma } from "../Daruma/Daruma";

const { clamp, lerp, inverseLerp } = THREE.MathUtils;

export const DarumaScene = ({
  getT,
  width,

  ...props
}: {
  getT: () => number;
  width: number;
} & React.ComponentProps<"group">) => {
  const ref = React.useRef<THREE.Group | null>(null);

  useFrame(() => {
    const darumas = ref.current?.children;

    if (!darumas) return;

    const gt = getT();

    for (let i = darumas.length; i--; ) {
      const o = darumas[i];

      const k = i / darumas.length;
      const offset = ((k * 45 + k ** 2 + k ** 3 * 13) % 17) / 17;

      const a1 = lerp(-0.3, 0.3, offset);
      const a2 = lerp(1.5, 1.2, offset ** 2 % 1);
      const y0 = lerp(3.8, 4.7, offset ** 3 % 1);

      const u = gt / 4 + (Math.round(offset * 4) / 4) * 0.5;
      const t = u % 1;

      const W = width + 5;

      o.position.x = ((Math.floor(u) * 4.5 + (k + 0.5) * W + offset) % W) - 4.5;

      o.position.y = 0;
      o.rotation.set(0, a2, 0);
      o.scale.y = 1;

      if (t < 0.2) {
        const h = inverseLerp(0, 0.2, t);

        o.scale.y = lerp(1, 0.7, h);
        o.position.y = -lerp(0, 0.5, h);
        o.position.x += lerp(0, 0.5, h);
        o.rotateX(lerp(0, 0.6, h));
      }

      if (0.2 <= t && t < 0.6) {
        const h = inverseLerp(0.2, 0.6, t);
        o.scale.y = lerp(0.7, 1, clamp(h * 4, 0, 1));

        if (h < 0.5) o.rotateX(0.8);
        else {
          const hh = inverseLerp(0.5, 1, h);
          o.rotateX(lerp(0.8, 0, hh));
        }

        o.position.x += 0.5 + h * 4;
        o.position.y = (1 - (h * 2 - 1) ** 2) * y0;
      }

      if (0.6 <= t && t < 1) {
        const h = inverseLerp(0.6, 1, t);

        const s = clamp(1 - (inverseLerp(0, 0.2, h) * 2 - 1) ** 2, 0, 1);

        o.scale.y = lerp(1, 0.7, s);
        o.position.y = -lerp(0, 0.5, s);

        const ay = clamp((1 - (h * 2 - 1) ** 2) * 1.3, 0, 1);

        const az = Math.sin(clamp(h * 1.6 - 0.21, 0, 1) * Math.PI * 2) * 0.3;

        o.rotation.set(0, lerp(a2, a1, ay), az);

        o.position.x += 0.5 + 4;
      }
    }
  });

  return (
    <group {...props} ref={ref}>
      {colors.slice(0, Math.ceil(width / 6.5)).map((color, i) => (
        <group key={i}>
          <Daruma color={color} scale={[1.5, 1.5, 1.5]} />
        </group>
      ))}
    </group>
  );
};

const colors = [
  "red",
  "yellow",
  "black",
  "purple",
  "black",
  "red",
  "purple",
  "yellow",
  "black",
] as const;
