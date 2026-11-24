<script setup lang="ts">
import { LogOut, RefreshCw, Settings } from '@lucide/vue'

withDefaults(
  defineProps<{
    isDemo?: boolean
    isLoading?: boolean
  }>(),
  {
    isDemo: false,
    isLoading: false,
  }
)

const emit = defineEmits<{
  refresh: []
  'open-settings': []
  logout: []
}>()
</script>

<template>
  <header class="sticky top-0 z-20 border-b border-white/10 bg-[#03051a]/85 backdrop-blur-xl">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <div class="flex items-center gap-2.5">
        <img
          src="/favicon/favicon-32x32.png"
          alt="Open Hue Controller logo"
          width="36"
          height="36"
          class="h-9 w-9"
        />
        <span class="text-sm font-semibold tracking-wide text-white/95">Open Hue Controller</span>
        <span
          v-if="isDemo"
          class="rounded-full border border-secondary-400/35 bg-secondary-500/15 px-2.5 py-0.5 text-[11px] font-medium text-secondary-300"
        >
          Demo
        </span>
      </div>

      <div class="relative flex items-center gap-2">
        <button
          type="button"
          :disabled="isLoading"
          title="Refresh state"
          class="inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/4 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-primary-400/40 hover:bg-primary-500/12 hover:text-white disabled:opacity-50 cursor-pointer"
          @click="emit('refresh')"
        >
          <RefreshCw class="h-3.5 w-3.5 text-primary-400" :class="{ 'animate-spin': isLoading }" />
          <span class="hidden sm:inline">Refresh</span>
        </button>

        <button
          type="button"
          title="Settings"
          aria-label="Open settings"
          class="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/4 p-2 text-slate-200 transition hover:border-primary-400/40 hover:bg-white/8 hover:text-white cursor-pointer"
          @click="emit('open-settings')"
        >
          <Settings class="h-4 w-4" />
        </button>

        <button
          type="button"
          :title="isDemo ? 'Exit Demo' : 'Sign Out'"
          class="inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/4 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/25 hover:bg-white/9 hover:text-white cursor-pointer"
          @click="emit('logout')"
        >
          <LogOut class="h-3.5 w-3.5" />
          <span class="hidden sm:inline">{{ isDemo ? 'Exit Demo' : 'Sign Out' }}</span>
        </button>
      </div>
    </div>
  </header>
</template>
