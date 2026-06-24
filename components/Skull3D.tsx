"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Skull3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const skullGroup = new THREE.Group();

    const craneaMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      emissive: 0x3a0000,
      emissiveIntensity: 0.15,
      roughness: 0.8,
      metalness: 0.3,
    });

    // Cranium
    const cranium = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 32), craneaMat);
    cranium.scale.set(1, 1.15, 1.1);
    skullGroup.add(cranium);

    // Jaw
    const jaw = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 32, 32),
      craneaMat
    );
    jaw.position.set(0, -0.7, 0.2);
    jaw.scale.set(0.9, 0.6, 0.8);
    skullGroup.add(jaw);

    // Cheekbones
    [-0.55, 0.55].forEach((x) => {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), craneaMat);
      cheek.position.set(x, -0.3, 0.6);
      cheek.scale.set(0.8, 0.7, 0.6);
      skullGroup.add(cheek);
    });

    // Eye sockets
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0x8b0000,
      emissiveIntensity: 0.4,
      roughness: 1,
    });

    [-0.38, 0.38].forEach((x) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), eyeMat);
      eye.position.set(x, 0.1, 0.85);
      skullGroup.add(eye);
    });

    // Nose
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1 });
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 3), noseMat);
    nose.position.set(0, -0.2, 1.0);
    nose.rotation.x = Math.PI;
    skullGroup.add(nose);

    // Teeth ridge
    const teethMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      emissive: 0x1a0a00,
      emissiveIntensity: 0.1,
    });
    for (let i = -3; i <= 3; i++) {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.06), teethMat);
      tooth.position.set(i * 0.1, -0.55, 0.85);
      skullGroup.add(tooth);
    }

    scene.add(skullGroup);

    // Lights
    const ambient = new THREE.AmbientLight(0x111111, 0.5);
    scene.add(ambient);

    const redLight = new THREE.PointLight(0x8b0000, 2, 10);
    redLight.position.set(2, 2, 3);
    scene.add(redLight);

    const backLight = new THREE.PointLight(0x1a0000, 1, 10);
    backLight.position.set(-2, -1, -2);
    scene.add(backLight);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    let time = 0;
    const animate = () => {
      time += 0.005;
      skullGroup.rotation.y = Math.sin(time) * 0.3 + mouseRef.current.x * 0.3;
      skullGroup.rotation.x = Math.sin(time * 0.7) * 0.1 - mouseRef.current.y * 0.2;

      redLight.intensity = 1.5 + Math.sin(time * 3) * 0.5;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 z-[1] opacity-40 pointer-events-none"
    />
  );
}
