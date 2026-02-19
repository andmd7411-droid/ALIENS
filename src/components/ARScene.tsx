import { XR, createXRStore } from '@react-three/xr'
import { Canvas } from '@react-three/fiber'
import React, { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { Alien } from './Alien'
import { ARHUD } from './ARHUD'
import { ExplosionSystem } from './ExplosionSystem'
import { PowerupItem } from './PowerupItem'
import { GlobalInputHandler } from './GlobalInputHandler'

const store = createXRStore({
    domOverlay: { root: document.body },
    optionalFeatures: ['dom-overlay']
})

export function ARScene() {
    const { spawnAlien, isPlaying, updateTime, aliens, powerups, level } = useGameStore()

    useEffect(() => {
        console.log("ARScene: Component mounted");
        if ('xr' in navigator) {
            (navigator as any).xr.isSessionSupported('immersive-ar').then((supported: boolean) => {
                console.log(`ARScene: WebXR immersive-ar supported: ${supported}`);
            }).catch((err: any) => {
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
            <button onClick={() => store.enterAR()} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100, padding: '1rem 2rem', fontSize: '1.5rem', background: '#00f260', color: 'black', border: 'none', borderRadius: '10px' }}>
                ENTER AR MISSION
            </button>
            <Canvas style={{ background: '#111' }}>
                <XR store={store}>
                    <ambientLight intensity={1.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />

                    <React.Suspense fallback={null}>
                        <ARHUD />
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
                </XR>
            </Canvas>
        </>
    )
}
