import { useRef, useEffect, useState } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { Billboard, Line } from '@react-three/drei'
import { TextureLoader, Group, DoubleSide } from 'three'
import * as THREE from 'three'
import { type Alien as AlienType, useGameStore } from '../store/gameStore'
import { soundManager } from '../utils/SoundManager'

interface AlienProps {
    data: AlienType;
}

export function Alien({ data }: AlienProps) {
    const { captureAlien, activePowerup } = useGameStore()
    // Force cache bust with version
    const texture = useLoader(TextureLoader, `${import.meta.env.BASE_URL}aliens/${data.type}.jpg?v=2`)
    const meshRef = useRef<Group>(null)
    const fireInterval = useRef<number | null>(null)

    const timeAlive = useRef(0)
    const hasExpired = useRef(false)

    const [showLaser, setShowLaser] = useState(false)
    const audioRef = useRef<{ oscillator: OscillatorNode, gain: GainNode, panner: PannerNode } | null>(null)

    // Cleanup interval and audio on unmount
    useEffect(() => {
        // Initialize spatial sound
        const sound = soundManager.createSpatialSource(data.position)
        if (sound) {
            audioRef.current = sound
            sound.oscillator.type = 'sine'
            sound.oscillator.frequency.setValueAtTime(150 + Math.random() * 50, soundManager.ctx!.currentTime)

            // Pulse the volume periodically
            const startTime = soundManager.ctx!.currentTime
            const pulseRate = 2.0; // every 2 seconds
            for (let i = 0; i < 60; i++) { // Schedule for 2 minutes
                const t = startTime + i * pulseRate;
                sound.gain.gain.setValueAtTime(0, t);
                sound.gain.gain.linearRampToValueAtTime(0.02, t + 0.1);
                sound.gain.gain.linearRampToValueAtTime(0, t + 1.5);
            }

            sound.oscillator.start()
        }

        return () => {
            if (fireInterval.current) clearInterval(fireInterval.current)
            if (audioRef.current) {
                audioRef.current.oscillator.stop()
                audioRef.current.oscillator.disconnect()
            }
        }
    }, [data.id, data.position])

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

            // Update Spatial Sound Position
            if (audioRef.current) {
                audioRef.current.panner.positionX.setValueAtTime(worldPos.x, state.clock.elapsedTime)
                audioRef.current.panner.positionY.setValueAtTime(worldPos.y, state.clock.elapsedTime)
                audioRef.current.panner.positionZ.setValueAtTime(worldPos.z, state.clock.elapsedTime)
            }

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

            // Update Spatial Sound Position
            if (audioRef.current && worldPos) {
                audioRef.current.panner.positionX.setValueAtTime(worldPos.x, state.clock.elapsedTime)
                audioRef.current.panner.positionY.setValueAtTime(worldPos.y, state.clock.elapsedTime)
                audioRef.current.panner.positionZ.setValueAtTime(worldPos.z, state.clock.elapsedTime)
            }
            // Increased to 12 seconds to give user time to find them (360 search takes time)
            if (timeAlive.current > 12 && !hasExpired.current) {
                hasExpired.current = true
                useGameStore.getState().missAlien(data.id)
            }

            // COLLISION DETECTION (Player Hit)
            const playerDist = worldPos.distanceTo(state.camera.position)

            if (playerDist < 1.2) { // Increased hit distance slightly for better feel
                // Too close! Deal damage.
                useGameStore.getState().takeDamage(50)
            }
        }
    })

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
                    onPointerDown={() => {
                        captureAlien(data.id)
                        soundManager.playShoot(activePowerup === 'rapid-fire')
                        setShowLaser(true)
                        setTimeout(() => setShowLaser(false), 50)

                        if (activePowerup === 'rapid-fire') {
                            if (fireInterval.current) clearInterval(fireInterval.current)
                            fireInterval.current = setInterval(() => {
                                captureAlien(data.id)
                                soundManager.playShoot(true)
                                setShowLaser(true)
                                setTimeout(() => setShowLaser(false), 30)
                            }, 100) as unknown as number
                        }
                    }}
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

            {/* Laser Visual Effect */}
            {showLaser && (
                <Line
                    points={[[0, 0, 0], data.position]} // Simple line from center to alien
                    color={activePowerup === 'rapid-fire' ? "#00ffff" : "#ffff00"}
                    lineWidth={2}
                    transparent
                    opacity={0.8}
                />
            )}
        </group>
    )
}
