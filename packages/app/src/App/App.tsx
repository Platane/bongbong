import * as React from "react";
import { Remote } from "./Remote";
import { Host } from "./Host";
import { Scene } from "../Scene/Scene";
import { Game } from "../state/game";
import { GameScreen } from "./GameScreen";
import { tracks } from "../state/trackList";

export const App = () => {
  if (location.pathname.match(/\/scene\/?$/)) {
    return <Scene style={{ width: "100vw", height: "100vh" }} />;
  }

  if (location.pathname.match(/\/demo\/?$/)) {
    const game = React.useMemo((): Game => {
      const audio = new Audio();
      audio.src = tracks[0].src;
      audio.play();

      return {
        track: { audio, ...tracks[0] },
        inputs: [],
      };
    }, []);

    React.useEffect(() => {
      const interval = setInterval(() => {
        game.inputs.push({
          kind: "ring",
          time: game.track.audio.currentTime,
          hand: "left",
        });
      }, 1200);

      return () => clearInterval(interval);
    }, [game]);

    return (
      <>
        <GameScreen game={game} />
        <div style={{ position: "fixed", bottom: "0", left: "0" }}>
          <button
            onClick={() =>
              game.inputs.push({
                kind: "ring",
                time: game.track.audio.currentTime,
                hand: "left",
              })
            }
          >
            ring
          </button>
          <button
            onClick={() =>
              game.inputs.push({
                kind: "skin",
                time: game.track.audio.currentTime,
                hand: "left",
              })
            }
          >
            skin
          </button>
        </div>
      </>
    );
  }

  {
    const [, remoteRoomId] =
      location.pathname.match(/\/room\/(\w+)\/remote\/?/) ?? [];

    if (remoteRoomId) return <Remote roomId={remoteRoomId} />;
  }

  return <Viewer />;
};

const Viewer = () => {
  const [roomId, createRoom] = React.useReducer(
    (r) => r ?? generateId(),
    null as string | null,
  );

  if (roomId) return <Host roomId={roomId} />;
  return <Home createRoom={createRoom} />;
};

const Home = ({ createRoom }: { createRoom: () => void }) => (
  <>
    <button onClick={createRoom}>create room</button>
  </>
);

const generateId = () =>
  Math.random()
    .toString(36)
    .slice(2, 6)
    .split("")
    .map((c) => (Math.random() > 0.5 ? c.toUpperCase() : c))
    .join("");
