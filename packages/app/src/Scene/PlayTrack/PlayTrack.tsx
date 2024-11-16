import { Hit, Game, getHits, Input, Partition, Track } from "../../state/game";
import * as THREE from "three";
import React from "react";
import { useFrame } from "@react-three/fiber";
import { Note } from "./Note";
import { target } from "../texture/sprite";

export const PlayTrack = ({
  track,
  hits,
  nextNoteIndex,
}: {
  track: Track;
  hits: Hit[];
  nextNoteIndex: number;
}) => {
  const refGroup = React.useRef<THREE.Group | null>(null);

  const refLine = React.useRef<THREE.Group | null>(null);

  useFrame(() => {
    if (!refLine.current) return;
    refLine.current.position.x = -timeToX(track.audio.currentTime);
  });

  return (
    <group ref={refGroup}>
      <sprite position={[0, 0, 0]} scale={[1.5, 1.5, 1.5]}>
        <spriteMaterial map={target} />
      </sprite>

      <group ref={refLine}>
        <PartitionMemoized
          hits={hits}
          partition={track.partition}
          nextNoteIndex={nextNoteIndex}
        />
        <Note kind="ring" stance="mischief" />
      </group>
    </group>
  );
};

const timeToX = (t: number) => t * 4;

const Partition = ({
  hits,
  partition,
  nextNoteIndex,
}: {
  hits: Hit[];
  partition: Partition;
  nextNoteIndex: number;
}) => {
  return (
    <>
      {partition.map((note, i) => {
        if (i < nextNoteIndex) return null;

        return (
          <Note
            position={[timeToX(note.time), 0, 0]}
            key={i}
            stance={"uwu"}
            kind={note.kind}
          />
        );
      })}
    </>
  );
};
const PartitionMemoized = React.memo(Partition);
