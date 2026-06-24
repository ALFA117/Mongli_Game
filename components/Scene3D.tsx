"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshBasicMaterial color="#060606" />
    </mesh>
  );
}

function PulsingLight() {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const flicker = Math.random() > 0.97 ? 0.3 : 1;
    ref.current.intensity = (1.5 + Math.sin(t * 0.8) * 0.8) * flicker;
  });
  return <pointLight ref={ref} color="#8b0000" position={[0, 4, 0]} distance={12} />;
}

function FloorGrid() {
  const ref = useRef<THREE.GridHelper>(null);
  return (
    <gridHelper
      ref={ref}
      args={[40, 40, "#1a0000", "#0a0000"]}
      position={[0, -0.49, 0]}
    />
  );
}

export default function Scene3D() {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 3, 8], fov: 55, near: 0.1, far: 40 }}
        gl={{ antialias: false, alpha: false, powerPreference: "low-power" }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#050000", 5, 22]} />
        <ambientLight color="#0a0a1a" intensity={0.3} />
        <spotLight position={[0, 10, 0]} angle={0.35} penumbra={0.9} intensity={1.2} color="#c4923a" />
        <PulsingLight />
        <Floor />
        <FloorGrid />
      </Canvas>
    </div>
  );
}
