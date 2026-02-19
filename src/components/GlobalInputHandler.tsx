import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'

export function GlobalInputHandler() {
    const { triggerUltimate } = useGameStore()
    const timerRef = useRef<number | null>(null)

    useEffect(() => {
        const handleStart = (e: Event) => {
            // Don't trigger if touching a button or interactive element
            const target = e.target as HTMLElement
            if (target.tagName === 'BUTTON' || target.closest('button')) return

            if (timerRef.current) clearTimeout(timerRef.current)
            timerRef.current = setTimeout(() => {
                triggerUltimate()
                // Haptic feedback if available
                if (navigator.vibrate) navigator.vibrate(200);
            }, 500) as unknown as number // 500ms long press
        }

        const handleEnd = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
                timerRef.current = null
            }
        }

        window.addEventListener('pointerdown', handleStart)
        window.addEventListener('pointerup', handleEnd)
        window.addEventListener('pointerleave', handleEnd)
        window.addEventListener('touchstart', handleStart)
        window.addEventListener('touchend', handleEnd)

        return () => {
            window.removeEventListener('pointerdown', handleStart)
            window.removeEventListener('pointerup', handleEnd)
            window.removeEventListener('pointerleave', handleEnd)
            window.removeEventListener('touchstart', handleStart)
            window.removeEventListener('touchend', handleEnd)
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [triggerUltimate])

    return null
}
