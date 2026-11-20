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
  <section v-if="scenes.length" class="space-y-2.5">
    <div class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
      <Sparkles class="h-3.5 w-3.5" />
      <span>Scenes</span>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="scene in scenes"
        :key="scene.id"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition cursor-pointer"
        :class="
          activeSceneId === scene.id
            ? 'border-zinc-300 bg-zinc-100 text-zinc-950'
            : 'border-zinc-800 bg-zinc-900/70 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100'
        "
        @click="emit('activate', scene)"
      >
        <span>{{ scene.name }}</span>
      </button>
    </div>
  </section>
</template>
