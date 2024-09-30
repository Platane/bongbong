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

  return (
    <>
      <pre>t: {t}s</pre>
      <svg viewBox={`${t - 1.8} 0 5 1`} style={{ width: "100%" }}>
        <line x1={t} x2={t} y1="0" y2="1" stroke="grey" strokeWidth={0.01} />

        {Array.from({ length: Math.ceil(duration + 3) }, (_, s) => (
          <line
            key={s}
            x1={s}
            x2={s}
            y1="0"
            y2="1"
            stroke="purple"
            strokeWidth={0.005}
          />
        ))}

        {inputs.map((o, i) => (
          <circle
            key={i}
            cx={o.time}
            cy={0.5}
            r={0.1}
            fill={o.kind === "ring" ? "blue" : "red"}
          />
        ))}
      </svg>
    </>
  );
};
