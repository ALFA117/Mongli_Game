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

// ─── Shared skull geometry builder ───
function useSkullParts() {
  return useMemo(() => {
    const group = new THREE.Group();

    const cranium = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32));
    cranium.geometry.scale(0.85, 1, 0.9);
    cranium.position.y = 0.2;
    group.add(cranium);

    const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 24));
    jaw.geometry.scale(1, 0.5, 0.85);
    jaw.position.set(0, -0.6, 0.1);
    group.add(jaw);

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16));
    eyeL.position.set(-0.3, 0.25, 0.65);
    group.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16));
    eyeR.position.set(0.3, 0.25, 0.65);
    group.add(eyeR);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 8));
    nose.position.set(0, -0.05, 0.75);
    nose.rotation.x = Math.PI;
    group.add(nose);

    const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12));
    cheekL.geometry.scale(1, 0.7, 0.6);
    cheekL.position.set(-0.5, -0.1, 0.5);
    group.add(cheekL);

    const cheekR = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12));
    cheekR.geometry.scale(1, 0.7, 0.6);
    cheekR.position.set(0.5, -0.1, 0.5);
    group.add(cheekR);

    for (let i = -3; i <= 3; i++) {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.04));
      tooth.position.set(i * 0.07, -0.42, 0.55);
      group.add(tooth);
    }

    group.updateMatrixWorld(true);
    const geos: THREE.BufferGeometry[] = [];
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const g = child.geometry.clone();
        child.updateWorldMatrix(true, false);
        g.applyMatrix4(child.matrixWorld);
        geos.push(g);
      }
    });
    return geos;
  }, []);
}

// ─── Mouse/touch parallax hook ───
function useParallax() {
  const mouse = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      mouse.current.x = (t.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(t.clientY / window.innerHeight) * 2 + 1;
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

// ═══════════════════════════════════════
// SCENE 1: Hotel — Classic noir skull
// ═══════════════════════════════════════
function HotelScene({ onSkullClick }: { onSkullClick?: () => void }) {
  const geos = useSkullParts();
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const mouse = useParallax();
  const { viewport } = useThree();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y += (mouse.current.x * 0.4 - groupRef.current.rotation.y) * 0.05;
    groupRef.current.rotation.x += (-mouse.current.y * 0.3 - groupRef.current.rotation.x) * 0.05;
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.1;
    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.1 + (Math.sin(t * 2) * 0.5 + 0.5) * 0.15;
    }
  });

  return (
    <>
      <fog attach="fog" args={["#0a1020", 3, 12]} />
      <group ref={groupRef} scale={viewport.width < 6 ? 1.2 : 1.5} onClick={onSkullClick}>
        {geos.map((geo, i) => (
          <mesh key={i} geometry={geo}>
            <meshStandardMaterial
              ref={i === 0 ? matRef : undefined}
              color="#e8d5b0"
              emissive="#c4923a"
              emissiveIntensity={0.15}
              roughness={0.7}
              metalness={0.3}
              transparent
              opacity={0.95}
            />
          </mesh>
        ))}
        <pointLight position={[-0.3, 0.25, 0.8]} color="#c4923a" intensity={0.5} distance={2} />
        <pointLight position={[0.3, 0.25, 0.8]} color="#c4923a" intensity={0.5} distance={2} />
      </group>
      <HotelParticles />
    </>
  );
}

function HotelParticles() {
  const count = 200;
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() =>
    Array.from({ length: count }, () => ({
      pos: new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 6 + 2, (Math.random() - 0.5) * 8),
      speed: 0.003 + Math.random() * 0.008,
      sway: Math.random() * Math.PI * 2,
    })), []);

  useFrame((state) => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    const t = state.clock.elapsedTime;
    data.forEach((p, i) => {
      p.pos.y -= p.speed;
      if (p.pos.y < -3) p.pos.y = 5;
      dummy.position.set(
        p.pos.x + Math.sin(t * 0.5 + p.sway) * 0.3,
        p.pos.y,
        p.pos.z + Math.cos(t * 0.3 + p.sway) * 0.2
      );
      dummy.scale.setScalar(0.008 + Math.sin(t + p.sway) * 0.003);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#c4923a" transparent opacity={0.35} />
    </instancedMesh>
  );
}

// ═══════════════════════════════════════
// SCENE 2: Alley — Fragmented skull
// ═══════════════════════════════════════
function AlleyScene({ onSkullClick }: { onSkullClick?: () => void }) {
  const geos = useSkullParts();
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useParallax();
  const { viewport } = useThree();

  const fragmentOffsets = useMemo(() =>
    geos.map((_, i) => ({
      angle: (i / geos.length) * Math.PI * 2,
      radius: 0.3 + Math.random() * 0.4,
      speed: 0.2 + Math.random() * 0.3,
      yOff: (Math.random() - 0.5) * 0.3,
    })), [geos]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y += (mouse.current.x * 0.3 - groupRef.current.rotation.y) * 0.03;
    groupRef.current.rotation.x += (-mouse.current.y * 0.2 - groupRef.current.rotation.x) * 0.03;
    // Jitter
    groupRef.current.rotation.y += Math.sin(t * 8) * 0.002;
    groupRef.current.rotation.x += Math.cos(t * 6) * 0.001;

    groupRef.current.children.forEach((child, i) => {
      if (i >= fragmentOffsets.length) return;
      const fo = fragmentOffsets[i];
      child.position.x = Math.sin(t * fo.speed + fo.angle) * fo.radius;
      child.position.y = fo.yOff + Math.cos(t * fo.speed * 0.7 + fo.angle) * 0.1;
      child.position.z = Math.cos(t * fo.speed + fo.angle) * fo.radius * 0.5;
    });
  });

  return (
    <>
      <fog attach="fog" args={["#050a18", 3, 10]} />
      <group ref={groupRef} scale={viewport.width < 6 ? 1.1 : 1.4} onClick={onSkullClick}>
        {geos.map((geo, i) => (
          <mesh key={i} geometry={geo}>
            <meshStandardMaterial
              color="#b0c0d0"
              emissive="#3060a0"
              emissiveIntensity={0.1}
              roughness={0.8}
              metalness={0.2}
              transparent
              opacity={0.85}
            />
          </mesh>
        ))}
      </group>
      <RainParticles />
    </>
  );
}

function RainParticles() {
  const count = 400;
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() =>
    Array.from({ length: count }, () => ({
      pos: new THREE.Vector3((Math.random() - 0.5) * 10, Math.random() * 10, (Math.random() - 0.5) * 6),
      speed: 0.08 + Math.random() * 0.12,
    })), []);

  useFrame(() => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    data.forEach((p, i) => {
      p.pos.y -= p.speed;
      if (p.pos.y < -5) p.pos.y = 5;
      dummy.position.copy(p.pos);
      dummy.scale.set(0.003, 0.06, 0.003);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#6090c0" transparent opacity={0.25} />
    </instancedMesh>
  );
}

// ═══════════════════════════════════════
// SCENE 3: Office — Point cloud skull
// ═══════════════════════════════════════
function OfficeScene({ onSkullClick }: { onSkullClick?: () => void }) {
  const geos = useSkullParts();
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useParallax();
  const { viewport } = useThree();

  // Sample points from skull geometry
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (const geo of geos) {
      const posAttr = geo.getAttribute("position");
      for (let i = 0; i < posAttr.count; i += 3) {
        pts.push(new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i)));
      }
    }
    return pts;
  }, [geos]);

  const pointsGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);
    points.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    });
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [points]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Mechanical clockwork rotation
    groupRef.current.rotation.y = t * 0.15;
    groupRef.current.rotation.x += (-mouse.current.y * 0.1 - groupRef.current.rotation.x) * 0.02;
  });

  return (
    <>
      <fog attach="fog" args={["#050a05", 3, 12]} />
      <group ref={groupRef} scale={viewport.width < 6 ? 1.1 : 1.4} onClick={onSkullClick}>
        <points geometry={pointsGeo}>
          <pointsMaterial color="#40c040" size={0.025} transparent opacity={0.7} sizeAttenuation />
        </points>
      </group>
      <PaperParticles />
    </>
  );
}

function PaperParticles() {
  const count = 50;
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() =>
    Array.from({ length: count }, () => ({
      pos: new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6),
      rotSpeed: (Math.random() - 0.5) * 2,
      floatSpeed: 0.01 + Math.random() * 0.02,
      phase: Math.random() * Math.PI * 2,
    })), []);

  useFrame((state) => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    const t = state.clock.elapsedTime;
    data.forEach((p, i) => {
      dummy.position.set(
        p.pos.x + Math.sin(t * p.floatSpeed * 10 + p.phase) * 0.5,
        p.pos.y + Math.cos(t * p.floatSpeed * 8 + p.phase) * 0.3,
        p.pos.z
      );
      dummy.rotation.set(t * p.rotSpeed * 0.5, t * p.rotSpeed, 0);
      dummy.scale.set(0.06, 0.08, 0.002);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#e8d5b0" transparent opacity={0.15} />
    </instancedMesh>
  );
}

// ═══════════════════════════════════════
// SCENE 4: Void — Giant transparent skull
// ═══════════════════════════════════════
function VoidScene({ onSkullClick }: { onSkullClick?: () => void }) {
  const geos = useSkullParts();
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useParallax();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y += (mouse.current.x * 0.1 - groupRef.current.rotation.y) * 0.01;
    // Breathing scale
    const breathe = 1 + Math.sin(t * 0.8) * 0.03;
    groupRef.current.scale.setScalar(2.5 * breathe);
  });

  return (
    <>
      <group ref={groupRef} scale={2.5} onClick={onSkullClick}>
        {geos.map((geo, i) => (
          <mesh key={i} geometry={geo}>
            <meshStandardMaterial
              color="#e8d5b0"
              emissive="#c4923a"
              emissiveIntensity={0.05}
              roughness={0.9}
              metalness={0.1}
              transparent
              opacity={0.25}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>
      <WarpParticles />
    </>
  );
}

function WarpParticles() {
  const count = 300;
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() =>
    Array.from({ length: count }, () => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12,
        -Math.random() * 20
      ),
      speed: 0.02 + Math.random() * 0.06,
    })), []);

  useFrame(() => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    data.forEach((p, i) => {
      p.pos.z += p.speed;
      if (p.pos.z > 5) {
        p.pos.z = -20;
        p.pos.x = (Math.random() - 0.5) * 12;
        p.pos.y = (Math.random() - 0.5) * 12;
      }
      dummy.position.copy(p.pos);
      const sz = 0.005 + (p.pos.z + 20) / 25 * 0.015;
      dummy.scale.setScalar(sz);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#e8d5b0" transparent opacity={0.6} />
    </instancedMesh>
  );
}

// ═══════════════════════════════════════
// SCENE 5: Archive — Multiple skulls
// ═══════════════════════════════════════
function ArchiveScene({ onSkullClick }: { onSkullClick?: () => void }) {
  const geos = useSkullParts();
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useParallax();
  const { viewport } = useThree();

  const skullConfigs = useMemo(() => [
    { pos: [0, 0, 0] as const, scale: 0.6, rotSpeed: 0.2 },
    { pos: [-2, 1, -1] as const, scale: 0.35, rotSpeed: -0.3 },
    { pos: [2, -0.5, -0.5] as const, scale: 0.4, rotSpeed: 0.25 },
    { pos: [-1.5, -1.2, -1.5] as const, scale: 0.3, rotSpeed: -0.15 },
    { pos: [1.8, 1.5, -2] as const, scale: 0.25, rotSpeed: 0.35 },
    { pos: [0.5, -1.8, -1] as const, scale: 0.3, rotSpeed: -0.2 },
  ], []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y += (mouse.current.x * 0.2 - groupRef.current.rotation.y) * 0.03;
    groupRef.current.rotation.x += (-mouse.current.y * 0.15 - groupRef.current.rotation.x) * 0.03;

    groupRef.current.children.forEach((child, idx) => {
      if (idx >= skullConfigs.length) return;
      const cfg = skullConfigs[idx];
      (child as THREE.Group).rotation.y = t * cfg.rotSpeed;
      (child as THREE.Group).position.y = cfg.pos[1] + Math.sin(t * 0.5 + idx) * 0.1;
    });
  });

  const sc = viewport.width < 6 ? 0.8 : 1;

  return (
    <>
      <fog attach="fog" args={["#120e08", 3, 12]} />
      <group ref={groupRef} scale={sc} onClick={onSkullClick}>
        {skullConfigs.map((cfg, si) => (
          <group key={si} position={[cfg.pos[0], cfg.pos[1], cfg.pos[2]]} scale={cfg.scale}>
            {geos.map((geo, gi) => (
              <mesh key={gi} geometry={geo}>
                <meshStandardMaterial
                  color="#d4b896"
                  emissive="#8a6a3a"
                  emissiveIntensity={0.1}
                  roughness={0.8}
                  metalness={0.2}
                  transparent
                  opacity={si === 0 ? 0.9 : 0.5}
                />
              </mesh>
            ))}
          </group>
        ))}
      </group>
      <ArchiveParticles />
    </>
  );
}

function ArchiveParticles() {
  const count = 80;
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() =>
    Array.from({ length: count }, () => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6
      ),
      rotSpeed: (Math.random() - 0.5) * 0.5,
      phase: Math.random() * Math.PI * 2,
    })), []);

  useFrame((state) => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    const t = state.clock.elapsedTime;
    data.forEach((p, i) => {
      dummy.position.set(
        p.pos.x + Math.sin(t * 0.2 + p.phase) * 0.5,
        p.pos.y + Math.cos(t * 0.15 + p.phase) * 0.3,
        p.pos.z
      );
      dummy.rotation.z = t * p.rotSpeed;
      dummy.scale.set(0.05 + Math.random() * 0.03, 0.04, 0.001);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color="#c4923a" transparent opacity={0.12} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

// ═══════════════════════════════════════
// Main component
// ═══════════════════════════════════════
export default function Skull3D({ className = "", scene = "hotel", onSkullClick }: Skull3DProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = useCallback(() => {
    onSkullClick?.();
  }, [onSkullClick]);

  if (!mounted) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-24 h-24 sm:w-32 sm:h-32 border border-noir-accent/20 rounded-full animate-pulse" />
      </div>
    );
  }

  const SceneComponent = {
    hotel: HotelScene,
    alley: AlleyScene,
    office: OfficeScene,
    void: VoidScene,
    archive: ArchiveScene,
  }[scene];

  return (
    <div className={`touch-none ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.2} />
        <directionalLight position={[2, 3, 5]} intensity={0.6} color="#e8d5b0" />
        <directionalLight position={[-2, -1, 3]} intensity={0.3} color="#c4923a" />
        <SceneComponent onSkullClick={handleClick} />
      </Canvas>
    </div>
  );
}
