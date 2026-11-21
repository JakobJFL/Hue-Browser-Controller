import type { ColorGamut, HueLight, XyPoint } from '../types/hue'

const GAMUT_C: ColorGamut = {
  red: { x: 0.6915, y: 0.3083 },
  green: { x: 0.17, y: 0.7 },
  blue: { x: 0.1532, y: 0.0475 },
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val))
}

function pointInTriangle(p: XyPoint, a: XyPoint, b: XyPoint, c: XyPoint): boolean {
  const v0x = c.x - a.x
  const v0y = c.y - a.y
  const v1x = b.x - a.x
  const v1y = b.y - a.y
  const v2x = p.x - a.x
  const v2y = p.y - a.y

  const dot00 = v0x * v0x + v0y * v0y
  const dot01 = v0x * v1x + v0y * v1y
  const dot02 = v0x * v2x + v0y * v2y
  const dot11 = v1x * v1x + v1y * v1y
  const dot12 = v1x * v2x + v1y * v2y

  const denom = dot00 * dot11 - dot01 * dot01
  if (Math.abs(denom) < 1e-10) return false

  const invDenom = 1 / denom
  const u = (dot11 * dot02 - dot01 * dot12) * invDenom
  const v = (dot00 * dot12 - dot01 * dot02) * invDenom
  return u >= 0 && v >= 0 && u + v <= 1
}

function closestPointOnSegment(p: XyPoint, a: XyPoint, b: XyPoint): XyPoint {
  const abx = b.x - a.x
  const aby = b.y - a.y
  const apx = p.x - a.x
  const apy = p.y - a.y
  const abLenSq = abx * abx + aby * aby
  if (abLenSq === 0) return { x: a.x, y: a.y }
  const t = clamp((apx * abx + apy * aby) / abLenSq, 0, 1)
  return { x: a.x + abx * t, y: a.y + aby * t }
}

function clampToGamut(xy: XyPoint, gamut: ColorGamut = GAMUT_C): XyPoint {
  const r = gamut.red || GAMUT_C.red
  const g = gamut.green || GAMUT_C.green
  const b = gamut.blue || GAMUT_C.blue
  if (pointInTriangle(xy, r, g, b)) return xy

  const candidates: [XyPoint, XyPoint, XyPoint] = [
    closestPointOnSegment(xy, r, g),
    closestPointOnSegment(xy, g, b),
    closestPointOnSegment(xy, b, r),
  ]

  let best = candidates[0]
  let bestDist = Infinity
  for (const pt of candidates) {
    const d = (xy.x - pt.x) ** 2 + (xy.y - pt.y) ** 2
    if (d < bestDist) {
      bestDist = d
      best = pt
    }
  }
  return best
}

export function hexToXy(hex: string, gamut: ColorGamut = GAMUT_C): XyPoint {
  const clean = hex.replace('#', '')
  const rInt = parseInt(clean.slice(0, 2), 16) || 0
  const gInt = parseInt(clean.slice(2, 4), 16) || 0
  const bInt = parseInt(clean.slice(4, 6), 16) || 0

  const toLinear = (c: number): number => {
    const n = c / 255
    return n > 0.04045 ? ((n + 0.055) / 1.055) ** 2.4 : n / 12.92
  }

  const r = toLinear(rInt)
  const g = toLinear(gInt)
  const b = toLinear(bInt)

  const X = r * 0.664511 + g * 0.154324 + b * 0.162028
  const Y = r * 0.283881 + g * 0.668433 + b * 0.047685
  const Z = r * 0.000088 + g * 0.07231 + b * 0.986039

  const sum = X + Y + Z
  if (sum === 0) return { x: 0.3127, y: 0.329 }

  const raw: XyPoint = {
    x: Number((X / sum).toFixed(4)),
    y: Number((Y / sum).toFixed(4)),
  }
  const clamped = clampToGamut(raw, gamut)
  return {
    x: Number(clamped.x.toFixed(4)),
    y: Number(clamped.y.toFixed(4)),
  }
}

export function xyToHex(xy: XyPoint | null | undefined, brightness = 100): string {
  if (!xy || typeof xy.x !== 'number' || typeof xy.y !== 'number' || xy.y <= 0) {
    return '#fde68a'
  }

  const z = 1.0 - xy.x - xy.y
  const Y = clamp(brightness, 25, 100) / 100
  const X = (Y / xy.y) * xy.x
  const Z = (Y / xy.y) * z

  let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038
  let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152
  let b = X * 0.051713 - Y * 0.121364 + Z * 1.01153

  const maxChannel = Math.max(r, g, b)
  if (maxChannel > 1) {
    r /= maxChannel
    g /= maxChannel
    b /= maxChannel
  }

  const toGamma = (c: number): number => {
    const v = Math.max(0, c)
    return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055
  }

  const rByte = clamp(Math.round(toGamma(r) * 255), 0, 255)
  const gByte = clamp(Math.round(toGamma(g) * 255), 0, 255)
  const bByte = clamp(Math.round(toGamma(b) * 255), 0, 255)

  return `#${[rByte, gByte, bByte].map((n) => n.toString(16).padStart(2, '0')).join('')}`
}

export function mirekToHex(mirek = 300): string {
  const kelvin = 1000000 / clamp(mirek, 153, 500)
  const temp = kelvin / 100

  let r: number
  let g: number
  let b: number

  if (temp <= 66) {
    r = 255
    g = 99.4708025861 * Math.log(temp) - 161.1195681661
    b = temp <= 19 ? 0 : 138.5177312231 * Math.log(temp - 10) - 305.0447927307
  } else {
    r = 329.698727446 * (temp - 60) ** -0.1332047592
    g = 288.1221695283 * (temp - 60) ** -0.0755148492
    b = 255
  }

  const rByte = clamp(Math.round(r), 0, 255)
  const gByte = clamp(Math.round(g), 0, 255)
  const bByte = clamp(Math.round(b), 0, 255)
  return `#${[rByte, gByte, bByte].map((n) => n.toString(16).padStart(2, '0')).join('')}`
}

export function getLightColorHex(
  light: Pick<HueLight, 'activeMode' | 'mirek' | 'xy'>
): string {
  if (light.activeMode === 'ct' && light.mirek) {
    return mirekToHex(light.mirek)
  }
  if (light.xy) {
    return xyToHex(light.xy, 100)
  }
  if (light.mirek) {
    return mirekToHex(light.mirek)
  }
  return '#fde68a'
}

export function getLightDisplayHex(
  light: Pick<HueLight, 'isOn' | 'reachable' | 'activeMode' | 'mirek' | 'xy'>
): string {
  if (!light.reachable || !light.isOn) return '#141b4d'
  return getLightColorHex(light)
}

export interface HsvColor {
  h: number
  s: number
  v: number
}

export function hsvToHex(h: number, s: number, v = 100): string {
  const hue = ((h % 360) + 360) % 360
  const sat = clamp(s, 0, 100) / 100
  const val = clamp(v, 0, 100) / 100

  const c = val * sat
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = val - c

  let r1 = 0
  let g1 = 0
  let b1 = 0

  if (hue < 60) {
    r1 = c
    g1 = x
  } else if (hue < 120) {
    r1 = x
    g1 = c
  } else if (hue < 180) {
    g1 = c
    b1 = x
  } else if (hue < 240) {
    g1 = x
    b1 = c
  } else if (hue < 300) {
    r1 = x
    b1 = c
  } else {
    r1 = c
    b1 = x
  }

  const rByte = clamp(Math.round((r1 + m) * 255), 0, 255)
  const gByte = clamp(Math.round((g1 + m) * 255), 0, 255)
  const bByte = clamp(Math.round((b1 + m) * 255), 0, 255)

  return `#${[rByte, gByte, bByte].map((n) => n.toString(16).padStart(2, '0')).join('')}`
}

export function hexToHsv(hex: string): HsvColor {
  const clean = hex.replace('#', '')
  const r = (parseInt(clean.slice(0, 2), 16) || 0) / 255
  const g = (parseInt(clean.slice(2, 4), 16) || 0) / 255
  const b = (parseInt(clean.slice(4, 6), 16) || 0) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min

  let h = 0
  if (d !== 0) {
    if (max === r) {
      h = ((g - b) / d) % 6
    } else if (max === g) {
      h = (b - r) / d + 2
    } else {
      h = (r - g) / d + 4
    }
    h *= 60
    if (h < 0) h += 360
  }

  const s = max === 0 ? 0 : (d / max) * 100
  const v = max * 100

  return { h, s, v }
}

export interface LightSurfacePalette {
  background: string
  boxShadow: string
  useDarkText: boolean
}

/**
 * Computes a modern luminous card surface and WCAG-contrasting text mode
 * by blending the bulb's display hex with its live brightness over midnight blue (#080d38).
 */
export function getLightSurfacePalette(
  light: Pick<
    HueLight,
    'isOn' | 'reachable' | 'brightness' | 'supportsDimming' | 'activeMode' | 'mirek' | 'xy'
  >
): LightSurfacePalette {
  if (!light.reachable) {
    return {
      background: 'rgba(5, 8, 34, 0.55)',
      boxShadow: 'none',
      useDarkText: false,
    }
  }

  if (!light.isOn) {
    return {
      background: 'rgba(7, 12, 51, 0.75)',
      boxShadow: 'none',
      useDarkText: false,
    }
  }

  const hex = getLightDisplayHex(light).replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16) || 253
  const g = parseInt(hex.slice(2, 4), 16) || 230
  const b = parseInt(hex.slice(4, 6), 16) || 138

  const briRatio = light.supportsDimming ? clamp(light.brightness, 1, 100) / 100 : 1
  const topAlpha = Number((0.52 + 0.46 * briRatio).toFixed(3))
  const bottomAlpha = Number((0.42 + 0.46 * briRatio).toFixed(3))
  const avgAlpha = (topAlpha + bottomAlpha) / 2

  // Blended RGB against base #080d38 -> rgb(8, 13, 56)
  const br = r * avgAlpha + 8 * (1 - avgAlpha)
  const bg = g * avgAlpha + 13 * (1 - avgAlpha)
  const bb = b * avgAlpha + 56 * (1 - avgAlpha)

  const toLinear = (c: number): number => {
    const n = c / 255
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4
  }
  const luminance = 0.2126 * toLinear(br) + 0.7152 * toLinear(bg) + 0.0722 * toLinear(bb)

  const glowAlpha = Number((0.16 + 0.26 * briRatio).toFixed(2))

  return {
    background: `linear-gradient(180deg, rgba(${r}, ${g}, ${b}, ${topAlpha}) 0%, rgba(${r}, ${g}, ${b}, ${bottomAlpha}) 100%), #080d38`,
    boxShadow: `0 10px 28px -10px rgba(${r}, ${g}, ${b}, ${glowAlpha}), inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
    useDarkText: luminance > 0.24,
  }
}
