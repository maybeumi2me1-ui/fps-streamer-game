<script setup lang="ts">
withDefaults(
  defineProps<{ ally?: boolean; down?: boolean; variant?: number; scanned?: boolean }>(),
  { ally: false, down: false, variant: 0, scanned: false },
)
</script>
<template>
  <svg
    class="combat-agent"
    :class="{ down, scanned, ally }"
    viewBox="0 0 100 180"
    aria-hidden="true"
  >
    <ellipse cx="51" cy="173" rx="35" ry="6" fill="#070e1b" opacity=".5" />
    <g :transform="down ? 'translate(8 151) rotate(-78 42 12) scale(.9)' : ''">
      <path
        d="m33 100 24 2-4 35-13 35-16-5 11-39Z"
        fill="#263247"
        stroke="#111e2c"
        stroke-width="3"
      />
      <path
        d="m54 102 17-2 3 34 15 31-13 8-19-33-9-21Z"
        fill="#1c2b3e"
        stroke="#111e2c"
        stroke-width="3"
      />
      <path d="m28 159 17 4-3 13-24-1Z M73 161l15-3 10 16-23 3Z" fill="#111a2a" />
      <path
        d="m26 48 17-9 22 3 16 17-6 47-25 8-26-15Z"
        :fill="ally ? '#31586a' : '#473d59'"
        stroke="#182439"
        stroke-width="3"
      />
      <path d="m37 53 24-2 7 35-29 8-9-14Z" fill="#172d3f" />
      <path d="m38 58 21 0m-23 12 26-2m-24 12 25-3" stroke="#657d89" stroke-width="3" />
      <path
        d="m29 50-11 6-12 35 13 8 22-23"
        :fill="ally ? '#3b6677' : '#66546b'"
        stroke="#18283a"
        stroke-width="3"
      />
      <path
        d="m71 53 10 6 14 29-10 14-29-18"
        :fill="ally ? '#3b6677' : '#66546b'"
        stroke="#18283a"
        stroke-width="3"
      />
      <path d="m43 34-1 12 15 4 5-16" fill="#b39383" />
      <path
        d="m35 13 15-8 16 9 1 18-12 12-16-7-7-12Z"
        fill="#45566a"
        stroke="#142237"
        stroke-width="3"
      />
      <path d="m37 19 24-2 0 13-19 2Z" fill="#152637" />
      <path d="m38 23 22-2" :stroke="ally ? '#85eff2' : '#ff7186'" stroke-width="3" />
      <path d="m31 15 3-10 19-4 13 8-1 7-16-4Z" fill="#1b2638" />
      <path d="m32 17-8 11 8 11m35-21 6 10-7 10" stroke="#5a7383" stroke-width="5" fill="none" />
      <path
        d="m17 83 39-10 26 3 12 12-26 8-28-2-15 6Z"
        fill="#101e2b"
        stroke="#637588"
        stroke-width="2"
      />
      <path d="m29 83 40-6m-22 10 37-4" :stroke="ally ? '#83dde5' : '#f98399'" stroke-width="2" />
      <path d="m54 91 7 14 7-2-3-14" fill="#142433" />
      <path d="m22 97 13-6 10 8-4 8-16-2Z" fill="#293f53" />
      <path
        d="m28 49 5 10m38-10-1 12M31 112l10 2m21 2 9-2"
        :stroke="ally ? '#89e7eb' : '#f18fa8'"
        stroke-width="3"
      />
    </g>
  </svg>
</template>
