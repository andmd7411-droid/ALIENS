import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore, type Explosion } from '../store/gameStore'
import * as THREE from 'three'

function ExplosionParticles({ data }: { data: Explosion }) {
    const group = useRef<THREE.Group>(null)
    const particleCount = 20

    // Generate random directions for particles once
    const particles = useMemo(() => {
        return new Array(particleCount).fill(0).map(() => ({
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5
            ),
            scale: Math.random() * 0.5 + 0.2,
            ref: React.createRef<THREE.Mesh>()
        }))
    }, [])

    useFrame((state, delta) => {
        const elapsed = (Date.now() - data.createdAt) / 1000

        particles.forEach((p) => {
            if (!p.ref.current) return

            // Move particle
            p.ref.current.position.addScaledVector(p.velocity, delta)

            // Add gravity
            p.velocity.y -= delta * 2

            // Fade out scale
            const life = 1.0 - (elapsed / 0.8) // 0.8s duration
            if (life > 0) {
                p.ref.current.scale.setScalar(p.scale * life)
            } else {
                p.ref.current.scale.setScalar(0)
            }
        })
    })

    return (
        <group ref={group} position={data.position}>
            {particles.map((p, i) => (
                <mesh key={i} ref={p.ref}>
                    <planeGeometry args={[0.2, 0.2]} />
                    <meshBasicMaterial color={data.color} transparent opacity={0.8} />
                </mesh>
            ))}
        </group>
    )
}

export function ExplosionSystem() {
    const { explosions } = useGameStore()

    return (
        <>
            {explosions.map((explosion) => (
                <ExplosionParticles key={explosion.id} data={explosion} />
            ))}
        </>
    )
}
