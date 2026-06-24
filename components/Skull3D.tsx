'use client'

import { useEffect, useRef } from 'react'
import type { MeshPhongMaterial } from 'three'

export default function Skull3D() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    let frame: number
    let disposed = false

    import('three').then((THREE) => {
      if (disposed || !mountRef.current) return

      const w = mountRef.current.clientWidth
      const h = mountRef.current.clientHeight
      if (w === 0 || h === 0) return

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)
      mountRef.current.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
      camera.position.set(0, 0, 5)

      const group = new THREE.Group()

      const skullMat = new THREE.MeshPhongMaterial({
        color: 0x1a1008,
        emissive: 0x0a0000,
        shininess: 30,
        specular: 0x330000,
      })

      const skull = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 32), skullMat)
      skull.scale.set(1, 1.15, 0.9)
      group.add(skull)

      const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.85, 32, 32), skullMat)
      jaw.position.set(0, -1.0, 0.1)
      jaw.scale.set(1, 0.6, 0.85)
      group.add(jaw)

      const eyeMat = new THREE.MeshPhongMaterial({
        color: 0x000000,
        emissive: 0x8b0000,
        emissiveIntensity: 0.5,
      })
      const eyeGeo = new THREE.SphereGeometry(0.28, 16, 16)

      const eyeL = new THREE.Mesh(eyeGeo, eyeMat)
      eyeL.position.set(-0.42, 0.18, 0.92)
      group.add(eyeL)

      const eyeRMat = eyeMat.clone()
      const eyeR = new THREE.Mesh(eyeGeo, eyeRMat)
      eyeR.position.set(0.42, 0.18, 0.92)
      group.add(eyeR)

      const nose = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.25, 3),
        new THREE.MeshPhongMaterial({ color: 0x000000 })
      )
      nose.position.set(0, -0.12, 1.05)
      nose.rotation.x = Math.PI
      group.add(nose)

      for (let i = 0; i < 6; i++) {
        const tooth = new THREE.Mesh(
          new THREE.BoxGeometry(0.13, 0.22, 0.1),
          new THREE.MeshPhongMaterial({ color: 0xe8d5b0, emissive: 0x222200 })
        )
        tooth.position.set(-0.37 + i * 0.15, -0.78, 0.78)
        group.add(tooth)
      }

      const crackMat = new THREE.LineBasicMaterial({ color: 0x8b0000 })
      const crackPaths = [
        [[0.2, 0.8, 1.0], [0.5, 0.3, 0.8], [0.7, 0.6, 0.6]],
        [[-0.3, 0.6, 1.0], [-0.6, 0.2, 0.8]],
        [[0.0, 1.1, 0.7], [0.15, 0.7, 0.95]],
      ]
      crackPaths.forEach((pts) => {
        const points = pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), crackMat))
      })

      for (let i = 0; i < 8; i++) {
        const drop = new THREE.Mesh(
          new THREE.SphereGeometry(0.035 + Math.random() * 0.02, 8, 8),
          new THREE.MeshPhongMaterial({ color: 0x8b0000, emissive: 0x4a0000 })
        )
        drop.position.set(
          -0.6 + Math.random() * 1.2,
          -1.0 - Math.random() * 0.6,
          0.5 + Math.random() * 0.4
        )
        drop.scale.y = 1.5 + Math.random()
        group.add(drop)
      }

      scene.add(group)

      scene.add(new THREE.AmbientLight(0x110000, 0.5))
      const redLight = new THREE.PointLight(0xff0000, 2, 8)
      redLight.position.set(2, 2, 3)
      scene.add(redLight)
      const fillLight = new THREE.PointLight(0x330000, 1, 6)
      fillLight.position.set(-2, -1, 2)
      scene.add(fillLight)

      let mouseX = 0
      let mouseY = 0
      const onMouse = (e: MouseEvent) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2
      }
      window.addEventListener('mousemove', onMouse)

      let t = 0
      const animate = () => {
        if (disposed) return
        frame = requestAnimationFrame(animate)
        t += 0.01

        group.rotation.y += (mouseX * 0.4 - group.rotation.y) * 0.05
        group.rotation.x += (-mouseY * 0.2 - group.rotation.x) * 0.05
        group.rotation.z = Math.sin(t * 0.5) * 0.03
        group.position.y = Math.sin(t * 0.7) * 0.05

        const intensity = 0.5 + Math.sin(t * 2) * 0.3
        ;(eyeL.material as MeshPhongMaterial).emissiveIntensity = intensity
        ;(eyeR.material as MeshPhongMaterial).emissiveIntensity = intensity

        redLight.intensity = 1.5 + Math.sin(t * 3) * 0.5

        renderer.render(scene, camera)
      }
      animate()

      const onResize = () => {
        if (!mountRef.current) return
        const nw = mountRef.current.clientWidth
        const nh = mountRef.current.clientHeight
        camera.aspect = nw / nh
        camera.updateProjectionMatrix()
        renderer.setSize(nw, nh)
      }
      window.addEventListener('resize', onResize)

      return () => {
        disposed = true
        cancelAnimationFrame(frame)
        window.removeEventListener('mousemove', onMouse)
        window.removeEventListener('resize', onResize)
        renderer.dispose()
        if (mountRef.current?.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement)
        }
      }
    })

    return () => {
      disposed = true
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
      }}
    />
  )
}
