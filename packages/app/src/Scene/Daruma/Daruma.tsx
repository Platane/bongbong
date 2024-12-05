import * as THREE from "three";
import React from "react";

// generated from https://www.rayon.design/app/model/43bc2f50-e61c-4458-9f39-2f984c93fd70?token=Fnr72pPvMzbmaJBgMOdGKBOE4P8rFQ1-
// @ts-ignore
import daruma_svg_src from "../../asset/daruma.svg?url";
import { getImageFromSvg } from "../texture/sprite";

const { clamp, lerp, inverseLerp } = THREE.MathUtils;

export const Daruma = ({
  color = "red",
  ...props
}: React.ComponentProps<"group"> & {
  color?: "red" | "purple" | "black" | "yellow";
}) => {
  return (
    <group {...props}>
      <mesh geometry={geometry}>
        <meshToonMaterial {...textures[color]} />
      </mesh>
      <mesh geometry={geometry} scale={[1.08, 1.08, 1.08]}>
        <meshBasicMaterial side={THREE.BackSide} color={"#000"} />
      </mesh>
    </group>
  );
};

const createGeometry = () => {
  const geometry = new THREE.SphereGeometry(1, 24, 28);

  const uvs = geometry.getAttribute("uv")!;
  const positions = geometry.getAttribute("position");
  const normals = geometry.getAttribute("normal");

  const center = new THREE.Vector3(0, 0.5, 1.6);
  const p = new THREE.Vector3();
  const v = new THREE.Vector3();

  for (let i = positions.count; i--; ) {
    p.fromBufferAttribute(positions, i);

    v.subVectors(p, center);
    const l = v.length();

    p.addScaledVector(v, 0.34 / l ** 1.6);

    positions.setXYZ(i, p.x, p.y, p.z);
  }

  for (let i = positions.count; i--; ) {
    p.fromBufferAttribute(positions, i);

    const u = inverseLerp(0.14, -1, p.y);

    const k = lerp(0.95, 1, clamp(Math.abs(u * 2 - 1) ** 1.3, 0, 1));

    p.x = p.x * k;
    p.z = p.z * k;

    positions.setXYZ(i, p.x, p.y, p.z);
  }

  geometry.computeVertexNormals();

  return geometry;
};
const createTexture = (color: string) => {
  const canvas = document.createElement("canvas");
  const size = 512;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  canvas.style.position = "fixed";
  canvas.style.bottom = "0";
  // canvas.style.right = "0";
  // canvas.style.width = "300px";

  // document.body.appendChild(canvas);

  const texture = new THREE.CanvasTexture(canvas);

  fetch(daruma_svg_src)
    .then((res) => res.text())
    .then((svgContent) =>
      svgContent.replace(
        /preserveAspectRatio="[^"]*"/,
        'preserveAspectRatio="none"'
      )
    )
    .then(getImageFromSvg)
    .then((img) => {
      ctx.drawImage(img, size * 0.03, size * 0.14, size * 0.44, size * 0.73);

      texture.needsUpdate = true;
    });

  return texture;
};
const createGradientTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 10;
  canvas.height = 1;

  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 999, 1);

  ctx.fillStyle = "#444";
  ctx.fillRect(0, 0, 7, 1);

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 5, 1);

  canvas.style.position = "fixed";
  canvas.style.bottom = "0";
  canvas.style.width = "min( 500px , 90vw )";
  canvas.style.imageRendering = "pixelated";

  // document.body.appendChild(canvas);

  const texture = new THREE.CanvasTexture(canvas);

  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;

  return texture;
};

const textures = {
  red: {
    gradientMap: createGradientTexture(),
    map: createTexture("#7a1010"),
  },
  purple: {
    gradientMap: createGradientTexture(),
    map: createTexture("#692094"),
  },
  yellow: {
    gradientMap: createGradientTexture(),
    map: createTexture("#e2cf25"),
  },
  black: {
    gradientMap: createGradientTexture(),
    map: createTexture("#1d1d1d"),
  },
};
const geometry = createGeometry();
