import { createPortal, useFrame, useThree } from "@react-three/fiber";
import React from "react";
import * as THREE from "three";
import type * as IRAPIER from "@dimforge/rapier3d";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
import { computeGeometryWeight } from "../utils/bones";

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
  radius: number;

  children: React.ReactElement;
};

export const Arm = (props: Props) => {
  const [, refresh] = React.useReducer((x) => 1 + x, 1);
  React.useEffect(() => void init().then(refresh), []);

  if (RAPIER) return <Arm_ {...props} />;

  return null;
};

const Arm_ = ({ particleCount, restingLength, radius, ...props }: Props) => {
  const refGroup = React.useRef<THREE.Group | null>(null);
  const refMesh = React.useRef<THREE.SkinnedMesh | null>(null);

  const refAnchor = React.useRef({
    A: new THREE.Vector3(),
    B: new THREE.Vector3(),
  });
  refAnchor.current.A.copy(props.A);
  refAnchor.current.B.copy(props.B);

  const { scene } = useThree();

  const { geometry, bones, rootBone, skeleton } = React.useMemo(
    () =>
      createArmGeometry({
        radius,
        radialSegments: 18,
        linearSegments: 48,
        restingLength,
        particleCount,
      }),
    []
  );

  const { dispose, onFrame } = React.useMemo(() => {
    const A = new THREE.Vector3();
    A.copy(refAnchor.current.A);
    const B = new THREE.Vector3();
    B.copy(refAnchor.current.B);

    const {
      dispose: disposeWorld,
      applyToScene,
      step,
    } = createWorld({ particleCount, restingLength }, { A, B });

    const onFrame = (_: unknown, dt: number) => {
      if (!refGroup.current) return;

      const mesh = refMesh.current;

      if (mesh && !mesh.skeleton) {
        mesh.bind(skeleton);
        mesh.add(rootBone);
      }

      A.copy(refAnchor.current.A);
      refGroup.current.localToWorld(A);

      B.copy(refAnchor.current.B);
      refGroup.current.localToWorld(B);

      bones[0].position.copy(A);
      bones.at(-1)!.position.copy(B);

      step(dt);
      applyToScene(bones);
    };

    return {
      dispose: () => {
        disposeWorld();
      },
      onFrame,
    };
  }, [particleCount, restingLength]);
  React.useEffect(() => dispose, [dispose]);

  useFrame(onFrame);

  const material = React.Children.toArray(props.children).findLast((c) =>
    c?.type?.match(/mesh\w+Material/)
  );

  return (
    <group ref={refGroup}>
      {createPortal(
        <>
          <skinnedMesh ref={refMesh} geometry={geometry}>
            {material}
          </skinnedMesh>

          {!!false &&
            bones.map((b, i) => (
              <mesh
                key={i}
                position={b.localToWorld(new THREE.Vector3())}
                quaternion={b.getWorldQuaternion(new THREE.Quaternion())}
              >
                <boxGeometry args={[0.4, 0.16, 0.16]} />
                <meshStandardMaterial
                  depthTest={false}
                  depthWrite={false}
                  color="yellow"
                  wireframe
                />
              </mesh>
            ))}
        </>,
        scene
      )}
    </group>
  );
};

new THREE.TorusGeometry(1, 0.5, 5, 5);

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

  const ballRadius = 0.01;

  const bodies = Array.from({ length: particleCount }, (_, i) => {
    let rigidBodyDesc: IRAPIER.RigidBodyDesc;
    if (i === 0 || i === particleCount - 1)
      rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
    else rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setGravityScale(0.4);

    const rigidBody = world.createRigidBody(rigidBodyDesc);
    rigidBody.setBodyType(RAPIER.RigidBodyType.Dynamic, false);

    rigidBody.setEnabledRotations(false, false, false, false);

    const k = i / (particleCount - 1);
    rigidBody.setTranslation({ x: A.x + restingLength * k, y: 0, z: 0 }, false);

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

    const o = { x: 0, y: 0, z: 0 };

    const l = Math.hypot(pos1.x - pos2.x, pos1.y - pos2.y, pos1.z - pos2.z);

    const stiffness = 250;
    const damping = 12;
    const joinData = RAPIER.JointData.spring(
      l / 2,
      stiffness,
      damping,
      { x: ballRadius, y: 0, z: 0 },
      { x: -ballRadius, y: 0, z: 0 }
    );

    const joint = world.createImpulseJoint(joinData, body1, body2, false);
  }

  const applyToScene = (objects: THREE.Object3D[]) => {
    for (let i = bodies.length; i--; ) {
      const g = objects[i];
      const body = bodies[i];

      const position = body.translation();
      g.position.copy(position as any);

      const rotation = body.rotation();
      g.quaternion.copy(rotation as any);

      if (i > 0) {
        const nextBody = bodies[i - 1];
        const nextPosition = nextBody.translation();
        const b = new THREE.Vector3(
          nextPosition.x,
          nextPosition.y,
          nextPosition.z
        );
        g.lookAt(b);
        g.rotateY(-Math.PI / 2);
      }
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

const createArmSkeletton = ({
  particleCount,
  restingLength,
}: {
  particleCount: number;
  restingLength: number;
}) => {
  const root = new THREE.Bone();
  const bones = Array.from({ length: particleCount }, (_, i) => {
    const b = new THREE.Bone();
    b.position.set(0, (i / (particleCount - 1) - 0.5) * restingLength, 0);
    root.add(b);
    return b;
  });
  const skeleton = new THREE.Skeleton(bones);
  return { skeleton, bones, root };
};

const createArmGeometry = ({
  radius,
  radialSegments,
  linearSegments,
  restingLength,
  particleCount,
}: {
  radius: number;
  radialSegments: number;
  linearSegments: number;
  restingLength: number;
  particleCount: number;
}) => {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const cylinderGeometry = new THREE.CylinderGeometry(
    radius,
    radius,
    restingLength,
    radialSegments,
    linearSegments
  );

  const sphereGeometryA = new THREE.SphereGeometry(
    radius * 0.99,
    radialSegments,
    radialSegments,
    0,
    Math.PI
  );
  q.setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
  sphereGeometryA.applyQuaternion(q);
  m.makeTranslation(new THREE.Vector3(0, -restingLength * 0.5, 0));
  sphereGeometryA.applyMatrix4(m);

  const sphereGeometryB = new THREE.SphereGeometry(
    radius * 0.99,
    radialSegments,
    radialSegments,
    0,
    Math.PI
  );
  q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  sphereGeometryB.applyQuaternion(q);
  m.makeTranslation(new THREE.Vector3(0, restingLength * 0.5, 0));
  sphereGeometryB.applyMatrix4(m);

  const geometry = mergeGeometries([
    cylinderGeometry,
    sphereGeometryA,
    sphereGeometryB,
  ]);

  const { skeleton, bones, root } = createArmSkeletton({
    restingLength,
    particleCount,
  });

  const b = new THREE.Vector3();
  computeGeometryWeight(
    geometry,
    bones,
    (p: THREE.Vector3, bone: THREE.Bone) => {
      bone.getWorldPosition(b);

      const d = p.distanceTo(b);

      if (d === 0) return 9999;

      return 1 / d ** 2;
    }
  );

  return { geometry, skeleton, bones, rootBone: root };
};
