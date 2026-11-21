<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch, type Component } from 'vue'
import { Settings, Thermometer, WifiOff, X } from '@lucide/vue'

const props = defineProps<{
  open: boolean
  showUnreachable: boolean
  showColorTempOnColorLights: boolean
}>()

const emit = defineEmits<{
  close: []
  'update:showUnreachable': [value: boolean]
  'update:showColorTempOnColorLights': [value: boolean]
}>()

const dialogRef = ref<HTMLElement | null>(null)
const closeButtonRef = ref<HTMLButtonElement | null>(null)
let previousActiveElement: HTMLElement | null = null

interface ToggleOption {
  id: 'unreachable' | 'color-temp'
  title: string
  description: string
  icon: Component
  iconClass: string
  checked: boolean
  onToggle: () => void
}

const options = computed<ToggleOption[]>(() => [
  {
    id: 'unreachable',
    title: 'Show unreachable bulbs',
    description: 'Display bulbs that are switched off at the wall or offline.',
    icon: WifiOff,
    iconClass: 'text-secondary-400',
    checked: props.showUnreachable,
    onToggle: () => emit('update:showUnreachable', !props.showUnreachable),
  },
  {
    id: 'color-temp',
    title: 'Temperature on colored bulbs',
    description: 'Show the warm-to-cool white slider alongside the color wheel.',
    icon: Thermometer,
    iconClass: 'text-cyan-300',
    checked: props.showColorTempOnColorLights,
    onToggle: () => emit('update:showColorTempOnColorLights', !props.showColorTempOnColorLights),
  },
])

function handleKeyDown(event: KeyboardEvent): void {
  if (!props.open) return
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }
  if (event.key === 'Tab' && dialogRef.value) {
    const focusable = Array.from(
      dialogRef.value.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    if (isOpen) {
      previousActiveElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      document.addEventListener('keydown', handleKeyDown)
      await nextTick()
      closeButtonRef.value?.focus()
    } else {
      document.removeEventListener('keydown', handleKeyDown)
      previousActiveElement?.focus()
      previousActiveElement = null
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-120 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-[#020314]/75 p-4 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        @click.self="emit('close')"
      >
        <div
          ref="dialogRef"
          class="w-full max-w-md rounded-3xl border border-white/14 bg-[#060a2e]/95 p-6 shadow-[0_24px_80px_rgba(2,3,24,0.88)] backdrop-blur-2xl sm:p-7"
        >
          <div class="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
            <div class="flex items-center gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary-400/30 bg-primary-500/15 text-primary-300 shadow-[0_0_20px_rgba(0,205,146,0.2)]">
                <Settings class="h-4 w-4" />
              </div>
              <div>
                <h2 id="settings-modal-title" class="text-base font-semibold tracking-tight text-white">Settings</h2>
                <p class="text-xs text-slate-400">Customize how bulbs and controls appear</p>
              </div>
            </div>

            <button
              ref="closeButtonRef"
              type="button"
              aria-label="Close settings"
              class="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-slate-300 transition hover:border-white/20 hover:bg-white/8 hover:text-white cursor-pointer"
              @click="emit('close')"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <div class="mt-5 space-y-3">
            <div
              v-for="opt in options"
              :key="opt.id"
              class="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#040722]/65 p-4 transition hover:border-white/18 cursor-pointer"
              @click="opt.onToggle"
            >
              <div class="flex min-w-0 items-start gap-3">
                <component :is="opt.icon" class="mt-0.5 h-4 w-4 shrink-0" :class="opt.iconClass" />
                <div class="space-y-0.5">
                  <p class="text-sm font-medium text-white">{{ opt.title }}</p>
                  <p class="text-xs leading-relaxed text-slate-400">{{ opt.description }}</p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                :aria-checked="opt.checked"
                :aria-label="opt.title"
                class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 cursor-pointer"
                :class="
                  opt.checked
                    ? 'border-primary-400/50 bg-primary-500 shadow-[0_0_16px_rgba(0,205,146,0.35)]'
                    : 'border-white/14 bg-[#131a4a]'
                "
                @click.stop="opt.onToggle"
              >
                <span
                  class="inline-block h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform duration-200"
                  :class="opt.checked ? 'translate-x-5.5' : 'translate-x-0.5'"
                />
              </button>
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <button
              type="button"
              class="rounded-xl bg-primary-400 px-4 py-2 text-xs font-bold text-primary-950 shadow-[0_0_20px_rgba(0,205,146,0.28)] transition hover:bg-primary-300 cursor-pointer"
              @click="emit('close')"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
