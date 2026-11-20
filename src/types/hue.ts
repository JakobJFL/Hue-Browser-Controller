export interface XyPoint {
  x: number
  y: number
}

export interface ColorGamut {
  red: XyPoint
  green: XyPoint
  blue: XyPoint
}

export interface ClipResourceRef {
  rid: string
  rtype: string
}

export interface DemoPreset {
  brightness?: number
  mirek?: number
  xy?: XyPoint
}

export interface ClipRawResource {
  id: string
  type: string
  owner?: ClipResourceRef
  metadata?: {
    name?: string
    archetype?: string
  }
  children?: ClipResourceRef[]
  services?: ClipResourceRef[]
  status?: string | { active?: string }
  on?: { on?: boolean }
  dimming?: { brightness?: number }
  color_temperature?: {
    mirek?: number | null
    mirek_schema?: {
      mirek_minimum?: number
      mirek_maximum?: number
    }
  }
  color?: {
    xy?: XyPoint
    gamut?: ColorGamut
  }
  group?: ClipResourceRef
  _demoPreset?: DemoPreset
}

export interface ClipApiResponse<T = ClipRawResource> {
  data?: T[]
  errors?: Array<{ description?: string }>
  error?: string
}

export type LightActiveMode = 'color' | 'ct' | 'dimming'

export interface HueLight {
  id: string
  deviceId: string | null
  name: string
  archetype: string
  isOn: boolean
  brightness: number
  supportsDimming: boolean
  supportsColor: boolean
  supportsCt: boolean
  xy: XyPoint | null
  gamut: ColorGamut | null
  mirek: number
  mirekMin: number
  mirekMax: number
  activeMode: LightActiveMode
  reachable: boolean
}

export type GroupType = 'room' | 'zone'

export interface HueGroupBase {
  id: string
  type: GroupType
  name: string
  archetype: string
  groupedLightId: string | null
  fallbackBrightness: number
  lightIds: string[]
}

export interface HueGroup extends HueGroupBase {
  isOn: boolean
  onCount: number
  totalCount: number
  brightness: number
}

export interface HueScene {
  id: string
  name: string
  groupId: string
  active: boolean
  demoPreset: DemoPreset | null
}

export interface NormalizedClipData {
  lights: Record<string, HueLight>
  groups: HueGroupBase[]
  scenes: HueScene[]
  homeGroupedLightId: string | null
}

export interface HueSession {
  access_token: string
  refresh_token?: string
  application_key: string
  expires_at: number
}

export type AuthMode = 'logged_out' | 'authenticating' | 'authenticated' | 'demo'

export interface HueSettings {
  showUnreachable: boolean
}

export interface GroupedLightUpdatePayload {
  on?: { on: boolean }
  dimming?: { brightness: number }
}

export interface LightUpdatePayload {
  on?: { on: boolean }
  dimming?: { brightness: number }
  color_temperature?: { mirek: number }
  color?: { xy: XyPoint }
}

export type SceneRecallAction = 'active' | 'dynamic_palette' | 'static'
