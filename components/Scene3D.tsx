"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";

function Rain({ count = 2000 }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return pos;
  }, [count]);

  useFrame(() => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= 0.15;
      pos[i * 3] += 0.01;
      if (pos[i * 3 + 1] < -1) {
        pos[i * 3 + 1] = 20;
        pos[i * 3] = (Math.random() - 0.5) * 40;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#667788" size={0.03} transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

function PulsingLight() {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.intensity = 1.5 + Math.sin(t * 0.8) * 0.8;
    const flicker = Math.random() > 0.97 ? 0.2 : 1;
    ref.current.intensity *= flicker;
  });
  return <pointLight ref={ref} color="#8b0000" position={[0, 4, 0]} distance={15} />;
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[50, 50]} />
      <MeshReflectorMaterial
        mirror={0.4}
        resolution={512}
        mixBlur={8}
        mixStrength={0.6}
        roughness={0.9}
        depthScale={1}
        color="#080808"
        metalness={0.4}
      />
    </mesh>
  );
}

function SceneContent() {
  return (
    <>
      <fog attach="fog" args={["#0a0000", 5, 25]} />
      <ambientLight color="#0a0a1a" intensity={0.3} />
      <spotLight
        position={[0, 12, 0]}
        angle={0.3}
        penumbra={0.8}
        intensity={1.5}
        color="#c4923a"
        castShadow
      />
      <PulsingLight />
      <pointLight color="#1a0000" position={[-5, 3, -5]} intensity={0.5} />
      <Floor />
      <Rain />
    </>
  );
}

export default function Scene3D() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 3, 8], fov: 60, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={["#000000"]} />
        <SceneContent />
      </Canvas>
    </div>
  );
}
