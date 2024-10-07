import React from "react";
import { Game } from "../App/game";

export const Track = ({ track, inputs }: Game & {}) => {
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

  const period = 4 / (track.bpm / 60);

  return (
    <>
      <pre>t: {t}s</pre>
      <svg
        viewBox={`${t - 1.8} 0 5 1`}
        style={{ width: "100%", maxWidth: "1200px" }}
      >
        <line x1={t} x2={t} y1="0" y2="1" stroke="grey" strokeWidth={0.01} />

        {Array.from({ length: Math.ceil(duration + 3) }, (_, s) => (
          <line
            key={s}
            x1={s}
            x2={s}
            y1="0.2"
            y2="0.4"
            stroke="purple"
            strokeWidth={0.005}
          />
        ))}

        {Array.from(
          { length: Math.ceil((duration - track.offset) / period) },
          (_, k) => (
            <line
              key={k}
              x1={track.offset + k * period}
              x2={track.offset + k * period}
              y1="0"
              y2="1"
              stroke="black"
              strokeWidth={0.005}
            />
          )
        )}

        {track.partition.map(({ time, kind }, i) => (
          <circle
            key={i}
            cx={time}
            cy={0.5}
            r={0.15}
            stroke={kind === "ring" ? "blue" : "red"}
            strokeWidth={0.05}
            fill="none"
          />
        ))}

        {inputs.map((o, i) => (
          <circle
            key={i}
            cx={o.time}
            cy={0.5}
            r={0.1}
            fill={o.kind === "ring" ? "blue" : "red"}
            stroke="grey"
            strokeLinecap="round"
            strokeWidth={0.05}
            strokeDasharray={3.14 * 0.1}
            strokeDashoffset={
              o.hand === "left" ? 3.14 * 0.1 * -0.5 : 3.14 * 0.1 * 0.5
            }
          />
        ))}
      </svg>
      <button onClick={() => console.log("currentTime", t)}>timestamp</button>
    </>
  );
};
