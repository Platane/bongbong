import { createRoot } from "react-dom/client";
import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Terry } from "./Terry/Terry";

export const Scene = (props: React.ComponentProps<typeof Canvas>) => (
  <Canvas {...props}>
    <ambientLight intensity={Math.PI / 2} />
    <directionalLight position={[1, 4, 2]} intensity={10} color={"#eee"} />

    <Terry />
  </Canvas>
);
