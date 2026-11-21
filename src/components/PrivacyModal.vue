<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch, type Component } from 'vue'
import { BarChart3, HardDrive, Server, ShieldCheck, X } from '@lucide/vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const dialogRef = ref<HTMLElement | null>(null)
const closeButtonRef = ref<HTMLButtonElement | null>(null)
let previousActiveElement: HTMLElement | null = null

interface PrivacyItem {
  id: string
  title: string
  description: string
  icon: Component
  iconClass: string
}

const items: PrivacyItem[] = [
  {
    id: 'storage',
    title: 'Strictly Necessary Browser Storage',
    description:
      'When you sign in or change settings, your Philips Hue OAuth tokens and UI preferences are saved only in your own browser (localStorage / sessionStorage). Signing out clears your session immediately.',
    icon: HardDrive,
    iconClass: 'text-primary-300',
  },
  {
    id: 'proxy',
    title: 'Stateless Philips Hue Cloud Connection',
    description:
      'Light and scene commands are sent over HTTPS to Philips Hue (api.meethue.com) via an open-source, stateless Cloudflare Worker proxy that stores no database, user accounts, or light state.',
    icon: Server,
    iconClass: 'text-cyan-300',
  },
  {
    id: 'analytics',
    title: 'Cookieless Web Analytics',
    description:
      'This personal open-source project uses Cloudflare Web Analytics to measure aggregated, anonymous pageviews and performance. It sets no cookies, uses no localStorage, and never tracks individuals across sites.',
    icon: BarChart3,
    iconClass: 'text-secondary-400',
  },
]
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
        aria-labelledby="privacy-modal-title"
        @click.self="emit('close')"
      >
        <div
          ref="dialogRef"
          class="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/14 bg-[#060a2e]/95 p-6 shadow-[0_24px_80px_rgba(2,3,24,0.88)] backdrop-blur-2xl sm:p-7"
        >
          <div class="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
            <div class="flex items-center gap-3">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary-400/30 bg-primary-500/15 text-primary-300 shadow-[0_0_20px_rgba(0,205,146,0.2)]"
              >
                <ShieldCheck class="h-4 w-4" />
              </div>
              <div>
                <h2 id="privacy-modal-title" class="text-base font-semibold tracking-tight text-white">
                  Privacy Notice
                </h2>
                <p class="text-xs text-slate-400">No cookies, no ads, and no personal data storage</p>
              </div>
            </div>

            <button
              ref="closeButtonRef"
              type="button"
              aria-label="Close privacy notice"
              class="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-slate-300 transition hover:border-white/20 hover:bg-white/8 hover:text-white cursor-pointer"
              @click="emit('close')"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <div class="mt-5 space-y-3 text-xs leading-relaxed text-slate-300">
            <div
              v-for="item in items"
              :key="item.id"
              class="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#040722]/65 p-4"
            >
              <component :is="item.icon" class="mt-0.5 h-4 w-4 shrink-0" :class="item.iconClass" />
              <div class="space-y-1">
                <p class="text-sm font-medium text-white">{{ item.title }}</p>
                <p class="text-slate-400">{{ item.description }}</p>
              </div>
            </div>

            <p class="pt-1 text-[11px] text-slate-400/85">
              Maintained by Jakob Frederik Lykke. Questions can be opened via the
              <a
                href="https://github.com/JakobJFL/Hue-Browser-Controller"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary-300 underline hover:text-primary-200"
              >GitHub repository</a>.
            </p>
          </div>

          <div class="mt-6 flex justify-end">
            <button
              type="button"
              class="rounded-xl bg-primary-400 px-4 py-2 text-xs font-bold text-primary-950 shadow-[0_0_20px_rgba(0,205,146,0.28)] transition hover:bg-primary-300 cursor-pointer"
              @click="emit('close')"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

