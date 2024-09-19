import * as React from "react";
import { useState } from "./useState";
import type { Game } from "./game";
import QRCode from "react-qr-code";
import { buildRoute } from "./routes";

export const App = () => {
  const state = useState();

  return (
    <>
      <h1>{state.type}</h1>
      <pre>{JSON.stringify(state, null, 2)}</pre>

      {state.type === "home" && <Home {...state} />}
      {state.type === "viewer" && !state.game && (
        <Lobby {...state} startGame={(track) => state.startGame(track, [])} />
      )}
      {state.type === "viewer" && state.game && <Game {...state} />}
      {state.type === "remote" && <Remote {...state} />}
    </>
  );
};

const Home = ({ createRoom }: { createRoom: () => void }) => (
  <>
    <button onClick={createRoom}>create room</button>
  </>
);

const Lobby = ({
  startGame,
  roomId,
}: {
  startGame: (track: string) => void;
  roomId: string;
}) => {
  const joinUrl = window.origin + buildRoute({ name: "new-remote", roomId });
  return (
    <>
      <h2>{roomId}</h2>
      <a target="_blank" href={joinUrl}>
        join with a new remote
      </a>
      <QRCode value={joinUrl} />
      <ul>
        {[
          //
          "bing",
          "bong",
        ].map((track) => (
          <li key={track}>
            <button onClick={() => startGame(track)}>{track}</button>
          </li>
        ))}
      </ul>
    </>
  );
};

const Remote = ({
  inputRemote,
}: {
  inputRemote: (kind: "ring" | "skin") => void;
}) => (
  <>
    <button onClick={() => inputRemote("ring")}>ring</button>
    <button onClick={() => inputRemote("skin")}>skin</button>
  </>
);

const Track = ({ trackStartedDate }: { trackStartedDate: number }) => {
  const [, refresh] = React.useReducer((x) => 1 + x, 1);
  React.useEffect(() => {
    let cancel: number;
    const loop = () => {
      refresh();
      cancel = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(cancel);
  }, []);

  return <pre>t: {Date.now() - trackStartedDate}ms</pre>;
};
const Game = ({ game }: { game: Game }) => {
  return <Track {...game} />;
};
