import * as React from "react";
import { useHostState } from "./useState";
import type { Game, Track } from "../state/game";
import QRCode from "react-qr-code";
import { PlayTrack } from "../PlayTrack/PlayTrack";
import { tracks } from "../state/trackList";
import { State as HostState } from "../state/hostState";

export const Host = ({ roomId }: { roomId: string }) => {
  const state = useHostState(roomId);

  const { game } = state;

  return (
    <>
      {!game && <Lobby roomId={roomId} {...state} />}
      {game && <Game roomId={roomId} game={game} />}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {state.remotes.map((remote) => (
          <Remote key={remote.id} remote={remote} />
        ))}
      </div>
      <pre>
        {JSON.stringify(
          {
            roomId,
            remotes: state.remotes.map((r) => ({ id: r.id, hand: r.hand })),
            game: state.game,
          },
          null,
          2
        )}
      </pre>
    </>
  );
};

const Remote = ({ remote }: { remote: HostState["remotes"][number] }) => {
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

  const t0 = (remote.sensorStats[0]?.timestamp ?? 0) / 1000;
  const t = Date.now() / 1000;

  return (
    <svg
      viewBox={`-3 -0.5 3.5 1`}
      style={{ width: "100%", height: 200, maxWidth: "600px" }}
    >
      <line
        x1={-99999}
        x2={99999}
        y1="0"
        y2="0"
        stroke="black"
        strokeWidth={0.006}
      />

      <line x1={0} x2={0} y1="-1" y2="1" stroke="grey" strokeWidth={0.01} />

      <text x={0.25} y={1} style={{ fontSize: 0.2 }}>
        {Math.ceil(remote.ping / 2)}ms
      </text>

      <path
        d={
          "M-99,0 " +
          remote.sensorStats
            .map(({ alpha, timestamp }) => {
              const x = timestamp / 1000 - t;
              const y = alpha / 100;

              return `L${x} ${y}`;
            })
            .join(" ")
        }
        strokeWidth={0.01}
        stroke="blue"
        fill="none"
      />

      <path
        d={
          "M-99,0 " +
          remote.sensorStats
            .map(({ gamma, timestamp }) => {
              const x = timestamp / 1000 - t;
              const y = gamma / 100;

              return `L${x} ${y}`;
            })
            .join(" ")
        }
        strokeWidth={0.01}
        stroke="red"
        fill="none"
      />
    </svg>
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
