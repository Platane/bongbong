import * as React from "react";
import { Remote } from "./Remote";
import { Host } from "./Host";
import { Scene } from "../Scene/Scene";
import { Game, InputKind } from "../state/game";
import { GameScreen } from "./GameScreen";
import { tracks } from "../state/trackList";

export const App = () => {
  if (location.pathname.match(/\/scene\/?$/)) {
    return <Scene style={{ width: "100vw", height: "100vh" }} />;
  }

  if (location.pathname.match(/\/demo\/?$/)) {
    const [game, setGame] = React.useState((): Game => {
      const audio = new Audio();
      audio.src = tracks[0].src;
      audio.play();

      return {
        track: { audio, ...tracks[0] },
        inputs: [],
      };
    });
    const addInput = (kind: InputKind) =>
      setGame((g) => ({
        ...g,
        inputs: [
          ...g.inputs,
          {
            kind,
            time: game.track.audio.currentTime,
            hand: "left",
          },
        ],
      }));

    React.useEffect(() => {
      let i = 0;
      let cancel = 0;
      const loop = () => {
        while (
          game.track.partition[i] &&
          game.track.partition[i].time < game.track.audio.currentTime
        ) {
          addInput(game.track.partition[i].kind);
          i++;
        }
        cancel = requestAnimationFrame(loop);
      };
      loop();
      return () => cancelAnimationFrame(cancel);
    }, [game.track.audio]);

    return (
      <>
        <GameScreen game={game} />
        <div style={{ position: "fixed", bottom: "0", left: "0" }}>
          <button
            onClick={() =>
              setGame((g) => ({
                ...g,
                inputs: [
                  ...g.inputs,
                  {
                    kind: "ring",
                    time: game.track.audio.currentTime,
                    hand: "left",
                  },
                ],
              }))
            }
          >
            ring
          </button>
          <button
            onClick={() =>
              setGame((g) => ({
                ...g,
                inputs: [
                  ...g.inputs,
                  {
                    kind: "skin",
                    time: game.track.audio.currentTime,
                    hand: "left",
                  },
                ],
              }))
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
    null as string | null
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
