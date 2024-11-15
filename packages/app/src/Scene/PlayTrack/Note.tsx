import React from "react";
import * as THREE from "three";
import { InputKind } from "../../state/game";

export const Note = ({
  stance,
  kind,
  ...props
}: { stance: string; kind: InputKind } & React.ComponentProps<"sprite">) => {
  return (
    <sprite {...props}>
      <spriteMaterial map={texture} />
    </sprite>
  );
};

const createSpriteMap = () => {
  const size = 512;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.save();
  ctx.translate(size / 2, size / 2);

  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(0, 0, (size / 2) * 0.96, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "purple";
  ctx.beginPath();
  ctx.arc(0, 0, (size / 2) * 0.82, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
};

const texture = new THREE.CanvasTexture(createSpriteMap());
