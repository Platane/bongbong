import * as React from "react";
import { useHostState } from "./useState";
import type { Game, Track } from "../state/game";
import QRCode from "react-qr-code";
import { PlayTrack } from "../PlayTrack/PlayTrack";
import { tracks } from "../state/trackList";

export const Host = ({ roomId }: { roomId: string }) => {
  const state = useHostState(roomId);

  const { game } = state;

  return (
    <>
      {!game && <Lobby roomId={roomId} {...state} />}
      {game && <Game roomId={roomId} game={game} />}
      <pre>{JSON.stringify({ roomId, ...state }, null, 2)}</pre>
    </>
  );
};

const Lobby = ({
  roomId,
  remotes,
  startGame,
}: {
  remotes: ReturnType<typeof useHostState>["remotes"];
  roomId: string;
  startGame: (track: Track) => void;
}) => {
  const [hoveredSrc, setHoveredSrc] = React.useState("");

  const joinUrl =
    window.origin + import.meta.env.BASE_URL + `room/${roomId}/remote`;

  return (
    <>
      <h2>{roomId}</h2>
      <a target="_blank" href={joinUrl} style={{ display: "block" }}>
        join with a new remote
      </a>
      <QRCode value={joinUrl} />
      <ul>
        {tracks.map((track) => (
          <li key={track.title} onMouseOver={() => setHoveredSrc(track.src)}>
            <button
              onClick={() => {
                if (remotes.length === 0) {
                  alert(
                    "no remote connected yet. Please scan the qr code with your phone"
                  );
                  return;
                }

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
  const joinUrl =
    window.origin + import.meta.env.BASE_URL + `room/${roomId}/remote`;

  return (
    <>
      <a target="_blank" href={joinUrl}>
        join with a new remote
      </a>
      <PlayTrack {...game} />
    </>
  );
};
