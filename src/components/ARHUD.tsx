import React from 'react'
import { createPortal } from 'react-dom'
import { useGameStore } from '../store/gameStore'

export function ARHUD() {
    const { score, level, timeRemaining, capturedCount, highScore, isPaused, togglePause, resetHighScore, isGameOver, startGame, isLevelComplete, nextLevel, lastDamageTime } = useGameStore()
    const [damageFlash, setDamageFlash] = React.useState(false)
    const lastDamageRef = React.useRef(lastDamageTime)
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
        if (lastDamageTime > lastDamageRef.current) {
            lastDamageRef.current = lastDamageTime
            setDamageFlash(true)
            const timer = setTimeout(() => setDamageFlash(false), 200)
            return () => clearTimeout(timer)
        }
    }, [lastDamageTime])

    if (!mounted) return null

    const overlayRoot = document.getElementById('ar-overlay')
    if (!overlayRoot) {
        console.warn("ARHUD: #ar-overlay not found in DOM")
        return null
    }

    // Common styles
    const overlayStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 2000, // Higher
        fontFamily: "'Inter', sans-serif",
        color: 'white',
        display: 'block' // Ensure visibility
    }

    const panelStyle: React.CSSProperties = {
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        padding: '15px',
        borderRadius: '12px',
        border: '1px solid rgba(0, 242, 96, 0.5)',
        pointerEvents: 'auto'
    }

    const buttonStyle: React.CSSProperties = {
        background: 'rgba(0, 242, 96, 0.3)',
        color: '#00f260',
        border: '2px solid #00f260',
        padding: '12px 24px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: '16px',
        marginTop: '10px',
        pointerEvents: 'auto'
    }

    const hudContent = (
        <div style={overlayStyle} id="ar-hud-container">
            {/* Damage Flash */}
            {damageFlash && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(255, 0, 0, 0.4)',
                    pointerEvents: 'none'
                }} />
            )}

            {!isGameOver && (
                <>
                    {/* Stats Panel */}
                    {!isPaused && (
                        <div style={panelStyle}>
                            <div style={{ fontSize: '12px', color: '#ffff00', marginBottom: '5px' }}>
                                HI-SCORE: {highScore.toString().padStart(6, '0')}
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00f260' }}>
                                {score.toString().padStart(6, '0')}
                            </div>
                            <div style={{ marginTop: '10px', fontSize: '14px', opacity: 0.9 }}>
                                Lvl {level} | {timeRemaining}s | {capturedCount}🎯
                            </div>
                        </div>
                    )}

                    {/* Pause Button */}
                    {!isPaused && !isLevelComplete && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                width: '50px',
                                height: '50px',
                                background: 'rgba(0, 0, 0, 0.6)',
                                border: '2px solid white',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '24px',
                                pointerEvents: 'auto'
                            }}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                togglePause()
                            }}
                        >
                            ⏸
                        </div>
                    )}

                    {/* Menus */}
                    {(isPaused || isLevelComplete) && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.85)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'auto'
                        }}>
                            {isPaused ? (
                                <>
                                    <h1 style={{ color: '#ffcc00', fontSize: '40px', marginBottom: '30px' }}>PAUSED</h1>
                                    <button style={buttonStyle} onClick={togglePause}>RESUME</button>
                                    <button style={{ ...buttonStyle, borderColor: '#ff4444', color: '#ff4444', background: 'rgba(255, 68, 68, 0.1)' }} onClick={resetHighScore}>
                                        RESET HI-SCORE
                                    </button>
                                </>
                            ) : (
                                <>
                                    <h2 style={{ color: '#00f260', fontSize: '32px', marginBottom: '20px' }}>LEVEL COMPLETE!</h2>
                                    <button style={buttonStyle} onClick={nextLevel}>NEXT MISSION</button>
                                </>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Game Over */}
            {isGameOver && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'black',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'auto'
                }}>
                    <h1 style={{ color: '#ff0000', fontSize: '48px', marginBottom: '10px' }}>MISSION FAILED</h1>
                    <p style={{ fontSize: '24px', marginBottom: '40px' }}>FINAL SCORE: {score}</p>
                    <button style={buttonStyle} onClick={startGame}>RETRY MISSION</button>
                </div>
            )}
        </div>
    )

    return createPortal(hudContent, overlayRoot)
}
