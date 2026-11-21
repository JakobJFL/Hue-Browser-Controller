import type {
  ClipRawResource,
  GroupType,
  HueGroupBase,
  HueLight,
  HueScene,
  NormalizedClipData,
} from '../types/hue'

/**
 * Parses flat Philips Hue CLIP v2 GET /clip/v2/resource array into
 * normalized lights, rooms/zones, scenes, and home grouped_light ID.
 */
export function normalizeClipResources(rawItems: ClipRawResource[] = []): NormalizedClipData {
  const connectivityByDevice = new Map<string, boolean>()
  const groupedLightsById = new Map<string, ClipRawResource>()
  const rawLights: ClipRawResource[] = []
  const rawGroups: ClipRawResource[] = []
  const rawScenes: ClipRawResource[] = []
  let homeGroupedLightId: string | null = null

  for (const item of rawItems) {
    if (!item?.type) continue
    if (item.type === 'zigbee_connectivity' && item.owner?.rid) {
      connectivityByDevice.set(item.owner.rid, item.status === 'connected')
    } else if (item.type === 'grouped_light') {
      groupedLightsById.set(item.id, item)
      if (item.owner?.rtype === 'bridge_home') {
        homeGroupedLightId = item.id
      }
    } else if (item.type === 'light') {
      rawLights.push(item)
    } else if (item.type === 'room' || item.type === 'zone') {
      rawGroups.push(item)
    } else if (item.type === 'scene') {
      rawScenes.push(item)
    }
  }

  const lights: Record<string, HueLight> = {}
  for (const l of rawLights) {
    const deviceId = l.owner?.rid || null
    const reachable =
      deviceId && connectivityByDevice.has(deviceId)
        ? Boolean(connectivityByDevice.get(deviceId))
        : true

    const supportsColor = Boolean(l.color)
    const supportsCt = Boolean(l.color_temperature)
    const supportsDimming = Boolean(l.dimming)

    const mirekMin = l.color_temperature?.mirek_schema?.mirek_minimum || 153
    const mirekMax = Math.max(mirekMin, l.color_temperature?.mirek_schema?.mirek_maximum || 500)
    const rawMirek = typeof l.color_temperature?.mirek === 'number' ? l.color_temperature.mirek : 320
    const mirek = Math.min(mirekMax, Math.max(mirekMin, Math.round(rawMirek)))

    const isCtValid =
      l.color_temperature?.mirek_valid === true && typeof l.color_temperature.mirek === 'number'

    const activeMode = isCtValid
      ? 'ct'
      : supportsColor && l.color?.xy
        ? 'color'
        : supportsCt
          ? 'ct'
          : 'dimming'

    lights[l.id] = {
      id: l.id,
      deviceId,
      name: l.metadata?.name || 'Hue Light',
      archetype: l.metadata?.archetype || 'classic_bulb',
      isOn: Boolean(l.on?.on),
      brightness: supportsDimming
        ? Math.min(100, Math.max(1, Math.round(l.dimming?.brightness ?? 100)))
        : 100,
      supportsDimming,
      supportsColor,
      supportsCt,
      xy: l.color?.xy ? { ...l.color.xy } : null,
      gamut: l.color?.gamut || null,
      mirek,
      mirekMin,
      mirekMax,
      activeMode,
      reachable,
    }
  }

  const allLightList = Object.values(lights)
  const assignedLightIds = new Set<string>()

  const groups: HueGroupBase[] = rawGroups
    .map((g) => {
      const glRef = (g.services || []).find((s) => s.rtype === 'grouped_light')
      const gl = glRef ? groupedLightsById.get(glRef.rid) : undefined

      const childDevices = new Set(
        (g.children || []).filter((c) => c.rtype === 'device').map((c) => c.rid)
      )
      const childLights = new Set(
        (g.children || []).filter((c) => c.rtype === 'light').map((c) => c.rid)
      )

      const memberLightIds = allLightList
        .filter((l) => childLights.has(l.id) || (l.deviceId && childDevices.has(l.deviceId)))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((l) => l.id)

      for (const id of memberLightIds) assignedLightIds.add(id)

      const groupType: GroupType = g.type === 'zone' ? 'zone' : 'room'

      return {
        id: g.id,
        type: groupType,
        name: g.metadata?.name || 'Unnamed Group',
        archetype: g.metadata?.archetype || 'home',
        groupedLightId: glRef?.rid || null,
        fallbackBrightness: Math.min(100, Math.max(1, Math.round(gl?.dimming?.brightness ?? 80))),
        lightIds: memberLightIds,
      }
    })
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'room' ? -1 : 1
      return a.name.localeCompare(b.name)
    })

  const unassigned = allLightList
    .filter((l) => !assignedLightIds.has(l.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  if (unassigned.length > 0) {
    if (groups.length === 0) {
      groups.push({
        id: 'all-lights',
        type: 'room',
        name: 'All Lights',
        archetype: 'home',
        groupedLightId: homeGroupedLightId,
        fallbackBrightness: 80,
        lightIds: unassigned.map((l) => l.id),
      })
    } else {
      groups.push({
        id: 'unassigned-lights',
        type: 'room',
        name: 'Unassigned',
        archetype: 'home',
        groupedLightId: null,
        fallbackBrightness: 80,
        lightIds: unassigned.map((l) => l.id),
      })
    }
  }

  const scenes: HueScene[] = rawScenes
    .filter((s): s is ClipRawResource & { group: { rid: string; rtype: string } } =>
      Boolean(s.group?.rid)
    )
    .map((s) => {
      const activeStatus =
        typeof s.status === 'object' && s.status !== null ? s.status.active : undefined
      return {
        id: s.id,
        name: s.metadata?.name || 'Scene',
        groupId: s.group.rid,
        active: Boolean(activeStatus && activeStatus !== 'inactive'),
        demoPreset: s._demoPreset || null,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return { lights, groups, scenes, homeGroupedLightId }
}
