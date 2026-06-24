'use client'

import { useEffect, useRef } from 'react'
import type { MeshPhongMaterial } from 'three'

export default function Skull3D({ size = 420 }: { size?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    let animFrame: number
    let disposed = false
    let mouseX = 0
    let mouseY = 0

    import('three').then((THREE) => {
      if (disposed || !ref.current) return
      const W = ref.current.clientWidth
      const H = ref.current.clientHeight
      if (W === 0 || H === 0) return

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)
      ref.current.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100)
      camera.position.z = 5

      const group = new THREE.Group()

      const skullMat = new THREE.MeshPhongMaterial({
        color: 0x110a08, emissive: 0x0a0000, shininess: 20, specular: 0x220000,
      })

      const cranium = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 32), skullMat)
      cranium.scale.set(1, 1.1, 0.92)
      group.add(cranium)

      const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.9, 32, 24), skullMat)
      jaw.position.set(0, -1.05, 0.08)
      jaw.scale.set(0.95, 0.55, 0.82)
      group.add(jaw)

      const eyeSocket = new THREE.MeshPhongMaterial({ color: 0x000000, emissive: 0x000000 })
      const eyeGlowMat = new THREE.MeshPhongMaterial({ color: 0x8B0000, emissive: 0x8B0000, emissiveIntensity: 1.5 })

      const addEye = (x: number) => {
        const socket = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), eyeSocket)
        socket.position.set(x, 0.18, 0.95)
        group.add(socket)
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), eyeGlowMat.clone())
        glow.position.set(x, 0.18, 1.02)
        group.add(glow)
        return glow
      }
      const eyeL = addEye(-0.42)
      const eyeR = addEye(0.42)

      const nose = new THREE.Mesh(
        new THREE.ConeGeometry(0.13, 0.22, 3),
        new THREE.MeshPhongMaterial({ color: 0x000000 })
      )
      nose.position.set(0, -0.15, 1.08)
      nose.rotation.x = Math.PI
      group.add(nose)

      const toothMat = new THREE.MeshPhongMaterial({ color: 0xd4c4a0, emissive: 0x111100 })
      for (let i = 0; i < 8; i++) {
        const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.2, 0.08), toothMat)
        tooth.position.set(-0.42 + i * 0.12, -0.82, 0.78)
        group.add(tooth)
      }

      const crackMat = new THREE.LineBasicMaterial({ color: 0x8B0000 })
      const crackPts = [
        [[0.15, 0.85, 1.0], [0.4, 0.4, 0.85], [0.6, 0.65, 0.65]],
        [[-0.25, 0.7, 1.0], [-0.55, 0.25, 0.8]],
        [[0.05, 0.3, 1.1], [0.1, -0.1, 1.0]],
      ]
      crackPts.forEach(pts => {
        const points = pts.map(p => new THREE.Vector3(p[0], p[1], p[2]))
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), crackMat))
      })

      const bloodMat = new THREE.MeshPhongMaterial({ color: 0xaa0000, emissive: 0x4a0000 })
      for (let i = 0; i < 8; i++) {
        const drop = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), bloodMat)
        drop.position.set(-0.6 + Math.random() * 1.2, -0.9 - Math.random() * 0.6, 0.4 + Math.random() * 0.4)
        drop.scale.y = 1.5 + Math.random() * 2
        group.add(drop)
      }

      scene.add(group)

      scene.add(new THREE.AmbientLight(0x0a0000, 0.8))
      const redLight = new THREE.PointLight(0xff0000, 3, 10)
      redLight.position.set(2, 2, 4)
      scene.add(redLight)
      const fillLight = new THREE.PointLight(0x330000, 1.5, 8)
      fillLight.position.set(-2, -1, 3)
      scene.add(fillLight)
      scene.add(new THREE.PointLight(0x8B0000, 1, 6).translateZ(-2).translateY(-2))

      const onMouse = (e: MouseEvent) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2
        mouseY = -(e.clientY / window.innerHeight - 0.5) * 2
      }
      const onTouch = (e: TouchEvent) => {
        mouseX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2
        mouseY = -(e.touches[0].clientY / window.innerHeight - 0.5) * 2
      }
      window.addEventListener('mousemove', onMouse)
      window.addEventListener('touchmove', onTouch, { passive: true })

      let t = 0
      const animate = () => {
        if (disposed) return
        animFrame = requestAnimationFrame(animate)
        t += 0.012
        group.rotation.y += (mouseX * 0.5 - group.rotation.y) * 0.04
        group.rotation.x += (mouseY * 0.25 - group.rotation.x) * 0.04
        group.rotation.z = Math.sin(t * 0.4) * 0.03
        group.position.y = Math.sin(t * 0.6) * 0.06
        const ei = Math.max(0.1, 0.8 + Math.sin(t * 1.8) * 0.7 + Math.sin(t * 3.1) * 0.3)
        ;(eyeL.material as MeshPhongMaterial).emissiveIntensity = ei
        ;(eyeR.material as MeshPhongMaterial).emissiveIntensity = ei
        redLight.intensity = 2.5 + Math.sin(t * 2.2) * 0.8
        renderer.render(scene, camera)
      }
      animate()

      const onResize = () => {
        if (!ref.current) return
        const nw = ref.current.clientWidth, nh = ref.current.clientHeight
        camera.aspect = nw / nh
        camera.updateProjectionMatrix()
        renderer.setSize(nw, nh)
      }
      window.addEventListener('resize', onResize)

      return () => {
        disposed = true
        cancelAnimationFrame(animFrame)
        window.removeEventListener('mousemove', onMouse)
        window.removeEventListener('touchmove', onTouch)
        window.removeEventListener('resize', onResize)
        renderer.dispose()
        if (ref.current?.contains(renderer.domElement)) ref.current.removeChild(renderer.domElement)
      }
    })

    return () => { disposed = true; cancelAnimationFrame(animFrame) }
  }, [])

  return <div ref={ref} style={{ width: size, height: size, willChange: 'transform' }} />
}
