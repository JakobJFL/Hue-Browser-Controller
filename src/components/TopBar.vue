<script setup lang="ts">
import { ref } from 'vue'
import { Lightbulb, LogOut, PowerOff, RefreshCw, Settings2 } from '@lucide/vue'

withDefaults(
  defineProps<{
    isDemo?: boolean
    isLoading?: boolean
    showUnreachable?: boolean
  }>(),
  {
    isDemo: false,
    isLoading: false,
    showUnreachable: false,
  }
)

const emit = defineEmits<{
  refresh: []
  'turn-all-off': []
  'toggle-unreachable': [value: boolean]
  logout: []
}>()

const settingsOpen = ref(false)

function onUnreachableChange(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('toggle-unreachable', target.checked)
}
</script>

<template>
  <header class="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur sticky top-0 z-20">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
      <div class="flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300 border border-amber-400/20">
          <Lightbulb class="h-4 w-4" />
        </div>
        <span class="text-sm font-semibold tracking-tight text-zinc-100">Open Hue Controller</span>
        <span
          v-if="isDemo"
          class="rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-300"
        >
          Demo
        </span>
      </div>

      <div class="flex items-center gap-2 relative">
        <button
          type="button"
          title="Turn all lights off"
          class="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
          @click="emit('turn-all-off')"
        >
          <PowerOff class="h-3.5 w-3.5 text-zinc-400" />
          <span class="hidden sm:inline">All Off</span>
        </button>

        <button
          type="button"
          :disabled="isLoading"
          title="Refresh state"
          class="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50 cursor-pointer"
          @click="emit('refresh')"
        >
          <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': isLoading }" />
          <span class="hidden sm:inline">Refresh</span>
        </button>

        <div class="relative">
          <button
            type="button"
            title="Settings"
            class="inline-flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
            @click="settingsOpen = !settingsOpen"
          >
            <Settings2 class="h-4 w-4" />
          </button>

          <div
            v-if="settingsOpen"
            class="absolute right-0 mt-2 w-64 rounded-xl border border-zinc-800 bg-zinc-900 p-3.5 shadow-xl z-30"
            @mouseleave="settingsOpen = false"
          >
            <p class="text-xs font-medium text-zinc-200 mb-2.5">Display Preferences</p>
            <label class="flex items-center justify-between gap-3 cursor-pointer text-xs text-zinc-400">
              <span>Show unreachable lights</span>
              <input
                type="checkbox"
                :checked="showUnreachable"
                class="h-4 w-4 accent-zinc-100 rounded cursor-pointer"
                @change="onUnreachableChange"
              />
            </label>
          </div>
        </div>

        <button
          type="button"
          :title="isDemo ? 'Exit Demo' : 'Sign Out'"
          class="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
          @click="emit('logout')"
        >
          <LogOut class="h-3.5 w-3.5" />
          <span class="hidden sm:inline">{{ isDemo ? 'Exit Demo' : 'Sign Out' }}</span>
        </button>
      </div>
    </div>
  </header>
</template>
