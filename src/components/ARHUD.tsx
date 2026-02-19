import React from 'react'
import { useGameStore } from '../store/gameStore'

export function ARHUD() {
    const { score, level, timeRemaining, capturedCount, highScore, isPaused, togglePause, resetHighScore, isGameOver, startGame, isLevelComplete, nextLevel, lastDamageTime } = useGameStore()
    const [damageFlash, setDamageFlash] = React.useState(false)
    const lastDamageRef = React.useRef(lastDamageTime)

    React.useEffect(() => {
        if (lastDamageTime > lastDamageRef.current) {
            lastDamageRef.current = lastDamageTime
            setDamageFlash(true)
            const timer = setTimeout(() => setDamageFlash(false), 200)
            return () => clearTimeout(timer)
        }
    }, [lastDamageTime])

    // Common styles
    const overlayStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1000,
        fontFamily: "'Inter', sans-serif",
        color: 'white'
    }

    const panelStyle: React.CSSProperties = {
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(5px)',
        padding: '15px',
        borderRadius: '12px',
        border: '1px solid rgba(0, 242, 96, 0.3)',
        pointerEvents: 'auto'
    }

    const buttonStyle: React.CSSProperties = {
        background: 'rgba(0, 242, 96, 0.2)',
        color: '#00f260',
        border: '1px solid #00f260',
        padding: '10px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: '14px',
        marginTop: '10px',
        pointerEvents: 'auto'
    }

    const pauseBtnStyle: React.CSSProperties = {
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.6)',
        border: '1px solid white',
        color: 'white',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '20px',
        pointerEvents: 'auto'
    }

    return (
        <div style={overlayStyle} id="ar-hud-overlay">
            {/* Damage Flash */}
            {damageFlash && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(255, 0, 0, 0.3)',
                    pointerEvents: 'none'
                }} />
            )}

            {!isGameOver && (
                <>
                    {/* Stats Panel */}
                    {!isPaused && (
                        <div style={panelStyle}>
                            <div style={{ fontSize: '10px', color: '#ffff00', marginBottom: '5px' }}>
                                HI-SCORE: {highScore.toString().padStart(6, '0')}
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00f260' }}>
                                {score.toString().padStart(6, '0')}
                            </div>
                            <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.8 }}>
                                LVL {level} | {timeRemaining}s | {capturedCount}🎯
                            </div>
                        </div>
                    )}

                    {/* Pause Button */}
                    {!isPaused && !isLevelComplete && (
                        <div style={pauseBtnStyle} onClick={togglePause}>
                            ⏸
                        </div>
                    )}

                    {/* Pause Menu */}
                    {isPaused && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.8)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'auto'
                        }}>
                            <h1 style={{ color: '#ffcc00', fontSize: '32px', marginBottom: '30px' }}>PAUSED</h1>
                            <button style={buttonStyle} onClick={togglePause}>RESUME</button>
                            <button style={{ ...buttonStyle, borderColor: '#ff4444', color: '#ff4444', background: 'rgba(255, 68, 68, 0.1)' }} onClick={resetHighScore}>
                                RESET HI-SCORE
                            </button>
                        </div>
                    )}

                    {/* Level Complete */}
                    {isLevelComplete && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.7)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'auto'
                        }}>
                            <h2 style={{ color: '#00f260', fontSize: '24px', marginBottom: '20px' }}>LEVEL COMPLETE!</h2>
                            <button style={buttonStyle} onClick={nextLevel}>NEXT MISSION</button>
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
                    <h1 style={{ color: '#ff0000', fontSize: '36px', marginBottom: '10px' }}>MISSION FAILED</h1>
                    <p style={{ fontSize: '20px', marginBottom: '30px' }}>FINAL SCORE: {score}</p>
                    <button style={buttonStyle} onClick={startGame}>RETRY MISSION</button>
                </div>
            )}
        </div>
    )
}
