import * as THREE from "three";

//
// let's follow this folding pattern
//
// (for radialSegment =3)
//
// 0 ----  3 ----  6 -- ...
// |     / |     / |
// |   /   |   /   |
// | /     | /     |
// 1 ----  4 ----  7 -- ...
// |     / |     / |
// |   /   |   /   |
// | /     | /     |
// 2 ----  5 ----  8 -- ...
// |     / |     / |
// |   /   |   /   |
// | /     | /     |
// 0 ----  3 ----  6 -- ...
//
//

export const createTubeGeometry = (
  curveN: number,
  { radialSegments }: { radialSegments: number }
) => {
  const geometry = new THREE.BufferGeometry();

  const nQuad = radialSegments * (curveN - 1);

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(nQuad * 2 * 3 * 3), 3)
  );
  geometry.setAttribute(
    "normal",
    new THREE.BufferAttribute(new Float32Array(nQuad * 2 * 3 * 3), 3)
  );

  const indexes: number[] = [];
  for (let k = 0; k < curveN - 1; k++) {
    for (let i = 0; i < radialSegments; i++) {
      const c1 = k * radialSegments + i;
      const c2 = k * radialSegments + ((i + 1) % radialSegments);
      const c3 = (k + 1) * radialSegments + ((i + 1) % radialSegments);
      const c4 = (k + 1) * radialSegments + i;

      indexes.push(
        //
        c1,
        c2,
        c3,
        //
        c4,
        c1,
        c3
      );
    }
  }

  geometry.setIndex(
    new THREE.BufferAttribute(new Uint32Array(indexes), 1, false)
  );

  return geometry;
};

export const updateTubeGeometry = (
  geometry: THREE.BufferGeometry,
  curve: THREE.Vector3Like[],
  tubeParams: { radius: number; radialSegments: number }
) => {
  const positions = geometry.getAttribute("position");
  const normals = geometry.getAttribute("normal");
  makeTube(positions.array, normals.array, curve, tubeParams);
  positions.needsUpdate = true;
  normals.needsUpdate = true;
};

const makeTube = (
  positions: number[] | THREE.TypedArray,
  normals: number[] | THREE.TypedArray,
  curve: THREE.Vector3Like[],
  { radius, radialSegments }: { radius: number; radialSegments: number }
) => {
  const n = new THREE.Vector3(0, 1, 0);
  const u = new THREE.Vector3();
  const v = new THREE.Vector3();
  const w = new THREE.Vector3();
  const w1 = new THREE.Vector3();
  const w2 = new THREE.Vector3();

  let i = 0;

  for (let r = 0; r < curve.length; r++) {
    if (r === 0) {
      w.subVectors(curve[r + 1], curve[r]).normalize();
    } else if (r === curve.length - 1) {
      w.subVectors(curve[r], curve[r - 1]).normalize();
    } else {
      w1.subVectors(curve[r], curve[r - 1]).normalize();
      w2.subVectors(curve[r + 1], curve[r]).normalize();

      w.addVectors(w1, w2).normalize();

      // if (Math.abs(w1.dot(w2)) < 0.95) {
      //   n2.crossVectors(w1, w2).normalize();

      //   if (n2.dot(n) > 0) n.copy(n2);
      //   else n.copy(n2).negate();
      // }
    }

    if (Math.abs(w.y) < 0.93) n.set(0, 1, 0);
    else n.set(0, 1, 0.025).normalize();

    u.crossVectors(w, n).normalize();
    v.crossVectors(u, w).normalize();

    for (let k = radialSegments; k--; ) {
      const a = Math.PI * 2 * (k / radialSegments);

      const cos = Math.cos(a);
      const sin = Math.sin(a);

      const nx = cos * u.x + sin * v.x;
      const ny = cos * u.y + sin * v.y;
      const nz = cos * u.z + sin * v.z;

      normals[i * 3 + 0] = nx;
      normals[i * 3 + 1] = ny;
      normals[i * 3 + 2] = nz;

      // normals[i * 3 + 0] = 0;
      // normals[i * 3 + 1] = 1;
      // normals[i * 3 + 2] = 0;

      positions[i * 3 + 0] = curve[r].x + nx * radius;
      positions[i * 3 + 1] = curve[r].y + ny * radius;
      positions[i * 3 + 2] = curve[r].z + nz * radius;

      i++;
    }
  }
};
