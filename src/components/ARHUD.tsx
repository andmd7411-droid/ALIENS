import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { Group } from 'three'
import { useGameStore } from '../store/gameStore'

function LevelCompleteUI() {
    const { isLevelComplete, nextLevel } = useGameStore()
    const [hovered, setHovered] = useState(false)

    if (!isLevelComplete) return null

    return (
        <group position={[0, 0, -1.5]}>
            <Text
                position={[0, 0.3, 0]}
                fontSize={0.2}
                color="#00f260"
                anchorX="center"
                anchorY="middle"
            >
                LEVEL COMPLETE!
            </Text>

            <group
                position={[0, -0.1, 0]}
                onClick={(e) => {
                    e.stopPropagation()
                    nextLevel()
                }}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                scale={1.5}
            >
                <mesh>
                    <planeGeometry args={[0.8, 0.25]} />
                    <meshBasicMaterial color={hovered ? "#00f260" : "rgba(0, 255, 100, 0.4)"} transparent opacity={0.8} />
                </mesh>
                <Text
                    position={[0, 0, 0.01]}
                    fontSize={0.1}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                >
                    NEXT MISSION
                </Text>
            </group>
        </group>
    )
}

export function ARHUD() {
    const { score, level, timeRemaining, capturedCount, highScore, isPaused, togglePause, resetHighScore, isGameOver, startGame } = useGameStore()
    const groupRef = useRef<Group>(null)
    const statsRef = useRef<Group>(null)
    const pauseBtnRef = useRef<Group>(null)

    // Hover states
    const [pauseHovered, setPauseHovered] = useState(false)
    const [resumeHovered, setResumeHovered] = useState(false)
    const [resetHovered, setResetHovered] = useState(false)
    const [retryHovered, setRetryHovered] = useState(false)
    const [damageFlash, setDamageFlash] = useState(0) // 0 to 1 opacity
    const lastDamageTimeRef = useRef(0)

    const hudDist = 0.8

    useFrame((state, delta) => {
        if (!groupRef.current) return

        // Lock HUD container to camera
        groupRef.current.position.copy(state.camera.position)
        groupRef.current.quaternion.copy(state.camera.quaternion)

        // Calculate viewport dimensions at HUD distance
        const v = state.viewport.getCurrentViewport(state.camera, [0, 0, -hudDist])

        // Update Stats Position (Top Left)
        if (statsRef.current) {
            const marginX = 0.05
            const marginY = 0.1
            const x = -v.width / 2 + marginX
            const y = v.height / 2 - marginY
            statsRef.current.position.set(x, y, -hudDist)
        }

        // Update Pause Button Position (Top Center)
        if (pauseBtnRef.current) {
            const marginY = 0.1
            const y = v.height / 2 - marginY
            pauseBtnRef.current.position.set(0, y, -hudDist)
        }

        // Damage Flash Logic
        const stateStore = useGameStore.getState();
        if (stateStore.lastDamageTime > lastDamageTimeRef.current) {
            lastDamageTimeRef.current = stateStore.lastDamageTime;
            setDamageFlash(0.6); // Start flash
        }

        if (damageFlash > 0) {
            setDamageFlash(prev => Math.max(0, prev - delta * 2)); // Fade out
        }
    })

    return (
        <group ref={groupRef}>


            {/* Game Over Screen */}
            {isGameOver && (
                <group position={[0, 0, -1.0]}>
                    <mesh>
                        <planeGeometry args={[2, 1.5]} />
                        <meshBasicMaterial color="black" transparent opacity={0.9} />
                    </mesh>
                    <Text position={[0, 0.3, 0.01]} fontSize={0.2} color="#ff0000">
                        MISSION FAILED
                    </Text>
                    <Text position={[0, 0.1, 0.01]} fontSize={0.08} color="white">
                        {`FINAL SCORE: ${score}`}
                    </Text>

                    <group
                        position={[0, -0.2, 0.02]}
                        onClick={(e) => { e.stopPropagation(); startGame() }}
                        onPointerOver={() => setRetryHovered(true)}
                        onPointerOut={() => setRetryHovered(false)}
                    >
                        <mesh>
                            <planeGeometry args={[1, 0.25]} />
                            <meshBasicMaterial color={retryHovered ? "#00f260" : "#333"} />
                        </mesh>
                        <Text position={[0, 0, 0.01]} fontSize={0.1} color="white">
                            RETRY MISSION
                        </Text>
                    </group>
                </group>
            )}

            {/* In-Game HUD (Hide if Game Over) */}
            {!isGameOver && (
                <>
                    {/* Stats Panel - Top Left */}
                    {!isPaused && (
                        <group ref={statsRef}>
                            {/* Background plate for better contrast */}
                            <mesh position={[0.15, -0.08, -0.01]}>
                                <planeGeometry args={[0.35, 0.2]} />
                                <meshBasicMaterial color="black" transparent opacity={0.5} />
                            </mesh>

                            <Text
                                fontSize={0.04}
                                color="#ffff00"
                                anchorX="left"
                                anchorY="top"
                                position={[0, 0, 0]}
                            >
                                {`HI-SCORE: ${highScore.toString().padStart(6, '0')}`}
                            </Text>
                            <Text
                                fontSize={0.035}
                                color="#00f260"
                                anchorX="left"
                                anchorY="top"
                                position={[0, -0.05, 0]}
                                lineHeight={1.2}
                            >
                                {`SCORE:    ${score.toString().padStart(6, '0')}
LEVEL:    ${level}
TIME:     ${timeRemaining}s
CAPTURED: ${capturedCount}`}
                            </Text>
                        </group>
                    )}

                    {/* Pause Button - Top Center */}
                    {!isPaused && (
                        <group
                            ref={pauseBtnRef}
                            onClick={(e) => { e.stopPropagation(); togglePause() }}
                            onPointerOver={() => setPauseHovered(true)}
                            onPointerOut={() => setPauseHovered(false)}
                        >
                            <mesh>
                                <circleGeometry args={[0.08, 32]} />
                                <meshBasicMaterial color={pauseHovered ? "white" : "rgba(0,0,0,0.5)"} transparent opacity={0.8} />
                                <meshBasicMaterial color="white" wireframe />
                            </mesh>
                            <Text position={[0, -0.01, 0.01]} fontSize={0.06} color={pauseHovered ? "black" : "white"}>
                                ⏸
                            </Text>
                        </group>
                    )}



                    {/* Pause Menu Overlay (Center Screen) */}
                    {isPaused && (
                        <group position={[0, 0, -1.0]}>
                            <mesh>
                                <planeGeometry args={[1.5, 2]} />
                                <meshBasicMaterial color="black" transparent opacity={0.8} />
                            </mesh>

                            <Text position={[0, 0.5, 0.01]} fontSize={0.15} color="#ffcc00">
                                PAUSED
                            </Text>

                            {/* Resume Button */}
                            <group
                                position={[0, 0.1, 0.02]}
                                onClick={(e) => { e.stopPropagation(); togglePause() }}
                                onPointerOver={() => setResumeHovered(true)}
                                onPointerOut={() => setResumeHovered(false)}
                            >
                                <mesh>
                                    <planeGeometry args={[0.8, 0.2]} />
                                    <meshBasicMaterial color={resumeHovered ? "#00f260" : "#333"} />
                                </mesh>
                                <Text position={[0, 0, 0.01]} fontSize={0.08} color="white">
                                    RESUME
                                </Text>
                            </group>

                            {/* Reset Button */}
                            <group
                                position={[0, -0.2, 0.02]}
                                onClick={(e) => { e.stopPropagation(); resetHighScore() }}
                                onPointerOver={() => setResetHovered(true)}
                                onPointerOut={() => setResetHovered(false)}
                            >
                                <mesh>
                                    <planeGeometry args={[0.8, 0.2]} />
                                    <meshBasicMaterial color={resetHovered ? "#ff4444" : "#333"} />
                                </mesh>
                                <Text position={[0, 0, 0.01]} fontSize={0.06} color="white">
                                    RESET HI-SCORE
                                </Text>
                            </group>
                        </group>
                    )}
                </>
            )}

            {/* Level Complete UI */}
            <LevelCompleteUI />

            {/* Global Damage Flash */}
            {damageFlash > 0 && (
                <mesh position={[0, 0, -0.5]}>
                    <planeGeometry args={[2, 2]} />
                    <meshBasicMaterial color="#ff0000" transparent opacity={damageFlash} />
                </mesh>
            )}
        </group>
    )
}
