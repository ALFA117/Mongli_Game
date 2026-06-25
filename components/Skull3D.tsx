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

// ─── Realistic skull built from layered geometry with correct materials ───
function useSkullModel() {
  return useMemo(() => {
    // CRANIUM — elongated sphere, slightly flattened at sides
    const craniumGeo = new THREE.SphereGeometry(1, 48, 48);
    const posAttr = craniumGeo.getAttribute("position");
    for (let i = 0; i < posAttr.count; i++) {
      let x = posAttr.getX(i);
      let y = posAttr.getY(i);
      let z = posAttr.getZ(i);

      // Flatten sides
      x *= 0.82;
      // Elongate vertically
      y *= 1.05;
      // Flatten back, push face forward
      z *= 0.88;

      // Brow ridge — push forward above eyes
      if (y > 0.15 && y < 0.45 && z > 0.3) {
        z += 0.08;
        y += 0.02;
      }

      // Temple indentation
      if (Math.abs(x) > 0.55 && y > -0.1 && y < 0.5) {
        const indent = (Math.abs(x) - 0.55) * 0.3;
        x = x > 0 ? x - indent : x + indent;
      }

      posAttr.setXYZ(i, x, y, z);
    }
    craniumGeo.computeVertexNormals();
    craniumGeo.translate(0, 0.15, 0);

    // JAW — smaller sphere, flattened, with chin point
    const jawGeo = new THREE.SphereGeometry(0.48, 32, 32);
    const jawPos = jawGeo.getAttribute("position");
    for (let i = 0; i < jawPos.count; i++) {
      let x = jawPos.getX(i);
      let y = jawPos.getY(i);
      let z = jawPos.getZ(i);

      // Flatten vertically
      y *= 0.42;
      // Narrow the sides
      x *= 0.85;
      z *= 0.80;

      // Chin point
      if (y < -0.1 && z > 0) {
        z += (0.1 - y) * 0.15;
        y -= Math.abs(z) * 0.05;
      }

      jawPos.setXYZ(i, x, y, z);
    }
    jawGeo.computeVertexNormals();
    jawGeo.translate(0, -0.55, 0.05);

    // EYE SOCKETS — inset spheres (will be rendered dark)
    const eyeSocketGeoL = new THREE.SphereGeometry(0.19, 24, 24);
    eyeSocketGeoL.scale(1.1, 1.3, 0.7);
    eyeSocketGeoL.translate(-0.28, 0.22, 0.6);

    const eyeSocketGeoR = new THREE.SphereGeometry(0.19, 24, 24);
    eyeSocketGeoR.scale(1.1, 1.3, 0.7);
    eyeSocketGeoR.translate(0.28, 0.22, 0.6);

    // NASAL CAVITY — inverted triangle shape
    const nasalGeo = new THREE.ConeGeometry(0.09, 0.18, 3);
    nasalGeo.rotateX(Math.PI);
    nasalGeo.rotateZ(Math.PI);
    nasalGeo.translate(0, -0.02, 0.72);

    // CHEEKBONES — subtle ridges
    const cheekL = new THREE.SphereGeometry(0.14, 16, 16);
    cheekL.scale(1.2, 0.6, 0.5);
    cheekL.translate(-0.45, 0.0, 0.5);

    const cheekR = new THREE.SphereGeometry(0.14, 16, 16);
    cheekR.scale(1.2, 0.6, 0.5);
    cheekR.translate(0.45, 0.0, 0.5);

    // TEETH — two rows
    const teethGeos: THREE.BufferGeometry[] = [];
    for (let i = -3; i <= 3; i++) {
      // Upper teeth
      const upper = new THREE.BoxGeometry(0.052, 0.07, 0.035);
      upper.translate(i * 0.065, -0.38, 0.52);
      teethGeos.push(upper);
      // Lower teeth
      const lower = new THREE.BoxGeometry(0.048, 0.06, 0.03);
      lower.translate(i * 0.063, -0.48, 0.50);
      teethGeos.push(lower);
    }

    // ZYGOMATIC ARCH — connecting cheek to temple
    const archL = new THREE.CylinderGeometry(0.03, 0.025, 0.35, 8);
    archL.rotateZ(Math.PI / 2.5);
    archL.translate(-0.55, 0.1, 0.35);

    const archR = new THREE.CylinderGeometry(0.03, 0.025, 0.35, 8);
    archR.rotateZ(-Math.PI / 2.5);
    archR.translate(0.55, 0.1, 0.35);

    return {
      bone: [craniumGeo, jawGeo, cheekL, cheekR, archL, archR, ...teethGeos],
      sockets: [eyeSocketGeoL, eyeSocketGeoR, nasalGeo],
    };
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
  const skull = useSkullModel();
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useParallax();
  const { viewport } = useThree();
  const glowRef = useRef(0);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y += (mouse.current.x * 0.4 - groupRef.current.rotation.y) * 0.05;
    groupRef.current.rotation.x += (-mouse.current.y * 0.25 - groupRef.current.rotation.x) * 0.05;
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.08;
    glowRef.current = Math.sin(t * 2) * 0.5 + 0.5;
  });

  const sc = viewport.width < 6 ? 1.1 : 1.4;

  return (
    <>
      <fog attach="fog" args={["#0a1020", 4, 14]} />
      <group ref={groupRef} scale={sc} onClick={onSkullClick}>
        {/* Bone material — weathered ivory */}
        {skull.bone.map((geo, i) => (
          <mesh key={`bone-${i}`} geometry={geo} castShadow receiveShadow>
            <meshStandardMaterial
              color="#d4c4a0"
              emissive="#8a6a30"
              emissiveIntensity={0.06}
              roughness={0.85}
              metalness={0.05}
            />
          </mesh>
        ))}
        {/* Dark cavities — eye sockets and nose */}
        {skull.sockets.map((geo, i) => (
          <mesh key={`socket-${i}`} geometry={geo}>
            <meshStandardMaterial
              color="#0a0a08"
              emissive="#c4923a"
              emissiveIntensity={i < 2 ? 0.15 : 0}
              roughness={1}
              metalness={0}
            />
          </mesh>
        ))}
        {/* Eye glow lights */}
        <pointLight position={[-0.28, 0.22, 0.75]} color="#c4923a" intensity={0.8} distance={1.5} decay={2} />
        <pointLight position={[0.28, 0.22, 0.75]} color="#c4923a" intensity={0.8} distance={1.5} decay={2} />
      </group>
      <HotelParticles />
    </>
  );
}

function HotelParticles() {
  const count = 150;
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() =>
    Array.from({ length: count }, () => ({
      pos: new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 6 + 2, (Math.random() - 0.5) * 8),
      speed: 0.003 + Math.random() * 0.006,
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
      <meshBasicMaterial color="#c4923a" transparent opacity={0.3} />
    </instancedMesh>
  );
}

// ═══════════════════════════════════════
// SCENE 2: Alley — Fragmented skull
// ═══════════════════════════════════════
function AlleyScene({ onSkullClick }: { onSkullClick?: () => void }) {
  const skull = useSkullModel();
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useParallax();
  const { viewport } = useThree();
  const allGeos = [...skull.bone, ...skull.sockets];

  const offsets = useMemo(() =>
    allGeos.map((_, i) => ({
      angle: (i / allGeos.length) * Math.PI * 2,
      radius: 0.25 + Math.random() * 0.35,
      speed: 0.15 + Math.random() * 0.25,
      yOff: (Math.random() - 0.5) * 0.25,
    })), [allGeos.length]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y += (mouse.current.x * 0.3 - groupRef.current.rotation.y) * 0.03;
    groupRef.current.rotation.x += (-mouse.current.y * 0.2 - groupRef.current.rotation.x) * 0.03;
    groupRef.current.rotation.y += Math.sin(t * 8) * 0.002;

    groupRef.current.children.forEach((child, i) => {
      if (i >= offsets.length) return;
      const o = offsets[i];
      child.position.x = Math.sin(t * o.speed + o.angle) * o.radius;
      child.position.y = o.yOff + Math.cos(t * o.speed * 0.7 + o.angle) * 0.08;
      child.position.z = Math.cos(t * o.speed + o.angle) * o.radius * 0.4;
    });
  });

  return (
    <>
      <fog attach="fog" args={["#050a18", 3, 10]} />
      <group ref={groupRef} scale={viewport.width < 6 ? 1 : 1.3} onClick={onSkullClick}>
        {allGeos.map((geo, i) => (
          <mesh key={i} geometry={geo}>
            <meshStandardMaterial
              color={i >= skull.bone.length ? "#050508" : "#a0b0c0"}
              emissive={i >= skull.bone.length ? "#3060a0" : "#203050"}
              emissiveIntensity={0.08}
              roughness={0.8}
              metalness={0.15}
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
  const count = 350;
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() =>
    Array.from({ length: count }, () => ({
      pos: new THREE.Vector3((Math.random() - 0.5) * 10, Math.random() * 10, (Math.random() - 0.5) * 6),
      speed: 0.08 + Math.random() * 0.1,
    })), []);

  useFrame(() => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    data.forEach((p, i) => {
      p.pos.y -= p.speed;
      if (p.pos.y < -5) p.pos.y = 5;
      dummy.position.copy(p.pos);
      dummy.scale.set(0.003, 0.05, 0.003);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#6090c0" transparent opacity={0.2} />
    </instancedMesh>
  );
}

// ═══════════════════════════════════════
// SCENE 3: Office — Point cloud skull
// ═══════════════════════════════════════
function OfficeScene({ onSkullClick }: { onSkullClick?: () => void }) {
  const skull = useSkullModel();
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useParallax();
  const { viewport } = useThree();

  const pointsGeo = useMemo(() => {
    const pts: number[] = [];
    for (const geo of [...skull.bone, ...skull.sockets]) {
      const attr = geo.getAttribute("position");
      for (let i = 0; i < attr.count; i += 2) {
        pts.push(attr.getX(i), attr.getY(i), attr.getZ(i));
      }
    }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return bg;
  }, [skull]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    groupRef.current.rotation.x += (-mouse.current.y * 0.1 - groupRef.current.rotation.x) * 0.02;
  });

  return (
    <>
      <fog attach="fog" args={["#050a05", 3, 12]} />
      <group ref={groupRef} scale={viewport.width < 6 ? 1.1 : 1.4} onClick={onSkullClick}>
        <points geometry={pointsGeo}>
          <pointsMaterial color="#40c040" size={0.02} transparent opacity={0.65} sizeAttenuation />
        </points>
      </group>
      <PaperParticles />
    </>
  );
}

function PaperParticles() {
  const count = 40;
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
        p.pos.x + Math.sin(t * p.floatSpeed * 10 + p.phase) * 0.4,
        p.pos.y + Math.cos(t * p.floatSpeed * 8 + p.phase) * 0.3,
        p.pos.z
      );
      dummy.rotation.set(t * p.rotSpeed * 0.5, t * p.rotSpeed, 0);
      dummy.scale.set(0.05, 0.07, 0.002);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#e8d5b0" transparent opacity={0.12} />
    </instancedMesh>
  );
}

// ═══════════════════════════════════════
// SCENE 4: Void — Giant transparent skull
// ═══════════════════════════════════════
function VoidScene({ onSkullClick }: { onSkullClick?: () => void }) {
  const skull = useSkullModel();
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useParallax();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y += (mouse.current.x * 0.1 - groupRef.current.rotation.y) * 0.01;
    const breathe = 1 + Math.sin(t * 0.8) * 0.025;
    groupRef.current.scale.setScalar(2.5 * breathe);
  });

  return (
    <>
      <group ref={groupRef} scale={2.5} onClick={onSkullClick}>
        {skull.bone.map((geo, i) => (
          <mesh key={`b-${i}`} geometry={geo}>
            <meshStandardMaterial
              color="#d4c4a0"
              emissive="#c4923a"
              emissiveIntensity={0.04}
              roughness={0.9}
              metalness={0.05}
              transparent
              opacity={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
        {skull.sockets.map((geo, i) => (
          <mesh key={`s-${i}`} geometry={geo}>
            <meshStandardMaterial
              color="#000"
              emissive="#c4923a"
              emissiveIntensity={i < 2 ? 0.3 : 0}
              transparent
              opacity={0.3}
            />
          </mesh>
        ))}
      </group>
      <WarpParticles />
    </>
  );
}

function WarpParticles() {
  const count = 250;
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() =>
    Array.from({ length: count }, () => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12,
        -Math.random() * 20
      ),
      speed: 0.02 + Math.random() * 0.05,
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
      dummy.scale.setScalar(0.005 + (p.pos.z + 20) / 25 * 0.012);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#e8d5b0" transparent opacity={0.5} />
    </instancedMesh>
  );
}

// ═══════════════════════════════════════
// SCENE 5: Archive — Multiple skulls
// ═══════════════════════════════════════
function ArchiveScene({ onSkullClick }: { onSkullClick?: () => void }) {
  const skull = useSkullModel();
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useParallax();
  const { viewport } = useThree();
  const allGeos = [...skull.bone, ...skull.sockets];

  const configs = useMemo(() => [
    { pos: [0, 0, 0] as const, scale: 0.55, rotSpeed: 0.2 },
    { pos: [-2, 1, -1] as const, scale: 0.3, rotSpeed: -0.3 },
    { pos: [2, -0.5, -0.5] as const, scale: 0.35, rotSpeed: 0.25 },
    { pos: [-1.5, -1.2, -1.5] as const, scale: 0.25, rotSpeed: -0.15 },
    { pos: [1.8, 1.5, -2] as const, scale: 0.22, rotSpeed: 0.35 },
  ], []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y += (mouse.current.x * 0.2 - groupRef.current.rotation.y) * 0.03;
    groupRef.current.rotation.x += (-mouse.current.y * 0.15 - groupRef.current.rotation.x) * 0.03;

    groupRef.current.children.forEach((child, idx) => {
      if (idx >= configs.length) return;
      const cfg = configs[idx];
      (child as THREE.Group).rotation.y = t * cfg.rotSpeed;
      (child as THREE.Group).position.y = cfg.pos[1] + Math.sin(t * 0.5 + idx) * 0.08;
    });
  });

  return (
    <>
      <fog attach="fog" args={["#120e08", 3, 12]} />
      <group ref={groupRef} scale={viewport.width < 6 ? 0.75 : 1} onClick={onSkullClick}>
        {configs.map((cfg, si) => (
          <group key={si} position={[cfg.pos[0], cfg.pos[1], cfg.pos[2]]} scale={cfg.scale}>
            {allGeos.map((geo, gi) => (
              <mesh key={gi} geometry={geo}>
                <meshStandardMaterial
                  color={gi >= skull.bone.length ? "#0a0a08" : "#c4a878"}
                  emissive={gi >= skull.bone.length ? "#8a6a30" : "#6a5020"}
                  emissiveIntensity={gi >= skull.bone.length && gi < skull.bone.length + 2 ? 0.12 : 0.04}
                  roughness={0.85}
                  metalness={0.1}
                  transparent
                  opacity={si === 0 ? 0.9 : 0.45}
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
  const count = 60;
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() =>
    Array.from({ length: count }, () => ({
      pos: new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6),
      rotSpeed: (Math.random() - 0.5) * 0.5,
      phase: Math.random() * Math.PI * 2,
    })), []);

  useFrame((state) => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    const t = state.clock.elapsedTime;
    data.forEach((p, i) => {
      dummy.position.set(
        p.pos.x + Math.sin(t * 0.2 + p.phase) * 0.4,
        p.pos.y + Math.cos(t * 0.15 + p.phase) * 0.3,
        p.pos.z
      );
      dummy.rotation.z = t * p.rotSpeed;
      dummy.scale.set(0.04, 0.035, 0.001);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color="#c4923a" transparent opacity={0.1} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

// ═══════════════════════════════════════
// Main component
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
        camera={{ position: [0, 0, 3.8], fov: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[3, 4, 5]} intensity={0.8} color="#e8d5b0" castShadow />
        <directionalLight position={[-2, 1, 3]} intensity={0.35} color="#c4923a" />
        <directionalLight position={[0, -2, 2]} intensity={0.15} color="#8080a0" />
        <SceneComponent onSkullClick={handleClick} />
      </Canvas>
    </div>
  );
}
