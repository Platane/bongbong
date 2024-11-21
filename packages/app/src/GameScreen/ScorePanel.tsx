import { styled } from "@linaria/react";
import React from "react";
import { black } from "../Scene/texture/theme";
import { generateTextShadowOutline } from "../theme/typography";
import { Input } from "../state/game";
import { DrumInput } from "../Scene/DrumInput/DrumInput";

export const ScorePanel = ({
  score,
  combo,
  inputs,

  ...props
}: {
  score: number;
  combo: number;
  inputs: Input[];

  style?: React.CSSProperties;
  className?: string;
}) => (
  <Container {...props}>
    <DrumInputContainer>
      <DrumInputContainer2>
        <DrumInput inputs={inputs} />
      </DrumInputContainer2>
    </DrumInputContainer>
    <ComboText key={combo}>
      <span>{combo}</span>
    </ComboText>
    <ScoreText>{score}</ScoreText>
  </Container>
);

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  gap: 10px;
  position: relative;
`;

const ComboText = styled.div`
  flex-grow: 2;
  width: 100%;
  color: #c0a942;

  display: flex;
  justify-content: center;
  align-items: center;

  font-size: 64px;
  text-align: center;
  font-family: cursive;
  letter-spacing: -4px;
  font-weight: bolder;
  font-family: monospace;
  -webkit-text-stroke-width: 0;
  -webkit-text-stroke-color: ${black};
  text-shadow: ${generateTextShadowOutline({ color: "#74490a", width: 8 })},
    3px 2px 5px #333;

  z-index: 2;

  animation: bump 140ms ease-out;

  @keyframes bump {
    0% {
      transform: translate(0, 0);
    }
    5% {
      transform: translate(0, -20px) scale(1.2, 1.2);
    }
    100% {
      transform: translate(0, 0px);
    }
  }
`;

const ScoreText = styled.div`
  width: 100%;
  color: #fff;
  text-align: right;
  font-size: 26px;
  letter-spacing: -1px;
  font-weight: bolder;
  font-family: monospace;
  -webkit-text-stroke-width: 0.5;
  -webkit-text-stroke-color: ${black};
  text-shadow: ${generateTextShadowOutline({ color: black, width: 3 })},
    3px 2px 5px #333;

  z-index: 2;
`;

const DrumInputContainer = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
`;

const DrumInputContainer2 = styled.div`
  aspect-ratio: 1;

  max-width: 100%;
  max-height: 100%;

  display: flex;
`;
