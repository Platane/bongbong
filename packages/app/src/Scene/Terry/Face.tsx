import { useFrame } from "@react-three/fiber";
import React from "react";
import * as THREE from "three";

export const Face = (props: React.ComponentProps<"mesh">) => {
  return (
    <mesh {...props}>
      <meshStandardMaterial map={faceSprites} depthTest={false} transparent />
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
};

const createFaceSprites = () => {
  const canvas = document.createElement("canvas");

  const s = 256;

  canvas.height = s;
  canvas.width = s;

  const ctx = canvas.getContext("2d")!;

  ctx.strokeStyle = "grey";
  ctx.lineWidth = s * 0.02;
  ctx.beginPath();
  ctx.arc(0.5 * s, 0.5 * s, (s / 2) * 0.7, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(0.26 * s, 0.4 * s, 0.1 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0.74 * s, 0.4 * s, 0.1 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "black";
  ctx.lineWidth = s * 0.03;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0.4 * s, 0.6 * s);
  ctx.lineTo(0.6 * s, 0.6 * s);
  ctx.stroke();

  // document.body.appendChild(canvas);
  canvas.style.position = "fixed";
  canvas.style.top = "0px";
  canvas.style.left = "0px";
  canvas.style.border = "solid 1px red";

  const texture = new THREE.CanvasTexture(canvas);

  return texture;
};

const faceSprites = createFaceSprites();
