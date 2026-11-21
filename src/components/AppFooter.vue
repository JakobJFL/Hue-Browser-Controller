<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer
    class="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-slate-300/75 drop-shadow-[0_1px_8px_rgba(2,3,28,0.85)] sm:flex-row sm:px-6"
  >
    <span>&copy; {{ currentYear }} Jakob Frederik Lykke &middot; Open Hue Controller</span>

    <div class="flex items-center gap-4">
      <span>Open Source &middot; MIT</span>
      <a
        href="https://github.com/JakobJFL/Hue-Browser-Controller"
        target="_blank"
        rel="noopener noreferrer"
        class="font-medium text-slate-200/90 transition hover:text-primary-300"
      >
        GitHub
      </a>
    </div>
  </footer>
</template>
