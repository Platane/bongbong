import * as React from "react";
import { getHits, getScore, type Game } from "../state/game";
import { PlayTrack } from "../PlayTrack/PlayTrack";
import { Layout } from "./Layout";
import { ScorePanel, Title } from "./ScorePanel";
import { PlayTrackPanel } from "../Scene/PlayTrack/PlayTrackPanel";
import { ComboPanel } from "./ComboPanel";
import { MascotPanel } from "../Scene/Mascot/MascotPanel";
import { BackgroundFlower } from "../Scene/Background/BackgroundFlower";
import { BackgroundPanel } from "../Scene/Background/BackgroundPanel";
import { DrumInput } from "../Scene/DrumInput/DrumInput";

export const GameScreen = ({
  game,
  style,
  className,
}: {
  game: Game;
  style?: React.CSSProperties;
  className?: string;
}) => {
  const { hits } = useHits(game);

  const { score, multiplier, combo } = React.useMemo(
    () => getScore(hits),
    [hits]
  );

  return (
    <Layout
      style={style}
      className={className}
      background={
        <BackgroundPanel
          getT={() => {
            const period = game.track.bpm / 60;
            return (game.track.audio.currentTime - game.track.offset) * period;
          }}
          style={{ opacity: 0.8 }}
        />
      }
      inputHelper={<DrumInput inputs={game.inputs} />}
      mascot={
        <MascotPanel
          combo={combo}
          inputs={game.inputs}
          style={{ width: "100%", height: "100%" }}
        />
      }
      score={
        <ScorePanel
          score={score}
          combo={combo}
          style={{ width: "100%", height: "100%" }}
        />
      }
      playTrack={
        <PlayTrackPanel
          track={game.track}
          hits={hits}
          style={{
            backgroundColor: "#333",
            boxShadow: "10px 0 10px 0 #000 inset",
          }}
        />
      }
      playTrackHeader={
        <ComboPanel
          multiplier={multiplier}
          combo={combo}
          style={{ width: "100%", height: "100%" }}
        />
      }
      title={<Title>{game.track.title}</Title>}
    />
  );
};

/**
 *
 * handle re-rendering when a new hit is expected
 * ie: on input and when a note should be registered as miss
 */
const useHits = (game: Game) => {
  const [key, refresh] = React.useReducer((x) => x + 1, 1);
  const { hits, shouldCheckAgainAtTime, nextNoteIndex } = React.useMemo(
    () =>
      getHits(game.track.partition, game.inputs, game.track.audio.currentTime),
    [game.inputs, game.track.partition, key]
  );
  const refreshTimeRef = React.useRef(shouldCheckAgainAtTime);
  refreshTimeRef.current = shouldCheckAgainAtTime;
  React.useEffect(() => {
    let raf: number;
    const loop = () => {
      if (game.track.audio.currentTime > refreshTimeRef.current) refresh();
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);

    // const onTimeUpdate = () => {
    //   if (game.track.audio.currentTime > refreshTimeRef.current) refresh();
    // };
    // game.track.audio.addEventListener("timeupdate", onTimeUpdate);
    // return () =>
    //   game.track.audio.removeEventListener("timeupdate", onTimeUpdate);
  }, [game.track.audio]);

  return { hits, nextNoteIndex };
};
