<script setup lang="ts">
import { onMounted } from 'vue'
import { AlertCircle, Lightbulb, Loader2, Power, X } from '@lucide/vue'
import { useHue } from './composables/useHue'
import LoginView from './components/LoginView.vue'
import TopBar from './components/TopBar.vue'
import RoomList from './components/RoomList.vue'
import SceneGrid from './components/SceneGrid.vue'
import LightCard from './components/LightCard.vue'

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
  toggleGroup,
  setGroupBrightness,
  turnAllOff,
  toggleLight,
  setLightBrightness,
  setLightTemperature,
  setLightColorHex,
  activateScene,
} = useHue()

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

  <!-- Main Controller View -->
  <div v-else class="min-h-screen flex flex-col">
    <TopBar
      :is-demo="authMode === 'demo'"
      :is-loading="isLoading"
      :show-unreachable="settings.showUnreachable"
      @refresh="refreshResources"
      @turn-all-off="turnAllOff"
      @toggle-unreachable="setShowUnreachable"
      @logout="logout"
    />

    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
      <!-- Dismissible Error Banner -->
      <div
        v-if="errorMessage"
        class="mb-6 flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200"
      >
        <div class="flex items-center gap-2">
          <AlertCircle class="h-4 w-4 shrink-0 text-red-400" />
          <span>{{ errorMessage }}</span>
        </div>
        <button type="button" class="text-red-300 hover:text-white cursor-pointer" @click="errorMessage = ''">
          <X class="h-4 w-4" />
        </button>
      </div>

      <div v-if="groups.length === 0 && !isLoading" class="py-20 text-center text-sm text-zinc-500">
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
          />
        </div>

        <!-- Right Content: Active Room Controls, Scenes & Lights -->
        <div v-if="selectedGroup" class="md:col-span-8 lg:col-span-8 space-y-7">
          <!-- Selected Group Header -->
          <div class="flex items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
            <div>
              <h2 class="text-xl font-semibold tracking-tight text-zinc-100">
                {{ selectedGroup.name }}
              </h2>
              <p class="text-xs text-zinc-400 mt-0.5">
                {{
                  selectedGroup.isOn
                    ? `${selectedGroup.onCount} of ${selectedGroup.totalCount} lights active`
                    : 'All lights off'
                }}
              </p>
            </div>

            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition cursor-pointer"
              :class="
                selectedGroup.isOn
                  ? 'border-zinc-200 bg-zinc-100 text-zinc-950 hover:bg-white'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100'
              "
              @click="toggleGroup(selectedGroup)"
            >
              <Power class="h-3.5 w-3.5" />
              <span>{{ selectedGroup.isOn ? 'Turn Off' : 'Turn On' }}</span>
            </button>
          </div>

          <!-- Scenes -->
          <SceneGrid
            :scenes="currentScenes"
            :active-scene-id="activeSceneByGroup[selectedGroup.id] || null"
            @activate="activateScene"
          />

          <!-- Lights -->
          <section class="space-y-2.5">
            <div class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
              <Lightbulb class="h-3.5 w-3.5" />
              <span>Lights ({{ currentLights.length }})</span>
            </div>

            <div v-if="currentLights.length === 0" class="rounded-xl border border-zinc-800/60 p-6 text-center text-xs text-zinc-500">
              No reachable lights in this group. Enable "Show unreachable lights" in Settings to view offline bulbs.
            </div>

            <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <LightCard
                v-for="light in currentLights"
                :key="light.id"
                :light="light"
                @toggle="toggleLight"
                @brightness="setLightBrightness"
                @temperature="setLightTemperature"
                @color="setLightColorHex"
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>
