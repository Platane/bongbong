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

const size = 200;
const margin = size / 4;

const svgs = {
  faceBackgroundBlue: svg(circleHead(red)),
  faceBackgroundRed: svg(circleHead(blue)),
  faceUwU: svg(uwuMouth + eyesOpen),
  faceOpenMouth: svg(openMouth + eyesOpen),
  faceMischief: svg(openMouth + eyesMischief),
  target: svg(`
    <circle cx="0" cy="0" r="47" stroke="#fff5" fill="none" stroke-width="6"/>
    <circle cx="0" cy="0" r="30" fill="#fff5" />
    `),
  turtle: svg(
    `<text style="font:bold 85px monospace" textLength="100" x="-50" y="30" >🐢</text>`
  ),
  flower1: svg(
    `<text style="font:bold 85px monospace" textLength="100" x="-50" y="30" >🌸</text>`
  ),
  flower2: svg(
    `<text style="font:bold 85px monospace" textLength="100" x="-50" y="30" >🌼</text>`
  ),
  strawberry: svg(
    `<text style="font:bold 85px monospace" textLength="100" x="-50" y="30" >🍓</text>`
  ),
  wave: svg(
    `<text style="font:bold 85px monospace" textLength="100" x="-50" y="30" >🌊</text>`
  ),
  roundWave: svg(
    `
    <circle cx="0" cy="0" r="50" fill="#333f" />
    <g transform="scale(0.94,0.94)">
    <circle cx="0" cy="0" r="50" fill="#fff" />
    <circle cx="0" cy="0" r="45" fill="#888" />
    <circle cx="0" cy="0" r="32" fill="#fff" />
    <circle cx="0" cy="0" r="27" fill="#888" />
    <circle cx="0" cy="0" r="22" fill="#fff" />
    </g>
    `
  ),
} as const;

const n = Object.keys(svgs).length;

const canvas = document.createElement("canvas");
canvas.width = size * n + margin * (n - 1);
canvas.height = size;
const ctx = canvas.getContext("2d")!;

const master = new THREE.CanvasTexture(canvas);
master.repeat.set(1 / (n + (margin / size) * (n - 1)), 1);
master.generateMipmaps = true;

Promise.all(
  Object.values(svgs).map((svg, i) => {
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
canvas.style.backgroundImage = `repeating-linear-gradient(
    45deg,
    #ddd 25%,
    transparent 25%,
    transparent 75%,
    #ddd 75%,
    #ddd
  ),
  repeating-linear-gradient(
    45deg,
    #ddd 25%,
    #fff 25%,
    #fff 75%,
    #ddd 75%,
    #ddd
  )`;
canvas.style.backgroundSize = `60px 60px`;
canvas.style.backgroundPosition = `0 0, 30px 30px`;
// document.body.appendChild(canvas);

export const textures = Object.fromEntries(
  Object.keys(svgs).map((key, i) => {
    const texture = master.clone();

    texture.offset = new THREE.Vector2(
      (i * (1 + margin / size)) / (n + (margin / size) * (n - 1)),
      0
    );

    return [key, texture as THREE.Texture];
  })
) as Record<keyof typeof svgs, THREE.Texture>;
