import * as THREE from "three";
import { black, blue, red } from "./theme";
import {
  circleHead,
  eyesMischief,
  eyesOpen,
  openMouth,
  svg,
  uwuMouth,
} from "./face-parts";

const size = 512;
const margin = size / 4;

const svgs = [
  svg(circleHead(red)),
  svg(circleHead(blue)),
  svg(uwuMouth + eyesOpen),
  svg(openMouth + eyesOpen),
  svg(openMouth + eyesMischief),
  svg(`
    <circle cx="0" cy="0" r="47" stroke="#fff5" fill="none" stroke-width="6"/>
    <circle cx="0" cy="0" r="30" fill="#fff5" />
    `),
];

const canvas = document.createElement("canvas");
canvas.width = size * svgs.length + margin * (svgs.length - 1);
canvas.height = size;
const ctx = canvas.getContext("2d")!;

const master = new THREE.CanvasTexture(canvas);
master.repeat.set(1 / (svgs.length + (margin / size) * (svgs.length - 1)), 1);

Promise.all(
  svgs.map((svg, i) => {
    const img = new Image();
    return new Promise((r) => {
      img.onload = r;
      img.src = "data:image/svg+xml," + encodeURIComponent(svg);
    }).then(() => {
      ctx.drawImage(img, (size + margin) * i, 0, size, size);
    });
  })
).then(() => {
  master.source.needsUpdate = true;
});

canvas.style.width = "100%";
document.body.appendChild(canvas);

const textures = svgs.map((_, i, { length }) => {
  const texture = master.clone();

  texture.offset = new THREE.Vector2(
    (i * (1 + margin / size)) / (length + (margin / size) * (length - 1)),
    0
  );

  return texture;
});

export const [
  faceBackgroundBlue,
  faceBackgroundRed,
  faceUwU,
  faceOpenMouth,
  faceMischief,
  target,
] = textures;
