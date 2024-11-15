import * as THREE from "three";
import { eyesOpen, uwuMouth } from "./face-parts";
import { black, blue, red } from "./theme";

const size = 256;

const n = 4;

const margin = size / 4;

const canvas = document.createElement("canvas");
canvas.width = size * n + margin * (n - 1);
canvas.height = size;
const ctx = canvas.getContext("2d")!;

ctx.scale(size / 100, size / 100);

const nextSprite = () => ctx.translate(100 + (margin / size) * 100, 0);

{
  ctx.save();
  ctx.translate(50, 50);

  ctx.fillStyle = black;
  ctx.beginPath();
  ctx.arc(0, 0, 50, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(0, 0, 50 - 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = blue;
  ctx.beginPath();
  ctx.arc(0, 0, 50 - 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

nextSprite();

{
  ctx.save();
  ctx.translate(50, 50);

  ctx.fillStyle = black;
  ctx.beginPath();
  ctx.arc(0, 0, 50, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(0, 0, 50 - 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = red;
  ctx.beginPath();
  ctx.arc(0, 0, 50 - 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

nextSprite();

{
  ctx.save();
  ctx.translate(50, 50);

  ctx.fillStyle = black;
  ctx.beginPath();
  ctx.arc(0, 0, 50, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(0, 0, 50 - 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "limegreen";
  ctx.beginPath();
  ctx.arc(0, 0, 50 - 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

nextSprite();

// face
{
  ctx.save();
  ctx.translate(50, 50);

  ctx.fillStyle = black;
  ctx.fill(new Path2D(eyesOpen));

  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = black;
  ctx.stroke(new Path2D(uwuMouth));

  ctx.restore();
}

canvas.style.width = "100%";
document.body.appendChild(canvas);

const master = new THREE.CanvasTexture(canvas);

const textures = Array.from({ length: n }, (_, i) => {
  const texture = master.clone();

  texture.repeat = new THREE.Vector2(1 / (n + (margin / size) * (n - 1)), 1);
  texture.offset = new THREE.Vector2(
    (i * (1 + margin / size)) / (n + (margin / size) * (n - 1)),
    0
  );

  return texture;
});

export const [
  faceBackgroundBlue,
  faceBackgroundRed,
  faceBackgroundGreen,
  faceUwU,
] = textures;
