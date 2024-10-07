import * as React from "react";

export const Remote = ({
  hand,
  inputRemote,
  switchHand,
  markRemoteUnsupported,
}: {
  hand: "left" | "right";
  inputRemote: (kind: "ring" | "skin") => void;
  switchHand: (hand: "left" | "right") => void;
  markRemoteUnsupported: () => void;
}) => {
  const [v, setV] = React.useState({ x: 0, y: 0, z: 0 });
  const [history, setHistory] = React.useState(
    [] as { la: number; dotg: number; hit: "skin" | "ring" | null }[]
  );

  React.useEffect(() => {
    if (!window.DeviceMotionEvent) {
      markRemoteUnsupported();
      return;
    }

    let active = false;

    const abortController = new AbortController();
    window.addEventListener(
      "devicemotion",
      (event) => {
        const xg = event.accelerationIncludingGravity?.x ?? null;
        const yg = event.accelerationIncludingGravity?.y ?? null;
        const zg = event.accelerationIncludingGravity?.z ?? null;

        const x = event.acceleration?.x ?? null;
        const y = event.acceleration?.y ?? null;
        const z = event.acceleration?.z ?? null;

        console.log(xg, x);

        if (
          typeof x === "number" &&
          typeof y === "number" &&
          typeof z === "number" &&
          Number.isFinite(x) &&
          Number.isFinite(y) &&
          Number.isFinite(z) &&
          typeof xg === "number" &&
          typeof yg === "number" &&
          typeof zg === "number" &&
          Number.isFinite(xg) &&
          Number.isFinite(yg) &&
          Number.isFinite(zg)
        ) {
          const g = { x: xg - x, y: yg - y, z: zg - z };

          const a = { x, y, z };

          const la = Math.hypot(x, y, z);

          const lg = Math.hypot(g.x, g.y, g.z);
          const dotg = (g.x * a.x + g.y * a.y + g.z * a.z) / (la * lg);

          const THRESHOLD_ACTIVATION = 6;
          const THRESHOLD_DEACTIVATION = THRESHOLD_ACTIVATION / 3;

          let hit = null as null | "skin" | "ring";

          if (la > THRESHOLD_ACTIVATION && !active) {
            if (Math.abs(dotg) < 0.5) hit = "ring";
            if (Math.abs(dotg) > 0.5) hit = "skin";

            if (hit) {
              active = true;
              inputRemote(hit);
            }
          }

          if (la < THRESHOLD_DEACTIVATION && active) {
            active = false;
          }

          setHistory((h) => {
            const hs = [{ la, dotg, hit }, ...h];
            while (hs.length > 100) hs.pop();
            return hs;
          });
          setV(a);
        } else {
          markRemoteUnsupported();
        }
      },
      { signal: abortController.signal }
    );

    return () => abortController.abort();
  }, []);

  return (
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
      <svg viewBox="-10 -2 20 9">
        <line
          style={{}}
          y2="0"
          y1="0"
          x1="0"
          x2={v.x}
          strokeWidth="2"
          stroke="purple"
        />
        <line
          style={{}}
          y2="3"
          y1="3"
          x1="0"
          x2={v.y}
          strokeWidth="2"
          stroke="blue"
        />
        <line
          style={{}}
          y2="6"
          y1="6"
          x1="0"
          x2={v.z}
          strokeWidth="2"
          stroke="orange"
        />

        <g>
          <path
            d={
              "M-10,0 " +
              history
                .map(({ la }, i, { length }) => {
                  const x = i / length;
                  return x * 20 - 10 + "," + (6 - la);
                })
                .join(" ")
            }
            strokeWidth={0.06}
            stroke="black"
            fill="none"
          />

          <line
            style={{}}
            y2={6 - 6}
            y1={6 - 6}
            x1="-10"
            x2="10"
            strokeWidth="0.04"
            stroke="red"
          />

          {history.map(({ hit }, i, { length }) => {
            const x = (i / length) * 20 - 10;

            if (!hit) return null;

            return (
              <circle
                r={0.2}
                cx={x}
                cy={0}
                fill={hit === "ring" ? "blue" : "red"}
              />
            );
          })}
        </g>
      </svg>
      <pre>{JSON.stringify(v, null, 2)}</pre>
    </>
  );
};
