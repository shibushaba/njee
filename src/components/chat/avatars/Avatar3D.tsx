import { Center } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'
import { cn } from '../../../lib/cn'
import { CatMascot } from './CatMascot'
import { MonkeyMascot } from './MonkeyMascot'

export type AvatarVariant = 'finu' | 'shibu'

type Avatar3DProps = {
  variant: AvatarVariant
  isTyping?: boolean
  className?: string
  /** Compact presence bar vs default header size */
  size?: 'md' | 'sm'
}

export function Avatar3D({ variant, isTyping = false, className, size = 'md' }: Avatar3DProps) {
  const Scene = useMemo(() => {
    return variant === 'finu' ? (
      <CatMascot isTyping={isTyping} />
    ) : (
      <MonkeyMascot isTyping={isTyping} />
    )
  }, [variant, isTyping])

  const dim = size === 'sm' ? 48 : 60
  /** Orthographic zoom: higher = tighter framing on the mascot (easier to read in the header). */
  const zoom = size === 'sm' ? 78 : 92

  return (
    <div
      className={cn(
        'relative overflow-hidden border-[2px] border-nje-border bg-nje-bg shadow-[0_2px_0_0_rgba(90,46,30,0.06)]',
        className,
      )}
      style={{ width: dim, height: dim }}
    >
      <Canvas
        orthographic
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0.08, 2.35], zoom, near: 0.1, far: 12 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={1.02} />
        <directionalLight position={[2.2, 3.2, 2]} intensity={0.55} color="#fff6e8" />
        <Suspense fallback={null}>
          <Center position={[0, -0.02, 0]}>{Scene}</Center>
        </Suspense>
      </Canvas>
    </div>
  )
}
