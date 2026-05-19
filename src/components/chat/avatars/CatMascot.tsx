import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'

type CatMascotProps = {
  isTyping: boolean
}

const cream = '#f2eadf'
const blush = '#e8c4cf'
const innerEar = '#f8dfe8'
const nose = '#c9a088'
const eye = '#7a6558'

export function CatMascot({ isTyping }: CatMascotProps) {
  const root = useRef<Group>(null)
  const tail = useRef<Group>(null)

  useFrame((state) => {
    const g = root.current
    if (!g) return
    const t = state.clock.elapsedTime
    g.position.y = Math.sin(t * 1.05) * 0.028
    const bounce = isTyping ? 1 + Math.sin(t * 6.5) * 0.06 : 1
    g.scale.setScalar(bounce)

    const tl = tail.current
    if (tl) {
      const w = isTyping ? 10 : 3.2
      tl.rotation.x = 0.35 + Math.sin(t * w) * (isTyping ? 0.12 : 0.06)
      tl.rotation.z = Math.sin(t * w * 0.9) * (isTyping ? 0.1 : 0.04)
    }
  })

  return (
    <group ref={root}>
      {/* Belly / body — soft capsule */}
      <mesh position={[0, -0.26, 0]} castShadow>
        <capsuleGeometry args={[0.16, 0.12, 4, 8]} />
        <meshStandardMaterial color={cream} roughness={0.9} metalness={0.04} />
      </mesh>

      {/* Head — dominant round silhouette */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <sphereGeometry args={[0.22, 12, 10]} />
        <meshStandardMaterial color={cream} roughness={0.88} metalness={0.03} />
      </mesh>

      {/* Cheek fluff */}
      <mesh position={[-0.16, -0.02, 0.12]} castShadow>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color={blush} roughness={0.92} metalness={0.02} />
      </mesh>
      <mesh position={[0.16, -0.02, 0.12]} castShadow>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color={blush} roughness={0.92} metalness={0.02} />
      </mesh>

      {/* Cat ears — triangular cones, readable silhouette */}
      <mesh position={[-0.14, 0.26, -0.02]} rotation={[0, 0, 0.55]} castShadow>
        <coneGeometry args={[0.09, 0.14, 5]} />
        <meshStandardMaterial color={cream} roughness={0.88} metalness={0.03} />
      </mesh>
      <mesh position={[0.14, 0.26, -0.02]} rotation={[0, 0, -0.55]} castShadow>
        <coneGeometry args={[0.09, 0.14, 5]} />
        <meshStandardMaterial color={cream} roughness={0.88} metalness={0.03} />
      </mesh>
      <mesh position={[-0.14, 0.24, 0.04]} rotation={[0.35, 0, 0.55]} castShadow>
        <coneGeometry args={[0.055, 0.09, 4]} />
        <meshStandardMaterial color={innerEar} roughness={0.94} metalness={0} />
      </mesh>
      <mesh position={[0.14, 0.24, 0.04]} rotation={[0.35, 0, -0.55]} castShadow>
        <coneGeometry args={[0.055, 0.09, 4]} />
        <meshStandardMaterial color={innerEar} roughness={0.94} metalness={0} />
      </mesh>

      {/* Sleepy eyes — soft, slightly flattened (calm) */}
      <mesh position={[-0.09, 0.05, 0.19]} scale={[1, 0.42, 0.7]} castShadow>
        <sphereGeometry args={[0.038, 8, 8]} />
        <meshStandardMaterial color={eye} roughness={0.95} metalness={0} />
      </mesh>
      <mesh position={[0.09, 0.05, 0.19]} scale={[1, 0.42, 0.7]} castShadow>
        <sphereGeometry args={[0.038, 8, 8]} />
        <meshStandardMaterial color={eye} roughness={0.95} metalness={0} />
      </mesh>

      {/* Tiny snout */}
      <mesh position={[0, 0.0, 0.22]} castShadow>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color={blush} roughness={0.9} metalness={0.02} />
      </mesh>
      <mesh position={[0, -0.02, 0.24]} castShadow>
        <sphereGeometry args={[0.022, 6, 6]} />
        <meshStandardMaterial color={nose} roughness={0.92} metalness={0} />
      </mesh>

      {/* Tiny tail */}
      <group ref={tail} position={[-0.05, -0.22, -0.12]}>
        <mesh rotation={[0.85, 0.2, -0.35]} castShadow>
          <capsuleGeometry args={[0.028, 0.14, 3, 6]} />
          <meshStandardMaterial color={cream} roughness={0.9} metalness={0.03} />
        </mesh>
      </group>
    </group>
  )
}
