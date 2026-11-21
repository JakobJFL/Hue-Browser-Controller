<script setup lang="ts">
import { Sparkles } from '@lucide/vue'
import type { HueScene } from '../types/hue'

withDefaults(
  defineProps<{
    scenes: HueScene[]
    activeSceneId?: string | null
  }>(),
  {
    activeSceneId: null,
  }
)

const emit = defineEmits<{
  activate: [scene: HueScene]
}>()
</script>

<template>
  <section v-if="scenes.length" class="space-y-3">
    <div class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-300/85">
      <Sparkles class="h-3.5 w-3.5 text-secondary-400" />
      <span>Scenes</span>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="scene in scenes"
        :key="scene.id"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-xl border py-4 px-10 text-xs font-medium transition cursor-pointer"
        :class="
          activeSceneId === scene.id
            ? 'border-secondary-400/50 bg-secondary-500/20 text-secondary-100 shadow-[0_0_20px_rgba(241,66,241,0.22)]'
            : 'border-white/12 bg-[#060a2e]/65 text-slate-200 hover:border-secondary-400/40 hover:bg-secondary-500/12 hover:text-white'
        "
        @click="emit('activate', scene)"
      >
        <span>{{ scene.name }}</span>
      </button>
    </div>
  </section>
</template>
