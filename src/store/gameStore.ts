import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { soundManager } from '../utils/SoundManager';


export type AlienType =
    | 'kralithor'
    | 'xylophont'
    | 'zyrephon'
    | 'myrmelux'
    | 'vorvakul'
    | 'verwak'
    | 'dyrekx';

export interface Alien {
    id: string;
    type: AlienType;
    position: [number, number, number];
    speed: number;
    health: number;
    isBoss?: boolean;
    variant?: 'normal' | 'tank' | 'invisible';
}

export interface Explosion {
    id: string;
    position: [number, number, number];
    color: string;
    createdAt: number;
}

export type PowerupType = 'rapid-fire' | 'slow-motion';

export interface Powerup {
    id: string;
    type: PowerupType;
    position: [number, number, number];
    createdAt: number;
}

interface GameState {
    score: number;
    level: number;
    timeRemaining: number;
    capturedCount: number;
    spawnCount: number;
    isPlaying: boolean;
    aliens: Alien[];
    explosions: Explosion[];
    powerups: Powerup[];
    activePowerup: PowerupType | null;
    powerupExpiry: number;
    ultimateCharge: number; // 0 to 100
    highScore: number;
    isPaused: boolean;
    isGameOver: boolean;
    lastDamageTime: number;

    isLevelComplete: boolean;

    startGame: () => void;
    togglePause: () => void;
    resetHighScore: () => void;
    nextLevel: () => void;
    updateTime: (delta: number) => void;
    takeDamage: (amount: number) => void;
    addScore: (points: number) => void;
    spawnAlien: () => void;
    captureAlien: (id: string) => void;
    missAlien: (id: string) => void;
    triggerExplosion: (position: [number, number, number], color: string) => void;
    removeExplosion: (id: string) => void;
    spawnPowerup: (position: [number, number, number]) => void;
    collectPowerup: (id: string) => void;
    removePowerup: (id: string) => void;
    triggerUltimate: () => void;
}

export const useGameStore = create<GameState>((set) => ({
    score: 0,
    level: 1,
    timeRemaining: 60,
    capturedCount: 0,
    spawnCount: 0,
    isPlaying: false,
    isLevelComplete: false,
    aliens: [],
    explosions: [],
    powerups: [],
    activePowerup: null,
    powerupExpiry: 0,
    ultimateCharge: 0,
    highScore: parseInt(localStorage.getItem('highScore') || '0'),
    isPaused: false,
    isGameOver: false,
    lastDamageTime: 0,

    startGame: () => {
        set({
            isPlaying: true,
            isLevelComplete: false,
            score: 0,
            level: 1,
            timeRemaining: 60,
            capturedCount: 0,
            spawnCount: 0,
            aliens: [],
            explosions: [],
            powerups: [],
            activePowerup: null,
            powerupExpiry: 0,
            ultimateCharge: 0,
            isPaused: false,
            isGameOver: false,
            lastDamageTime: 0
        });
    },

    togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

    resetHighScore: () => {
        localStorage.setItem('highScore', '0');
        set({ highScore: 0 });
    },

    nextLevel: () => {
        set((state) => ({
            level: state.level + 1,
            timeRemaining: 60,
            isLevelComplete: false,
            aliens: [], // Clear old aliens
            explosions: [],
            powerups: []
        }));
    },

    takeDamage: (amount: number) => {
        const state = useGameStore.getState();
        if (state.isGameOver || state.isLevelComplete || state.isPaused) return;

        // Level 1: Safe Zone (No Penalty)
        if (state.level <= 1) return;

        // Global Invulnerability Cooldown (1 second)
        const now = Date.now();
        if (now - state.lastDamageTime < 1000) return;

        // Penalty subtracts amount
        const newScore = state.score - amount;
        const isGameOver = newScore < 0;

        set({
            score: newScore,
            isGameOver: isGameOver,
            isPlaying: !isGameOver,
            lastDamageTime: now
        });
    },

    missAlien: (id) => {
        const state = useGameStore.getState();

        // Safety check: verify alien exists before penalizing
        // This prevents double-penalties if called multiple times or after level clear
        const alienExists = state.aliens.some(a => a.id === id);
        if (!alienExists) return;

        const newAliens = state.aliens.filter(a => a.id !== id);

        if (state.isGameOver || state.isLevelComplete || state.isPaused) {
            set({ aliens: newAliens });
            return;
        }

        if (state.level <= 1) {
            // Level 1: Safe Zone (Just remove alien)
            set({ aliens: newAliens });
            return;
        }

        // Penalty: -50 points
        const newScore = state.score - 50;
        const isGameOver = newScore < 0;

        set({
            aliens: newAliens,
            score: newScore,
            isGameOver: isGameOver,
            isPlaying: !isGameOver
        });
    },

    updateTime: (delta) => set((state) => {
        if (!state.isPlaying || state.isLevelComplete || state.isPaused || state.isGameOver) return {};

        const newTime = state.timeRemaining - delta;

        if (newTime <= 0) {
            // Level Complete!
            return { timeRemaining: 0, isLevelComplete: true, aliens: [], explosions: [], powerups: [], activePowerup: null };
        }

        // Check powerup expiry
        const { activePowerup, powerupExpiry } = state;
        if (activePowerup && Date.now() > powerupExpiry) {
            return { timeRemaining: newTime, activePowerup: null };
        }

        return { timeRemaining: newTime };
    }),

    addScore: (points) => set((state) => {
        const newScore = state.score + points;
        const newHighScore = Math.max(state.highScore, newScore);
        localStorage.setItem('highScore', newHighScore.toString());
        return { score: newScore, highScore: newHighScore };
    }),

    spawnAlien: () => {
        const { isLevelComplete, spawnCount } = useGameStore.getState();
        if (isLevelComplete) return;

        // Increment spawn count
        useGameStore.setState({ spawnCount: spawnCount + 1 });
        const isBoss = (spawnCount + 1) % 10 === 0;

        const types: AlienType[] = ['kralithor', 'xylophont', 'zyrephon', 'myrmelux', 'vorvakul', 'verwak', 'dyrekx'];
        const { level } = useGameStore.getState();
        const randomType = types[Math.floor(Math.random() * types.length)];

        // Random position around the user (circular range 5m to 10m)
        // Increased distance to give user reaction time
        const angle = Math.random() * Math.PI * 2;
        const radius = 5 + Math.random() * 5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        // Keep height closer to eye level (-0.5 to 1.0) so they aren't too high/low
        const y = -0.2 + Math.random() * 0.5;

        const isTank = !isBoss && Math.random() < 0.15; // 15% chance for Tank
        const isInvisible = !isBoss && !isTank && Math.random() < 0.15; // 15% chance for Invisible

        const newAlien: Alien = {
            id: uuidv4(),
            type: randomType,
            position: [x, y, z],
            // Increase speed with level: Base 0.5 + Random * 1.0 + Level * 0.1
            // If Slow Motion is active, reduce speed by 50%
            speed: (isBoss ? 0.7 + (level * 0.1) : (isTank ? 0.4 : 0.6) + Math.random() * 1.5 + (level * 0.25)) * (useGameStore.getState().activePowerup === 'slow-motion' ? 0.5 : 1.0),
            health: isBoss ? 500 : (isTank ? 300 : 100),
            isBoss: isBoss,
            variant: isTank ? 'tank' : (isInvisible ? 'invisible' : 'normal')
        };

        // 20% chance to spawn a powerup INSTEAD of an alien (if not a boss spawn)
        if (!isBoss && Math.random() < 0.20) {
            useGameStore.getState().spawnPowerup([x, y, z]);
            return;
        }

        set((state) => ({ aliens: [...state.aliens, newAlien] }));
    },

    captureAlien: (id) => {
        soundManager.playShoot();

        const state = useGameStore.getState();
        const alienIndex = state.aliens.findIndex(a => a.id === id);

        if (alienIndex === -1) return;

        const alien = state.aliens[alienIndex];
        const newHealth = alien.health - 100;

        if (newHealth <= 0) {
            // Killed!
            state.triggerExplosion(alien.position, alien.isBoss ? '#ff0000' : '#ffaa00'); // Red explosion for boss
            set((state) => { // Use callback to access current state for score calculation
                const points = alien.isBoss ? 1000 : (alien.variant === 'tank' ? 300 : 100);
                const newScore = state.score + points;
                const newHighScore = Math.max(state.highScore, newScore);
                localStorage.setItem('highScore', newHighScore.toString());

                return {
                    aliens: state.aliens.filter(a => a.id !== id),
                    score: newScore,
                    highScore: newHighScore,
                    capturedCount: state.capturedCount + 1
                };
            });
        } else {
            // Just Hit! Update health
            const newAliens = [...state.aliens];
            newAliens[alienIndex] = { ...alien, health: newHealth };
            set({ aliens: newAliens });
        }
    },




    triggerExplosion: (position, color) => {
        const id = uuidv4();
        // Limit total explosions to prevent lag
        set((state) => {
            const newExplosions = [...state.explosions, { id, position, color, createdAt: Date.now() }];
            if (newExplosions.length > 20) newExplosions.shift(); // Keep max 20
            return { explosions: newExplosions };
        });

        // Auto remove after 2 seconds safely
        setTimeout(() => {
            useGameStore.getState().removeExplosion(id);
        }, 1000);
    },

    removeExplosion: (id) => set((state) => ({
        explosions: state.explosions.filter(e => e.id !== id)
    })),

    spawnPowerup: (position) => {
        const type: PowerupType = Math.random() > 0.5 ? 'rapid-fire' : 'slow-motion';
        const id = uuidv4();
        set((state) => ({
            powerups: [...state.powerups, { id, type, position, createdAt: Date.now() }]
        }));

        // Despawn after 15 seconds if not collected
        setTimeout(() => {
            useGameStore.getState().removePowerup(id);
        }, 15000);
    },

    collectPowerup: (id) => {
        const powerup = useGameStore.getState().powerups.find(p => p.id === id);
        if (!powerup) return;

        // soundManager.playPowerup(); // TODO: Add powerup sound

        set((state) => ({
            powerups: state.powerups.filter(p => p.id !== id),
            activePowerup: powerup.type,
            powerupExpiry: Date.now() + 10000 // 10 seconds duration
        }));
    },

    removePowerup: (id) => set((state) => ({
        powerups: state.powerups.filter(p => p.id !== id)
    })),

    triggerUltimate: () => {
        const state = useGameStore.getState();
        // Removed charge check for Long Press mechanic
        // if (state.ultimateCharge < 100) return;

        // Visual feedback (maybe sound?)
        // soundManager.playExplosion(); 

        state.aliens.forEach(alien => {
            state.triggerExplosion(alien.position, '#00ffff'); // Cyan explosion for ultimate
        });

        set((state) => {
            const points = state.aliens.length * 50;
            const newScore = state.score + points;
            const newHighScore = Math.max(state.highScore, newScore);
            localStorage.setItem('highScore', newHighScore.toString());

            return {
                aliens: [], // Kill all
                score: newScore,
                highScore: newHighScore,
                capturedCount: state.capturedCount + state.aliens.length,
                ultimateCharge: 0
            };
        });
    }
}));
