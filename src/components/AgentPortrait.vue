<script setup lang="ts">
withDefaults(defineProps<{ variant?: number }>(), { variant: 0 })
</script>
<template>
  <svg class="agent-portrait" viewBox="0 0 80 88" role="img" aria-label="原创角色：夜航战术小队">
    <path d="M0 0h80v88H0Z" :fill="['#343b57', '#23454c', '#4e3440', '#394b41'][variant % 4]" />
    <path d="M-6 87 14 63 30 57h22l19 10 14 22Z" fill="#141f30" />
    <path d="m22 69 13-10h12l16 11-17 17H31Z" fill="#41596b" />
    <path d="m28 55 5-14h19l3 19-14 15Z" fill="#bb8c7f" />
    <path d="m21 22 10-13 24 5 10 18-5 19-15 14-19-10-7-19Z" fill="#e0b7a0" />
    <path
      d="M12 36 13 19 30 4 52 7l16 13-3 18-7-13-6 11-8-15-6 12-9-8-5 20-6-8-2 19Z"
      fill="#152031"
    />
    <path d="m19 20 13-9 21 3-18 3-7 15-4-8m14-13 16 4 9 9" fill="#34405b" />
    <path d="m29 40 8-2m11 1 7 1" stroke="#2a2936" stroke-width="2" />
    <path
      d="m30 41 5 1m14 0 5-1"
      :stroke="['#8ee9ee', '#a6e7ac', '#f09fbc', '#ddd185'][variant % 4]"
      stroke-width="2"
    />
    <path d="m41 42-2 8 5 1m-9 6 10 1" stroke="#936f6d" fill="none" stroke-width="1.5" />
    <path
      d="m15 32 1 19 8 6m-9-13 5-1m39-5 8-5 1 19-8 4"
      stroke="#536d81"
      fill="none"
      stroke-width="4"
    />
    <path d="m64 48-5 11-9 2" stroke="#a2c7d2" fill="none" stroke-width="2" />
    <path d="m10 76 14-10 5 22m32-21 10 9-10 12" fill="#273d53" />
    <path d="m33 73 8 6 8-6m-8 6v9" stroke="#f55470" fill="none" stroke-width="3" />
  </svg>
</template>
