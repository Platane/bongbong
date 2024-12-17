import { useFrame, useThree } from "@react-three/fiber";
import React, { useRef } from "react";
import { MeshToonMaterial } from "three";
import * as THREE from "three";
import { Face } from "./Face";
import { Arm } from "./Arm";
import { createDrumGeometry } from "./drum";

export const Terry = ({
  pose,
}: {
  pose: {
    face: "happy";
    leftHand: { vy: number; vx: number };
    rightHand: { vy: number; vx: number };
  };
}) => {
  const ref = React.useRef<THREE.Group | null>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;

    ref.current.userData.t = (ref.current.userData.t ?? 0) + delta;

    ref.current.rotation.y =
      Math.sin(ref.current.userData.t * 1.4) * 0.5 - 0.35;
  });

  const [B, setB] = React.useState(() => new THREE.Vector3(3, 0, -1));
  const [stance, setRandomStance] = React.useReducer(
    () =>
      (["uwu", "openMouth", "mischief"] as const)[
        Math.floor(Math.random() * 3)
      ],
    "uwu",
  );

  return (
    <group
      ref={ref}
      position={[0, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        console.log("ccc");

        const angle = Math.random() * 2 - 1;

        setRandomStance();
        setB(
          new THREE.Vector3(1 + Math.cos(angle) * 2, 0, Math.sin(angle) * 2),
        );
      }}
    >
      <group
        //
        rotation={[1.25, 0, 0.1]}
      >
        <Body />
        <Face
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 1.02, 0]}
          stance={stance}
        />
        <Arm
          A={new THREE.Vector3(0.85, 0.72, 0.2)}
          B={B}
          particleCount={10}
          restingLength={2}
        />
        <Arm
          A={new THREE.Vector3(-0.85, 0.72, 0.2)}
          B={{ x: -B.x, y: -B.y, z: B.z }}
          particleCount={10}
          restingLength={1.8}
        />
      </group>

      <mesh position={[0.4, -1, -0.4]}>
        <cylinderGeometry args={[0.18, 0.18, 1.5]} />
        <meshNormalMaterial />
      </mesh>
      <mesh position={[-0.4, -1, -0.4]}>
        <cylinderGeometry args={[0.18, 0.18, 1.5]} />
        <meshNormalMaterial />
      </mesh>
    </group>
  );
};

const Body = () => {
  const bones = React.useMemo(createDrumBones, []);

  const ref = useRef<THREE.SkinnedMesh | null>(null);

  const { scene } = useThree();

  React.useEffect(() => {
    const mesh = ref.current;

    if (!mesh) return;

    mesh.add(bones.root);
    mesh.bind(bones.skeletton);

    const helper = new THREE.SkeletonHelper(mesh);
    scene.add(helper);
  }, []);

  useFrame(() => {
    const k = (Math.sin(Date.now() * 0.01) + 1) * 0.1;
    bones.update(k);
  });

  return (
    <skinnedMesh geometry={drumGeometry} ref={ref}>
      {/* <meshToonMaterial color={"blue"} /> */}
      {/* <meshStandardMaterial color="blue" /> */}
      <meshNormalMaterial />
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
    head.position.set(0, 1, 0);
    head.quaternion.identity();
    head.rotateZ(curve * 4);
  };

  return { root, skeletton, bones, update };
};

const computeDrumWeight = (
  geometry: THREE.BufferGeometry,
  bones: THREE.Bone[],
) => {
  const positions = geometry.getAttribute("position")!;

  const skinIndices = Array.from({ length: positions.count }, () => [
    0, 0, 0, 0,
  ]).flat();
  const skinWeights = Array.from({ length: positions.count }, () => [
    1, 0, 0, 0,
  ]).flat();

  const p = new THREE.Vector3();
  const b = new THREE.Vector3();
  const weights = Array.from(bones, () => 0);

  for (let i = positions.count; i--; ) {
    p.set(positions.getX(i), positions.getY(i), positions.getZ(i));

    for (let j = bones.length; j--; ) {
      bones[j].getWorldPosition(b);

      const d = p.distanceTo(b);
      const w = 1 / d ** 3;

      weights[j] = w;
    }

    const bs = weights
      .map((weight, index) => ({ weight, index }))
      .sort((a, b) => a.weight - b.weight)
      .slice(0, 4);

    const sum = bs.reduce((sum, { weight }) => sum + weight, 0);
    for (let k = 4; k--; ) {
      skinIndices[i * 4 + k] = bs[k]?.index ?? 0;
      skinWeights[i * 4 + k] = (bs[k]?.weight ?? 0) / sum;
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

const drumGeometry = createDrumGeometry();
computeDrumWeight(drumGeometry, createDrumBones().bones);
