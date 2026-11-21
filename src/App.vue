<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { AlertCircle, Lightbulb, Loader2, X } from '@lucide/vue'
import { useHue } from './composables/useHue'
import AppFooter from './components/AppFooter.vue'
import LoginView from './components/LoginView.vue'
import TopBar from './components/TopBar.vue'
import RoomList from './components/RoomList.vue'
import SceneGrid from './components/SceneGrid.vue'
import LightCard from './components/LightCard.vue'
import SettingsModal from './components/SettingsModal.vue'

const {
  authMode,
  isLoading,
  isBootstrapping,
  errorMessage,
  settings,
  groups,
  selectedGroup,
  selectedGroupId,
  currentLights,
  currentScenes,
  activeSceneByGroup,
  bootstrap,
  refreshResources,
  loginWithHue,
  startDemoMode,
  logout,
  selectGroup,
  setShowUnreachable,
  setShowColorTempOnColorLights,
  toggleGroup,
  setGroupBrightness,
  turnAllOff,
  toggleLight,
  setLightBrightness,
  setLightTemperature,
  setLightColorHex,
  activateScene,
} = useHue()

const settingsModalOpen = ref(false)
const expandedLightId = ref<string | null>(null)

function handleToggleExpand(lightId: string): void {
  expandedLightId.value = expandedLightId.value === lightId ? null : lightId
}

watch([selectedGroupId, authMode], () => {
  expandedLightId.value = null
})

onMounted(() => {
  void bootstrap()
})
</script>

<template>
  <!-- Initial OAuth / Session Check -->
  <div v-if="isBootstrapping" class="min-h-screen flex flex-col items-center justify-center gap-3 text-slate-300">
    <Loader2 class="h-6 w-6 animate-spin text-primary-400" />
    <p class="text-sm">Connecting to Philips Hue…</p>
  </div>

  <!-- Signed-Out View -->
  <LoginView
    v-else-if="authMode === 'logged_out' || authMode === 'authenticating'"
    :is-authenticating="authMode === 'authenticating'"
    :error-message="errorMessage"
    @login="loginWithHue"
    @demo="startDemoMode"
  />

  <!-- Main Controller View (solid dark-blue canvas matching LoginView palette) -->
  <div v-else class="min-h-screen flex flex-col bg-[#03051a] text-slate-100">
    <TopBar
      :is-demo="authMode === 'demo'"
      :is-loading="isLoading"
      @refresh="refreshResources"
      @open-settings="settingsModalOpen = true"
      @logout="logout"
    />

    <SettingsModal
      :open="settingsModalOpen"
      :show-unreachable="settings.showUnreachable"
      :show-color-temp-on-color-lights="settings.showColorTempOnColorLights"
      @close="settingsModalOpen = false"
      @update:show-unreachable="setShowUnreachable"
      @update:show-color-temp-on-color-lights="setShowColorTempOnColorLights"
    />

    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <!-- Dismissible Error Banner -->
      <div
        v-if="errorMessage"
        class="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-secondary-400/35 bg-secondary-950/55 px-4 py-3 text-xs text-secondary-100"
      >
        <div class="flex items-center gap-2.5">
          <AlertCircle class="h-4 w-4 shrink-0 text-secondary-400" />
          <span>{{ errorMessage }}</span>
        </div>
        <button
          type="button"
          class="text-secondary-300 transition hover:text-white cursor-pointer"
          @click="errorMessage = ''"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <div v-if="groups.length === 0 && !isLoading" class="py-20 text-center text-sm text-slate-400">
        No rooms or lights found on this Hue Bridge.
      </div>

      <div v-else class="grid grid-cols-1 gap-8 md:grid-cols-12">
        <!-- Left Sidebar: Rooms & Zones -->
        <div class="md:col-span-4 lg:col-span-4">
          <RoomList
            :groups="groups"
            :selected-group-id="selectedGroupId"
            @select="selectGroup"
            @toggle="toggleGroup"
            @brightness="setGroupBrightness"
            @turn-all-off="turnAllOff"
          />
        </div>

        <!-- Right Content: Active Room Controls, Scenes & Lights -->
        <div v-if="selectedGroup" class="md:col-span-8 lg:col-span-8 space-y-8">
          <!-- Selected Group Header -->
          <div class="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <h2 class="text-2xl font-light tracking-tight text-white">
                {{ selectedGroup.name }}
              </h2>
              <p class="text-xs text-slate-300/75 mt-1">
                {{
                  selectedGroup.isOn
                    ? `${selectedGroup.onCount} of ${selectedGroup.totalCount} lights active · ${selectedGroup.brightness}%`
                    : 'All lights off'
                }}
              </p>
            </div>
          </div>

          <!-- Scenes -->
          <SceneGrid
            :scenes="currentScenes"
            :active-scene-id="activeSceneByGroup[selectedGroup.id] || null"
            @activate="activateScene"
          />

          <!-- Lights -->
          <section class="space-y-3">
            <div class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-300/85">
              <Lightbulb class="h-3.5 w-3.5 text-primary-400" />
              <span>Lights ({{ currentLights.length }})</span>
            </div>

            <div
              v-if="currentLights.length === 0"
              class="rounded-2xl border border-white/10 bg-[#060a2e]/50 p-6 text-center text-xs text-slate-400"
            >
              No reachable lights in this group. Enable "Show unreachable lights" in Settings to view offline bulbs.
            </div>

            <div v-else class="grid grid-cols-1 items-start gap-3.5 sm:grid-cols-2">
              <LightCard
                v-for="light in currentLights"
                :key="light.id"
                :light="light"
                :expanded="expandedLightId === light.id"
                :show-color-temp-on-color-lights="settings.showColorTempOnColorLights"
                @toggle="toggleLight"
                @toggle-expand="handleToggleExpand"
                @brightness="setLightBrightness"
                @temperature="setLightTemperature"
                @color="setLightColorHex"
              />
            </div>
          </section>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>
