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
    const material = new THREE.MeshStandardMaterial({ color: "orange" });

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
      step,
    } = createWorld({ particleCount, restingLength }, { A, B });

    const onFrame = (_, dt) => {
      if (!ref.current) return;

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

  const step = (dt: number) => {
    bodyA.setTranslation(A as any, true);
    bodyB.setTranslation(B as any, true);

    world.step();
  };

  const dispose = () => {};

  return { step, applyToScene, dispose };
};
