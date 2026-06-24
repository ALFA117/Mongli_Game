'use client'

import { useEffect, useRef } from 'react'
import type { MeshPhongMaterial, Mesh } from 'three'

export default function Skull3D({ size = 400 }: { size?: number }) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return
    let raf: number
    let mouseX = 0, mouseY = 0
    let cleanup: (() => void) | undefined

    import('three').then(THREE => {
      if (!mountRef.current) return
      const W = mountRef.current.clientWidth || size
      const H = mountRef.current.clientHeight || size

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)
      mountRef.current.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100)
      camera.position.z = 5
      const group = new THREE.Group()

      const mat = new THREE.MeshPhongMaterial({ color: 0x120a08, emissive: 0x0a0000, shininess: 25, specular: 0x1a0000 })
      const cranium = new THREE.Mesh(new THREE.SphereGeometry(1.2, 48, 48), mat)
      cranium.scale.set(1, 1.12, 0.9)
      group.add(cranium)

      const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.88, 32, 32), mat)
      jaw.position.set(0, -1.05, 0.1); jaw.scale.set(0.92, 0.52, 0.8)
      group.add(jaw)

      const eyeMatDark = new THREE.MeshPhongMaterial({ color: 0x000000 })
      const eyeMatGlow = new THREE.MeshPhongMaterial({ color: 0x8B0000, emissive: 0x8B0000, emissiveIntensity: 1.2 })
      const eyes: Mesh[] = []
      const addEye = (x: number) => {
        const socket = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 20), eyeMatDark)
        socket.position.set(x, 0.2, 0.96); group.add(socket)
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), eyeMatGlow.clone())
        glow.position.set(x, 0.2, 1.04); group.add(glow); eyes.push(glow)
      }
      addEye(-0.43); addEye(0.43)

      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 3), new THREE.MeshPhongMaterial({ color: 0x000000 }))
      nose.position.set(0, -0.14, 1.1); nose.rotation.x = Math.PI; group.add(nose)

      const toothMat = new THREE.MeshPhongMaterial({ color: 0xd0c090 })
      for (let i = 0; i < 8; i++) {
        const t = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.07), toothMat)
        t.position.set(-0.39 + i * 0.11, -0.85, 0.8); group.add(t)
      }

      const crackMat = new THREE.LineBasicMaterial({ color: 0x8B0000 })
      ;[
        [new THREE.Vector3(0.1, 0.9, 1.0), new THREE.Vector3(0.4, 0.4, 0.85), new THREE.Vector3(0.55, 0.6, 0.7)],
        [new THREE.Vector3(-0.2, 0.75, 1.0), new THREE.Vector3(-0.5, 0.3, 0.82)],
        [new THREE.Vector3(0.0, 0.3, 1.1), new THREE.Vector3(0.05, -0.05, 1.0)],
      ].forEach(pts => { group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), crackMat)) })

      const bloodMat = new THREE.MeshPhongMaterial({ color: 0xaa0000, emissive: 0x440000 })
      for (let i = 0; i < 8; i++) {
        const d = new THREE.Mesh(new THREE.SphereGeometry(0.05 + Math.random() * 0.04, 8, 8), bloodMat)
        d.position.set(-0.6 + Math.random() * 1.2, -0.85 - Math.random() * 0.6, 0.5 + Math.random() * 0.3)
        d.scale.y = 1.5 + Math.random() * 2.5; group.add(d)
      }

      scene.add(group)
      scene.add(new THREE.AmbientLight(0x080000, 1))
      const redPt = new THREE.PointLight(0xff2200, 3, 12); redPt.position.set(2, 2, 4); scene.add(redPt)
      const fillPt = new THREE.PointLight(0x220000, 2, 8); fillPt.position.set(-2, -1, 3); scene.add(fillPt)

      const onMouse = (e: MouseEvent) => { mouseX = (e.clientX / window.innerWidth - 0.5) * 2; mouseY = -(e.clientY / window.innerHeight - 0.5) * 2 }
      const onTouch = (e: TouchEvent) => { mouseX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2; mouseY = -(e.touches[0].clientY / window.innerHeight - 0.5) * 2 }
      window.addEventListener('mousemove', onMouse)
      window.addEventListener('touchmove', onTouch, { passive: true })

      let t = 0
      const animate = () => {
        raf = requestAnimationFrame(animate); t += 0.01
        group.rotation.y += (mouseX * 0.45 - group.rotation.y) * 0.05
        group.rotation.x += (mouseY * 0.22 - group.rotation.x) * 0.05
        group.rotation.z = Math.sin(t * 0.35) * 0.025
        group.position.y = Math.sin(t * 0.55) * 0.06
        const ei = Math.max(0.1, 0.7 + Math.sin(t * 1.5) * 0.5 + Math.sin(t * 3.7) * 0.2)
        eyes.forEach(eye => { (eye.material as MeshPhongMaterial).emissiveIntensity = ei })
        redPt.intensity = 2.5 + Math.sin(t * 2.1) * 0.8
        renderer.render(scene, camera)
      }
      animate()

      cleanup = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('mousemove', onMouse)
        window.removeEventListener('touchmove', onTouch)
        renderer.dispose()
        if (mountRef.current?.contains(renderer.domElement)) mountRef.current.removeChild(renderer.domElement)
      }
    })

    return () => cleanup?.()
  }, [size])

  return <div ref={mountRef} style={{ width: size, height: size, filter: 'drop-shadow(0 0 30px rgba(139,0,0,0.6))' }} />
}
