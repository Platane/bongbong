import * as React from "react";
import type { Game, Track } from "../state/game";
import { PlayTrack } from "../PlayTrack/PlayTrack";
import { Scene } from "../Scene/Scene";

export const GameScreen = ({ game }: { game: Game }) => {
  return (
    <>
      <Scene
        style={{ maxWidth: "800px", width: "100%", height: "500px" }}
        {...game}
      />
      <PlayTrack {...game} />
    </>
  );
};
