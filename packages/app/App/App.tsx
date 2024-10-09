import * as React from "react";
import { useState } from "./useState";
import type { Game, Input } from "./game";
import QRCode from "react-qr-code";
import { buildRoute } from "./routes";
import { tracks } from "./trackList";
import { Track } from "../Track/Track";
import { Remote } from "./Remote";
import { WebRTC } from "./WebRTC";

export const App = () => {
  return <WebRTC />;

  const state = useState();

  return (
    <>
      <h1>{state.type}</h1>

      {state.type === "home" && <Home {...state} />}
      {/* {state.type === "viewer" && state.connectionStatus === "connecting" && (
        <div>connecting...</div>
      )} */}
      {state.type === "viewer" &&
        // state.connectionStatus !== "connecting" &&
        !state.game && (
          <Lobby {...state} startGame={(track) => state.startGame(track, [])} />
        )}
      {state.type === "viewer" && state.game && <Game {...state} />}
      {state.type === "remote" && <Remote {...state} />}

      <pre>{JSON.stringify(state, null, 2)}</pre>
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
                audio.volume = 0;
                audio.play().then(() => {
                  audio.pause();
                  audio.volume = 1;
                  startGame({ audio, ...track });
                });
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

const Game = ({ game, roomId }: { game: Game; roomId: string }) => {
  const joinUrl = window.origin + buildRoute({ name: "new-remote", roomId });

  return (
    <>
      <a target="_blank" href={joinUrl}>
        join with a new remote
      </a>
      <Track {...game} />
    </>
  );
};
