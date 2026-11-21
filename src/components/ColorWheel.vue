<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Palette } from '@lucide/vue'
import { hexToHsv, hsvToHex } from '../utils/color'

const props = defineProps<{
  modelValue: string
  label?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [hex: string]
}>()

const wheelRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)

const initial = hexToHsv(props.modelValue)
const hue = ref(initial.h)
const saturation = ref(initial.s)

watch(
  () => props.modelValue,
  (nextHex) => {
    if (isDragging.value) return
    const parsed = hexToHsv(nextHex)
    hue.value = parsed.h
    saturation.value = parsed.s
  }
)

const activeHex = computed(() => hsvToHex(hue.value, saturation.value, 100))

// Concentric thumb positioning: keeps the 22px ring thumb inside the wheel rim
const THUMB_INSET_PCT = 7.5
const thumbStyle = computed(() => {
  const rad = (hue.value * Math.PI) / 180
  const maxTravelPct = 50 - THUMB_INSET_PCT
  const rPct = (saturation.value / 100) * maxTravelPct
  const left = 50 + rPct * Math.cos(rad)
  const top = 50 + rPct * Math.sin(rad)
  return {
    left: `${left}%`,
    top: `${top}%`,
    backgroundColor: activeHex.value,
  }
})

function updateFromPointer(clientX: number, clientY: number): void {
  const el = wheelRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const radius = rect.width / 2
  if (radius <= 0) return

  const insetPx = (THUMB_INSET_PCT / 100) * rect.width
  const usableRadius = Math.max(1, radius - insetPx)

  const dx = clientX - (rect.left + radius)
  const dy = clientY - (rect.top + radius)
  const dist = Math.hypot(dx, dy)

  const nextAngle = (Math.atan2(dy, dx) * 180) / Math.PI
  hue.value = (nextAngle + 360) % 360
  saturation.value = Math.min(100, (dist / usableRadius) * 100)

  emit('update:modelValue', hsvToHex(hue.value, saturation.value, 100))
}

function onPointerDown(event: PointerEvent): void {
  isDragging.value = true
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  updateFromPointer(event.clientX, event.clientY)
}

function onPointerMove(event: PointerEvent): void {
  if (!isDragging.value) return
  updateFromPointer(event.clientX, event.clientY)
}

function onPointerEnd(event: PointerEvent): void {
  if (!isDragging.value) return
  isDragging.value = false
  const el = event.currentTarget as HTMLElement
  if (el.hasPointerCapture(event.pointerId)) {
    el.releasePointerCapture(event.pointerId)
  }
}

function onKeyDown(event: KeyboardEvent): void {
  let handled = true
  if (event.key === 'ArrowRight') hue.value = (hue.value + 6) % 360
  else if (event.key === 'ArrowLeft') hue.value = (hue.value + 354) % 360
  else if (event.key === 'ArrowUp') saturation.value = Math.min(100, saturation.value + 5)
  else if (event.key === 'ArrowDown') saturation.value = Math.max(0, saturation.value - 5)
  else handled = false

  if (handled) {
    event.preventDefault()
    emit('update:modelValue', hsvToHex(hue.value, saturation.value, 100))
  }
}
</script>

<template>
  <div class="space-y-2.5">
    <div class="flex items-center justify-between text-xs text-slate-300/85">
      <span class="inline-flex items-center gap-1.5">
        <Palette class="h-3.5 w-3.5 text-secondary-400" />
        Color
      </span>
      <span class="tabular-nums text-slate-300">{{ Math.round(saturation) }}%</span>
    </div>

    <div class="flex justify-center py-1">
      <div
        ref="wheelRef"
        role="slider"
        tabindex="0"
        :aria-label="label || 'Hue and saturation color wheel'"
        :aria-valuemin="0"
        :aria-valuemax="100"
        :aria-valuenow="Math.round(saturation)"
        class="relative h-44 w-44 touch-none select-none rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18),0_8px_24px_rgba(0,0,0,0.4)] outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 cursor-pointer"
        style="
          background:
            radial-gradient(circle closest-side, #ffffff 0%, rgba(255, 255, 255, 0) 100%),
            conic-gradient(
              from 90deg,
              #ff0000 0deg,
              #ffff00 60deg,
              #00ff00 120deg,
              #00ffff 180deg,
              #0000ff 240deg,
              #ff00ff 300deg,
              #ff0000 360deg
            );
        "
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerEnd"
        @pointercancel="onPointerEnd"
        @keydown="onKeyDown"
      >
        <!-- Concentric Hollow Ring Thumb -->
        <span
          class="pointer-events-none absolute h-5.5 w-5.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-white shadow-[0_1px_5px_rgba(0,0,0,0.55),inset_0_1px_2px_rgba(0,0,0,0.25)] transition-transform duration-100"
          :class="{ 'scale-110': isDragging }"
          :style="thumbStyle"
        />
      </div>
    </div>
  </div>
</template>
