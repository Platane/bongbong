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
  const [history, setHistory] = React.useState(
    [] as {
      alpha: number;
      gamma: number;
      timestamp: number;
      hit: "skin" | "ring" | null;
    }[]
  );

  const handRef = React.useRef(hand === "left" ? 1 : -1);

  React.useEffect(() => {
    if (!window.DeviceMotionEvent) {
      markRemoteUnsupported();
      return;
    }

    let activeAlpha = false;
    let activeGamma = false;

    const abortController = new AbortController();
    window.addEventListener(
      "devicemotion",
      (event) => {
        const alpha = event.rotationRate?.alpha ?? null;
        const gamma = event.rotationRate?.gamma ?? null;

        if (
          !(
            typeof alpha === "number" &&
            typeof gamma === "number" &&
            Number.isFinite(alpha) &&
            Number.isFinite(gamma)
          )
        ) {
          markRemoteUnsupported();

          return;
        }

        let hit = null as null | "skin" | "ring";

        if (alpha < -120 && !activeAlpha) {
          activeAlpha = true;
          hit = "skin";
        }
        if (alpha > 20 && activeAlpha) {
          activeAlpha = false;
        }

        if (gamma * handRef.current < -120 && !activeGamma) {
          activeGamma = true;
          hit = "ring";
        }
        if (gamma * handRef.current > 20 && activeGamma) {
          activeGamma = false;
        }

        if (hit) inputRemote(hit);

        setHistory((h) => {
          const hs = [{ alpha, gamma, hit, timestamp: event.timeStamp }, ...h];
          while (hs.length > 120) hs.pop();
          return hs;
        });
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
      <svg viewBox="-10 -2 20 20">
        <path
          d={
            "M-10,10 " +
            history
              .map(({ alpha }, i, { length }) => {
                const x = i / length;
                return x * 20 - 10 + "," + (10 + alpha / 100);
              })
              .join(" ")
          }
          strokeWidth={0.06}
          stroke="blue"
          fill="none"
        />

        <path
          d={
            "M-10,15 " +
            history
              .map(({ gamma }, i, { length }) => {
                const x = i / length;
                return x * 20 - 10 + "," + (15 + gamma / 100);
              })
              .join(" ")
          }
          strokeWidth={0.06}
          stroke="orange"
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
      </svg>
    </>
  );
};
