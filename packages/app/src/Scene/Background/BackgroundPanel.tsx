import React from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { FlowerParticles } from "./FlowerParticles";
import { Waves } from "./Waves";

export const BackgroundPanel = ({
  getT,

  ...props
}: {
  getT: () => number;

  style?: React.CSSProperties;
  className?: string;
}) => (
  <Canvas
    dpr={[1, 2]}
    gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
    linear
    {...props}
  >
    <Scene getT={getT} />
  </Canvas>
);

const Scene = ({ getT }: { getT: () => number }) => {
  const { size, camera } = useThree();

  // React.useEffect(() => {
  //   (camera as THREE.PerspectiveCamera).fov = Math.random() * 100;
  // }, [size.width, size.height]);

  const [perspectiveCamera] = React.useState(
    () => new THREE.PerspectiveCamera()
  );
  const [orthographicCamera] = React.useState(
    () => new THREE.OrthographicCamera()
  );
  const [backgroundTexture] = React.useState(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 8;
    const ctx = canvas.getContext("2d")!;

    const linearGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    linearGradient.addColorStop(0, "#ffddbe");
    linearGradient.addColorStop(1, "#ff7300");

    ctx.fillStyle = linearGradient;

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    return new THREE.CanvasTexture(canvas);
  });

  const [viewport, setViewport] = React.useState({
    x: -10,
    y: -10,
    width: 20,
    height: 20,
  });

  useFrame(({ gl, size, scene }) => {
    const aspectRatio = size.height / size.width;

    const width = size.width / 63;
    const height = width * aspectRatio;

    orthographicCamera.left = -width / 2;
    orthographicCamera.right = width / 2;

    orthographicCamera.bottom = -height / 2;
    orthographicCamera.top = height / 2;

    setViewport((v) => {
      const v2 = {
        x: orthographicCamera.left,
        y: orthographicCamera.bottom,
        width: orthographicCamera.right - orthographicCamera.left,
        height: orthographicCamera.top - orthographicCamera.bottom,
      };

      if (
        v2.x !== v.x ||
        v2.y !== v.y ||
        v2.width !== v.width ||
        v2.height !== v.height
      )
        return v2;

      return v;
    });

    orthographicCamera.position.set(0, 0, 1);
    orthographicCamera.lookAt(new THREE.Vector3(0, 0, 0));

    orthographicCamera.updateProjectionMatrix();

    scene.background = backgroundTexture;

    gl.render(scene, orthographicCamera);
  }, 1);

  return (
    <>
      <FlowerParticles
        width={Math.ceil(viewport.width) + 2}
        height={Math.ceil(viewport.height) + 2}
        getT={getT}
        position={[viewport.x - 1, viewport.y - 1, 0]}
      />

      <Waves
        size={50 + Math.min(120, (viewport.width / viewport.height) * 80)}
        width={viewport.width * 1.1}
        height={viewport.width * 0.1 + 2}
        position={[0, viewport.y + 2.5 - (viewport.width * 0.1 + 2) / 2, 0]}
        rotation={[0, 0, -0.12]}
        getT={getT}
      />
    </>
  );
};
