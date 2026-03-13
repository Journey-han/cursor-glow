interface CursorGlowOptions {
  colorA?: string
  colorB?: string
  glowSize?: number
  ringSize?: number
  trailCount?: number
  hideNativeCursor?: boolean
}

declare function cursorGlow(options?: CursorGlowOptions): {
  destroy(): void
  pause(): void
  resume(): void
  refreshHoverTargets(): void
}

export default cursorGlow