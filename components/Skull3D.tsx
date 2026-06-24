'use client'

import { useEffect, useRef } from 'react'
import type { MeshBasicMaterial } from 'three'

export default function Skull3D({ size = 400 }: { size?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    let raf: number
    let mx = 0, my = 0, targetMx = 0, targetMy = 0
    let destroyed = false

    import('three').then(THREE => {
      if (destroyed || !ref.current) return

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
      renderer.setSize(size, size)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)

      ref.current.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50)
      camera.position.z = 5.5

      const group = new THREE.Group()

      const boneMat = new THREE.MeshPhongMaterial({
        color: new THREE.Color(0.12, 0.09, 0.07),
        emissive: new THREE.Color(0.04, 0.0, 0.0),
        specular: new THREE.Color(0.3, 0.1, 0.1),
        shininess: 60,
      })

      const cranium = new THREE.Mesh(new THREE.SphereGeometry(1.15, 64, 64), boneMat)
      cranium.scale.set(1, 1.08, 0.88)
      group.add(cranium)

      const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.82, 48, 48), boneMat)
      jaw.position.set(0, -0.98, 0.12)
      jaw.scale.set(0.9, 0.5, 0.78)
      group.add(jaw)

      const socketMat = new THREE.MeshBasicMaterial({ color: 0x000000 })
      const lSocket = new THREE.Mesh(new THREE.SphereGeometry(0.27, 32, 32), socketMat)
      lSocket.position.set(-0.41, 0.19, 0.95)
      group.add(lSocket)
      const rSocket = new THREE.Mesh(new THREE.SphereGeometry(0.27, 32, 32), socketMat)
      rSocket.position.set(0.41, 0.19, 0.95)
      group.add(rSocket)

      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff1100 })
      const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), eyeMat)
      lEye.position.set(-0.41, 0.19, 1.06)
      group.add(lEye)
      const rEyeMat = new THREE.MeshBasicMaterial({ color: 0xff1100 })
      const rEye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), rEyeMat)
      rEye.position.set(0.41, 0.19, 1.06)
      group.add(rEye)

      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 3), new THREE.MeshBasicMaterial({ color: 0x000000 }))
      nose.position.set(0, -0.12, 1.08)
      nose.rotation.x = Math.PI
      group.add(nose)

      const toothMat = new THREE.MeshPhongMaterial({ color: 0xc8b87a, emissive: 0x110f00, shininess: 30 })
      for (let i = 0; i < 6; i++) {
        const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.07), toothMat)
        tooth.position.set(-0.3 + i * 0.12, -0.82, 0.82)
        group.add(tooth)
      }

      const crackMat = new THREE.LineBasicMaterial({ color: 0x8B0000 })
      ;[
        [new THREE.Vector3(0.08, 0.88, 1.0), new THREE.Vector3(0.35, 0.42, 0.88)],
        [new THREE.Vector3(-0.18, 0.72, 1.0), new THREE.Vector3(-0.44, 0.28, 0.84)],
        [new THREE.Vector3(0.02, 0.28, 1.08), new THREE.Vector3(0.06, -0.04, 1.02)],
      ].forEach(pts => { group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), crackMat)) })

      const bloodMat = new THREE.MeshBasicMaterial({ color: 0x8B0000 })
      for (let i = 0; i < 5; i++) {
        const drop = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), bloodMat)
        drop.position.set(-0.5 + i * 0.22, -0.92 - Math.random() * 0.4, 0.55 + Math.random() * 0.2)
        drop.scale.y = 1.8 + Math.random() * 1.5
        group.add(drop)
      }

      scene.add(group)

      scene.add(new THREE.AmbientLight(0x050000, 2))
      const keyLight = new THREE.PointLight(0xff2200, 4, 15)
      keyLight.position.set(1.5, 2, 5)
      scene.add(keyLight)
      const fillLight = new THREE.PointLight(0x8B0000, 2, 10)
      fillLight.position.set(-2, -1, 3)
      scene.add(fillLight)
      const rimLight = new THREE.PointLight(0x440000, 3, 8)
      rimLight.position.set(0, 0, -4)
      scene.add(rimLight)

      const onMouse = (e: MouseEvent) => {
        targetMx = (e.clientX / window.innerWidth - 0.5) * 2
        targetMy = -(e.clientY / window.innerHeight - 0.5) * 2
      }
      const onTouch = (e: TouchEvent) => {
        targetMx = (e.touches[0].clientX / window.innerWidth - 0.5) * 2
        targetMy = -(e.touches[0].clientY / window.innerHeight - 0.5) * 2
      }
      window.addEventListener('mousemove', onMouse)
      window.addEventListener('touchmove', onTouch, { passive: true })

      let t = 0
      const animate = () => {
        if (destroyed) return
        raf = requestAnimationFrame(animate)
        t += 0.008

        mx += (targetMx - mx) * 0.04
        my += (targetMy - my) * 0.04

        group.rotation.y += (mx * 0.35 - group.rotation.y) * 0.06
        group.rotation.x += (my * 0.18 - group.rotation.x) * 0.06
        group.rotation.z = Math.sin(t * 0.3) * 0.02
        group.position.y = Math.sin(t * 0.5) * 0.05

        const pulse = 0.5 + Math.sin(t * 1.2) * 0.35 + Math.sin(t * 3.3) * 0.15
        const c = new THREE.Color(0.55 + pulse * 0.45, 0, 0)
        ;(lEye.material as MeshBasicMaterial).color = c
        ;(rEye.material as MeshBasicMaterial).color = c.clone()

        keyLight.intensity = 3.5 + Math.sin(t * 1.8) * 0.8

        renderer.render(scene, camera)
      }
      animate()

      const destroy = () => {
        destroyed = true
        cancelAnimationFrame(raf)
        window.removeEventListener('mousemove', onMouse)
        window.removeEventListener('touchmove', onTouch)
        renderer.dispose()
        if (ref.current?.contains(renderer.domElement)) ref.current.removeChild(renderer.domElement)
      }

      return destroy
    })

    return () => { destroyed = true; cancelAnimationFrame(raf) }
  }, [size])

  return (
    <div ref={ref} style={{
      width: size, height: size,
      filter: 'drop-shadow(0 0 20px rgba(200,0,0,0.7)) drop-shadow(0 0 60px rgba(139,0,0,0.4)) drop-shadow(0 0 100px rgba(100,0,0,0.2))',
    }} />
  )
}
