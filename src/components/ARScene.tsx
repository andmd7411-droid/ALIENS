import { XR, createXRStore, useXR } from '@react-three/xr'
import { Canvas } from '@react-three/fiber'
import React, { useEffect } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../store/gameStore'
import { Alien } from './Alien'
import { ARHUD } from './ARHUD'
import { soundManager } from '../utils/SoundManager'
import { ExplosionSystem } from './ExplosionSystem'
import { PowerupItem } from './PowerupItem'
import { GlobalInputHandler } from './GlobalInputHandler'
import { SpaceBackground } from './SpaceBackground'

const store = createXRStore({
    // @ts-expect-error - Some versions of @react-three/xr have different types
    domOverlay: { root: document.body },
    optionalFeatures: ['dom-overlay']
})

function HUDLayer() {
    const session = useXR((state) => state.session)
    return (
        <>
            <ARHUD />
            {!session && <SpaceBackground />}
        </>
    )
}

export function ARScene() {
    const { spawnAlien, isPlaying, updateTime, aliens, powerups, level, lastDamageTime } = useGameStore()
    const shakeRef = React.useRef(0)
    const lastDamageRef = React.useRef(0)
    const sceneGroupRef = React.useRef<THREE.Group>(null)

    // Handle BGM
    useEffect(() => {
        if (isPlaying) {
            soundManager.startBGM()
        } else {
            soundManager.stopBGM()
        }
        return () => soundManager.stopBGM()
    }, [isPlaying])

    // Handle Screen Shake
    useEffect(() => {
        if (lastDamageTime > lastDamageRef.current) {
            lastDamageRef.current = lastDamageTime
            shakeRef.current = 0.1 // 10cm shake intensity
            setTimeout(() => { shakeRef.current = 0 }, 200) // Snap back
        }
    }, [lastDamageTime])

    useEffect(() => {
        console.log("ARScene: Component mounted");
        if ('xr' in navigator) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const xr = (navigator as unknown as { xr: any }).xr;
            xr.isSessionSupported('immersive-ar').then((supported: boolean) => {
                console.log(`ARScene: WebXR immersive-ar supported: ${supported}`);
            }).catch((err: unknown) => {
                console.error("ARScene: Error checking XR support", err);
            });
        } else {
            console.warn("ARScene: WebXR not available in navigator");
        }
    }, []);

    useEffect(() => {
        if (!isPlaying) return

        // Dynamic spawn rate: Starts at 1.2s (was 2.0s), decreases per level, min 0.3s
        const spawnRate = Math.max(300, 1200 - (level * 100))

        const interval = setInterval(() => {
            spawnAlien()

            // Spawn increasing number of aliens as level rises
            // Level 3+: Chance for extra aliens (was level 5+)
            const extraSpawns = Math.floor(level / 3);
            for (let i = 0; i < extraSpawns; i++) {
                if (Math.random() > 0.3) spawnAlien(); // 70% chance (was 60%)
            }
        }, spawnRate)
        return () => clearInterval(interval)
    }, [isPlaying, spawnAlien, level])

    useEffect(() => {
        if (!isPlaying) return
        const timer = setInterval(() => {
            updateTime(1)
        }, 1000)
        return () => clearInterval(timer)
    }, [isPlaying, updateTime])

    return (
        <>
            <button
                onClick={() => store.enterAR()}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    zIndex: 100,
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                    background: 'rgba(0, 242, 96, 0.2)',
                    color: '#00f260',
                    border: '1px solid #00f260',
                    borderRadius: '5px',
                    backdropFilter: 'blur(5px)',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}
            >
                Enter AR
            </button>
            <Canvas style={{ background: '#111' }}>
                <XR store={store}>
                    <ambientLight intensity={1.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />

                    <group
                        ref={sceneGroupRef}
                        onUpdate={(self) => {
                            if (shakeRef.current > 0) {
                                self.position.set(
                                    (Math.random() - 0.5) * shakeRef.current,
                                    (Math.random() - 0.5) * shakeRef.current,
                                    (Math.random() - 0.5) * shakeRef.current
                                )
                            } else {
                                if (self.position.x !== 0) self.position.set(0, 0, 0)
                            }
                        }}
                    >
                        <React.Suspense fallback={null}>
                            <ExplosionSystem />
                            <GlobalInputHandler />

                            {powerups.map((powerup) => (
                                <PowerupItem key={powerup.id} data={powerup} />
                            ))}

                        </React.Suspense>

                        <React.Suspense fallback={null}>
                            {aliens.map((alien) => (
                                <Alien key={alien.id} data={alien} />
                            ))}
                        </React.Suspense>
                    </group>

                    <React.Suspense fallback={null}>
                        <HUDLayer />
                    </React.Suspense>
                </XR>
            </Canvas>
        </>
    )
}
