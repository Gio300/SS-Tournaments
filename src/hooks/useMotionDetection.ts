'use client'

import { useCallback, useRef, useState } from 'react'

/**
 * Pixel-based motion detection for Pro tier.
 * Samples video frames, compares pixel diff to determine "action" level.
 * Returns a score 0-1; higher = more motion.
 */
export function useMotionDetection() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const prevDataRef = useRef<ImageData | null>(null)
  const [lastScore, setLastScore] = useState(0)

  const getMotionScore = useCallback(async (video: HTMLVideoElement): Promise<number> => {
    if (video.readyState < 2 || video.videoWidth === 0) return 0
    const w = Math.min(64, video.videoWidth)
    const h = Math.min(36, video.videoHeight)
    let canvas = canvasRef.current
    if (!canvas) {
      canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvasRef.current = canvas
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return 0
    ctx.drawImage(video, 0, 0, w, h)
    const data = ctx.getImageData(0, 0, w, h)
    const prev = prevDataRef.current
    prevDataRef.current = data
    if (!prev) return 0
    let diff = 0
    const len = data.data.length
    for (let i = 0; i < len; i += 4) {
      diff += Math.abs(data.data[i] - prev.data[i])
      diff += Math.abs(data.data[i + 1] - prev.data[i + 1])
      diff += Math.abs(data.data[i + 2] - prev.data[i + 2])
    }
    const maxDiff = len * 255
    const score = Math.min(1, diff / (maxDiff * 0.1))
    setLastScore(score)
    return score
  }, [])

  return { getMotionScore, lastScore }
}
