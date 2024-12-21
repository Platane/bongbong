import * as THREE from "three";

export const computeGeometryWeight = (
  geometry: THREE.BufferGeometry,
  bones: THREE.Bone[],
  computeVertexWeight: (
    p: THREE.Vector3,
    bone: THREE.Bone,
  ) => number = computeVertexWeightDefault,
) => {
  const positions = geometry.getAttribute("position")!;

  const skinIndices = new Uint16Array(positions.count * 4);
  const skinWeights = new Float32Array(positions.count * 4);

  const p = new THREE.Vector3();
  const maxWeights = Array.from({ length: 5 }, () => ({ index: 0, weight: 0 }));

  for (let i = positions.count; i--; ) {
    p.set(positions.getX(i), positions.getY(i), positions.getZ(i));

    // reset max weight
    for (let k = 4; k--; ) maxWeights[k].weight = 0;

    for (let j = bones.length; j--; ) {
      // insert weight
      maxWeights[4].weight = computeVertexWeight(p, bones[j]);
      maxWeights[4].index = j;

      for (
        let k = maxWeights.length - 1;
        k-- && maxWeights[k + 1].weight > maxWeights[k].weight;
      ) {
        const { weight, index } = maxWeights[k + 1];
        maxWeights[k + 1].weight = maxWeights[k].weight;
        maxWeights[k + 1].index = maxWeights[k].index;
        maxWeights[k].weight = weight;
        maxWeights[k].index = index;
      }
    }

    const sum = maxWeights.reduce((sum, { weight }) => sum + weight, 0);
    for (let k = 4; k--; ) {
      skinIndices[i * 4 + k] = maxWeights[k].index;
      skinWeights[i * 4 + k] = sum === 0 ? 0 : maxWeights[k].weight / sum;
    }
  }

  geometry.setAttribute(
    "skinIndex",
    new THREE.Uint16BufferAttribute(skinIndices, 4),
  );
  geometry.setAttribute(
    "skinWeight",
    new THREE.Float32BufferAttribute(skinWeights, 4),
  );
};

const b = new THREE.Vector3();
const computeVertexWeightDefault = (p: THREE.Vector3, bone: THREE.Bone) => {
  bone.getWorldPosition(b);

  const d = p.distanceTo(b);

  if (d === 0) return 9999;

  return 1 / d ** 3;
};
