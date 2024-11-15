import { Game } from "../../state/game";
import * as THREE from "three";
import React from "react";

export const PlayTrack = ({ track, inputs }: Game & {}) => {
  const refGroup = React.useRef<THREE.Group | null>(null);

  return <group ref={refGroup}></group>;
};
