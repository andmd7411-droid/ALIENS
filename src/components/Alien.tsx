import { useRef, useEffect } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import { TextureLoader, Group, DoubleSide } from 'three'
import * as THREE from 'three'
import { type Alien as AlienType, useGameStore } from '../store/gameStore'

interface AlienProps {
    data: AlienType;
}

export function Alien({ data }: AlienProps) {
    const { captureAlien, activePowerup } = useGameStore()
    // Force cache bust with version
    const texture = useLoader(TextureLoader, `/aliens/${data.type}.jpg?v=2`)
    const meshRef = useRef<Group>(null)
    const fireInterval = useRef<number | null>(null)

    const timeAlive = useRef(0)
    const hasExpired = useRef(false)

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (fireInterval.current) clearInterval(fireInterval.current)
        }
    }, [])

    useFrame((state, delta) => {
        if (meshRef.current) {
            const time = state.clock.elapsedTime
            timeAlive.current += delta

            // "Alive" animation: Pulsing scale with irregular heartbeat (faster)
            const pulse = 1 + Math.sin(time * 5) * 0.15 + Math.sin(time * 10) * 0.05
            meshRef.current.scale.setScalar(pulse)

            // CHASE LOGIC (Move towards Camera/Player at 0,0,0)
            const worldPos = meshRef.current.getWorldPosition(new THREE.Vector3())
            // Calculate direction vector towards camera (0,0,0 - currentPos)
            // Camera is at 0,0,0 in AR usually, or relative to world
            const targetPos = state.camera.position
            const direction = new THREE.Vector3().subVectors(targetPos, worldPos).normalize()

            // Move along direction
            const speed = data.speed * 0.5 // Adjust speed for chase
            meshRef.current.position.add(direction.multiplyScalar(speed * delta))

            // Deterministic random/offset based on ID (simple hash)
            const idValue = data.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

            // Add wobble for "alive" feel (perpendicular to direction ideally, but simple wobble works)
            meshRef.current.position.y += Math.sin(time * 3 + idValue) * 0.002

            // Rotation: spin + wobble
            meshRef.current.rotation.z -= delta * 2.0
            meshRef.current.rotation.z += Math.sin(time * 5) * 0.1

            // Penalty Logic: Time To Live (TTL)
            // Increased to 12 seconds to give user time to find them (360 search takes time)
            if (timeAlive.current > 12 && !hasExpired.current) {
                hasExpired.current = true
                useGameStore.getState().missAlien(data.id)
            }

            // COLLISION DETECTION (Player Hit)
            const playerDist = worldPos.distanceTo(state.camera.position)

            if (playerDist < 1.2) { // Increased hit distance slightly for better feel
                // Too close! Deal damage.
                useGameStore.getState().takeDamage(10)
            }
        }
    })

    const handlePointerDown = () => {
        captureAlien(data.id)

        if (activePowerup === 'rapid-fire') {
            if (fireInterval.current) clearInterval(fireInterval.current)
            fireInterval.current = setInterval(() => {
                captureAlien(data.id)
            }, 100) as unknown as number
        }
    }

    const handlePointerUp = () => {
        if (fireInterval.current) {
            clearInterval(fireInterval.current)
            fireInterval.current = null
        }
    }

    // Tint color for Boss / Variants
    const color = data.isBoss ? '#ff0000' : (data.variant === 'tank' ? '#444444' : (data.variant === 'invisible' ? '#aaddff' : 'white'));
    const scale = data.isBoss ? 4 : (data.variant === 'tank' ? 2.5 : 1.5);

    return (
        <group position={data.position}>
            <Billboard
                ref={meshRef}
                follow={true}
                lockX={false}
                lockY={false}
                lockZ={false}
            >
                <mesh
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    onPointerOver={() => document.body.style.cursor = 'crosshair'}
                    onPointerOut={() => {
                        document.body.style.cursor = 'default'
                        handlePointerUp()
                    }}
                >
                    <planeGeometry args={[scale, scale]} />
                    <shaderMaterial
                        transparent
                        side={DoubleSide}
                        uniforms={{
                            uTexture: { value: texture },
                            uTime: { value: 0 },
                            uColor: { value: new THREE.Color(color) },
                            uIsBoss: { value: data.isBoss ? 1.0 : 0.0 },
                            uOpacity: { value: 1.0 }
                        }}
                        vertexShader={`
                            varying vec2 vUv;
                            void main() {
                                vUv = uv;
                                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                            }
                        `}
                        fragmentShader={`
                            uniform sampler2D uTexture;
                            uniform vec3 uColor;
                            uniform float uIsBoss;
                            uniform float uOpacity;
                            varying vec2 vUv;
                            void main() {
                                vec4 color = texture2D(uTexture, vUv);
                                float brightness = length(color.rgb);
                                if (brightness < 0.1) discard;
                                
                                // Apply boss/variant tint
                                if (uIsBoss > 0.5 || uColor.r < 0.9 || uColor.b > 0.9) { // Simple check for tint application
                                    gl_FragColor = vec4(color.rgb * uColor, color.a * uOpacity);
                                } else {
                                    gl_FragColor = vec4(color.rgb, color.a * uOpacity);
                                }
                            }
                        `}
                    />
                </mesh>
            </Billboard>
        </group>
    )
}
