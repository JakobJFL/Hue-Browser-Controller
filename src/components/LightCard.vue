<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown, ChevronUp, Palette, Power, Sun, Thermometer, WifiOff } from '@lucide/vue'
import type { HueLight } from '../types/hue'
import { getLightDisplayHex } from '../utils/color'

const props = defineProps<{
  light: HueLight
}>()

const emit = defineEmits<{
  toggle: [lightId: string]
  brightness: [lightId: string, value: number]
  temperature: [lightId: string, value: number]
  color: [lightId: string, hex: string]
}>()

const expanded = ref(false)

const displayHex = computed(() => getLightDisplayHex(props.light))
const hasControls = computed(
  () => props.light.supportsDimming || props.light.supportsCt || props.light.supportsColor
)

const swatches = ['#ffb454', '#fff1d6', '#ff6b4a', '#f43f8e', '#8b5cf6', '#38bdf8', '#34d399']

function onBrightnessInput(event: Event): void {
  emit('brightness', props.light.id, Number((event.target as HTMLInputElement).value))
}

function onTemperatureInput(event: Event): void {
  emit('temperature', props.light.id, Number((event.target as HTMLInputElement).value))
}

function onColorInput(event: Event): void {
  emit('color', props.light.id, (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3.5 transition hover:border-zinc-700/80">
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <span
          class="h-3.5 w-3.5 shrink-0 rounded-full border border-white/15 transition"
          :style="{
            backgroundColor: displayHex,
            boxShadow: light.isOn ? `0 0 10px ${displayHex}88` : 'none',
          }"
        />
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <p class="truncate text-sm font-medium text-zinc-100">{{ light.name }}</p>
            <span
              v-if="!light.reachable"
              class="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400"
            >
              <WifiOff class="h-2.5 w-2.5" />
              Offline
            </span>
          </div>
          <p class="text-xs text-zinc-500">
            {{ light.isOn ? (light.supportsDimming ? `${light.brightness}% brightness` : 'On') : 'Off' }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-1.5 shrink-0">
        <button
          v-if="hasControls"
          type="button"
          :aria-label="`Adjust ${light.name}`"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/70 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200 cursor-pointer"
          @click="expanded = !expanded"
        >
          <ChevronUp v-if="expanded" class="h-4 w-4" />
          <ChevronDown v-else class="h-4 w-4" />
        </button>

        <button
          type="button"
          :aria-label="`Toggle ${light.name}`"
          class="flex h-8 w-8 items-center justify-center rounded-lg border transition cursor-pointer"
          :class="
            light.isOn
              ? 'border-zinc-200 bg-zinc-100 text-zinc-950 hover:bg-white'
              : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
          "
          @click="emit('toggle', light.id)"
        >
          <Power class="h-4 w-4" />
        </button>
      </div>
    </div>

    <div v-if="expanded && hasControls" class="mt-4 space-y-4 border-t border-zinc-800/80 pt-3.5">
      <div v-if="light.supportsDimming" class="space-y-1.5">
        <div class="flex items-center justify-between text-xs text-zinc-400">
          <span class="inline-flex items-center gap-1.5"><Sun class="h-3.5 w-3.5" /> Brightness</span>
          <span class="tabular-nums text-zinc-300">{{ light.brightness }}%</span>
        </div>
        <input
          type="range"
          min="1"
          max="100"
          :value="light.brightness"
          class="w-full"
          :style="{
            background: `linear-gradient(to right, #e4e4e7 ${light.brightness}%, #27272a ${light.brightness}%)`,
            borderRadius: '9999px',
            height: '6px',
          }"
          @input="onBrightnessInput"
        />
      </div>

      <div v-if="light.supportsCt" class="space-y-1.5">
        <div class="flex items-center justify-between text-xs text-zinc-400">
          <span class="inline-flex items-center gap-1.5"><Thermometer class="h-3.5 w-3.5" /> Temperature</span>
          <span class="tabular-nums text-zinc-500">{{ Math.round(1000000 / light.mirek) }}K</span>
        </div>
        <input
          type="range"
          :min="light.mirekMin"
          :max="light.mirekMax"
          :value="light.mirek"
          class="w-full"
          style="background: linear-gradient(to right, #cfe8ff 0%, #fff4dc 45%, #ffab5e 100%); border-radius: 9999px; height: 6px;"
          @input="onTemperatureInput"
        />
      </div>

      <div v-if="light.supportsColor" class="space-y-2">
        <span class="inline-flex items-center gap-1.5 text-xs text-zinc-400">
          <Palette class="h-3.5 w-3.5" /> Color
        </span>
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="hex in swatches"
            :key="hex"
            type="button"
            class="h-6 w-6 rounded-full border border-white/20 transition hover:scale-110 cursor-pointer"
            :style="{ backgroundColor: hex }"
            @click="emit('color', light.id, hex)"
          />
          <label class="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-300 hover:border-zinc-600 cursor-pointer">
            <span>Custom</span>
            <input
              type="color"
              :value="displayHex"
              class="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
              @input="onColorInput"
            />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
