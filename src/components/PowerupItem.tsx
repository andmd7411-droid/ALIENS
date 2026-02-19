import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { type Powerup, useGameStore } from '../store/gameStore'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface PowerupItemProps {
    data: Powerup
}

export function PowerupItem({ data }: PowerupItemProps) {
    const meshRef = useRef<THREE.Mesh>(null)
    const { collectPowerup } = useGameStore()

    useFrame((state, delta) => {
        if (meshRef.current) {
            // Spin animation
            meshRef.current.rotation.y += delta * 2
            meshRef.current.rotation.x += delta * 0.5

            // Float animation
            meshRef.current.position.y = data.position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1
        }
    })

    const isRapidFire = data.type === 'rapid-fire'
    const color = isRapidFire ? '#0088ff' : '#00ff88' // Blue or Green

    return (
        <group position={data.position}>
            <mesh
                ref={meshRef}
                onClick={() => collectPowerup(data.id)}
                scale={0.5}
            >
                {isRapidFire ? (
                    <boxGeometry args={[1, 1, 1]} />
                ) : (
                    <sphereGeometry args={[0.6, 16, 16]} />
                )}
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.5}
                    transparent
                    opacity={0.9}
                />
            </mesh>

            {/* Label */}
            <Html position={[0, 0.8, 0]} center>
                <div style={{
                    color: color,
                    fontWeight: 'bold',
                    textShadow: '0 0 5px black',
                    fontSize: '14px',
                    whiteSpace: 'nowrap'
                }}>
                    {isRapidFire ? 'RAPID FIRE' : 'SLOW MO'}
                </div>
            </Html>
        </group>
    )
}
