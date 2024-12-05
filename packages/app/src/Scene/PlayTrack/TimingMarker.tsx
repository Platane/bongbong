import { styled } from "@linaria/react";
import { generateTextShadowOutline } from "../../theme/typography";
import { Hit, Track } from "../../state/game";
import React from "react";

export const TimingMarker = ({
  hits,
  track,

  ...props
}: {
  hits: Hit[];
  track: Track;

  style?: React.CSSProperties;
  className?: string;
}) => {
  const recentSuccessHits = useRecentHits(hits, track.audio);

  return (
    <Container {...props}>
      {recentSuccessHits.map((hit) => {
        if (hit.type === "hit")
          return (
            <Text data-kind={hit.timing} key={hit.time}>
              {hit.timing}
            </Text>
          );

        if (hit.type === "miss")
          return (
            <Text data-kind="miss" key={hit.time}>
              Miss
            </Text>
          );

        if (hit.type === "unwarranted")
          return (
            <Text data-kind="unwarranted" key={hit.time}>
              Nope
            </Text>
          );

        return null;
      })}
    </Container>
  );
};

const useRecentHits = (hits: Hit[], audio: HTMLAudioElement) => {
  const duration = ANIMATION_DURATION + 0.2;
  const currentTime = audio.currentTime;

  const recentSuccessHits = hits
    .filter(
      (x) => x.type === "hit" || x.type === "miss" || x.type === "unwarranted"
    )
    .filter((x) => currentTime - duration < x.time && x.time < currentTime);

  const [, refresh] = React.useReducer((x) => 1 + x, 1);
  React.useEffect(() => {
    if (!recentSuccessHits[0]) return;
    const delta = recentSuccessHits[0].time + duration - currentTime;

    const timeout = setTimeout(refresh, delta * 1000);
    return () => clearTimeout(timeout);
  }, [recentSuccessHits[0]?.time]);

  return recentSuccessHits;
};

const ANIMATION_DURATION = 0.2;

const Container = styled.div`
  width: 10px;
  height: 10px;
  pointer-events: none;
`;
const Text = styled.div<{
  "data-kind": "good" | "ok" | "miss" | "unwarranted";
}>`
  flex-grow: 2;
  width: 100%;

  display: flex;
  justify-content: center;
  align-items: center;

  font-size: 72px;
  text-align: center;
  letter-spacing: -4px;
  font-weight: bolder;
  font-family: monospace;
  text-align: center;

  &[data-kind="good"] {
    color: #c0a942;
    text-shadow: ${generateTextShadowOutline({ color: "#74490a", width: 12 })},
      ${generateTextShadowOutline({ color: "#fff", width: 16 })};
    animation: bump ${ANIMATION_DURATION}s ease-out;
  }
  &[data-kind="ok"] {
    color: #b6b4a9;
    text-shadow: ${generateTextShadowOutline({ color: "#696661", width: 12 })},
      ${generateTextShadowOutline({ color: "#fff", width: 16 })};
    animation: bump ${ANIMATION_DURATION}s ease-out;
  }
  &[data-kind="miss"],
  &[data-kind="unwarranted"] {
    color: #b6b4a9;
    text-shadow: ${generateTextShadowOutline({ color: "#696661", width: 12 })},
      ${generateTextShadowOutline({ color: "#fff", width: 16 })};
    animation: bump ${ANIMATION_DURATION}s ease-out;
  }

  opacity: 0;
  position: absolute;

  @keyframes bump {
    0% {
      transform: translate(0, 0);
    }
    8% {
      transform: translate(0, -20px) scale(1.2, 1.2);
      opacity: 1;
    }
    40% {
      opacity: 1;
    }
    100% {
      transform: translate(0, -30px);
      opacity: 0;
    }
  }
  
  }
`;
