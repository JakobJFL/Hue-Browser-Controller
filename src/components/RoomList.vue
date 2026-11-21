<script setup lang="ts">
import { computed, type Component } from 'vue'
import { Home, Layers, Power, PowerOff } from '@lucide/vue'
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
  'turn-all-off': []
}>()

interface GroupSection {
  key: 'room' | 'zone'
  label: string
  icon: Component
  items: HueGroup[]
  showAllOff: boolean
}

const sections = computed<GroupSection[]>(() => {
  const rooms = props.groups.filter((g) => g.type === 'room')
  const zones = props.groups.filter((g) => g.type === 'zone')
  return [
    { key: 'room' as const, label: 'Rooms', icon: Home, items: rooms, showAllOff: true },
    {
      key: 'zone' as const,
      label: 'Zones',
      icon: Layers,
      items: zones,
      showAllOff: rooms.length === 0,
    },
  ].filter((section) => section.items.length > 0)
})

function onGroupBrightnessInput(group: HueGroup, event: Event): void {
  const target = event.target as HTMLInputElement
  emit('brightness', group, Number(target.value))
}
</script>

<template>
  <aside class="space-y-7">
    <div v-for="section in sections" :key="section.key">
      <div class="mb-3 flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-300/85">
          <component :is="section.icon" class="h-3.5 w-3.5 text-primary-400" />
          <span>{{ section.label }}</span>
        </div>

        <button
          v-if="section.showAllOff"
          type="button"
          title="Turn all lights off"
          class="inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/4 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-secondary-400/40 hover:bg-secondary-500/12 hover:text-white cursor-pointer"
          @click="emit('turn-all-off')"
        >
          <PowerOff class="h-3.5 w-3.5 text-secondary-400" />
          <span>All Off</span>
        </button>
      </div>

      <div class="space-y-2.5">
        <div
          v-for="group in section.items"
          :key="group.id"
          class="rounded-2xl border p-3.5 transition cursor-pointer"
          :class="
            selectedGroupId === group.id
              ? 'border-primary-600/30 bg-primary-700/10 shadow-sm'
              : 'border-white/10 bg-[#060a2e]/55 hover:border-white/10 hover:bg-[#080d3a]/80'
          "
          @click="emit('select', group.id)"
        >
          <div class="flex items-center justify-between gap-2">
            <button
              type="button"
              :aria-current="selectedGroupId === group.id ? 'true' : undefined"
              class="min-w-0 flex-1 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 cursor-pointer"
              @click.stop="emit('select', group.id)"
            >
              <span class="block truncate text-sm font-medium text-white">{{ group.name }}</span>
              <span class="mt-0.5 block text-xs text-slate-400">
                {{ group.isOn ? `${group.onCount}/${group.totalCount} on · ${group.brightness}%` : 'Off' }}
              </span>
            </button>

            <button
              type="button"
              :aria-label="`Toggle ${group.name}`"
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition cursor-pointer"
              :class="
                group.isOn
                  ? 'border-primary-400/40 bg-primary-400/15 text-primary-300 hover:bg-primary-400/25'
                  : 'border-white/10 bg-[#03051a]/70 text-slate-400 hover:border-primary-400/35 hover:text-white'
              "
              @click.stop="emit('toggle', group)"
            >
              <Power class="h-4 w-4" />
            </button>
          </div>

          <div v-if="group.isOn" class="mt-3.5" @click.stop>
            <input
              type="range"
              min="1"
              max="100"
              :aria-label="`${group.name} brightness`"
              :value="group.brightness"
              class="hue-pill-slider-sm w-full"
              style="background: linear-gradient(to right, #0a1435 0%, #008363 48%, #25e2a5 100%);"
              @input="onGroupBrightnessInput(group, $event)"
            />
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>
