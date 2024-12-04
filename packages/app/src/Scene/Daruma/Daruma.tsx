import * as THREE from "three";
import React from "react";

// generated from https://www.rayon.design/app/model/43bc2f50-e61c-4458-9f39-2f984c93fd70?token=Fnr72pPvMzbmaJBgMOdGKBOE4P8rFQ1-
// @ts-ignore
import daruma_svg_src from "../../asset/daruma.svg?url";

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
  const n = new THREE.Vector3();
  const v = new THREE.Vector3();

  for (let i = positions.count; i--; ) {
    p.fromBufferAttribute(positions, i);
    n.fromBufferAttribute(normals, i);

    v.subVectors(p, center);
    const l = v.length();

    p.addScaledVector(v, 0.34 / l ** 1.6);

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

  new Promise<HTMLImageElement>((r) => {
    const img = new Image();
    img.onload = () => r(img);
    img.src = daruma_svg_src;
  }).then((img) => {
    ctx.drawImage(img, size * 0.04, size * 0.14, size * 0.42, size * 0.7);

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
