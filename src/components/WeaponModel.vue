<script setup lang="ts">
import { useId } from 'vue'
const uid = useId().replace(/:/g, '')
const paint = (name: string) => `url(#${uid}-${name})`
withDefaults(defineProps<{ gear: number; fired?: boolean; hands?: boolean }>(), {
  fired: false,
  hands: true,
})
</script>
<template>
  <svg
    class="weapon-model"
    :class="{ 'weapon-fired': fired }"
    viewBox="0 0 600 400"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="uid + '-gun-body'" x1="0" y1="0" x2=".7" y2="1">
        <stop stop-color="#d2dce1" />
        <stop offset=".25" stop-color="#526171" />
        <stop offset=".5" stop-color="#182333" />
        <stop offset="1" stop-color="#080d17" />
      </linearGradient>
      <linearGradient :id="uid + '-gun-white'" x1="0" x2=".7" y2="1">
        <stop stop-color="#f0f1ea" />
        <stop offset=".4" stop-color="#b5c5cb" />
        <stop offset="1" stop-color="#576d80" />
      </linearGradient>
      <linearGradient :id="uid + '-gun-red'" x2="1" y2="1">
        <stop stop-color="#ff7887" />
        <stop offset=".4" stop-color="#e33e5b" />
        <stop offset="1" stop-color="#72243d" />
      </linearGradient>
      <linearGradient :id="uid + '-glove'" x2="1" y2="1">
        <stop stop-color="#505c70" />
        <stop offset=".5" stop-color="#1e2b3d" />
        <stop offset="1" stop-color="#0d1522" />
      </linearGradient>
      <radialGradient :id="uid + '-muzzle'">
        <stop stop-color="#fff" />
        <stop offset=".25" stop-color="#fff1a3" />
        <stop offset=".5" stop-color="#ffb04e" stop-opacity=".9" />
        <stop offset="1" stop-color="#ff6a36" stop-opacity="0" />
      </radialGradient>
    </defs>
    <g v-if="gear > 1" class="gun-assembly" :class="{ 'compact-gun': gear === 2 }">
      <g v-if="hands" class="gun-hands">
        <path
          d="m278 228-61 49 44 71 143 52H562L392 286Z"
          :fill="paint('glove')"
          stroke="#0a1321"
          stroke-width="5"
        />
        <path d="m226 291 50-33 53 18-15 60-57 8Z" fill="#47536a" />
        <path d="m230 292 50-16 24 10-15 37-32 7Z" fill="#26344b" />
        <path d="m362 301 67-32 66 26 105 92v13H449l-38-55Z" :fill="paint('glove')" />
        <path d="m478 323 87 70m-64-60 78 58" stroke="#de4465" stroke-width="4" />
      </g>
      <path
        d="m271 199 88 28-29 116-56-7-34-61Z"
        fill="#101927"
        stroke="#3d4c61"
        stroke-width="4"
      />
      <path d="m282 231 51 16-21 74-29-5-22-49Z" fill="#29394d" />
      <path d="m269 263 41 11m-43 1 39 12m-37 2 33 10" stroke="#0c1523" stroke-width="5" />
      <path d="m363 231 54 20-5 95-68-28Z" fill="#151e2c" stroke="#53647b" stroke-width="4" />
      <path d="m365 263 36 15-3 49-42-18Z" fill="#a6b4bb" />
      <path d="m358 302 43 14" stroke="#ee4a67" stroke-width="7" />
      <path
        d="m207 111 145 33 101 100 147 74v82l-83-7-117-89-135-72-67-54Z"
        :fill="paint('gun-body')"
        stroke="#111a29"
        stroke-width="7"
      />
      <path d="m207 111 145 33-21 30-128-35Z" fill="#aab9c0" />
      <path d="m203 139 128 35 69 88-105-50-93-42Z" fill="#202e41" />
      <path
        d="m336 172 25-24 79 78 95 58-39 19-94-68Z"
        :fill="paint('gun-white')"
        stroke="#26364b"
        stroke-width="4"
      />
      <path d="m363 161 24 28-21 22-16-20Z" :fill="paint('gun-red')" />
      <path d="m398 207 19 20-18 18-20-24Z" fill="#f0f1e7" />
      <path d="m435 250 63 29 24 41-56-22-19-30Z" :fill="paint('gun-red')" />
      <path d="m470 270 24 14 8 15-21-9Z" fill="#ff9cac" />
      <path d="m512 300 38-19 50 30v45l-49-20Z" :fill="paint('gun-white')" />
      <path d="m549 289 24 15-8 20-20-9Z" fill="#ed4565" />
      <path d="m507 341 21-3 61 55-31-2Z" fill="#f05771" />
      <path d="m252 178 46 13 23 25-59-22Z" fill="#63758a" />
      <path d="m261 181 35 12" stroke="#c1d2d8" stroke-width="2" />
      <path d="m316 200 26 9 28 30-30-15Z" fill="#f25471" />
      <path d="m352 252 21 9-6 23-24-10Z" fill="none" stroke="#8295a8" stroke-width="6" />
      <path d="m209 111-37-62 26-15 55 81Z" fill="#172538" stroke="#52677b" stroke-width="4" />
      <path d="m178 53 26-13 20 31-21 13Z" fill="#697b8b" />
      <path d="m169 49-16-26 21-13 23 24Z" fill="#151e2c" stroke="#788697" stroke-width="3" />
      <ellipse cx="163" cy="20" rx="10" ry="6" fill="#090c12" transform="rotate(-30 163 20)" />
      <path
        d="m218 110 7-32 23 2 18 40-14 5-16-27-6 20Z"
        fill="#152235"
        stroke="#7b8e9e"
        stroke-width="3"
      />
      <path
        d="m315 135 6-35 28 8 27 48-17 1-20-34-10 1-1 20Z"
        fill="#132034"
        stroke="#91a2af"
        stroke-width="3"
      />
      <path d="m230 126 88 22m-90-10 85 22" stroke="#090e18" stroke-width="6" />
      <path d="m249 119 51 13" stroke="#e34161" stroke-width="4" />
      <circle
        v-for="(p, i) in [
          [307, 185],
          [389, 256],
          [538, 326],
        ]"
        :key="i"
        :cx="p[0]"
        :cy="p[1]"
        r="4"
        fill="#a2b5c4"
      />
      <path
        v-if="fired"
        d="m164 25-42 6 15-26-28-32 40 5 15-42 17 36 36-11-23 33 25 23-43-1Z"
        fill="#ffe8a1"
        stroke="#ffad4d"
        stroke-width="4"
      />
      <circle v-if="fired" cx="164" cy="20" r="70" :fill="paint('muzzle')" />
      <path v-if="gear === 2" d="m247 171 67 22 22 29-72-25Z" fill="#67d6df" opacity=".8" />
    </g>
    <g v-else class="gun-assembly">
      <g v-if="hands">
        <path
          d="m297 254 74 5 49 47 180 60v34H382l-102-72Z"
          :fill="paint('glove')"
          stroke="#111e2d"
          stroke-width="6"
        />
        <path d="m333 276 59 22 28 52-58-5-41-34Z" fill="#3c4b61" />
        <path d="m363 344 91 48" stroke="#ef4766" stroke-width="6" />
      </g>
      <path
        d="m255 144 111 32 49 85-52 65-72-42-39-70Z"
        fill="#162137"
        stroke="#61758b"
        stroke-width="5"
      />
      <path d="m295 213 67 19-7 59-44-18-23-44Z" fill="#29394e" />
      <path d="m308 240 42 11m-39 0 38 11" stroke="#53637c" stroke-width="4" />
      <path
        d="m193 81 118 9 91 62-35 56-141-37-41-42Z"
        :fill="paint('gun-body')"
        stroke="#172236"
        stroke-width="6"
      />
      <path d="m193 81 118 9 33 26-130-7Z" :fill="paint('gun-white')" />
      <path d="m214 109 130 7 37 31-28 28-120-37Z" :fill="paint('gun-white')" />
      <path d="m261 121 57 7 28 28-36-9Z" :fill="paint('gun-red')" />
      <path d="m231 139 38 10 14 24-48-13Z" fill="#ee4a66" />
      <path d="m195 82-14 44 26 8 11-25Z" fill="#101928" />
      <ellipse cx="195" cy="111" rx="8" ry="14" fill="#050a11" />
      <path
        d="m212 82 6-18 15 1 2 19m74 6 6-15 13 6 6 15"
        fill="#1b263b"
        stroke="#98a8b6"
        stroke-width="3"
      />
      <path d="m357 198 29 7-2 34-22 10-5-10 16-7 1-17-15-3" fill="#aebdc5" />
      <path d="m306 186 36 12" stroke="#ff6c83" stroke-width="3" />
      <path
        v-if="fired"
        d="m192 110-39 17 8-30-36-19 39-8 3-35 22 29 35-20-9 39 29 19-38 3Z"
        fill="#fff1bc"
        stroke="#ffb34c"
        stroke-width="4"
      />
      <circle v-if="fired" cx="191" cy="105" r="60" :fill="paint('muzzle')" />
    </g>
  </svg>
</template>
