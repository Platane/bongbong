import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import React, { useRef } from "react";
import { computeGeometryWeight } from "../utils/bones";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils";

export const Body = () => {
  const bones = React.useMemo(createDrumBones, []);

  const ref = useRef<THREE.SkinnedMesh | null>(null);

  const { scene } = useThree();

  const texture = React.useMemo(() => createTexture("#23307c", "#c22802"), []);

  React.useEffect(() => {
    const mesh = ref.current;

    if (!mesh) return;

    mesh.add(bones.root);
    mesh.bind(bones.skeletton);

    // const helper = new THREE.SkeletonHelper(mesh);
    // scene.add(helper);
  }, []);

  useFrame(() => {
    const k = (Math.sin(Date.now() * 0.01) + 1) * 0.1;
    bones.update(k);
  });

  return (
    <skinnedMesh geometry={drumGeometry} ref={ref}>
      <meshToonMaterial map={texture} gradientMap={gradientMap} />
      {/* <meshNormalMaterial /> */}
    </skinnedMesh>
  );
};

const createDrumBones = () => {
  const root = new THREE.Bone();
  root.position.set(0, 0, 0);

  const head = new THREE.Bone();
  head.position.set(0, 1, 0);
  root.add(head);

  const ass = new THREE.Bone();
  ass.position.set(0, -1, 0);
  root.add(ass);

  const bones = [root, head, ass];
  const skeletton = new THREE.Skeleton(bones);

  const update = (curve: number) => {
    // head.position.set(0, 1, 0);
    const u = -curve * 2.4;
    root.position.set(0, 0, u);
    ass.position.set(0, -1, -u);
    head.position.set(0, 1, -u);

    ass.quaternion.identity();
    ass.rotateX(-curve * 3);

    head.quaternion.identity();
    head.rotateX(curve * 1.5);
  };

  return { root, skeletton, bones, update };
};

export const createDrumGeometry = ({
  radialSegments = 32,
  heightSegments = 14,
  radius = 0.7,
  radiusFace = radius * 0.81,
  radiusBumpsRatio = 0.5,
  height = 2,
}: {
  radialSegments?: number;
  heightSegments?: number;
  radius?: number;
  radiusFace?: number;
  radiusBumpsRatio?: number;
  height?: number;
} = {}) => {
  const geometry = new THREE.BufferGeometry();

  const getRadius = (k: number) =>
    radius * ((1 - ((k - 0.5) * 2) ** 2) * radiusBumpsRatio + 1);

  // buffers

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];

  for (let i = 0; i < heightSegments; i++) {
    const k1 = i / heightSegments;
    const k2 = (i + 1) / heightSegments;

    const h1 = (k1 - 0.5) * height;
    const h2 = (k2 - 0.5) * height;

    const r1 = getRadius(k1);
    const r2 = getRadius(k2);

    const uv = i >= heightSegments - 2 || i <= 1 ? 3 / 4 : 0;

    for (let j = 0; j < radialSegments; j++) {
      const a0 = Math.PI * 2 * (j / radialSegments);
      const a1 = Math.PI * 2 * ((j + 1) / radialSegments);

      const a = [Math.sin(a0) * r1, h1, Math.cos(a0) * r1];
      const b = [Math.sin(a1) * r1, h1, Math.cos(a1) * r1];
      const c = [Math.sin(a1) * r2, h2, Math.cos(a1) * r2];
      const d = [Math.sin(a0) * r2, h2, Math.cos(a0) * r2];

      const na = new THREE.Vector3().fromArray(a).normalize();
      const nb = new THREE.Vector3().fromArray(b).normalize();
      const nc = new THREE.Vector3().fromArray(c).normalize();
      const nd = new THREE.Vector3().fromArray(d).normalize();

      positions.push(...a, ...b, ...c);
      positions.push(...c, ...d, ...a);

      normals.push(...na, ...nb, ...nc);
      normals.push(...nc, ...nd, ...na);

      uvs.push(uv, uv, uv, uv, uv, uv);
      uvs.push(uv, uv, uv, uv, uv, uv);
    }
  }

  for (let j = 0; j < radialSegments; j++) {
    const a0 = Math.PI * 2 * (j / radialSegments);
    const a1 = Math.PI * 2 * ((j + 1) / radialSegments);

    const h = height * 0.5;

    const a1x = Math.sin(a1);
    const a1y = Math.cos(a1);

    const a0x = Math.sin(a0);
    const a0y = Math.cos(a0);

    positions.push(
      //
      0,
      -h,
      0,

      a1x * radius,
      -h,
      a1y * radius,

      a0x * radius,
      -h,
      a0y * radius,
    );
    normals.push(
      0,
      -1,
      0,

      0,
      -1,
      0,

      0,
      -1,
      0,
    );
    uvs.push(1, 1, 1, 1, 1, 1);

    //
    //

    positions.push(
      //
      0,
      h,
      0,

      a0x * radiusFace,
      h,
      a0y * radiusFace,

      a1x * radiusFace,
      h,
      a1y * radiusFace,
    );
    normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
    uvs.push(1 / 4, 1 / 4, 1 / 4, 1 / 4, 1 / 4, 1 / 4);

    positions.push(
      //
      a0x * radiusFace,
      h,
      a0y * radiusFace,

      a1x * radius,
      h,
      a1y * radius,

      a1x * radiusFace,
      h,
      a1y * radiusFace,
    );
    positions.push(
      //
      a0x * radiusFace,
      h,
      a0y * radiusFace,

      a0x * radius,
      h,
      a0y * radius,

      a1x * radius,
      h,
      a1y * radius,
    );
    normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
    normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
    uvs.push(3 / 4, 3 / 4, 3 / 4, 3 / 4, 3 / 4, 3 / 4);
    uvs.push(3 / 4, 3 / 4, 3 / 4, 3 / 4, 3 / 4, 3 / 4);
  }

  // outline
  {
    const nFace = positions.length / 3 / 3;
    for (let k = nFace; k--; ) {
      const A = 1.05;
      const H = 1.04;

      positions.push(
        positions[k * 9 + 0] * A,
        positions[k * 9 + 1] * H,
        positions[k * 9 + 2] * A,
      );
      normals.push(normals[k * 9 + 0], normals[k * 9 + 1], normals[k * 9 + 2]);

      positions.push(
        positions[k * 9 + 6] * A,
        positions[k * 9 + 7] * H,
        positions[k * 9 + 8] * A,
      );
      normals.push(normals[k * 9 + 6], normals[k * 9 + 7], normals[k * 9 + 8]);

      positions.push(
        positions[k * 9 + 3] * A,
        positions[k * 9 + 4] * H,
        positions[k * 9 + 5] * A,
      );
      normals.push(normals[k * 9 + 3], normals[k * 9 + 4], normals[k * 9 + 5]);

      uvs.push(2 / 4, 2 / 4, 2 / 4, 2 / 4, 2 / 4, 2 / 4);
    }
    if (false)
      for (let j = 0; j < radialSegments; j++) {
        const a0 = Math.PI * 2 * (j / radialSegments);
        const a1 = Math.PI * 2 * ((j + 1) / radialSegments);

        // const h = (height * 0.5 * radialSegments) / 2;
        const h = (1 / heightSegments - 0.5) * height;

        const r = getRadius(1 / heightSegments) + 0.1;

        const a1x = Math.sin(a1);
        const a1y = Math.cos(a1);

        const a0x = Math.sin(a0);
        const a0y = Math.cos(a0);

        positions.push(
          //
          0,
          -h,
          0,

          a1x * r,
          -h,
          a1y * r,

          a0x * r,
          -h,
          a0y * r,
        );
        normals.push(
          0,
          -1,
          0,

          0,
          -1,
          0,

          0,
          -1,
          0,
        );
        uvs.push(2 / 4, 2 / 4, 2 / 4, 2 / 4, 2 / 4, 2 / 4);

        positions.push(
          //
          0,
          -h,
          0,

          a0x * r,
          -h,
          a0y * r,

          a1x * r,
          -h,
          a1y * r,
        );
        normals.push(
          0,
          1,
          0,

          0,
          1,
          0,

          0,
          1,
          0,
        );
        uvs.push(2 / 4, 2 / 4, 2 / 4, 2 / 4, 2 / 4, 2 / 4);
        positions.push(
          //
          0,
          h,
          0,

          a1x * r,
          h,
          a1y * r,

          a0x * r,
          h,
          a0y * r,
        );
        normals.push(
          0,
          -1,
          0,

          0,
          -1,
          0,

          0,
          -1,
          0,
        );
        uvs.push(2 / 4, 2 / 4, 2 / 4, 2 / 4, 2 / 4, 2 / 4);

        positions.push(
          //
          0,
          h,
          0,

          a0x * r,
          h,
          a0y * r,

          a1x * r,
          h,
          a1y * r,
        );
        normals.push(
          0,
          1,
          0,

          0,
          1,
          0,

          0,
          1,
          0,
        );
        uvs.push(2 / 4, 2 / 4, 2 / 4, 2 / 4, 2 / 4, 2 / 4);
      }

    const m = 0.08;
    const rm = 0.004;
    const h = (2 / heightSegments - 0.5) * height;

    const r1 = getRadius(2 / heightSegments - (m / height) * 0.25);
    const r2 = getRadius(2 / heightSegments + (m / height) * 0.25);

    {
      const cylinderGeometry = new THREE.CylinderGeometry(
        r1 + rm,
        r2 + rm,
        m,
        radialSegments,
        1,
      ).toNonIndexed();
      const mat = new THREE.Matrix4();
      mat.makeTranslation(new THREE.Vector3(0, -h, 0));
      cylinderGeometry.applyMatrix4(mat);

      const cpositions = cylinderGeometry.getAttribute("position")!;
      const cnormals = cylinderGeometry.getAttribute("normal")!;
      positions.push(...cpositions.array);
      normals.push(...cnormals.array);
      for (let k = cpositions.count; k--; ) uvs.push(2 / 4, 2 / 4);
    }

    {
      const cylinderGeometry = new THREE.CylinderGeometry(
        r2 + rm,
        r1 + rm,
        m,
        radialSegments,
        1,
      ).toNonIndexed();
      const mat = new THREE.Matrix4();
      mat.makeTranslation(new THREE.Vector3(0, h, 0));
      cylinderGeometry.applyMatrix4(mat);

      const cpositions = cylinderGeometry.getAttribute("position")!;
      const cnormals = cylinderGeometry.getAttribute("normal")!;
      positions.push(...cpositions.array);
      normals.push(...cnormals.array);
      for (let k = cpositions.count; k--; ) uvs.push(2 / 4, 2 / 4);
    }

    {
      const cylinderGeometry = new THREE.CylinderGeometry(
        radius + rm + 0.04,
        radius + rm + 0.04,
        m,
        radialSegments,
        1,
      ).toNonIndexed();
      const mat = new THREE.Matrix4();
      mat.makeTranslation(new THREE.Vector3(0, (height - m) * 0.5 - 0.01, 0));
      cylinderGeometry.applyMatrix4(mat);

      const cpositions = cylinderGeometry.getAttribute("position")!;
      const cnormals = cylinderGeometry.getAttribute("normal")!;
      positions.push(...cpositions.array);
      normals.push(...cnormals.array);
      for (let k = cpositions.count; k--; ) uvs.push(2 / 4, 2 / 4);
    }
    {
      const cylinderGeometry = new THREE.CylinderGeometry(
        radius + rm + 0.04,
        radius + rm + 0.04,
        m,
        radialSegments,
        1,
      ).toNonIndexed();
      const mat = new THREE.Matrix4();
      mat.makeTranslation(
        new THREE.Vector3(0, -((height - m) * 0.5 - 0.01), 0),
      );
      cylinderGeometry.applyMatrix4(mat);

      const cpositions = cylinderGeometry.getAttribute("position")!;
      const cnormals = cylinderGeometry.getAttribute("normal")!;
      positions.push(...cpositions.array);
      normals.push(...cnormals.array);
      for (let k = cpositions.count; k--; ) uvs.push(2 / 4, 2 / 4);
    }
  }

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(positions), 3),
  );
  geometry.setAttribute(
    "normal",
    new THREE.BufferAttribute(new Float32Array(normals), 3),
  );
  geometry.setAttribute(
    "uv",
    new THREE.BufferAttribute(new Float32Array(uvs), 2),
  );

  return toCreasedNormals(geometry, Math.PI / 4);

  return geometry;
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
const gradientMap = createGradientTexture();

const drumGeometry = createDrumGeometry();
computeGeometryWeight(drumGeometry, createDrumBones().bones);

const createTexture = (bodyColor: string, faceColor: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 1;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = bodyColor;
  ctx.fillRect(0, 0, 1, 1);

  ctx.fillStyle = faceColor;
  ctx.fillRect(1, 0, 1, 1);

  ctx.fillStyle = "#000";
  ctx.fillRect(2, 0, 1, 1);

  ctx.fillStyle = "#fff";
  ctx.fillRect(3, 0, 1, 1);

  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.width = "200px";
  canvas.style.imageRendering = "pixelated";
  // document.body.appendChild(canvas);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  return texture;
};
