import * as THREE from "three";
import type { Hit } from "../../state/game";
import React from "react";
import { useFrame } from "@react-three/fiber";
import { textures } from "../texture/sprite";

export const HitMarkers = ({ hits }: { hits: Hit[] }) => {
  const ANIMATION_DURATION = 3;

  const recentSuccessHits = useRecentSuccessHits(hits, ANIMATION_DURATION);

  return (
    <group>
      {recentSuccessHits.map((x) => (
        <SuccessEffect
          key={x.note.time}
          timestamp={x.input.timestamp}
          timing={x.timing}
        />
      ))}
    </group>
  );
};

export const useRecentSuccessHits = (hits: Hit[], duration = 1) => {
  const now = Date.now() / 1000;

  const recentSuccessHits = hits
    .filter((x) => x.type === "hit")
    .filter(
      (x) => now - duration < x.input.timestamp && x.input.timestamp < now
    );

  const [, refresh] = React.useReducer((x) => 1 + x, 1);
  React.useEffect(() => {
    if (!recentSuccessHits[0]) return;
    const delta = recentSuccessHits[0].input.timestamp + duration - now;

    const timeout = setTimeout(refresh, delta * 1000);
    return () => clearTimeout(timeout);
  }, [recentSuccessHits[0]?.input.timestamp]);

  return recentSuccessHits;
};

const SuccessEffect = ({
  timestamp,
  timing,

  ...props
}: {
  timestamp: number;
  timing: "good" | "ok";
} & React.ComponentProps<"group">) => {
  const ref = React.useRef<THREE.Group | null>(null);

  const [{ particles, particleState }] = React.useState(() => {
    const geometry = new THREE.BufferGeometry();

    const particleState = Array.from({ length: 35 }, () => {
      const A = (Math.floor(Math.random() * 2) + 2.3) * 4;
      const a = Math.random() * Math.PI * 2;

      const vx = Math.sin(a) * A;
      const vy = Math.cos(a) * A;

      return { vx, vy, x0: 0 + vx * 0.02, y0: 0 + vy * 0.02 };
    });

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        Array.from(particleState, (_, i) => [0, 0, 0]).flat(),
        3
      )
    );

    const material = new THREE.PointsMaterial({
      size: 46,
      map: textures.turtle,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
    });
    const particles = new THREE.Points(geometry, material);

    return { particles, particleState };
  });

  React.useEffect(() => {
    ref.current?.add(particles);

    return () => {
      particles.parent?.remove(particles);
    };
  }, [particles]);

  useFrame(() => {
    const t = Date.now() / 1000 - timestamp;

    const positions = particles.geometry.getAttribute("position");

    particleState.forEach(({ x0, y0, vx, vy }, i) => {
      const x = x0 + vx * t;
      const y = y0 + vy * t;

      positions.setXYZ(i, x, y, 0);
    });

    particles.material.opacity = Math.max(0, Math.min(1, 1.2 - t));

    positions.needsUpdate = true;
  });

  return <group {...props} ref={ref}></group>;
};
