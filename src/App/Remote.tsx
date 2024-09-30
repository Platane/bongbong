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

  React.useEffect(() => {
    if (window.DeviceMotionEvent != undefined) {
      markRemoteUnsupported();
      return;
    }

    const abortController = new AbortController();
    window.addEventListener(
      "devicemotion",
      (event) => {
        const x = event.accelerationIncludingGravity?.x ?? null;
        const y = event.accelerationIncludingGravity?.y ?? null;
        const z = event.accelerationIncludingGravity?.z ?? null;

        if (
          typeof x === "number" &&
          typeof y === "number" &&
          typeof z === "number" &&
          Number.isFinite(x) &&
          Number.isFinite(y) &&
          Number.isFinite(z)
        ) {
          setV({ x, y, z });
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
      <svg viewBox="-10 -2 20 8">
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
      </svg>
      <pre>{JSON.stringify(v, null, 2)}</pre>
    </>
  );
};
