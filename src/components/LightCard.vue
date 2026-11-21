<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDown, Sun, Thermometer, WifiOff } from '@lucide/vue'
import type { HueLight } from '../types/hue'
import { getLightColorHex, getLightSurfacePalette } from '../utils/color'
import ColorWheel from './ColorWheel.vue'

const props = withDefaults(
  defineProps<{
    light: HueLight
    expanded?: boolean
    showColorTempOnColorLights?: boolean
  }>(),
  {
    expanded: false,
    showColorTempOnColorLights: false,
  }
)

const emit = defineEmits<{
  toggle: [lightId: string]
  'toggle-expand': [lightId: string]
  brightness: [lightId: string, value: number]
  temperature: [lightId: string, value: number]
  color: [lightId: string, hex: string]
}>()

const colorHex = computed(() => getLightColorHex(props.light))
const surface = computed(() => getLightSurfacePalette(props.light))
const canAdjust = computed(
  () =>
    props.light.reachable &&
    (props.light.supportsDimming || props.light.supportsCt || props.light.supportsColor)
)
const isExpanded = computed(() => props.expanded && canAdjust.value)

function onToggleClick(): void {
  if (!props.light.reachable) return
  emit('toggle', props.light.id)
}

function onBrightnessInput(event: Event): void {
  emit('brightness', props.light.id, Number((event.target as HTMLInputElement).value))
}

function onTemperatureInput(event: Event): void {
  emit('temperature', props.light.id, Number((event.target as HTMLInputElement).value))
}

function onWheelColorUpdate(hex: string): void {
  emit('color', props.light.id, hex)
}
</script>

<template>
  <div
    class="overflow-hidden rounded-2xl border transition-all duration-200"
    :class="
      !light.reachable
        ? 'border-white/6 opacity-60'
        : light.isOn
          ? 'border-white/25'
          : 'border-white/10 hover:border-white/20'
    "
    :style="{
      background: surface.background,
      boxShadow: surface.boxShadow,
    }"
  >
    <!-- Top Half: Full-Width Button to Toggle Light On/Off (disabled when offline) -->
    <button
      type="button"
      :disabled="!light.reachable"
      :aria-label="
        light.reachable
          ? `Toggle ${light.name} ${light.isOn ? 'off' : 'on'}`
          : `${light.name} is offline`
      "
      :aria-pressed="light.reachable ? light.isOn : false"
      class="flex w-full flex-col items-center justify-center px-5 text-center transition-colors"
      :class="[
        canAdjust ? 'pt-5 pb-2.5' : 'min-h-[94px] py-6',
        !light.reachable
          ? 'cursor-not-allowed text-slate-400'
          : surface.useDarkText
            ? 'cursor-pointer text-[#070b29] hover:bg-black/6 active:bg-black/10'
            : light.isOn
              ? 'cursor-pointer text-white hover:bg-white/8 active:bg-white/12'
              : 'cursor-pointer text-slate-200 hover:bg-white/5 hover:text-white active:bg-white/8',
      ]"
      @click="onToggleClick"
    >
      <span class="flex max-w-full items-center justify-center gap-2">
        <span class="truncate text-base font-medium tracking-tight">
          {{ light.name }}
        </span>
        <span
          v-if="!light.reachable"
          class="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/12 bg-white/6 px-2 py-0.5 text-[10px] font-medium text-slate-300"
        >
          <WifiOff class="h-2.5 w-2.5 text-secondary-400" />
          Offline
        </span>
      </span>
    </button>

    <!-- Bottom Half: Full-Width Button to Open/Close Settings Dropdown (hidden when offline) -->
    <button
      v-if="canAdjust"
      type="button"
      :aria-label="`${isExpanded ? 'Hide' : 'Show'} settings for ${light.name}`"
      :aria-expanded="isExpanded"
      class="flex w-full items-center justify-center pt-2 pb-3.5 transition-colors cursor-pointer"
      :class="
        surface.useDarkText
          ? 'text-[#070b29]/75 hover:bg-black/8 hover:text-[#070b29]'
          : light.isOn
            ? 'text-white/80 hover:bg-white/10 hover:text-white'
            : 'text-slate-400 hover:bg-white/6 hover:text-slate-200'
      "
      @click="emit('toggle-expand', light.id)"
    >
      <ChevronDown
        class="h-4.5 w-4.5 transition-transform duration-250 ease-out"
        :class="{ 'rotate-180': isExpanded }"
      />
    </button>

    <!-- Smooth Animated Expandable Settings Dropdown -->
    <div
      v-if="canAdjust"
      :inert="!isExpanded"
      class="grid transition-[grid-template-rows,opacity] duration-250 ease-out"
      :class="
        isExpanded
          ? 'grid-rows-[1fr] opacity-100'
          : 'pointer-events-none grid-rows-[0fr] opacity-0'
      "
    >
      <div class="overflow-hidden">
        <div
          class="space-y-4 border-t border-white/12 bg-[#050929]/95 p-4 text-slate-100 backdrop-blur-md"
        >
          <div v-if="light.supportsDimming" class="space-y-2">
            <div class="flex items-center justify-between text-xs text-slate-300/85">
              <span class="inline-flex items-center gap-1.5">
                <Sun class="h-3.5 w-3.5 text-primary-400" />
                Brightness
              </span>
              <span class="tabular-nums text-white">{{ light.brightness }}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              :aria-label="`${light.name} brightness`"
              :value="light.brightness"
              class="hue-pill-slider w-full"
              style="background: linear-gradient(to right, #0d1438 0%, #5b6c8f 48%, #f1f5f9 100%);"
              @input="onBrightnessInput"
            />
          </div>

          <!-- Color Temperature Pill Slider (always on white-ambiance bulbs, optional on color bulbs) -->
          <div
            v-if="light.supportsCt && (!light.supportsColor || showColorTempOnColorLights)"
            class="space-y-2"
          >
            <div class="flex items-center justify-between text-xs text-slate-300/85">
              <span class="inline-flex items-center gap-1.5">
                <Thermometer class="h-3.5 w-3.5 text-cyan-300" />
                Temperature
              </span>
              <span class="tabular-nums text-slate-300">{{ Math.round(1000000 / light.mirek) }}K</span>
            </div>
            <input
              type="range"
              :min="light.mirekMin"
              :max="light.mirekMax"
              :aria-label="`${light.name} color temperature`"
              :value="light.mirek"
              class="hue-pill-slider w-full"
              style="background: linear-gradient(to right, #5b92cc 0%, #c8d3df 42%, #e6c245 100%);"
              @input="onTemperatureInput"
            />
          </div>

          <!-- Colored Bulbs: 2D Hue + Saturation Color Wheel -->
          <ColorWheel
            v-if="light.supportsColor"
            :model-value="colorHex"
            :label="`${light.name} hue and saturation`"
            @update:model-value="onWheelColorUpdate"
          />
        </div>
      </div>
    </div>
  </div>
</template>
