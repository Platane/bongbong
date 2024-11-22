import type { Hit, Partition, Track } from "../../state/game";
import * as THREE from "three";
import React from "react";
import { useFrame } from "@react-three/fiber";
import { Note } from "./Note";
import { HitMarkers } from "./HitMarkers";
import { textures } from "../texture/sprite";

export const PlayTrack = ({ track, hits }: { track: Track; hits: Hit[] }) => {
  const refGroup = React.useRef<THREE.Group | null>(null);

  const refLine = React.useRef<THREE.Group | null>(null);

  useFrame(() => {
    if (!refLine.current) return;
    refLine.current.position.x = -timeToX(track.audio.currentTime);
  });

  return (
    <group ref={refGroup}>
      <Target />

      <group ref={refLine}>
        <PartitionMemoized hits={hits} partition={track.partition} />
      </group>

      <HitMarkersMemoized hits={hits} />
    </group>
  );
};

const Target = () => (
  <sprite position={[0, 0, 0]} scale={[1.5, 1.5, 1.5]}>
    <spriteMaterial map={textures.target} />
  </sprite>
);

const timeToX = (t: number) => t * 4;

const Partition = ({
  hits,
  partition,
}: {
  hits: Hit[];
  partition: Partition;
}) => {
  return (
    <>
      {partition.map((note, i) => {
        const hit = hits.find(
          (h) => (h.type === "hit" || h.type === "miss") && h.note === note
        );

        if (hit?.type === "hit") return null;

        if (!hit || hit.type === "miss")
          return (
            <Note
              miss={hit?.type === "miss"}
              position={[timeToX(note.time), 0, 0]}
              key={i}
              stance={"uwu"}
              kind={note.kind}
            />
          );

        return null;
      })}
    </>
  );
};
const PartitionMemoized = React.memo(Partition);
const HitMarkersMemoized = React.memo(HitMarkers);
