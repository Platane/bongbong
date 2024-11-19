import React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Hit, Track } from "../../state/game";
import * as THREE from "three";
import { PlayTrack } from "./PlayTrack";

type Props = {
  hits: Hit[];
  nextNoteIndex: number;
  track: Track;
};

export const PlayTrackPanel = ({
  style,
  className,
  ...props
}: Props & {
  style?: React.CSSProperties;
  className?: string;
}) => (
  <Canvas
    dpr={[1, 2]}
    gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
    linear
    style={style}
    className={className}
  >
    <OrthoGraphicCamera />
    <PlayTrack {...props} />
  </Canvas>
);

const OrthoGraphicCamera = (
  props: React.ComponentProps<"orthographicCamera">
) => {
  const ref = React.useRef<THREE.OrthographicCamera | null>(null);

  useFrame(({ gl: renderer, set }) => {
    const camera = ref.current;

    if (!camera) return;

    set({ camera });

    const s = new THREE.Vector2();
    renderer.getSize(s);

    const width = s.x;
    const height = s.y;

    const advance = 1.2;

    camera.top = 1;
    camera.bottom = -1;
    camera.left = -advance;
    camera.right =
      width / (height / (camera.top - camera.bottom)) + camera.left;

    camera.updateProjectionMatrix();
  });

  return <orthographicCamera position={[0, 0, 1]} {...props} ref={ref} />;
};
