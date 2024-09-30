import * as React from "react";
import { useState } from "./useState";
import type { Game, Input } from "./game";
import QRCode from "react-qr-code";
import { buildRoute } from "./routes";
import { tracks } from "./trackList";
import { Track } from "../Track/Track";

export const App = () => {
  const state = useState();

  return (
    <>
      <h1>{state.type}</h1>

      {state.type === "home" && <Home {...state} />}
      {state.type === "viewer" && state.connectionStatus === "connecting" && (
        <div>connecting...</div>
      )}
      {state.type === "viewer" &&
        state.connectionStatus !== "connecting" &&
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

const Remote = ({
  hand,
  inputRemote,
  switchHand,
}: {
  hand: "left" | "right";
  inputRemote: (kind: "ring" | "skin") => void;
  switchHand: (hand: "left" | "right") => void;
}) => (
  <>
    <button onClick={() => inputRemote("ring")}>ring</button>
    <button onClick={() => inputRemote("skin")}>skin</button>

    <div>
      <input
        type="radio"
        id="hand-left"
        name="hand"
        value="left"
        checked={hand === "left"}
        onChange={(e) => e.target.checked && switchHand("left")}
      />
      <label htmlFor="hand-left">left</label>

      <input
        type="radio"
        id="hand-right"
        name="hand"
        value="right"
        checked={hand === "right"}
        onChange={(e) => e.target.checked && switchHand("right")}
      />
      <label htmlFor="hand-right">right</label>
    </div>
  </>
);

const Game = ({ game }: { game: Game }) => {
  return <Track {...game} />;
};
