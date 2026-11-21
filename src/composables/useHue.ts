import { computed, reactive, ref } from 'vue'
import {
  AuthExpiredError,
  clearSession,
  fetchAllResources,
  handleOAuthCallbackIfPresent,
  loadStoredSession,
  recallScene,
  startHueOAuth,
  updateGroupedLight,
  updateLight,
} from '../services/hueApi.ts'
import { createDemoResources } from '../services/mockData.ts'
import type {
  AuthMode,
  ClipRawResource,
  HueGroup,
  HueGroupBase,
  HueLight,
  HueScene,
  HueSettings,
} from '../types/hue.ts'
import { normalizeClipResources } from '../utils/clipNormalizer.ts'
import { hexToXy } from '../utils/color.ts'
import { createKeyedDebounce } from '../utils/debounce.ts'

const SETTINGS_KEY = 'open_hue_settings_v2'

const DEFAULT_SETTINGS: HueSettings = {
  showUnreachable: false,
  showColorTempOnColorLights: false,
}

function loadSettings(): HueSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { ...DEFAULT_SETTINGS }
    }
    const record = parsed as Record<string, unknown>
    return {
      showUnreachable:
        typeof record.showUnreachable === 'boolean'
          ? record.showUnreachable
          : DEFAULT_SETTINGS.showUnreachable,
      showColorTempOnColorLights:
        typeof record.showColorTempOnColorLights === 'boolean'
          ? record.showColorTempOnColorLights
          : DEFAULT_SETTINGS.showColorTempOnColorLights,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback
}

function hasPendingStartupSession(): boolean {
  try {
    if (typeof window !== 'undefined' && window.location?.href) {
      const url = new URL(window.location.href)
      if (url.searchParams.has('code') || url.searchParams.has('error')) {
        return true
      }
    }
  } catch {
    // Ignore invalid URL environments
  }
  return loadStoredSession() !== null
}

const authMode = ref<AuthMode>('logged_out')
const isLoading = ref(false)
const isBootstrapping = ref(hasPendingStartupSession())
const errorMessage = ref('')
const selectedGroupId = ref<string | null>(null)
const activeSceneByGroup = reactive<Record<string, string | null>>({})
const settings = reactive<HueSettings>(loadSettings())

const lightsMap = reactive<Record<string, HueLight>>({})
const groupsList = ref<HueGroupBase[]>([])
const scenesList = ref<HueScene[]>([])
const homeGroupedLightId = ref<string | null>(null)

const sliderDebounce = createKeyedDebounce(250)
const sceneSyncDebounce = createKeyedDebounce(850)
let refreshGeneration = 0

function applyNormalized(rawItems: ClipRawResource[]): void {
  const parsed = normalizeClipResources(rawItems)
  for (const k of Object.keys(lightsMap)) delete lightsMap[k]
  Object.assign(lightsMap, parsed.lights)
  groupsList.value = parsed.groups
  scenesList.value = parsed.scenes
  homeGroupedLightId.value = parsed.homeGroupedLightId

  for (const k of Object.keys(activeSceneByGroup)) delete activeSceneByGroup[k]
  for (const s of parsed.scenes) {
    if (s.active) activeSceneByGroup[s.groupId] = s.id
  }

  if (!selectedGroupId.value || !parsed.groups.some((g) => g.id === selectedGroupId.value)) {
    selectedGroupId.value = parsed.groups[0]?.id || null
  }
}

function clearActiveScenesForLight(lightId: string): void {
  for (const g of groupsList.value) {
    if (g.lightIds.includes(lightId)) {
      activeSceneByGroup[g.id] = null
    }
  }
}

export function useHue() {
  const groups = computed<HueGroup[]>(() =>
    groupsList.value.map((g) => {
      const members = g.lightIds
        .map((id) => lightsMap[id])
        .filter((l): l is HueLight => Boolean(l))
      const onLights = members.filter((l) => l.reachable && l.isOn)
      const brightness = onLights.length
        ? Math.round(onLights.reduce((s, l) => s + l.brightness, 0) / onLights.length)
        : g.fallbackBrightness
      return {
        ...g,
        isOn: onLights.length > 0,
        onCount: onLights.length,
        totalCount: members.length,
        brightness,
      }
    })
  )

  const selectedGroup = computed<HueGroup | null>(
    () => groups.value.find((g) => g.id === selectedGroupId.value) || groups.value[0] || null
  )

  const currentLights = computed<HueLight[]>(() => {
    const g = selectedGroup.value
    if (!g) return []
    return g.lightIds
      .map((id) => lightsMap[id])
      .filter((l): l is HueLight => Boolean(l && (settings.showUnreachable || l.reachable)))
  })

  const currentScenes = computed<HueScene[]>(() => {
    const g = selectedGroup.value
    return g ? scenesList.value.filter((s) => s.groupId === g.id) : []
  })

  function logout(): void {
    refreshGeneration++
    isLoading.value = false
    sliderDebounce.clearAll()
    sceneSyncDebounce.clearAll()
    clearSession()
    authMode.value = 'logged_out'
    for (const k of Object.keys(lightsMap)) delete lightsMap[k]
    for (const k of Object.keys(activeSceneByGroup)) delete activeSceneByGroup[k]
    groupsList.value = []
    scenesList.value = []
    homeGroupedLightId.value = null
    selectedGroupId.value = null
    errorMessage.value = ''
  }

  function handleActionError(err: unknown, fallback: string): void {
    if (err instanceof AuthExpiredError) {
      logout()
      errorMessage.value = err.message
      return
    }
    errorMessage.value = toErrorMessage(err, fallback)
  }

  async function refreshResources(): Promise<void> {
    errorMessage.value = ''
    if (authMode.value === 'demo') {
      applyNormalized(createDemoResources())
      return
    }
    const gen = ++refreshGeneration
    isLoading.value = true
    try {
      const res = await fetchAllResources()
      if (gen !== refreshGeneration || authMode.value !== 'authenticated') return
      applyNormalized(res.data || [])
    } catch (err) {
      if (gen === refreshGeneration) {
        handleActionError(err, 'Failed to load Hue resources.')
      }
    } finally {
      if (gen === refreshGeneration) {
        isLoading.value = false
      }
    }
  }

  async function bootstrap(): Promise<void> {
    if (hasPendingStartupSession()) {
      isBootstrapping.value = true
    }
    errorMessage.value = ''
    try {
      let cbSession = null
      try {
        cbSession = await handleOAuthCallbackIfPresent()
      } catch (err) {
        clearSession()
        authMode.value = 'logged_out'
        errorMessage.value = toErrorMessage(err, 'Authentication failed.')
        return
      }

      if (cbSession || loadStoredSession()) {
        authMode.value = 'authenticated'
        await refreshResources()
      } else {
        authMode.value = 'logged_out'
      }
    } finally {
      isBootstrapping.value = false
    }
  }

  function loginWithHue(): void {
    errorMessage.value = ''
    try {
      authMode.value = 'authenticating'
      startHueOAuth()
    } catch (err) {
      authMode.value = 'logged_out'
      errorMessage.value = toErrorMessage(err, 'Could not start login.')
    }
  }

  function startDemoMode(): void {
    refreshGeneration++
    isLoading.value = false
    sliderDebounce.clearAll()
    sceneSyncDebounce.clearAll()
    errorMessage.value = ''
    authMode.value = 'demo'
    applyNormalized(createDemoResources())
  }

  const selectGroup = (id: string): void => {
    selectedGroupId.value = id
  }

  function persistSettings(): void {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          showUnreachable: settings.showUnreachable,
          showColorTempOnColorLights: settings.showColorTempOnColorLights,
        })
      )
    } catch {
      // Ignore storage quota/privacy errors
    }
  }

  function setShowUnreachable(val: boolean): void {
    settings.showUnreachable = Boolean(val)
    persistSettings()
  }

  function setShowColorTempOnColorLights(val: boolean): void {
    settings.showColorTempOnColorLights = Boolean(val)
    persistSettings()
  }

  async function toggleGroup(group: HueGroup): Promise<void> {
    const nextOn = !group.isOn
    const prev = group.lightIds.map((id) => ({ id, isOn: Boolean(lightsMap[id]?.isOn) }))
    sceneSyncDebounce.clearAll()
    for (const id of group.lightIds) {
      const l = lightsMap[id]
      if (l && (l.reachable || !nextOn)) l.isOn = nextOn
    }
    if (!nextOn) activeSceneByGroup[group.id] = null
    if (authMode.value === 'demo') return
    try {
      if (group.groupedLightId) {
        await updateGroupedLight(group.groupedLightId, { on: { on: nextOn } })
      } else {
        await Promise.all(
          group.lightIds
            .filter((id) => lightsMap[id]?.reachable)
            .map((id) => updateLight(id, { on: { on: nextOn } }))
        )
      }
    } catch (err) {
      for (const s of prev) {
        const l = lightsMap[s.id]
        if (l) l.isOn = s.isOn
      }
      handleActionError(err, 'Could not update room state.')
    }
  }

  function setGroupBrightness(group: HueGroup, val: number): void {
    const bri = Math.max(1, Math.min(100, Math.round(Number(val))))
    sceneSyncDebounce.clearAll()
    for (const id of group.lightIds) {
      const l = lightsMap[id]
      if (l && l.reachable && (l.isOn || !group.isOn)) {
        l.isOn = true
        if (l.supportsDimming) l.brightness = bri
      }
    }
    if (authMode.value === 'demo') return
    const glId = group.groupedLightId
    const memberIds = [...group.lightIds]
    sliderDebounce.schedule(`grp-bri-${group.id}`, async () => {
      try {
        if (glId) {
          await updateGroupedLight(glId, { on: { on: true }, dimming: { brightness: bri } })
        } else {
          await Promise.all(
            memberIds
              .filter((id) => lightsMap[id]?.reachable)
              .map((id) => {
                const l = lightsMap[id]
                return updateLight(
                  id,
                  l?.supportsDimming
                    ? { on: { on: true }, dimming: { brightness: bri } }
                    : { on: { on: true } }
                )
              })
          )
        }
      } catch (err) {
        handleActionError(err, 'Could not adjust room brightness.')
      }
    })
  }

  async function turnAllOff(): Promise<void> {
    const prev = Object.values(lightsMap).map((l) => ({ id: l.id, isOn: l.isOn }))
    sceneSyncDebounce.clearAll()
    sliderDebounce.clearAll()
    for (const l of Object.values(lightsMap)) l.isOn = false
    for (const k of Object.keys(activeSceneByGroup)) activeSceneByGroup[k] = null
    if (authMode.value === 'demo') return
    try {
      if (homeGroupedLightId.value) {
        await updateGroupedLight(homeGroupedLightId.value, { on: { on: false } })
      } else {
        const groupRequests = groupsList.value
          .map((g) => g.groupedLightId)
          .filter((id): id is string => Boolean(id))
          .map((id) => updateGroupedLight(id, { on: { on: false } }))

        const ungroupedLightIds = groupsList.value
          .filter((g) => !g.groupedLightId)
          .flatMap((g) => g.lightIds)
          .filter((id) => lightsMap[id]?.reachable)
          .map((id) => updateLight(id, { on: { on: false } }))

        await Promise.all([...groupRequests, ...ungroupedLightIds])
      }
    } catch (err) {
      for (const s of prev) {
        const l = lightsMap[s.id]
        if (l) l.isOn = s.isOn
      }
      handleActionError(err, 'Could not turn all lights off.')
    }
  }

  async function toggleLight(lightId: string): Promise<void> {
    const l = lightsMap[lightId]
    if (!l || !l.reachable) return
    const prev = l.isOn
    sceneSyncDebounce.clearAll()
    l.isOn = !prev
    if (!l.isOn) clearActiveScenesForLight(lightId)
    if (authMode.value === 'demo') return
    try {
      await updateLight(lightId, { on: { on: l.isOn } })
    } catch (err) {
      l.isOn = prev
      handleActionError(err, `Could not toggle ${l.name}.`)
    }
  }

  function setLightBrightness(lightId: string, val: number): void {
    const l = lightsMap[lightId]
    if (!l || !l.reachable) return
    const bri = Math.max(1, Math.min(100, Math.round(Number(val))))
    sceneSyncDebounce.clearAll()
    l.isOn = true
    l.brightness = bri
    if (authMode.value === 'demo') return
    sliderDebounce.schedule(`lt-bri-${lightId}`, async () => {
      try {
        await updateLight(lightId, { on: { on: true }, dimming: { brightness: bri } })
      } catch (err) {
        handleActionError(err, `Could not dim ${l.name}.`)
      }
    })
  }

  function setLightTemperature(lightId: string, mirekVal: number): void {
    const l = lightsMap[lightId]
    if (!l || !l.reachable) return
    const mirek = Math.max(l.mirekMin, Math.min(l.mirekMax, Math.round(Number(mirekVal))))
    sceneSyncDebounce.clearAll()
    clearActiveScenesForLight(lightId)
    l.isOn = true
    l.mirek = mirek
    l.activeMode = 'ct'
    if (authMode.value === 'demo') return
    sliderDebounce.schedule(`lt-ct-${lightId}`, async () => {
      try {
        await updateLight(lightId, { on: { on: true }, color_temperature: { mirek } })
      } catch (err) {
        handleActionError(err, `Could not update temperature for ${l.name}.`)
      }
    })
  }

  function setLightColorHex(lightId: string, hex: string): void {
    const l = lightsMap[lightId]
    if (!l || !l.reachable) return
    const xy = hexToXy(hex, l.gamut || undefined)
    sceneSyncDebounce.clearAll()
    clearActiveScenesForLight(lightId)
    l.isOn = true
    l.xy = xy
    l.activeMode = 'color'
    if (authMode.value === 'demo') return
    sliderDebounce.schedule(`lt-xy-${lightId}`, async () => {
      try {
        await updateLight(lightId, { on: { on: true }, color: { xy } })
      } catch (err) {
        handleActionError(err, `Could not update color for ${l.name}.`)
      }
    })
  }

  async function activateScene(scene: HueScene): Promise<void> {
    activeSceneByGroup[scene.groupId] = scene.id
    const g = groupsList.value.find((grp) => grp.id === scene.groupId)
    if (g) {
      for (const id of g.lightIds) {
        const l = lightsMap[id]
        if (!l || !l.reachable) continue
        l.isOn = true
        if (scene.demoPreset) {
          if (scene.demoPreset.brightness && l.supportsDimming) {
            l.brightness = scene.demoPreset.brightness
          }
          if (scene.demoPreset.xy && l.supportsColor) {
            l.xy = { ...scene.demoPreset.xy }
            l.activeMode = 'color'
          } else if (scene.demoPreset.mirek && l.supportsCt) {
            l.mirek = Math.max(l.mirekMin, Math.min(l.mirekMax, scene.demoPreset.mirek))
            l.activeMode = 'ct'
          }
        }
      }
    }
    if (authMode.value === 'demo') return
    try {
      await recallScene(scene.id, 'active')
      sceneSyncDebounce.schedule('scene-sync', () => {
        void refreshResources()
      })
    } catch (err) {
      handleActionError(err, `Could not activate scene "${scene.name}".`)
    }
  }

  return {
    authMode,
    isLoading,
    isBootstrapping,
    errorMessage,
    settings,
    groups,
    selectedGroup,
    selectedGroupId,
    currentLights,
    currentScenes,
    activeSceneByGroup,
    bootstrap,
    refreshResources,
    loginWithHue,
    startDemoMode,
    logout,
    selectGroup,
    setShowUnreachable,
    setShowColorTempOnColorLights,
    toggleGroup,
    setGroupBrightness,
    turnAllOff,
    toggleLight,
    setLightBrightness,
    setLightTemperature,
    setLightColorHex,
    activateScene,
  }
}

