import { styled } from "@linaria/react";
import React from "react";

export const ComboPanel = ({
  multiplier,
  combo,
  ...props
}: {
  multiplier: number;
  combo: number;

  style?: React.CSSProperties;
  className?: string;
}) => (
  <Container {...props}>
    {Array.from({ length: multiplier }, (_, i) => (
      <Dot key={i} />
    ))}
  </Container>
);

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 0 20px;
  gap: 10px;
`;
const Dot = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background-color: #fff;
`;
