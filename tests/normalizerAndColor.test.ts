import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createDemoResources } from '../src/services/mockData.ts'
import type { ClipRawResource } from '../src/types/hue.ts'
import { normalizeClipResources } from '../src/utils/clipNormalizer.ts'
import {
  getLightColorHex,
  getLightSurfacePalette,
  hexToHsv,
  hexToXy,
  hsvToHex,
  mirekToHex,
  xyToHex,
} from '../src/utils/color.ts'

describe('CLIP v2 resource normalizer & color utilities', () => {
  it('detects ct activeMode when color_temperature.mirek_valid is true on color bulbs', () => {
    const raw: ClipRawResource[] = [
      {
        id: 'l-ct-active',
        type: 'light',
        metadata: { name: 'Color Bulb in White Mode' },
        on: { on: true },
        dimming: { brightness: 80 },
        color_temperature: {
          mirek: 366,
          mirek_valid: true,
          mirek_schema: { mirek_minimum: 153, mirek_maximum: 500 },
        },
        color: {
          xy: { x: 0.457, y: 0.41 },
        },
      },
      {
        id: 'l-color-active',
        type: 'light',
        metadata: { name: 'Color Bulb in XY Mode' },
        on: { on: true },
        dimming: { brightness: 80 },
        color_temperature: {
          mirek: null,
          mirek_valid: false,
          mirek_schema: { mirek_minimum: 153, mirek_maximum: 500 },
        },
        color: {
          xy: { x: 0.17, y: 0.7 },
        },
      },
    ]

    const parsed = normalizeClipResources(raw)
    assert.equal(parsed.lights['l-ct-active'].activeMode, 'ct')
    assert.equal(parsed.lights['l-ct-active'].supportsColor, true)
    assert.equal(parsed.lights['l-ct-active'].mirek, 366)

    assert.equal(parsed.lights['l-color-active'].activeMode, 'color')
    assert.equal(parsed.lights['l-color-active'].mirek, 320)
  })

  it('surfaces unassigned bulbs in an Unassigned group even when rooms already exist', () => {
    const raw: ClipRawResource[] = [
      {
        id: 'room-1',
        type: 'room',
        metadata: { name: 'Office' },
        children: [{ rid: 'dev-1', rtype: 'device' }],
        services: [{ rid: 'gl-1', rtype: 'grouped_light' }],
      },
      { id: 'gl-1', type: 'grouped_light', owner: { rid: 'room-1', rtype: 'room' } },
      { id: 'light-1', type: 'light', owner: { rid: 'dev-1', rtype: 'device' }, metadata: { name: 'Desk' } },
      { id: 'light-orphan', type: 'light', owner: { rid: 'dev-2', rtype: 'device' }, metadata: { name: 'Hallway Bulb' } },
    ]

    const parsed = normalizeClipResources(raw)
    assert.equal(parsed.groups.length, 2)
    const unassignedGroup = parsed.groups.find((g) => g.id === 'unassigned-lights')
    assert.ok(unassignedGroup)
    assert.deepEqual(unassignedGroup.lightIds, ['light-orphan'])
  })

  it('normalizes demo resources without creating spurious Unassigned groups', () => {
    const parsed = normalizeClipResources(createDemoResources())
    assert.equal(Object.keys(parsed.lights).length, 17)
    assert.equal(parsed.groups.some((g) => g.id === 'unassigned-lights'), false)
    assert.equal(parsed.lights['light-closet'].reachable, false)
  })

  it('converts colors reliably and clamps XY points within gamut', () => {
    const hex = hsvToHex(180, 75, 100)
    const hsv = hexToHsv(hex)
    assert.ok(Math.abs(hsv.h - 180) <= 2)
    assert.ok(Math.abs(hsv.s - 75) <= 2)

    const xy = hexToXy('#00ff00')
    assert.ok(xy.x >= 0 && xy.x <= 1)
    assert.ok(xy.y > 0 && xy.y <= 1)
    assert.match(xyToHex(xy, 100), /^#[0-9a-f]{6}$/)
    assert.match(mirekToHex(370), /^#[0-9a-f]{6}$/)

    const brightSurface = getLightSurfacePalette({
      isOn: true,
      reachable: true,
      brightness: 100,
      supportsDimming: true,
      activeMode: 'ct',
      mirek: 250,
      xy: null,
    })
    assert.equal(brightSurface.useDarkText, true)
    assert.match(
      getLightColorHex({ activeMode: 'ct', mirek: 250, xy: { x: 0.2, y: 0.2 } }),
      /^#[0-9a-f]{6}$/
    )
  })
})
