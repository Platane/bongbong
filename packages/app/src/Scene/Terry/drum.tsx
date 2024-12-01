import * as THREE from "three";

export const createDrumGeometry = () => {
  const geometry = new THREE.BufferGeometry();

  // constant

  const radialSegments = 24;
  const heightSegments = 10;

  const radius = 0.7;
  const radiusBumpsRatio = 0.5;
  const height = 2;

  const getRadius = (k: number) =>
    radius * ((1 - ((k - 0.5) * 2) ** 2) * radiusBumpsRatio + 1);

  // buffers

  const positions: number[] = [];
  const normals: number[] = [];
  const uv: number[] = [];

  for (let i = 0; i < heightSegments; i++) {
    const k1 = i / heightSegments;
    const k2 = (i + 1) / heightSegments;

    const h1 = (k1 - 0.5) * height;
    const h2 = (k2 - 0.5) * height;

    const r1 = getRadius(k1);
    const r2 = getRadius(k2);

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
    }
  }

  for (let j = 0; j < radialSegments; j++) {
    const a0 = Math.PI * 2 * (j / radialSegments);
    const a1 = Math.PI * 2 * ((j + 1) / radialSegments);

    const h = height * 0.5;
    positions.push(
      //
      0,
      h,
      0,

      Math.sin(a0) * radius,
      h,
      Math.cos(a0) * radius,

      Math.sin(a1) * radius,
      h,
      Math.cos(a1) * radius
    );

    positions.push(
      //
      0,
      -h,
      0,

      Math.sin(a1) * radius,
      -h,
      Math.cos(a1) * radius,

      Math.sin(a0) * radius,
      -h,
      Math.cos(a0) * radius
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
      0
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
      0
    );
  }

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(positions), 3)
  );
  geometry.setAttribute(
    "normal",
    new THREE.BufferAttribute(new Float32Array(normals), 3)
  );

  return geometry;
};
