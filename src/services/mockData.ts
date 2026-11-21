import type { ClipRawResource, DemoPreset, GroupType, XyPoint } from '../types/hue'

const mkLight = (
  id: string,
  devId: string,
  name: string,
  on: boolean,
  bri: number | null,
  ct: number | null,
  xy: XyPoint | null
): ClipRawResource => ({
  id,
  type: 'light',
  owner: { rid: devId, rtype: 'device' },
  metadata: { name, archetype: 'classic_bulb' },
  on: { on },
  ...(bri != null ? { dimming: { brightness: bri } } : {}),
  ...(ct != null
    ? {
        color_temperature: {
          mirek: ct,
          mirek_valid: xy == null,
          mirek_schema: { mirek_minimum: 153, mirek_maximum: 500 },
        },
      }
    : {}),
  ...(xy ? { color: { xy } } : {}),
})

const mkScene = (
  id: string,
  name: string,
  groupId: string,
  groupType: GroupType,
  preset: DemoPreset
): ClipRawResource => ({
  id,
  type: 'scene',
  metadata: { name },
  group: { rid: groupId, rtype: groupType },
  _demoPreset: preset,
})

export function createDemoResources(): ClipRawResource[] {
  return [
    { id: 'bh-1', type: 'bridge_home', services: [{ rid: 'gl-home', rtype: 'grouped_light' }] },
    { id: 'gl-home', type: 'grouped_light', owner: { rid: 'bh-1', rtype: 'bridge_home' }, on: { on: true }, dimming: { brightness: 78 } },

    // --- ROOMS ---
    {
      id: 'room-living',
      type: 'room',
      metadata: { name: 'Living Room', archetype: 'living_room' },
      children: [
        { rid: 'dev-sofa', rtype: 'device' },
        { rid: 'dev-tv', rtype: 'device' },
        { rid: 'dev-ceiling', rtype: 'device' },
        { rid: 'dev-bookshelf', rtype: 'device' },
        { rid: 'dev-reading', rtype: 'device' },
        { rid: 'dev-corner', rtype: 'device' },    // NEW
        { rid: 'dev-art', rtype: 'device' },       // NEW
      ],
      services: [{ rid: 'gl-living', rtype: 'grouped_light' }],
    },
    { id: 'gl-living', type: 'grouped_light', owner: { rid: 'room-living', rtype: 'room' }, on: { on: true }, dimming: { brightness: 80 } },

    {
      id: 'room-office',
      type: 'room',
      metadata: { name: 'Studio Desk', archetype: 'office' },
      children: [
        { rid: 'dev-strip', rtype: 'device' },
        { rid: 'dev-key', rtype: 'device' },
        { rid: 'dev-shelf', rtype: 'device' },
        { rid: 'dev-overhead', rtype: 'device' },
      ],
      services: [{ rid: 'gl-office', rtype: 'grouped_light' }],
    },
    { id: 'gl-office', type: 'grouped_light', owner: { rid: 'room-office', rtype: 'room' }, on: { on: true }, dimming: { brightness: 72 } },

    {
      id: 'room-bedroom',
      type: 'room',
      metadata: { name: 'Bedroom', archetype: 'bedroom' },
      children: [
        { rid: 'dev-bed', rtype: 'device' },
        { rid: 'dev-bed-2', rtype: 'device' },
        { rid: 'dev-dresser', rtype: 'device' },
        { rid: 'dev-closet', rtype: 'device' },
      ],
      services: [{ rid: 'gl-bedroom', rtype: 'grouped_light' }],
    },
    { id: 'gl-bedroom', type: 'grouped_light', owner: { rid: 'room-bedroom', rtype: 'room' }, on: { on: false }, dimming: { brightness: 35 } },

    {
      id: 'room-kitchen',
      type: 'room',
      metadata: { name: 'Kitchen', archetype: 'kitchen' },
      children: [
        { rid: 'dev-island', rtype: 'device' },
        { rid: 'dev-cabinet', rtype: 'device' },
      ],
      services: [{ rid: 'gl-kitchen', rtype: 'grouped_light' }],
    },
    { id: 'gl-kitchen', type: 'grouped_light', owner: { rid: 'room-kitchen', rtype: 'room' }, on: { on: true }, dimming: { brightness: 85 } },

    // --- ZONES ---
    {
      id: 'zone-chill',
      type: 'zone',
      metadata: { name: 'Downstairs Chill', archetype: 'home' },
      children: [
        { rid: 'light-sofa', rtype: 'light' },
        { rid: 'light-tv', rtype: 'light' },
        { rid: 'light-strip', rtype: 'light' },
        { rid: 'light-bookshelf', rtype: 'light' },
        { rid: 'light-cabinet', rtype: 'light' },
        { rid: 'light-corner', rtype: 'light' },   // NEW
      ],
      services: [{ rid: 'gl-chill', rtype: 'grouped_light' }],
    },
    { id: 'gl-chill', type: 'grouped_light', owner: { rid: 'zone-chill', rtype: 'zone' }, on: { on: true }, dimming: { brightness: 75 } },

    // --- ZIGBEE CONNECTIVITY ---
    { id: 'zb-1', type: 'zigbee_connectivity', owner: { rid: 'dev-sofa', rtype: 'device' }, status: 'connected' },
    { id: 'zb-2', type: 'zigbee_connectivity', owner: { rid: 'dev-tv', rtype: 'device' }, status: 'connected' },
    { id: 'zb-3', type: 'zigbee_connectivity', owner: { rid: 'dev-ceiling', rtype: 'device' }, status: 'connected' },
    { id: 'zb-4', type: 'zigbee_connectivity', owner: { rid: 'dev-strip', rtype: 'device' }, status: 'connected' },
    { id: 'zb-5', type: 'zigbee_connectivity', owner: { rid: 'dev-key', rtype: 'device' }, status: 'connected' },
    { id: 'zb-6', type: 'zigbee_connectivity', owner: { rid: 'dev-bed', rtype: 'device' }, status: 'connected' },
    { id: 'zb-7', type: 'zigbee_connectivity', owner: { rid: 'dev-closet', rtype: 'device' }, status: 'disconnected' },
    { id: 'zb-8', type: 'zigbee_connectivity', owner: { rid: 'dev-bookshelf', rtype: 'device' }, status: 'connected' },
    { id: 'zb-9', type: 'zigbee_connectivity', owner: { rid: 'dev-reading', rtype: 'device' }, status: 'connected' },
    { id: 'zb-10', type: 'zigbee_connectivity', owner: { rid: 'dev-shelf', rtype: 'device' }, status: 'connected' },
    { id: 'zb-11', type: 'zigbee_connectivity', owner: { rid: 'dev-overhead', rtype: 'device' }, status: 'disconnected' },
    { id: 'zb-12', type: 'zigbee_connectivity', owner: { rid: 'dev-bed-2', rtype: 'device' }, status: 'connected' },
    { id: 'zb-13', type: 'zigbee_connectivity', owner: { rid: 'dev-dresser', rtype: 'device' }, status: 'connected' },
    { id: 'zb-14', type: 'zigbee_connectivity', owner: { rid: 'dev-island', rtype: 'device' }, status: 'connected' },
    { id: 'zb-15', type: 'zigbee_connectivity', owner: { rid: 'dev-cabinet', rtype: 'device' }, status: 'connected' },
    { id: 'zb-16', type: 'zigbee_connectivity', owner: { rid: 'dev-corner', rtype: 'device' }, status: 'connected' }, // NEW
    { id: 'zb-17', type: 'zigbee_connectivity', owner: { rid: 'dev-art', rtype: 'device' }, status: 'connected' },    // NEW

    // --- LIGHTS ---
    // Living Room
    mkLight('light-sofa', 'dev-sofa', 'Floor Lamp', true, 85, 370, { x: 0.457, y: 0.41 }),
    mkLight('light-tv', 'dev-tv', 'TV Play Bar', true, 78, 290, { x: 0.215, y: 0.145 }),
    mkLight('light-ceiling', 'dev-ceiling', 'Ceiling Pendant', true, 65, 345, null),
    mkLight('light-bookshelf', 'dev-bookshelf', 'Bookshelf Spot', true, 90, 310, { x: 0.38, y: 0.16 }),
    mkLight('light-reading', 'dev-reading', 'Reading Lamp', false, 60, 390, null),
    mkLight('light-corner', 'dev-corner', 'Corner Uplight', true, 70, 400, { x: 0.52, y: 0.38 }),       // NEW (Warm Coral)
    mkLight('light-art', 'dev-art', 'Art Spotlight', true, 50, 265, null),                              // NEW (Crisp Gallery White)

    // Studio Desk
    mkLight('light-strip', 'dev-strip', 'Desk Lightstrip', true, 90, 250, { x: 0.175, y: 0.34 }),
    mkLight('light-key', 'dev-key', 'Monitor Glow', true, 55, 230, null),
    mkLight('light-shelf', 'dev-shelf', 'Shelf Accent', true, 80, 275, { x: 0.15, y: 0.22 }),
    mkLight('light-overhead', 'dev-overhead', 'Overhead Downlight', false, 100, null, null),

    // Bedroom
    mkLight('light-bed', 'dev-bed', 'Bedside Right', false, 35, 420, { x: 0.505, y: 0.415 }),
    mkLight('light-bed-2', 'dev-bed-2', 'Bedside Left', false, 35, 420, { x: 0.505, y: 0.415 }),
    mkLight('light-dresser', 'dev-dresser', 'Dresser Glow', true, 25, 450, { x: 0.54, y: 0.39 }),
    mkLight('light-closet', 'dev-closet', 'Wardrobe Spot', false, 100, null, null),

    // Kitchen
    mkLight('light-island', 'dev-island', 'Island Pendant', true, 95, 300, null),
    mkLight('light-cabinet', 'dev-cabinet', 'Under Cabinet', true, 75, 350, { x: 0.42, y: 0.39 }),

    // --- SCENES ---
    mkScene('sc-1', 'Relax', 'room-living', 'room', { brightness: 55, mirek: 440 }),
    mkScene('sc-2', 'Bright', 'room-living', 'room', { brightness: 100, mirek: 280 }),
    mkScene('sc-3', 'Tokyo Neon', 'room-living', 'room', { brightness: 82, xy: { x: 0.28, y: 0.14 } }),
    mkScene('sc-4', 'Savanna Sunset', 'room-living', 'room', { brightness: 72, xy: { x: 0.56, y: 0.38 } }),
    mkScene('sc-5', 'Concentrate', 'room-office', 'room', { brightness: 100, mirek: 215 }),
    mkScene('sc-6', 'Arctic Aurora', 'room-office', 'room', { brightness: 80, xy: { x: 0.16, y: 0.32 } }),
    mkScene('sc-7', 'Nightlight', 'room-bedroom', 'room', { brightness: 12, mirek: 480 }),
    mkScene('sc-8', 'Read', 'room-bedroom', 'room', { brightness: 75, mirek: 340 }),
    mkScene('sc-9', 'Evening Lounge', 'zone-chill', 'zone', { brightness: 60, xy: { x: 0.49, y: 0.41 } }),
    mkScene('sc-10', 'Cooking', 'room-kitchen', 'room', { brightness: 100, mirek: 250 }),
    mkScene('sc-11', 'Late Snack', 'room-kitchen', 'room', { brightness: 30, mirek: 430 }),
  ]
}