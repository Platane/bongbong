import { styled } from "@linaria/react";
import { generateTextShadowOutline } from "../../theme/typography";
import { Hit } from "../../state/game";
import React from "react";
import { useRecentSuccessHits } from "./HitMarkers";

export const TimingMarker = ({
  hits,

  ...props
}: {
  hits: Hit[];

  style?: React.CSSProperties;
  className?: string;
}) => {
  const recentSuccessHits = useRecentSuccessHits(
    hits,
    ANIMATION_DURATION + 0.2
  );

  return (
    <Container {...props}>
      {recentSuccessHits.map((hit) => (
        <Text data-timing={hit.timing} key={hit.note.time}>
          {hit.timing}
        </Text>
      ))}
    </Container>
  );
};

const ANIMATION_DURATION = 0.2;

const Container = styled.div`
  width: 10px;
  height: 10px;
  pointer-events: none;
`;
const Text = styled.div`
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

  &[data-timing="good"] {
    color: #c0a942;
    text-shadow: ${generateTextShadowOutline({ color: "#74490a", width: 12 })},
      ${generateTextShadowOutline({ color: "#fff", width: 16 })};
  }
  &[data-timing="ok"] {
    color: #b6b4a9;
    text-shadow: ${generateTextShadowOutline({ color: "#696661", width: 12 })},
      ${generateTextShadowOutline({ color: "#fff", width: 16 })};
  }

  opacity: 0;
  position: absolute;

  animation: bump ${ANIMATION_DURATION}s ease-out;

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
`;
