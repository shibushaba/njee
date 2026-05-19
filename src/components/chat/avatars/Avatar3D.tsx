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

  const dim = size === 'sm' ? 40 : 56
  const zoom = size === 'sm' ? 148 : 118

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
        dpr={[1, 1.35]}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        camera={{ position: [0, 0.08, 2.35], zoom, near: 0.1, far: 12 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.92} />
        <directionalLight position={[2.2, 3, 1.8]} intensity={0.42} color="#fff6e8" />
        <Suspense fallback={null}>
          <Center position={[0, -0.02, 0]}>{Scene}</Center>
        </Suspense>
      </Canvas>
    </div>
  )
}
