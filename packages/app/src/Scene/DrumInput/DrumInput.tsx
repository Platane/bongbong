import React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Input } from "../../state/game";
import * as THREE from "three";
import { createDrumGeometry } from "../Terry/drum";
import { blue, red } from "../texture/theme";

export const DrumInput = ({
  inputs,

  ...props
}: {
  inputs: Input[];

  style?: React.CSSProperties;
  className?: string;
}) => (
  <Canvas
    {...props}
    dpr={[1, 2]}
    gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
    linear
    onCreated={({ camera: camera_ }) => {
      const camera = camera_ as THREE.PerspectiveCamera;

      camera.position.set(0, 4, 1.2);
      camera.lookAt(new THREE.Vector3(0, 0, -0.3));

      camera.near = 0.1;
      camera.far = 160;
      camera.fov = 40;
      camera.updateProjectionMatrix();
    }}
  >
    <group>
      <ambientLight intensity={Math.PI / 2} />
      <directionalLight position={[1, 4, 2]} intensity={10} color={"#eee"} />
    </group>

    <Drum inputs={inputs} />
  </Canvas>
);

const Drum = ({
  inputs,

  ...props
}: {
  inputs: Input[];
} & React.ComponentProps<"group">) => {
  const ref = React.useRef<THREE.Group | null>(null);

  useFrame(() => {
    const group = ref.current;
    if (!group) return;

    // group.rotation.z += 0.02;
  });

  const ANIMATION_DURATION = 0.5;
  const now = Date.now() / 1000;

  const recentInputs = inputs.filter(
    (i) => now - ANIMATION_DURATION < i.timestamp && i.timestamp < now
  );

  const [, refresh] = React.useReducer((x) => 1 + x, 1);
  React.useEffect(() => {
    if (!recentInputs[0]) return;
    const delta = recentInputs[0]?.timestamp + ANIMATION_DURATION - now;

    const timeout = setTimeout(refresh, delta * 1000);
    return () => clearTimeout(timeout);
  }, [recentInputs[0]?.timestamp]);

  return (
    <group {...props} ref={ref}>
      <mesh geometry={drumGeometry}>
        <meshNormalMaterial />
      </mesh>

      {recentInputs.map((i) => (
        <ImpactHelper key={i.timestamp} input={i} />
      ))}
    </group>
  );
};

const easeInOutBack = (x: number) =>
  x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

const ImpactHelper = ({
  input,
}: {
  input: Pick<Input, "timestamp" | "hand" | "kind">;
}) => {
  const ref = React.useRef<THREE.Group | null>(null);

  useFrame(() => {
    const t = Date.now() / 1000 - input.timestamp;
    const duration = 0.18;

    if (!ref.current) return;

    if (t > duration) {
      ref.current.visible = false;
    } else {
      ref.current.visible = true;

      const k = easeInOutBack(t / duration);

      ref.current.position.set(0, k * 0.1, 0);

      const s = 1 + k * 0.2;
      ref.current.scale.set(s, s, s);
    }
  });

  if (input.kind === "skin")
    return (
      <group ref={ref}>
        <mesh
          //
          position={[(input.hand === "left" ? 1 : -1) * 0.065, 1.001, 0]}
          scale={[0.45 * (input.hand === "left" ? 1 : -1), 0.5, 0.5]}
          geometry={halfDiskGeometry}
        >
          <meshBasicMaterial color={red} opacity={0.8} transparent />
        </mesh>
      </group>
    );

  if (input.kind === "ring")
    return (
      <group ref={ref}>
        <mesh
          //
          position={[(input.hand === "left" ? 1 : -1) * 0.065, 1.001, 0]}
          scale={[0.53 * (input.hand === "left" ? 1 : -1), 0.56, 0.56]}
          geometry={arcGeometry}
        >
          <meshBasicMaterial color={blue} opacity={0.8} transparent />
        </mesh>
      </group>
    );

  return null;
};

const createHalfDiskGeometry = () => {
  const shape = new THREE.Shape();
  shape.moveTo(0, 1);
  shape.arc(0, -1, 1, 0, Math.PI);

  const depth = 0.03;
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.04,
    bevelThickness: 0.01,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  const m = new THREE.Matrix4();

  m.makeTranslation(new THREE.Vector3(0, 0, -depth * 0.5));
  geometry.applyMatrix4(m);

  m.makeRotationX(Math.PI / 2);
  geometry.applyMatrix4(m);

  m.makeRotationY(Math.PI / 2);
  geometry.applyMatrix4(m);

  return geometry;
};

const createArcGeometry = () => {
  const h = 0.36;

  const shape = new THREE.Shape();
  shape.moveTo(0, 1 + h);
  shape.arc(0, -(1 + h), 1 + h, 0, Math.PI);
  shape.lineTo(-1, 0);
  shape.arc(1, 0, 1, Math.PI, 0, true);

  const depth = 0.03;
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth,
    steps: 1,
    bevelEnabled: !true,
    bevelSegments: 1,
    bevelSize: 0.04,
    bevelThickness: 0.01,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  const m = new THREE.Matrix4();

  m.makeTranslation(new THREE.Vector3(0, 0, -depth * 0.5));
  geometry.applyMatrix4(m);

  m.makeRotationX(Math.PI / 2);
  geometry.applyMatrix4(m);

  m.makeRotationY(Math.PI / 2);
  geometry.applyMatrix4(m);

  return geometry;
};

const drumGeometry = createDrumGeometry();
const halfDiskGeometry = createHalfDiskGeometry();
const arcGeometry = createArcGeometry();
