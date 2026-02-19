import '../styles/HUD.css'
import { useGameStore } from '../store/gameStore'

export function HUD() {
    const { score, level, timeRemaining, capturedCount, isPlaying, startGame, activePowerup, highScore, isPaused, togglePause, resetHighScore } = useGameStore()

    if (!isPlaying && timeRemaining === 60 && level === 1 && score === 0) {
        return (
            <div className="hud-overlay hud-screen">
                <h1 className="hud-title">XENOSCOPE</h1>
                <p className="hud-subtitle">Alien Hunter AR</p>
                <button className="hud-btn" onClick={startGame}>START MISSION</button>
            </div>
        )
    }

    if (!isPlaying && timeRemaining <= 0) {
        return (
            <div className="hud-overlay hud-screen" style={{ background: 'rgba(50,0,0,0.85)' }}>
                <h1 className="hud-title" style={{ color: '#ff0055' }}>MISSION FAILED</h1>
                <p className="hud-subtitle">Aliens Captured: {capturedCount}</p>
                <button className="hud-btn" onClick={startGame}>RETRY LEVEL {level}</button>
            </div>
        )
    }

    if (isPaused) {
        return (
            <div className="hud-overlay hud-screen" style={{ background: 'rgba(0,0,0,0.6)' }}>
                <h1 className="hud-title" style={{ color: '#ffcc00' }}>PAUSED</h1>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <button className="hud-btn" onClick={togglePause}>RESUME MISSION</button>
                    <button className="hud-btn" onClick={() => {
                        resetHighScore();
                        // Optional: close pause menu or keep open? 
                        // Keep open nicely gives feedback
                    }} style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', background: 'rgba(255,0,0,0.2)' }}>
                        RESET HIGH SCORE
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="hud-overlay">
            <div className="hud-stats">
                <div style={{ color: '#ffff00', fontSize: '0.9em', fontWeight: 'bold' }}>HI-SCORE: {highScore.toString().padStart(6, '0')}</div>
                <div>SCORE: {score.toString().padStart(6, '0')}</div>
                <div>LEVEL: {level}</div>
                <div>CAPTURED: {capturedCount}</div>
            </div>

            {activePowerup && (
                <div className="powerup-alert" style={{
                    position: 'absolute',
                    top: '20%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: activePowerup === 'rapid-fire' ? '#0088ff' : '#00ff88',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    textShadow: '0 0 10px black',
                    textAlign: 'center',
                    animation: 'pulse 1s infinite'
                }}>
                    {activePowerup === 'rapid-fire' ? '🚀 RAPID FIRE 🚀' : '⏱️ SLOW MOTION ⏱️'}
                </div>
            )}

            <div className={`hud-timer ${timeRemaining < 10 ? 'low' : ''}`}>
                {timeRemaining}s
            </div>

            <button
                onClick={togglePause}
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'none',
                    border: '2px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    pointerEvents: 'auto'
                }}
            >
                ⏸️
            </button>

            <div className="reticle-outer" />
            <div className="reticle-inner" />
        </div>
    )
}
