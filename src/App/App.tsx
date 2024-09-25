import * as React from "react";
import { useState } from "./useState";
import type { Game, Input } from "./game";
import QRCode from "react-qr-code";
import { buildRoute } from "./routes";
import { tracks } from "./trackList";

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
  startGame: (track: Game["track"]) => void;
  roomId: string;
}) => {
  const [hoveredSrc, setHoveredSrc] = React.useState("");

  const joinUrl = window.origin + buildRoute({ name: "new-remote", roomId });
  return (
    <>
      <h2>{roomId}</h2>
      <a target="_blank" href={joinUrl}>
        join with a new remote
      </a>
      <QRCode value={joinUrl} />
      <ul>
        {tracks.map((track) => (
          <li key={track.title} onMouseOver={() => setHoveredSrc(track.src)}>
            <button
              onClick={() => {
                const audio = new Audio();
                audio.src = track.src;
                startGame({ audio, ...track });
              }}
            >
              {track.title}
            </button>
          </li>
        ))}
      </ul>
      {hoveredSrc && <link href={hoveredSrc} rel="preload" as="fetch" />}
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

const Track = ({ trackStartedDate, track, inputs }: Game & {}) => {
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

  // const t = Date.now() - trackStartedDate;
  const t = track.audio.currentTime;
  const duration = track.audio.duration;

  return (
    <>
      <pre>t: {t}s</pre>
      <svg viewBox={`${t} 0 3 1`} style={{ width: "100%" }}>
        {Array.from({ length: Math.ceil(duration + 3) }, (_, s) => (
          <line
            key={s}
            x1={s}
            x2={s}
            y1="0"
            y2="1"
            stroke="purple"
            strokeWidth={0.01}
          />
        ))}

        {inputs.map((o, i) => (
          <circle
            key={i}
            cx={o.timestamp}
            cy={0.5}
            r={0.1}
            fill={o.kind === "ring" ? "blue" : "red"}
          />
        ))}
      </svg>
    </>
  );
};
const Game = ({ game }: { game: Game }) => {
  return <Track {...game} />;
};
