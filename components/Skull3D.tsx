"use client";

import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type SceneType = "hotel" | "alley" | "office" | "void" | "archive";

interface Skull3DProps {
  className?: string;
  scene?: SceneType;
  onSkullClick?: () => void;
}

// ─── Lightweight skull: separate cranium, jaw, sockets ───
function useSkullGeo() {
  return useMemo(() => {
    // Cranium — low-poly sphere with subtle shaping
    const cranium = new THREE.SphereGeometry(1, 20, 16);
    cranium.scale(0.82, 1, 0.85);
    cranium.translate(0, 0.15, 0);

    // Jaw
    const jaw = new THREE.SphereGeometry(0.45, 16, 10);
    jaw.scale(0.9, 0.38, 0.75);
    jaw.translate(0, -0.52, 0.05);

    // Left eye socket
    const eyeL = new THREE.CircleGeometry(0.17, 12);
    eyeL.translate(-0.27, 0.22, 0.72);

    // Right eye socket
    const eyeR = new THREE.CircleGeometry(0.17, 12);
    eyeR.translate(0.27, 0.22, 0.72);

    // Nose hole
    const nose = new THREE.CircleGeometry(0.07, 6);
    nose.translate(0, -0.02, 0.74);

    // Teeth — simple boxes
    const teeth: THREE.BufferGeometry[] = [];
    for (let i = -3; i <= 3; i++) {
      const t = new THREE.BoxGeometry(0.048, 0.06, 0.03);
      t.translate(i * 0.06, -0.36, 0.5);
      teeth.push(t);
    }

    // Cheekbones
    const cheekL = new THREE.SphereGeometry(0.12, 8, 6);
    cheekL.scale(1, 0.6, 0.5);
    cheekL.translate(-0.42, 0.0, 0.45);

    const cheekR = new THREE.SphereGeometry(0.12, 8, 6);
    cheekR.scale(1, 0.6, 0.5);
    cheekR.translate(0.42, 0.0, 0.45);

    return {
      bone: [cranium, jaw, cheekL, cheekR, ...teeth],
      eyes: [eyeL, eyeR, nose],
    };
  }, []);
}

// ─── Mouse parallax ───
function useParallax() {
  const mouse = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    const onTouch = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      mouse.current.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);
  return mouse;
}

// ─── Particles (shared, lightweight) ───
function DustParticles({ count = 60, color = "#c4923a" }: { count?: number; color?: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 7,
      y: Math.random() * 5 + 1,
      z: (Math.random() - 0.5) * 5,
      speed: 0.002 + Math.random() * 0.004,
      phase: Math.random() * Math.PI * 2,
    })), [count]);

  useFrame((s) => {
    if (!ref.current) return;
    const d = new THREE.Object3D();
    const t = s.clock.elapsedTime;
    data.forEach((p, i) => {
      p.y -= p.speed;
      if (p.y < -2) p.y = 4;
      d.position.set(p.x + Math.sin(t * 0.3 + p.phase) * 0.2, p.y, p.z);
      d.scale.setScalar(0.008);
      d.updateMatrix();
      ref.current!.setMatrixAt(i, d.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 3, 3]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} />
    </instancedMesh>
  );
}

// ═══════════════════════════════════════
// SkullMesh — renders the skull geometry
// ═══════════════════════════════════════
function SkullMesh({
  skull,
  boneColor = "#d4c4a0",
  emissive = "#8a6a30",
  eyeEmissive = "#c4923a",
  opacity = 1,
  wireframe = false,
  onClick,
}: {
  skull: ReturnType<typeof useSkullGeo>;
  boneColor?: string;
  emissive?: string;
  eyeEmissive?: string;
  opacity?: number;
  wireframe?: boolean;
  onClick?: () => void;
}) {
  return (
    <group onClick={onClick}>
      {skull.bone.map((geo, i) => (
        <mesh key={`b${i}`} geometry={geo}>
          <meshStandardMaterial
            color={boneColor}
            emissive={emissive}
            emissiveIntensity={0.08}
            roughness={0.85}
            metalness={0.05}
            transparent={opacity < 1}
            opacity={opacity}
            wireframe={wireframe}
          />
        </mesh>
      ))}
      {skull.eyes.map((geo, i) => (
        <mesh key={`e${i}`} geometry={geo}>
          <meshBasicMaterial
            color="#050505"
            transparent
            opacity={opacity * 0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {/* Eye glow */}
      <pointLight position={[-0.27, 0.22, 0.8]} color={eyeEmissive} intensity={0.6} distance={1.2} decay={2} />
      <pointLight position={[0.27, 0.22, 0.8]} color={eyeEmissive} intensity={0.6} distance={1.2} decay={2} />
    </group>
  );
}

// ═══ SCENE: Hotel ═══
function HotelScene({ onSkullClick }: { onSkullClick?: () => void }) {
  const skull = useSkullGeo();
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useParallax();
  const { viewport } = useThree();

  useFrame((s) => {
    if (!groupRef.current) return;
    const t = s.clock.elapsedTime;
    groupRef.current.rotation.y += (mouse.current.x * 0.35 - groupRef.current.rotation.y) * 0.04;
    groupRef.current.rotation.x += (-mouse.current.y * 0.2 - groupRef.current.rotation.x) * 0.04;
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.06;
  });

  return (
    <>
      <group ref={groupRef} scale={viewport.width < 6 ? 1.1 : 1.35}>
        <SkullMesh skull={skull} onClick={onSkullClick} />
      </group>
      <DustParticles count={50} />
    </>
  );
}

// ═══ SCENE: Alley ═══
function AlleyScene({ onSkullClick }: { onSkullClick?: () => void }) {
  const skull = useSkullGeo();
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useParallax();
  const { viewport } = useThree();

  useFrame((s) => {
    if (!groupRef.current) return;
    const t = s.clock.elapsedTime;
    groupRef.current.rotation.y += (mouse.current.x * 0.3 - groupRef.current.rotation.y) * 0.03;
    groupRef.current.rotation.y += Math.sin(t * 6) * 0.003;
  });

  return (
    <>
      <group ref={groupRef} scale={viewport.width < 6 ? 1 : 1.3}>
        <SkullMesh
          skull={skull}
          boneColor="#a0b0c0"
          emissive="#203050"
          eyeEmissive="#5080c0"
          onClick={onSkullClick}
        />
      </group>
      <DustParticles count={40} color="#6090c0" />
    </>
  );
}

// ═══ SCENE: Office ═══
function OfficeScene({ onSkullClick }: { onSkullClick?: () => void }) {
  const skull = useSkullGeo();
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  useFrame((s) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = s.clock.elapsedTime * 0.12;
  });

  return (
    <>
      <group ref={groupRef} scale={viewport.width < 6 ? 1 : 1.3}>
        <SkullMesh
          skull={skull}
          boneColor="#30a030"
          emissive="#104010"
          eyeEmissive="#40ff40"
          wireframe
          onClick={onSkullClick}
        />
      </group>
      <DustParticles count={30} color="#40c040" />
    </>
  );
}

// ═══ SCENE: Void ═══
function VoidScene({ onSkullClick }: { onSkullClick?: () => void }) {
  const skull = useSkullGeo();
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useParallax();

  useFrame((s) => {
    if (!groupRef.current) return;
    const t = s.clock.elapsedTime;
    groupRef.current.rotation.y += (mouse.current.x * 0.08 - groupRef.current.rotation.y) * 0.01;
    groupRef.current.scale.setScalar(2.2 + Math.sin(t * 0.8) * 0.05);
  });

  return (
    <group ref={groupRef} scale={2.2}>
      <SkullMesh
        skull={skull}
        opacity={0.2}
        eyeEmissive="#c4923a"
        onClick={onSkullClick}
      />
    </group>
  );
}

// ═══ SCENE: Archive ═══
function ArchiveScene({ onSkullClick }: { onSkullClick?: () => void }) {
  const skull = useSkullGeo();
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useParallax();
  const { viewport } = useThree();

  const configs = useMemo(() => [
    { pos: [0, 0, 0] as const, sc: 0.5, rs: 0.2 },
    { pos: [-1.8, 0.8, -1] as const, sc: 0.28, rs: -0.25 },
    { pos: [1.7, -0.4, -0.5] as const, sc: 0.32, rs: 0.2 },
    { pos: [-1.2, -1, -1.3] as const, sc: 0.22, rs: -0.15 },
  ], []);

  useFrame((s) => {
    if (!groupRef.current) return;
    const t = s.clock.elapsedTime;
    groupRef.current.rotation.y += (mouse.current.x * 0.15 - groupRef.current.rotation.y) * 0.03;
    groupRef.current.children.forEach((child, i) => {
      if (i >= configs.length) return;
      (child as THREE.Group).rotation.y = t * configs[i].rs;
    });
  });

  return (
    <>
      <group ref={groupRef} scale={viewport.width < 6 ? 0.7 : 0.9}>
        {configs.map((c, i) => (
          <group key={i} position={[c.pos[0], c.pos[1], c.pos[2]]} scale={c.sc}>
            <SkullMesh
              skull={skull}
              boneColor="#c4a878"
              emissive="#6a5020"
              opacity={i === 0 ? 0.9 : 0.4}
              onClick={i === 0 ? onSkullClick : undefined}
            />
          </group>
        ))}
      </group>
      <DustParticles count={30} color="#c4923a" />
    </>
  );
}

// ═══════════════════════════════════════
// Main
// ═══════════════════════════════════════
export default function Skull3D({ className = "", scene = "hotel", onSkullClick }: Skull3DProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const handleClick = useCallback(() => { onSkullClick?.(); }, [onSkullClick]);

  if (!mounted) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-24 h-24 sm:w-32 sm:h-32 border border-noir-accent/20 rounded-full animate-pulse" />
      </div>
    );
  }

  const Sc = { hotel: HotelScene, alley: AlleyScene, office: OfficeScene, void: VoidScene, archive: ArchiveScene }[scene];

  return (
    <div className={`touch-none ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 40 }}
        gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
        dpr={1}
        frameloop="always"
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 3, 5]} intensity={0.9} color="#f0e0c8" />
        <directionalLight position={[-2, 1, 3]} intensity={0.3} color="#c4923a" />
        <Sc onSkullClick={handleClick} />
      </Canvas>
    </div>
  );
}
