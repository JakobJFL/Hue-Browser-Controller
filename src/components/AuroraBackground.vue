<script setup lang="ts">
// Flicker-free GPU-composited Northern Lights background with multi-fold serpentine waves.
// Uses static CSS-blurred SVG layers inside pure translate3d() wrapper divs so the GPU
// caches each blurred wave layer once without per-frame SVG filter repaints.
</script>

<template>
  <div
    class="pointer-events-none fixed inset-0 z-0 isolate overflow-hidden bg-[#02031c] [contain:strict]"
    aria-hidden="true"
  >
    <!-- 1. Static Deep Midnight-Indigo Sky Base -->
    <div
      class="absolute inset-0 bg-[linear-gradient(145deg,#020217_0%,#03062e_45%,#06104a_78%,#030524_100%)]"
    />

    <!-- 2. Atmospheric Aurora Sky Wash (blur-[84px] on GPU layer) -->
    <div class="aurora-drift-b absolute -inset-[14%]">
      <div class="aurora-gpu-blur h-full w-full blur-[84px]">
        <svg
          class="h-full w-full"
          viewBox="0 0 1600 1000"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="atmo-cobalt" x1="20%" y1="5%" x2="90%" y2="80%">
              <stop offset="0%" stop-color="#03062e" stop-opacity="0" />
              <stop offset="40%" stop-color="#0b3eb8" stop-opacity="0.82" />
              <stop offset="75%" stop-color="#1458e6" stop-opacity="0.92" />
              <stop offset="100%" stop-color="#00b4d8" stop-opacity="0.7" />
            </linearGradient>
            <linearGradient id="atmo-emerald" x1="96%" y1="2%" x2="30%" y2="48%">
              <stop offset="0%" stop-color="#25e2a5" stop-opacity="0.95" />
              <stop offset="35%" stop-color="#00cd92" stop-opacity="0.85" />
              <stop offset="70%" stop-color="#0096c7" stop-opacity="0.65" />
              <stop offset="100%" stop-color="#03062e" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="atmo-magenta" x1="16%" y1="95%" x2="92%" y2="46%">
              <stop offset="0%" stop-color="#f142f1" stop-opacity="0.9" />
              <stop offset="42%" stop-color="#b11aab" stop-opacity="0.8" />
              <stop offset="78%" stop-color="#4f18d4" stop-opacity="0.7" />
              <stop offset="100%" stop-color="#050a44" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M 500,-40 L 1580,-40 L 1580,270 C 1320,210 1160,390 920,350 C 680,310 580,150 500,-40 Z"
            fill="url(#atmo-emerald)"
          />
          <path
            d="M 460,250 C 740,160 940,310 1180,330 C 1380,345 1480,440 1580,510 L 1420,660 C 1080,570 830,680 500,610 C 250,555 300,310 460,250 Z"
            fill="url(#atmo-cobalt)"
          />
          <path
            d="M -20,960 C 220,760 490,630 810,635 C 1120,640 1320,490 1580,525 L 1580,880 C 1260,830 960,890 620,960 Z"
            fill="url(#atmo-magenta)"
          />
        </svg>
      </div>
    </div>

    <!-- 3. Multi-Fold Serpentine S-Wave Ribbons & Softened Aurora Cores -->
    <div class="aurora-drift-a absolute -inset-[12%]">
      <div class="aurora-gpu-blur absolute inset-0 blur-[40px]">
        <svg
          class="h-full w-full"
          viewBox="0 0 1600 1000"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="rib-emerald-wave" x1="95%" y1="4%" x2="32%" y2="54%">
              <stop offset="0%" stop-color="#63f2c0" />
              <stop offset="24%" stop-color="#00cd92" />
              <stop offset="54%" stop-color="#00c4d8" />
              <stop offset="82%" stop-color="#1152e8" />
              <stop offset="100%" stop-color="#040838" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="rib-violet-curl" x1="96%" y1="18%" x2="54%" y2="60%">
              <stop offset="0%" stop-color="#d524d1" />
              <stop offset="45%" stop-color="#7618e8" />
              <stop offset="85%" stop-color="#1628b8" />
              <stop offset="100%" stop-color="#04062e" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="rib-magenta-wave" x1="15%" y1="95%" x2="94%" y2="48%">
              <stop offset="0%" stop-color="#fb77fb" />
              <stop offset="30%" stop-color="#f142f1" />
              <stop offset="58%" stop-color="#b11aab" />
              <stop offset="82%" stop-color="#6218e2" />
              <stop offset="100%" stop-color="#182ad4" />
            </linearGradient>
            <linearGradient id="rib-cyan-wave" x1="94%" y1="62%" x2="42%" y2="95%">
              <stop offset="0%" stop-color="#25e2a5" />
              <stop offset="36%" stop-color="#00d2ff" />
              <stop offset="74%" stop-color="#0d47c4" />
              <stop offset="100%" stop-color="#040836" stop-opacity="0.1" />
            </linearGradient>
          </defs>

          <!-- Upper sky subtle rippling emerald veil -->
          <path
            d="M 460,-30 C 620,105 800,35 990,115 C 1180,195 1360,55 1580,110 L 1580,-50 L 460,-50 Z"
            fill="url(#rib-emerald-wave)"
            opacity="0.65"
          />

          <!-- Main Upper Serpentine S-Ribbon (pulled inward so full S-bend sits inside viewport) -->
          <path
            d="M 840,-50 L 1580,-50 L 1580,130 C 1410,160 1195,195 1210,295 C 1225,395 1405,425 1580,465 L 1580,565 C 1360,500 1205,425 995,465 C 785,505 585,435 695,305 C 805,175 680,85 840,-50 Z"
            fill="url(#rib-emerald-wave)"
          />

          <!-- Right-edge Violet-Orchid S-Curl & Dark Midnight Pocket inside the visible right frame -->
          <path
            d="M 1580,135 C 1395,170 1225,215 1238,308 C 1250,398 1415,415 1580,470 L 1580,350 C 1445,325 1355,295 1365,242 C 1375,188 1480,162 1580,148 Z"
            fill="url(#rib-violet-curl)"
          />
          <path
            d="M 1580,235 C 1435,255 1345,300 1358,368 C 1370,432 1475,448 1580,460 Z"
            fill="#030426"
            opacity="0.95"
          />

          <!-- Undulating Dark Midnight Trough separating upper cobalt & lower magenta curtains -->
          <path
            d="M -60,440 C 210,545 450,445 700,510 C 950,575 1150,465 1390,520 C 1180,605 930,550 670,625 C 410,700 165,645 -60,710 Z"
            fill="#03052b"
            opacity="0.9"
          />

          <!-- Sweeping Multi-Wave Magenta -> Violet Curtain (shifted higher so lower cyan wave shines) -->
          <path
            d="M 1590,485 C 1395,455 1275,565 1065,545 C 855,525 735,645 525,675 C 315,705 165,830 -50,925 L -50,1040 L 495,1040 C 665,865 810,705 1030,722 C 1245,738 1385,605 1590,625 Z"
            fill="url(#rib-magenta-wave)"
          />

          <!-- Parallel Undulating Arctic Cyan & Mint Wave (lifted well into visible lower-right sky) -->
          <path
            d="M 485,1040 C 655,860 810,695 1035,712 C 1250,728 1390,595 1590,615 L 1590,775 C 1405,740 1265,845 1055,830 C 855,815 735,915 625,1040 Z"
            fill="url(#rib-cyan-wave)"
          />

          <!-- Deep Midnight-Indigo Ocean Trough clearly visible beneath the Cyan/Emerald Wave -->
          <path
            d="M 635,1040 C 755,905 885,820 1075,835 C 1275,850 1415,755 1590,782 L 1590,1040 Z"
            fill="#020528"
            opacity="0.96"
          />
        </svg>
      </div>

      <!-- Softened Luminous Aurora Wave Cores (blur-[30px] blends seamlessly without tube lines) -->
      <div class="aurora-gpu-blur absolute inset-0 blur-[30px]">
        <svg
          class="h-full w-full"
          viewBox="0 0 1600 1000"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="spine-emerald" x1="96%" y1="5%" x2="38%" y2="52%">
              <stop offset="0%" stop-color="#a0fad4" />
              <stop offset="32%" stop-color="#25e2a5" />
              <stop offset="68%" stop-color="#00d2ff" />
              <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="spine-magenta" x1="12%" y1="96%" x2="94%" y2="52%">
              <stop offset="0%" stop-color="#fcaafd" />
              <stop offset="35%" stop-color="#fb77fb" />
              <stop offset="70%" stop-color="#f142f1" />
              <stop offset="100%" stop-color="#7c1ae8" stop-opacity="0.35" />
            </linearGradient>
            <linearGradient id="spine-cyan" x1="94%" y1="62%" x2="44%" y2="96%">
              <stop offset="0%" stop-color="#63f2c0" />
              <stop offset="48%" stop-color="#00dcff" />
              <stop offset="100%" stop-color="#0e42b3" stop-opacity="0" />
            </linearGradient>
          </defs>

          <path
            d="M 1560,75 C 1365,115 1175,175 1195,295 C 1215,415 895,335 795,415 C 695,495 1295,445 1560,545"
            fill="none"
            stroke="url(#spine-emerald)"
            stroke-width="54"
            stroke-linecap="round"
            opacity="0.65"
          />
          <path
            d="M 1560,575 C 1360,535 1235,640 1025,615 C 815,590 695,725 490,765 C 310,800 185,885 55,955"
            fill="none"
            stroke="url(#spine-magenta)"
            stroke-width="58"
            stroke-linecap="round"
            opacity="0.68"
          />
          <path
            d="M 555,965 C 715,825 855,710 1055,728 C 1255,745 1395,625 1570,645"
            fill="none"
            stroke="url(#spine-cyan)"
            stroke-width="46"
            stroke-linecap="round"
            opacity="0.72"
          />
        </svg>
      </div>
    </div>

    <!-- 4. Static Soft Dark-Sky Radial Vignette on Upper-Left -->
    <div
      class="absolute inset-0 bg-[radial-gradient(ellipse_at_16%_28%,rgba(2,2,23,0.62)_0%,transparent_58%)]"
    />
  </div>
</template>

