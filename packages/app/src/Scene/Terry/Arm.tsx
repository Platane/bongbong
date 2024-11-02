import { useFrame, useThree } from "@react-three/fiber";
import React from "react";
import { MeshToonMaterial } from "three";
import * as THREE from "three";
import type * as IRAPIER from "@dimforge/rapier3d";

export const init = () =>
  import("@dimforge/rapier3d/").then((r) => {
    RAPIER = r;
  });

let RAPIER: typeof IRAPIER;

type Props = {
  A: { x: number; y: number; z: number };
  B: { x: number; y: number; z: number };
  particleCount: number;
  restingLength: number;
};

export const Arm = (props: Props) => {
  const [, refresh] = React.useReducer((x) => 1 + x, 1);
  React.useEffect(() => void init().then(refresh), []);

  if (RAPIER) return <Arm_ {...props} />;

  return null;
};

const Arm_ = ({ particleCount, restingLength, ...props }: Props) => {
  const ref = React.useRef<THREE.Group | null>(null);

  const refAnchor = React.useRef({
    A: new THREE.Vector3(),
    B: new THREE.Vector3(),
  });
  refAnchor.current.A.copy(props.A);
  refAnchor.current.B.copy(props.B);

  const { scene } = useThree();

  const { dispose, onFrame } = React.useMemo(() => {
    const geometry = new THREE.SphereGeometry(0.1);
    const material = new THREE.MeshStandardMaterial({
      color: "orange",
      side: THREE.DoubleSide,
      wireframe: true,
    });

    const meshes = Array.from(
      { length: particleCount },
      () => new THREE.Mesh(geometry, material)
    );

    for (const m of meshes) scene.add(m);

    const A = new THREE.Vector3();
    A.copy(refAnchor.current.A);
    const B = new THREE.Vector3();
    B.copy(refAnchor.current.B);

    const {
      dispose: disposeWorld,
      applyToScene,
      getPositions,
      step,
    } = createWorld({ particleCount, restingLength }, { A, B });

    const tubeParams = { radius: 0.2, radialSegments: 5 };
    const tube = new THREE.Mesh(
      createTubeGeometry(particleCount, tubeParams),
      material
    );
    scene.add(tube);

    const onFrame = (_: unknown, dt: number) => {
      if (!ref.current) return;

      const positions = tube.geometry.getAttribute("position");
      makeTube(getPositions(), tubeParams, positions.array);
      positions.needsUpdate = true;
      geometry.computeVertexNormals();

      A.copy(refAnchor.current.A);
      ref.current.localToWorld(A);

      B.copy(refAnchor.current.B);
      ref.current.localToWorld(B);

      step(dt);
      applyToScene(meshes);
    };

    return {
      dispose: () => {
        for (const m of meshes) m.parent?.remove(m);
        tube.parent?.remove(tube);
        disposeWorld();
      },
      onFrame,
    };
  }, [particleCount, restingLength]);
  React.useEffect(() => dispose, [dispose]);

  useFrame(onFrame);

  return <group ref={ref}></group>;
};

export const createWorld = (
  {
    particleCount,
    restingLength,
  }: { particleCount: number; restingLength: number },
  {
    A,
    B,
  }: {
    A: { x: number; y: number; z: number };
    B: { x: number; y: number; z: number };
  }
) => {
  const gravity = { x: 0.0, y: -9.81, z: 0.0 };

  const world = new RAPIER.World(gravity);

  const bodies = Array.from({ length: particleCount }, (_, i) => {
    let rigidBodyDesc: IRAPIER.RigidBodyDesc;
    if (i === 0 || i === particleCount - 1)
      rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
    else rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setGravityScale(0.4);

    const rigidBody = world.createRigidBody(rigidBodyDesc);
    rigidBody.setBodyType(RAPIER.RigidBodyType.Dynamic, false);

    const k = i / (particleCount - 1);
    rigidBody.setTranslation({ x: A.x + restingLength * k, y: 0, z: 0 }, false);

    const ballRadius = 0.1;

    const colliderDesc = RAPIER.ColliderDesc.ball(ballRadius).setMass(1);

    const collider = world.createCollider(colliderDesc, rigidBody);

    return rigidBody;
  });

  const bodyA = bodies[0];
  const bodyB = bodies.at(-1)!;

  bodyA.lockTranslations(true, false);
  bodyB.lockTranslations(true, false);

  for (let i = 0; i < bodies.length - 1; i++) {
    const body1 = bodies[i];
    const body2 = bodies[i + 1];

    const pos1 = body1.translation();
    const pos2 = body2.translation();

    const mid = {
      x: (pos1.x + pos2.x) / 2,
      y: (pos1.y + pos2.y) / 2,
      z: (pos1.z + pos2.z) / 2,
    };

    const anchor1 = {
      x: mid.x - pos1.x,
      y: mid.y - pos1.y,
      z: mid.z - pos1.z,
    };
    const anchor2 = {
      x: mid.x - pos2.x,
      y: mid.y - pos2.y,
      z: mid.z - pos2.z,
    };
    const o = { x: 0, y: 0, z: 0 };

    const l = Math.hypot(pos1.x - pos2.x, pos1.y - pos2.y, pos1.z - pos2.z);
    // const joinData = RAPIER.JointData.rope(l, anchor1, anchor2);
    // const joinData = RAPIER.JointData.rope(l, o, o);

    const stiffness = 150;
    const damping = 12;
    const joinData = RAPIER.JointData.spring(l / 2, stiffness, damping, o, o);

    // const joinData = RAPIER.JointData.spherical(anchor1, anchor2);
    const joint = world.createImpulseJoint(joinData, body1, body2, false);
  }

  const applyToScene = (balls: THREE.Object3D[]) => {
    for (let i = bodies.length; i--; ) {
      const g = balls[i];
      const body = bodies[i];

      const position = body.translation();
      g.position.copy(position as any);

      const rotation = body.rotation();
      g.quaternion.copy(rotation as any);
    }
  };

  const getPositions = () => bodies.map((b) => b.translation());

  const step = (dt: number) => {
    bodyA.setTranslation(A as any, true);
    bodyB.setTranslation(B as any, true);

    world.step();
  };

  const dispose = () => {};

  return { step, applyToScene, getPositions, dispose };
};

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

const createTubeGeometry = (
  curveN: number,
  { radialSegments }: { radialSegments: number }
) => {
  const geometry = new THREE.BufferGeometry();

  const nQuad = radialSegments * (curveN - 1);

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(nQuad * 2 * 3 * 3), 3)
  );

  return geometry;
};

const makeTube = (
  curve: { x: number; y: number; z: number }[],
  { radius, radialSegments }: { radius: number; radialSegments: number },
  positions: number[] | THREE.TypedArray
) => {
  let kFace = 0;

  const y = new THREE.Vector3(0, 1, 0);
  const x = new THREE.Vector3(1, 0, 0);
  const getBase = (u: THREE.Vector3, v: THREE.Vector3, n: THREE.Vector3) => {
    if (Math.abs(n.dot(y)) < 0.98) {
      u.crossVectors(n, y).normalize();
      v.crossVectors(n, u).normalize();
    } else {
      u.crossVectors(n, x).normalize();
      v.crossVectors(n, u).normalize();
    }
  };

  const au = new THREE.Vector3();
  const av = new THREE.Vector3();

  const bu = new THREE.Vector3();
  const bv = new THREE.Vector3();

  getBase(
    bu,
    bv,
    new THREE.Vector3(
      curve[1].x - curve[0].x,
      curve[1].y - curve[0].y,
      curve[1].z - curve[0].z
    ).normalize()
  );

  const n1 = new THREE.Vector3();
  const n2 = new THREE.Vector3();
  const n = new THREE.Vector3();

  const quad = [
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ] as const;

  for (let i = 1; i < curve.length; i++) {
    n1.set(
      curve[i].x - curve[i - 1].x,
      curve[i].y - curve[i - 1].y,
      curve[i].z - curve[i - 1].z
    ).normalize();
    if (i === curve.length - 1) n2.copy(n1);
    else
      n2.set(
        curve[i + 1].x - curve[i].x,
        curve[i + 1].y - curve[i].y,
        curve[i + 1].z - curve[i].z
      ).normalize();

    au.copy(bu);
    av.copy(bv);

    const b = curve[i];
    const a = curve[i - 1];

    getBase(bu, bv, n.addVectors(n1, n2).normalize());

    for (let j = radialSegments; j--; ) {
      const a0 = Math.PI * 2 * (j / radialSegments);
      const a1 = Math.PI * 2 * ((j + 1) / radialSegments);

      const cosa0 = Math.cos(a0) * radius;
      const sina0 = Math.sin(a0) * radius;
      const cosa1 = Math.cos(a1) * radius;
      const sina1 = Math.sin(a1) * radius;

      quad[0].set(
        a.x + au.x * cosa0 + av.x * sina0,
        a.y + au.y * cosa0 + av.y * sina0,
        a.z + au.z * cosa0 + av.z * sina0
      );
      quad[1].set(
        a.x + au.x * cosa1 + av.x * sina1,
        a.y + au.y * cosa1 + av.y * sina1,
        a.z + au.z * cosa1 + av.z * sina1
      );
      quad[2].set(
        b.x + bu.x * cosa1 + bv.x * sina1,
        b.y + bu.y * cosa1 + bv.y * sina1,
        b.z + bu.z * cosa1 + bv.z * sina1
      );
      quad[3].set(
        b.x + bu.x * cosa0 + bv.x * sina0,
        b.y + bu.y * cosa0 + bv.y * sina0,
        b.z + bu.z * cosa0 + bv.z * sina0
      );

      positions[kFace * 9 + 0 + 0] = quad[0].x;
      positions[kFace * 9 + 0 + 1] = quad[0].y;
      positions[kFace * 9 + 0 + 2] = quad[0].z;

      positions[kFace * 9 + 3 + 0] = quad[1].x;
      positions[kFace * 9 + 3 + 1] = quad[1].y;
      positions[kFace * 9 + 3 + 2] = quad[1].z;

      positions[kFace * 9 + 6 + 0] = quad[2].x;
      positions[kFace * 9 + 6 + 1] = quad[2].y;
      positions[kFace * 9 + 6 + 2] = quad[2].z;

      kFace++;

      positions[kFace * 9 + 0 + 0] = quad[2].x;
      positions[kFace * 9 + 0 + 1] = quad[2].y;
      positions[kFace * 9 + 0 + 2] = quad[2].z;

      positions[kFace * 9 + 3 + 0] = quad[3].x;
      positions[kFace * 9 + 3 + 1] = quad[3].y;
      positions[kFace * 9 + 3 + 2] = quad[3].z;

      positions[kFace * 9 + 6 + 0] = quad[0].x;
      positions[kFace * 9 + 6 + 1] = quad[0].y;
      positions[kFace * 9 + 6 + 2] = quad[0].z;

      kFace++;
    }
  }
};
