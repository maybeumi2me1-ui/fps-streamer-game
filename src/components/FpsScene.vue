<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'
import type { Match } from '../game/types'
import { stageNames } from '../game/content'
const props = defineProps<{ match: Match | null }>()
const emit = defineEmits<{ shoot: [] }>()
const fired = ref(false)
let flash: ReturnType<typeof setTimeout> | undefined
const stage = computed(() => props.match?.stage ?? 0)
const result = computed(() => props.match?.results.at(-1))
const clock = computed(() => {
  const n = props.match?.roundSeconds ?? 95
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`
})
function shoot() {
  if (!props.match || props.match.resolved || props.match.hits >= 3) return
  emit('shoot')
  fired.value = true
  clearTimeout(flash)
  flash = setTimeout(() => (fired.value = false), 150)
}
onUnmounted(() => clearTimeout(flash))
</script>
<template>
  <div
    class="fps-scene"
    :class="{
      'scene-fired': fired,
      'clutch-scene': stage === 3,
      'scene-resolved': match?.resolved,
    }"
  >
    <svg
      class="harbor"
      viewBox="0 0 1000 600"
      role="img"
      aria-label="原创战术场景：暮光港区，穿过旧城巷道的集装箱货运站"
    >
      <defs>
        <linearGradient id="sky" x2="0" y2="1">
          <stop stop-color="#62788e" />
          <stop offset="1" stop-color="#dbb68b" />
        </linearGradient>
        <linearGradient id="plaster" x2="1" y2="1">
          <stop stop-color="#a99178" />
          <stop offset="1" stop-color="#655f5c" />
        </linearGradient>
        <linearGradient id="street" x2="0" y2="1">
          <stop stop-color="#7b817b" />
          <stop offset="1" stop-color="#343f48" />
        </linearGradient>
        <linearGradient id="steel" x2="1" y2="0">
          <stop stop-color="#101a24" />
          <stop offset=".48" stop-color="#4d5c67" />
          <stop offset=".6" stop-color="#243240" />
          <stop offset="1" stop-color="#0a131c" />
        </linearGradient>
        <linearGradient id="container" x2="1" y2="1">
          <stop stop-color="#6c8786" />
          <stop offset="1" stop-color="#334a50" />
        </linearGradient>
        <radialGradient id="vignette">
          <stop offset=".4" stop-color="#07131d" stop-opacity="0" />
          <stop offset="1" stop-color="#07131d" stop-opacity=".65" />
        </radialGradient>
        <pattern id="concrete" width="43" height="32" patternUnits="userSpaceOnUse">
          <path d="M0 31H43M21 0V31" fill="none" stroke="#222e34" stroke-opacity=".12" />
          <path d="M5 9h4m20 10h3" stroke="#c9c3ab" stroke-opacity=".18" />
        </pattern>
        <pattern id="slats" width="14" height="10" patternUnits="userSpaceOnUse">
          <path d="M1 0v10" stroke="#172f37" stroke-width="3" opacity=".45" />
        </pattern>
        <filter id="glow"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      <rect width="1000" height="600" fill="url(#sky)" />
      <circle cx="682" cy="135" r="51" fill="#efd2a4" opacity=".7" />
      <path
        d="M280 226V127h52V99h34v59h38v-14h42v79M600 225v-97h32v-27h27v57h38v-18h37v94"
        fill="#74808a"
        opacity=".65"
      />
      <path
        d="M420 190V96h6v31h119v7H426m46-5v60m8-56 53 39"
        stroke="#63717c"
        stroke-width="4"
        fill="none"
      />
      <g :transform="`translate(${stage === 2 ? -12 : stage === 3 ? 14 : 0},0)`">
        <path d="M0 384 510 307 1000 403V600H0Z" fill="url(#street)" />
        <path
          d="M90 600 510 313M865 600 554 315M0 510l1000-25M0 565l1000-10M230 395l520 8"
          stroke="#252f35"
          stroke-width="2"
          opacity=".5"
        />
        <path
          d="m380 600 142-266 17-1-124 267m194-265 137 265"
          stroke="#c0ad77"
          stroke-dasharray="40 35"
          stroke-width="5"
          opacity=".45"
          fill="none"
        />
        <path d="M351 146h285v182H351Z" fill="#979084" />
        <rect x="351" y="146" width="285" height="182" fill="url(#concrete)" />
        <path d="M351 146h285v12H351M351 219h285" stroke="#b0a38c" stroke-width="7" />
        <path d="M449 327V239q40-65 81 0v88Z" fill="#283943" />
        <path d="M437 327V237q51-84 105 0v90" fill="none" stroke="#b3a18a" stroke-width="16" />
        <path d="M477 243h24v84h-24" fill="#192b36" />
        <rect x="547" y="188" width="58" height="25" rx="2" fill="#344855" />
        <text x="553" y="204" fill="#e0c9a4" font-size="12" font-family="monospace">DOCK 07</text>
        <g v-for="x in [373, 570]" :key="x">
          <rect :x="x" y="248" width="35" height="42" fill="#36454d" />
          <path :d="`M${x} 260h35m-35 10h35m-35 10h35`" stroke="#7e8580" stroke-width="3" />
        </g>
        <path d="M0 0 355 114v249L0 498Z" fill="url(#plaster)" />
        <path d="M0 0 355 114v249L0 498Z" fill="url(#concrete)" />
        <path d="M0 77 355 154M0 102 355 173" stroke="#c8af8d" stroke-width="9" opacity=".6" />
        <path d="M0 358 355 285v79L0 498Z" fill="#586263" opacity=".8" />
        <path
          d="m10 35 45 15v335m0-330L337 140v180"
          fill="none"
          stroke="#364850"
          stroke-width="10"
        />
        <path d="m18 35 45 15v335m0-330L337 140" fill="none" stroke="#8d9c96" stroke-width="3" />
        <path d="m90 140 109 23v170L90 370Z" fill="#26363f" stroke="#515f61" stroke-width="9" />
        <path
          v-for="n in 12"
          :key="n"
          :d="`M95 ${150 + n * 15}l100 ${22 - n * 3}`"
          stroke="#697273"
          stroke-width="4"
        />
        <path d="m239 195 76 9v75l-76 12Z" fill="#304750" stroke="#b1a38e" stroke-width="7" />
        <path d="m277 201v83m-36-39 72-1" stroke="#818c89" stroke-width="4" />
        <path d="m237 188 80 10 13-16-90-12Z" fill="#4e6365" />
        <path d="m0 442 355-90v21L0 480Z" fill="#333f45" />
        <path d="M1000 0 636 123v253l364 134Z" fill="#8f7969" />
        <path d="M1000 0 636 123v253l364 134Z" fill="url(#concrete)" />
        <path
          d="m636 126 364-100v17L636 146m0 51 364-58v15l-364 62m0 117 364 66"
          stroke="#b69a7f"
          stroke-width="9"
        />
        <path d="m719 207 133-23v210l-133-48Z" fill="#38494f" stroke="#a39079" stroke-width="9" />
        <path d="m738 221 94-14v165l-94-34Z" fill="#172d39" />
        <path d="m752 226 60-8v45l-60 2Z" fill="#758e8d" opacity=".5" />
        <path d="m656 179 235-48 38 28-273 62Z" fill="#325e61" />
        <path d="m656 218 273-59v22l-273 62Z" fill="#244449" />
        <path d="m885 68 73-24v65l-73 19Z" fill="#30424d" stroke="#ba9b7e" stroke-width="7" />
        <path d="m922 56v63m-34-30 67-20" stroke="#62767b" stroke-width="4" />
        <path d="m951 181v233m-7-231v233" stroke="#40525a" stroke-width="6" />
        <path d="m910 251 78-6v42l-78-2Z" fill="#cabf95" />
        <text x="917" y="276" fill="#3a4a4f" font-size="19" font-family="monospace">B →</text>
        <path
          d="M0 95Q430 210 1000 58M187 0q312 194 715-2"
          stroke="#283a46"
          stroke-width="3"
          fill="none"
        />
        <path d="m320 136 7 18m301-20 7 18m200-35 6 18" stroke="#e6c98e" stroke-width="5" />
        <path d="m681 164 9 0v22" stroke="#f6cf7c" stroke-width="6" fill="none" />
        <ellipse cx="690" cy="187" rx="19" ry="7" fill="#f6cd83" opacity=".5" filter="url(#glow)" />
        <path d="m594 325 90-33 95 26-71 41Z" fill="#748e8d" />
        <path d="m594 325 114 34v144l-114-56Z" fill="url(#container)" />
        <path d="m708 359 71-41v141l-71 44Z" fill="#253e49" />
        <path d="m594 325 114 34v144l-114-56Z" fill="url(#slats)" />
        <path d="m608 342v109m86-82v113" stroke="#99aaa0" stroke-width="3" opacity=".6" />
        <text
          x="617"
          y="390"
          fill="#b1c0ae"
          font-family="monospace"
          font-size="13"
          transform="rotate(17 617 390)"
        >
          HBR / 072
        </text>
        <path d="m230 368 63-25 64 23-58 28Z" fill="#a28d69" />
        <path d="m230 368 69 26v92l-69-32Z" fill="#736a52" />
        <path d="m299 394 58-28v83l-58 37Z" fill="#4e5147" />
        <path
          d="m239 375 52 23v69l-52-22Zm2 12 47 66m-46-9 47-45"
          fill="none"
          stroke="#b0a078"
          stroke-width="4"
        />
        <path d="M0 510 364 363l-34 69L0 592Z" fill="#172b34" opacity=".48" />
        <path d="m704 506 296 67v27H793Z" fill="#111f2b" opacity=".4" />
        <path d="m185 463 18-9 19 11-16 9Zm18-9 5-43 6 38" fill="#c59455" />
      </g>
      <g
        v-if="match && !match.resolved"
        :transform="`translate(${[468, 542, 388, 570, 456][stage]},${[285, 300, 310, 275, 302][stage]})`"
        class="opponent"
      >
        <ellipse cy="45" rx="23" ry="6" fill="#172430" opacity=".4" />
        <circle cy="-21" r="9" fill="#535962" stroke="#ffb49b" stroke-width="2" />
        <path
          d="m-10-10h20l7 30H-16Zm-1 29-5 25m20-25 7 25M-9-4l-14 16 24 2m10-14 14 13"
          fill="#4c5968"
          stroke="#b77b6e"
          stroke-width="4"
        />
        <path d="M-7 12h39" stroke="#26323d" stroke-width="5" />
      </g>
      <g
        v-if="(match?.gear ?? 1) > 1"
        transform="translate(619 365) rotate(-16 150 170)"
        class="rifle"
      >
        <path
          d="m58 160 56-23 21 105-38 16-22-37Z"
          fill="#5d615c"
          stroke="#222f38"
          stroke-width="9"
        />
        <path d="m186 132 33 12-15 81-39-8Z" fill="#222d36" stroke="#4a5b64" stroke-width="5" />
        <path d="m200 202 76 6 61 70-66 8-69-45Z" fill="#6c6c60" />
        <path
          d="m81 94 177 33 79 77-39 28-142-82-68-5Z"
          fill="url(#steel)"
          stroke="#14222d"
          stroke-width="5"
        />
        <path
          d="m100 85 9-21 23 2 3 26m49 8 7-22 24 5 4 25"
          fill="#1b2935"
          stroke="#627682"
          stroke-width="4"
        />
        <path d="m86 89-23-58 21-10 42 81Z" fill="url(#steel)" stroke="#15232d" stroke-width="4" />
        <path d="m63 30-8-17 20-10 10 18Z" fill="#1a2733" />
        <path
          d="m113 115 83 19m-66-6 56 14m45 13 38 26"
          stroke="#83969d"
          stroke-width="3"
          opacity=".6"
        />
        <path d="m151 150 21 5-4 29-24-4Z" fill="#162732" stroke="#526570" stroke-width="4" />
        <circle cx="219" cy="155" r="5" fill="#a9b8b1" />
        <path d="m101 156 49 17-5 29-39-13-16-16Z" fill="#4c5558" />
        <path d="m114 166 28 10m-25-1 25 10" stroke="#86877b" stroke-width="3" />
        <path
          v-if="fired"
          d="m60 15-38-11 20-18-16-36 37 16 16-35 9 37 36-8-26 27 25 21-43-1Z"
          fill="#fff2bc"
          stroke="#ffbe5a"
          stroke-width="5"
        />
      </g>
      <g v-else transform="translate(650 415) rotate(-19 100 80)" class="rifle">
        <path
          d="m73 89 39-14 42 43 92 76-69 28-78-73Z"
          fill="#666b60"
          stroke="#38464b"
          stroke-width="7"
        />
        <path
          d="m65 25 108 5 31 32-52 28-70-20Z"
          fill="url(#steel)"
          stroke="#14222c"
          stroke-width="5"
        />
        <path d="m91 70 43 1-13 85-35 7-17-17Z" fill="#253541" stroke="#53636a" stroke-width="5" />
        <path d="m135 80 27 4-5 28-30-3" fill="none" stroke="#718389" stroke-width="5" />
        <path d="m79 21h11v11m57-8h12v10M81 39h67" stroke="#98a8a7" stroke-width="4" />
        <path d="m77 108 36-9m-39 19 36-9m-38 20 34-10" stroke="#52636a" stroke-width="4" />
        <path
          v-if="fired"
          d="m64 28-33 7 12-21-32-24 36 2 12-30 14 29 31-9-13 27Z"
          fill="#fff2bc"
          stroke="#ffbe5a"
          stroke-width="5"
        />
      </g>
      <rect width="1000" height="600" fill="url(#vignette)" pointer-events="none" />
    </svg>
    <div class="fps-score">
      <span class="team-blue">港区队 {{ match?.score[0] ?? 0 }}</span
      ><b>{{ clock }}</b
      ><span class="team-red">{{ match?.score[1] ?? 0 }} 守望队</span
      ><small>{{ match ? `关键节点 ${stage + 1} / 5` : '暮光港区 · 原创战术地图' }}</small>
    </div>
    <div class="minimap" aria-hidden="true">
      <svg viewBox="0 0 80 80">
        <path d="M8 70V10h25v20h37v40H45V47H28v23Z" fill="none" stroke="#91a6ab" stroke-width="9" />
        <circle cx="22" cy="56" r="4" fill="#b6f575" />
        <circle cx="59" cy="29" r="3" fill="#ff8e83" /></svg
      ><small>HARBOR / B</small>
    </div>
    <div v-if="match" class="kill-feed">
      <span v-if="result"
        >{{ result.won ? '你 ▸ 对手' : '对手 ▸ 队友' }}<small>{{ result.choice }}</small></span
      >
    </div>
    <div class="scene-location">
      <b>{{ match ? stageNames[stage] : '准备好，下一场就是你的主场。' }}</b
      ><small>{{
        stage === 3
          ? '1 v 2 · 信标已部署'
          : stage === 1
            ? '武器预算决定下一波火力'
            : '控制长街 · 配合进攻'
      }}</small>
    </div>
    <div class="reticle" :class="{ hit: fired }">＋</div>
    <button
      v-if="match && !match.resolved && match.hits < 3"
      class="aim-point"
      :style="{
        left: 43 + ((match.hits * 13 + stage * 7) % 27) + '%',
        top: 43 + ((match.hits * 7) % 15) + '%',
      }"
      @click="shoot"
      aria-label="射击预瞄点"
    >
      ⌖
    </button>
    <div
      v-if="match?.resolved"
      :key="match.results.length"
      class="round-banner"
      :class="{ lost: !result?.won }"
    >
      <b>{{ result?.won ? 'ROUND SECURED' : 'ROUND LOST' }}</b
      ><small>{{ result?.message }}</small>
    </div>
    <div v-if="fired" class="hit-feedback">命中 · 预瞄 +1%</div>
    <div class="fps-bottom">
      <span
        >♥ {{ match ? Math.max(15, 100 - stage * 13) : 100 }} <small>HP</small>　◇
        {{ match?.gear ?? 1 }} <small>装备</small></span
      ><span
        >{{ match?.kills ?? 0 }} <small>ELIMS</small>　{{ match ? 3 - match.hits : 3 }}
        <small>预瞄</small></span
      >
    </div>
  </div>
</template>
