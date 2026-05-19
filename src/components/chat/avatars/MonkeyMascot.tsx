import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'

type MonkeyMascotProps = {
  isTyping: boolean
}

const fur = '#b89272'
const furShadow = '#a67f62'
const muzzle = '#f4ebe0'
const muzzleSoft = '#efe4d6'
const innerEar = '#f0ddd4'
const eye = '#4f3f35'
const nose = '#8d6e58'

export function MonkeyMascot({ isTyping }: MonkeyMascotProps) {
  const root = useRef<Group>(null)
  const tail = useRef<Group>(null)
  const ears = useRef<Group>(null)

  useFrame((state) => {
    const g = root.current
    if (!g) return
    const t = state.clock.elapsedTime
    g.position.y = Math.sin(t * 1.05 + 0.25) * 0.028
    const bounce = isTyping ? 1 + Math.sin(t * 6.6) * 0.06 : 1
    g.scale.setScalar(bounce)

    const tl = tail.current
    if (tl) {
      const w = isTyping ? 8.5 : 2.6
      tl.rotation.z = 0.5 + Math.sin(t * w) * (isTyping ? 0.16 : 0.07)
      tl.rotation.y = Math.sin(t * w * 0.88) * (isTyping ? 0.1 : 0.045)
    }

    const er = ears.current
    if (er) {
      const e = isTyping ? 5.5 : 2.2
      er.rotation.z = Math.sin(t * e) * (isTyping ? 0.04 : 0.018)
    }
  })

  return (
    <group ref={root}>
      {/* Compact chibi body */}
      <mesh position={[0, -0.24, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.1, 4, 8]} />
        <meshStandardMaterial color={fur} roughness={0.88} metalness={0.04} />
      </mesh>

      {/* Small rounded head — ears read larger (monkey proportion) */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <sphereGeometry args={[0.12, 12, 10]} />
        <meshStandardMaterial color={fur} roughness={0.86} metalness={0.04} />
      </mesh>

      {/* Subtle hair tuft */}
      <mesh position={[0, 0.22, -0.02]} castShadow>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={furShadow} roughness={0.9} metalness={0.03} />
      </mesh>
      <mesh position={[0.02, 0.23, 0.02]} castShadow>
        <sphereGeometry args={[0.022, 6, 6]} />
        <meshStandardMaterial color={fur} roughness={0.9} metalness={0.03} />
      </mesh>

      {/* Very large circular ears — dominant monkey silhouette */}
      <group ref={ears} position={[0, 0.1, 0]}>
        <group position={[-0.33, 0, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.14, 12, 10]} />
            <meshStandardMaterial color={fur} roughness={0.87} metalness={0.04} />
          </mesh>
          <mesh position={[0.04, 0, 0.06]} scale={[1, 1, 0.75]} castShadow>
            <sphereGeometry args={[0.085, 10, 10]} />
            <meshStandardMaterial color={innerEar} roughness={0.94} metalness={0} />
          </mesh>
        </group>
        <group position={[0.33, 0, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.14, 12, 10]} />
            <meshStandardMaterial color={fur} roughness={0.87} metalness={0.04} />
          </mesh>
          <mesh position={[-0.04, 0, 0.06]} scale={[1, 1, 0.75]} castShadow>
            <sphereGeometry args={[0.085, 10, 10]} />
            <meshStandardMaterial color={innerEar} roughness={0.94} metalness={0} />
          </mesh>
        </group>
      </group>

      {/* Cream “mask” muzzle — heart of monkey face read */}
      <mesh position={[0, -0.02, 0.14]} scale={[1.25, 1.05, 0.95]} castShadow>
        <sphereGeometry args={[0.1, 12, 10]} />
        <meshStandardMaterial color={muzzle} roughness={0.9} metalness={0.02} />
      </mesh>
      <mesh position={[0, -0.08, 0.2]} scale={[1.15, 0.75, 0.9]} castShadow>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color={muzzleSoft} roughness={0.91} metalness={0.02} />
      </mesh>

      {/* Sleepy / playful eyes — wide on muzzle */}
      <mesh position={[-0.07, 0.02, 0.24]} scale={[1, 0.48, 0.75]} castShadow>
        <sphereGeometry args={[0.032, 8, 8]} />
        <meshStandardMaterial color={eye} roughness={0.95} metalness={0} />
      </mesh>
      <mesh position={[0.07, 0.02, 0.24]} scale={[1, 0.48, 0.75]} castShadow>
        <sphereGeometry args={[0.032, 8, 8]} />
        <meshStandardMaterial color={eye} roughness={0.95} metalness={0} />
      </mesh>
      <mesh position={[-0.07, 0.035, 0.255]} castShadow>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshStandardMaterial color="#faf6f2" roughness={0.88} metalness={0} />
      </mesh>
      <mesh position={[0.07, 0.035, 0.255]} castShadow>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshStandardMaterial color="#faf6f2" roughness={0.88} metalness={0} />
      </mesh>

      {/* Small nose anchor on muzzle */}
      <mesh position={[0, -0.04, 0.27]} castShadow>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color={nose} roughness={0.92} metalness={0} />
      </mesh>

      {/* Tiny tail */}
      <group ref={tail} position={[0.08, -0.2, -0.08]}>
        <mesh rotation={[0.45, -0.45, 0.55]} castShadow>
          <capsuleGeometry args={[0.024, 0.11, 3, 6]} />
          <meshStandardMaterial color={fur} roughness={0.88} metalness={0.04} />
        </mesh>
      </group>
    </group>
  )
}
