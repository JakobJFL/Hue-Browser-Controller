<script setup lang="ts">
import { computed } from 'vue'
import { Home, Layers, Power } from '@lucide/vue'
import type { HueGroup } from '../types/hue'

const props = withDefaults(
  defineProps<{
    groups: HueGroup[]
    selectedGroupId?: string | null
  }>(),
  {
    selectedGroupId: null,
  }
)

const emit = defineEmits<{
  select: [groupId: string]
  toggle: [group: HueGroup]
  brightness: [group: HueGroup, value: number]
}>()

const rooms = computed(() => props.groups.filter((g) => g.type === 'room'))
const zones = computed(() => props.groups.filter((g) => g.type === 'zone'))

function onGroupBrightnessInput(group: HueGroup, event: Event): void {
  const target = event.target as HTMLInputElement
  emit('brightness', group, Number(target.value))
}
</script>

<template>
  <aside class="space-y-6">
    <div v-if="rooms.length">
      <div class="flex items-center gap-1.5 px-1 mb-2.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
        <Home class="h-3.5 w-3.5" />
        <span>Rooms</span>
      </div>

      <div class="space-y-2">
        <div
          v-for="room in rooms"
          :key="room.id"
          class="rounded-xl border p-3 transition cursor-pointer"
          :class="
            selectedGroupId === room.id
              ? 'border-zinc-600 bg-zinc-900 shadow-sm'
              : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700/80 hover:bg-zinc-900/70'
          "
          @click="emit('select', room.id)"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-zinc-100">{{ room.name }}</p>
              <p class="text-xs text-zinc-500">
                {{ room.isOn ? `${room.onCount}/${room.totalCount} on · ${room.brightness}%` : 'Off' }}
              </p>
            </div>

            <button
              type="button"
              :aria-label="`Toggle ${room.name}`"
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition cursor-pointer"
              :class="
                room.isOn
                  ? 'border-amber-400/40 bg-amber-400/15 text-amber-300 hover:bg-amber-400/25'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
              "
              @click.stop="emit('toggle', room)"
            >
              <Power class="h-4 w-4" />
            </button>
          </div>

          <div v-if="room.isOn" class="mt-3" @click.stop>
            <input
              type="range"
              min="1"
              max="100"
              :value="room.brightness"
              class="w-full"
              :style="{
                background: `linear-gradient(to right, #fbbf24 ${room.brightness}%, #27272a ${room.brightness}%)`,
                borderRadius: '9999px',
                height: '6px',
              }"
              @input="onGroupBrightnessInput(room, $event)"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="zones.length">
      <div class="flex items-center gap-1.5 px-1 mb-2.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
        <Layers class="h-3.5 w-3.5" />
        <span>Zones</span>
      </div>

      <div class="space-y-2">
        <div
          v-for="zone in zones"
          :key="zone.id"
          class="rounded-xl border p-3 transition cursor-pointer"
          :class="
            selectedGroupId === zone.id
              ? 'border-zinc-600 bg-zinc-900 shadow-sm'
              : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700/80 hover:bg-zinc-900/70'
          "
          @click="emit('select', zone.id)"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-zinc-100">{{ zone.name }}</p>
              <p class="text-xs text-zinc-500">
                {{ zone.isOn ? `${zone.onCount}/${zone.totalCount} on · ${zone.brightness}%` : 'Off' }}
              </p>
            </div>

            <button
              type="button"
              :aria-label="`Toggle ${zone.name}`"
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition cursor-pointer"
              :class="
                zone.isOn
                  ? 'border-amber-400/40 bg-amber-400/15 text-amber-300 hover:bg-amber-400/25'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
              "
              @click.stop="emit('toggle', zone)"
            >
              <Power class="h-4 w-4" />
            </button>
          </div>

          <div v-if="zone.isOn" class="mt-3" @click.stop>
            <input
              type="range"
              min="1"
              max="100"
              :value="zone.brightness"
              class="w-full"
              :style="{
                background: `linear-gradient(to right, #fbbf24 ${zone.brightness}%, #27272a ${zone.brightness}%)`,
                borderRadius: '9999px',
                height: '6px',
              }"
              @input="onGroupBrightnessInput(zone, $event)"
            />
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>
