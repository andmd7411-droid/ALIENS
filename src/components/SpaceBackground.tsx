import { useMemo } from 'react'
import { Stars, Float, Sphere, MeshDistortMaterial } from '@react-three/drei'

export function SpaceBackground() {
    const planets = useMemo(() => [
        { position: [15, 5, -20] as [number, number, number], color: '#ff4400', size: 3, speed: 0.1, distort: 0.4 },
        { position: [-20, -10, -25] as [number, number, number], color: '#4488ff', size: 2, speed: 0.15, distort: 0.3 },
        { position: [10, -15, -30] as [number, number, number], color: '#aa44ff', size: 4, speed: 0.08, distort: 0.2 },
    ], [])

    return (
        <group>
            {/* Infinite Starfield */}
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            {/* Distant Nebulae / Ambient Light */}
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} color="#44ddff" intensity={2} />
            <pointLight position={[-10, -10, -10]} color="#ff44aa" intensity={1} />

            {/* Animated Planets */}
            {planets.map((planet, i) => (
                <Float
                    key={i}
                    speed={planet.speed * 10}
                    rotationIntensity={2}
                    floatIntensity={2}
                >
                    <Sphere position={planet.position} args={[planet.size, 32, 32]}>
                        <MeshDistortMaterial
                            color={planet.color}
                            speed={2}
                            distort={planet.distort}
                            roughness={0.5}
                            metalness={0.8}
                            emissive={planet.color}
                            emissiveIntensity={0.2}
                        />
                    </Sphere>
                </Float>
            ))}

            {/* Subtle background fog for depth */}
            <fog attach="fog" args={['#050505', 10, 100]} />
        </group>
    )
}
