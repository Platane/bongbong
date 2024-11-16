import * as React from "react";
import { getHits, getScore, type Game, type Track } from "../state/game";
import { PlayTrack } from "../PlayTrack/PlayTrack";
import { Scene } from "../Scene/Scene";

export const GameScreen = ({ game }: { game: Game }) => {
  const [key, refresh] = React.useReducer((x) => x + 1, 1);
  const { hits, shouldCheckAgainAtTime, nextNoteIndex } = React.useMemo(
    () =>
      getHits(game.track.partition, game.inputs, game.track.audio.currentTime),
    [game.inputs, game.track.partition, key]
  );

  const refreshTimeRef = React.useRef(shouldCheckAgainAtTime);
  refreshTimeRef.current = shouldCheckAgainAtTime;
  React.useEffect(() => {
    const onTimeUpdate = () => {
      if (game.track.audio.currentTime > refreshTimeRef.current) refresh();
    };
    game.track.audio.addEventListener("timeupdate", onTimeUpdate);
    return () =>
      game.track.audio.removeEventListener("timeupdate", onTimeUpdate);
  }, [game.track.audio]);

  const { score, multiplier, combo } = React.useMemo(
    () => getScore(hits),
    [hits]
  );

  console.log(score, multiplier);

  return (
    <>
      <Scene
        style={{ maxWidth: "800px", width: "100%", height: "500px" }}
        {...game}
        {...{ hits, nextNoteIndex, score, multiplier, combo }}
      />
      <PlayTrack {...game} />
    </>
  );
};
