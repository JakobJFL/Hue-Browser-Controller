<script setup lang="ts">
import { AlertCircle, ArrowRight, Play, Sparkles } from '@lucide/vue'
import { isOAuthConfigured } from '../config'
import AppFooter from './AppFooter.vue'
import AuroraBackground from './AuroraBackground.vue'

withDefaults(
  defineProps<{
    isAuthenticating?: boolean
    errorMessage?: string
  }>(),
  {
    isAuthenticating: false,
    errorMessage: '',
  }
)

const emit = defineEmits<{
  login: []
  demo: []
}>()

const configured = isOAuthConfigured()
</script>

<template>
  <div class="relative isolate min-h-screen flex flex-col justify-between overflow-hidden pt-6 sm:pt-8">
    <!-- Custom Wavy Northern Lights SVG Sky -->
    <AuroraBackground />

    <!-- Minimal Top Header -->
    <header class="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 sm:px-6">
      <div class="flex items-center gap-2.5">
        <img
          src="/public/favicon/favicon-32x32.png"
          alt="Open Hue Controller logo"
          width="36"
          height="36"
          class="h-9 w-9"
        />
        <span class="text-sm font-semibold tracking-wide text-white/95">Open Hue Controller</span>
      </div>

      <span
        class="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/4 px-3 py-1 text-[11px] font-medium tracking-wide text-primary-200/90 backdrop-blur-md"
      >
        <Sparkles class="h-3 w-3 text-primary-400" />
        HUE V2 HTTPS
      </span>
    </header>

    <!-- Main Content: Left-aligned editorial hero + sleek frosted glass login panel -->
    <main class="relative z-10 mx-auto my-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-12">
      <!-- Left Column: Minimalist Northern Lights Headline over the deep midnight sky -->
      <div class="lg:col-span-7 space-y-5">
        <p class="text-xs font-semibold uppercase tracking-[0.22em] text-primary-300/90">
          Philips Hue Browser Studio
        </p>
        <h1 class="text-4xl font-light tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.08]">
          Your Hue lights,
          <span
            class="block font-normal bg-linear-to-r from-primary-300 via-cyan-300 to-secondary-400 bg-clip-text text-transparent"
          >
            accessible anywhere.
          </span>
        </h1>
        <p class="max-w-lg text-sm sm:text-base leading-relaxed text-slate-300/80">
          Control every light, room, and scene directly from your browser over secure HTTPS from anywhere in the world. Open Hue Controller is a free, open-source, and privacy-first web app.
        </p>
      </div>

      <!-- Right Column: Frosted Dark Glass Sign-In Card -->
      <div class="lg:col-span-5">
        <div
          class="w-full rounded-3xl border border-white/14 bg-[#040726]/60 p-7 sm:p-8 shadow-[0_24px_80px_rgba(2,3,24,0.75)] backdrop-blur-2xl"
        >
          <div class="mb-6">
            <h2 class="text-lg font-medium tracking-tight text-white">Connect your Bridge</h2>
            <p class="mt-1 text-xs leading-relaxed text-slate-300/75">
              Sign in once with your Philips Hue account for instant, automatic pairing.
            </p>
          </div>

          <div
            v-if="errorMessage"
            class="mb-5 flex items-start gap-2.5 rounded-2xl border border-secondary-400/35 bg-secondary-950/55 p-3.5 text-xs text-secondary-100"
          >
            <AlertCircle class="h-4 w-4 shrink-0 text-secondary-400 mt-0.5" />
            <span>{{ errorMessage }}</span>
          </div>

          <div class="space-y-3">
            <button
              type="button"
              :disabled="isAuthenticating"
              class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary-400 px-4 py-3 text-sm font-bold text-primary-950 shadow-[0_0_28px_rgba(0,205,146,0.35)] transition hover:bg-primary-300 hover:shadow-[0_0_36px_rgba(37,226,165,0.5)] disabled:opacity-60 cursor-pointer"
              @click="emit('login')"
            >
              <span>{{ isAuthenticating ? 'Redirecting to Philips Hue…' : 'Sign in with Philips Hue' }}</span>
              <ArrowRight class="h-4 w-4" />
            </button>

            <button
              type="button"
              class="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/14 bg-white/5 px-4 py-3 text-sm font-medium text-white/90 transition hover:border-secondary-400/45 hover:bg-secondary-500/12 hover:text-white cursor-pointer"
              @click="emit('demo')"
            >
              <Play class="h-4 w-4 text-secondary-400" />
              <span>Try Demo Mode</span>
            </button>
          </div>

          <p v-if="!configured" class="mt-5 text-[11px] leading-relaxed text-slate-400/85">
            Setup hint: Add <code class="text-primary-300">VITE_HUE_CLIENT_ID</code> and
            <code class="text-primary-300">VITE_WORKER_URL</code> in <code class="text-primary-300">.env</code> for live OAuth.
          </p>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

