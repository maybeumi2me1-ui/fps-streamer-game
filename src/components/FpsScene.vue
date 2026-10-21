<script setup lang="ts">
import { computed, ref, onUnmounted, watch } from 'vue'
import type { Match, Tag } from '../game/types'
import { stageNames } from '../game/content'
import { battleVisual, mapById, type MapId } from '../game/visuals'
import WeaponModel from './WeaponModel.vue'
import CombatAgent from './CombatAgent.vue'
import AgentPortrait from './AgentPortrait.vue'
const props = withDefaults(
  defineProps<{ match: Match | null; mapId?: MapId; preview?: Tag | null }>(),
  { mapId: 'oldtown', preview: null },
)
const emit = defineEmits<{ shoot: [] }>()
const fired = ref(false),
  impact = ref(false)
let flash: ReturnType<typeof setTimeout> | undefined,
  burst: ReturnType<typeof setTimeout> | undefined
const stage = computed(() => props.match?.stage ?? 0)
const visual = computed(() => battleVisual(props.match, props.preview))
const map = computed(() => mapById(props.mapId))
const atlas = `${import.meta.env.BASE_URL}art/tactical-maps.webp`
const background = computed(() => ({
  backgroundImage: `url(${atlas})`,
  backgroundPosition: `center ${map.value.position}`,
}))
const clock = computed(() => {
  const n = props.match?.roundSeconds ?? 95
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`
})
const ammo = computed(() =>
  Math.max(
    0,
    (visual.value.gear === 1 ? 12 : visual.value.gear === 2 ? 24 : 30) - (props.match?.hits ?? 0),
  ),
)
const teamplay = computed(() => visual.value.tag === 'team' || visual.value.tag === 'engage')
const scan = computed(() => visual.value.effect?.kind === 'scan')
function recoil() {
  clearTimeout(flash)
  fired.value = true
  flash = setTimeout(() => (fired.value = false), 180)
}
function shoot() {
  if (!props.match || props.match.resolved || props.match.hits >= 3) return
  emit('shoot')
  recoil()
}
watch(
  () => props.match?.results.length,
  (count, previous) => {
    if (count && count !== previous) {
      impact.value = true
      clearTimeout(burst)
      burst = setTimeout(() => (impact.value = false), 1100)
      if (visual.value.result?.tag !== 'save') recoil()
    }
  },
)
onUnmounted(() => {
  clearTimeout(flash)
  clearTimeout(burst)
})
</script>
<template>
  <div
    class="fps-scene v05-scene"
    :class="[
      `battle-${visual.effect?.kind ?? 'idle'}`,
      `outcome-${visual.outcome}`,
      {
        'scene-fired': fired,
        'clutch-scene': stage === 3,
        'scene-resolved': match?.resolved,
        'battle-impact': impact,
        'is-preview': !!preview,
      },
    ]"
    :data-map="mapId"
    :data-effect="visual.effect?.kind ?? 'idle'"
    :data-outcome="visual.outcome"
  >
    <div
      class="environment-image"
      :style="background"
      role="img"
      :aria-label="`原创地图：${map.name}，${map.note}`"
    ></div>
    <div class="environment-grade"></div>
    <div class="sun-dust">
      <i
        v-for="i in 8"
        :key="i"
        :style="{
          left: ((i * 13) % 100) + '%',
          top: ((i * 17) % 70) + '%',
          animationDelay: i * 0.4 + 's',
        }"
      ></i>
    </div>
    <svg v-if="scan" class="scan-field" viewBox="0 0 1000 560" aria-hidden="true">
      <g fill="none" stroke="#78e8ec">
        <ellipse cx="540" cy="370" rx="175" ry="65" />
        <ellipse cx="540" cy="370" rx="110" ry="40" />
        <path d="M365 370h350m-175-65v130m-125-90 250 50" stroke-dasharray="7 12" />
      </g>
      <path d="M520 238h40v100h-40Z" fill="#74e7eb" opacity=".08" />
    </svg>
    <div v-if="visual.effect?.kind === 'smoke'" class="smoke-dome">
      <i></i><i></i><i></i><span></span>
    </div>
    <div v-if="visual.effect?.kind === 'flash'" class="flash-orb"><i></i><span>✧</span></div>
    <div v-if="visual.effect?.kind === 'dash'" class="dash-trails">
      <i></i><i></i><i></i><i></i>
    </div>
    <div v-if="visual.effect?.kind === 'retreat'" class="retreat-route"><span>↙</span><i></i></div>
    <div v-if="teamplay" class="allied-squad">
      <CombatAgent ally :variant="1" /><CombatAgent ally :variant="2" />
    </div>
    <div
      v-if="match"
      class="enemy-unit"
      :class="{ eliminated: visual.result?.won, escaping: visual.tag === 'save' }"
      :style="{ left: [51, 44, 57, 47, 53][stage] + '%', top: [42, 44, 40, 43, 42][stage] + '%' }"
    >
      <CombatAgent :down="visual.result?.won" :scanned="scan" /><span v-if="scan" class="enemy-lock"
        >目标已侦测</span
      >
    </div>
    <div v-if="match && stage === 3" class="enemy-unit second-enemy">
      <CombatAgent :down="visual.result?.won" :scanned="scan" />
    </div>
    <div v-if="stage === 3 && match" class="signal-beacon"><i></i><span>◇</span></div>
    <div class="weapon-layer" :class="{ 'weapon-lowered': visual.tag === 'save' }">
      <WeaponModel :gear="visual.gear" :fired="fired" />
    </div>
    <div v-if="fired || (impact && visual.tag === 'full')" class="bullet-tracer"></div>
    <div v-if="fired" class="hit-sparks"><i></i><i></i><i></i></div>
    <div class="screen-vignette"></div>
    <div class="scene-stream">
      <span class="scene-live">● {{ match ? 'LIVE 直播中' : 'RANKED 排位准备' }}</span
      ><span v-if="match">♟ {{ match.viewers.toLocaleString() }}</span>
    </div>
    <div class="fps-score">
      <div class="squad-faces"><AgentPortrait v-for="i in 3" :key="i" :variant="i" /></div>
      <span class="team-blue">{{ match?.score[0] ?? 0 }}</span
      ><b>{{ clock }}</b
      ><span class="team-red">{{ match?.score[1] ?? 0 }}</span>
      <div class="squad-faces enemy-faces">
        <AgentPortrait v-for="i in 3" :key="i" :variant="i + 1" />
      </div>
      <small>{{ match ? `第 ${stage + 1} / 5 回合 · 进攻方` : '原创地图 · 七天主播生涯' }}</small>
    </div>
    <div class="minimap" aria-hidden="true">
      <svg viewBox="0 0 100 100">
        <path
          d="M12 72V19h23v17h15V9h17v27h20v23H68v28H47V64H29v21H12Z"
          fill="#7e9398"
          fill-opacity=".3"
          stroke="#b5cbd0"
          stroke-width="3"
        />
        <path d="M23 72V46h20m14-24v26h18M56 72h14" fill="none" stroke="#d4e3dd" stroke-width="6" />
        <circle :cx="30 + stage * 5" cy="60" r="4" fill="#acffad" />
        <circle cx="65" cy="42" r="3" fill="#ff6b86" />
        <circle cx="50" cy="24" r="3" fill="#f2cfa2" /></svg
      ><small>{{ map.area }}</small>
    </div>
    <div v-if="visual.effect" class="skill-announcement">
      <span>{{ preview ? '战术预览' : '战术执行' }}</span> {{ visual.effect.icon }}
      {{ visual.effect.name }}
    </div>
    <div v-if="match" class="kill-feed">
      <span v-if="visual.result" :class="{ kill: visual.result.won }"
        ><AgentPortrait :variant="visual.result.won ? 0 : 2" />{{
          visual.result.won ? '你' : '敌方'
        }}
        <b>⌁</b> {{ visual.result.won ? '敌方' : '队友'
        }}<small>{{ visual.result.choice }}</small></span
      ><span v-if="(match.streak ?? 0) >= 2" class="kill secondary"
        >队伍协作 <b>⌁</b> 关键区域已控制</span
      >
    </div>
    <div class="scene-location">
      <b>{{ match ? stageNames[stage] : map.name }}</b
      ><small>{{
        stage === 3 ? '1 v 2 · 信标已部署' : (visual.effect?.description ?? map.note)
      }}</small>
    </div>
    <div class="reticle" :class="{ hit: fired }"><i></i><i></i><i></i><i></i></div>
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
      <span></span>
    </button>
    <div
      v-if="match?.resolved"
      :key="match.results.length"
      class="round-banner"
      :class="{ lost: !visual.result?.won, saved: visual.tag === 'save' }"
    >
      <span class="result-emblem">{{
        visual.tag === 'save' ? '◇' : visual.result?.won ? '✦' : '×'
      }}</span
      ><b>{{
        visual.tag === 'save' ? '资源已保留' : visual.result?.won ? '回合胜利' : '回合失利'
      }}</b
      ><small>{{ visual.result?.message }}</small
      ><em v-if="match.streak >= 2"
        >{{ match.streak }} 连胜 · {{ match.streak >= 3 ? '高光时刻' : '乘胜追击' }}</em
      >
    </div>
    <div v-if="fired" class="hit-feedback">✕ 命中 · 预瞄 +1%</div>
    <div class="fps-bottom">
      <div class="player-identity">
        <AgentPortrait /><span>夜航 <small>进攻方</small></span>
      </div>
      <span class="health-hud"
        ><em>◈</em> {{ match ? Math.max(25, 100 - stage * 12) : 100 }}<small>HP</small></span
      >
      <div class="ability-hud">
        <span :class="{ active: visual.effect?.kind === 'smoke' }">◉<small>烟幕</small></span
        ><span :class="{ active: scan }">⌖<small>扫描</small></span
        ><span :class="{ active: visual.effect?.kind === 'flash' }">✧<small>闪光</small></span
        ><span :class="{ active: visual.effect?.kind === 'dash' }">ϟ<small>突进</small></span>
      </div>
      <div class="ammo-hud">
        <b>{{ ammo }}</b
        ><small> / {{ visual.gear === 1 ? 36 : 90 }}</small
        ><span>{{
          visual.gear === 1 ? 'P-12 霜牙' : visual.gear === 2 ? 'M-24 雾线' : 'R-09 赤脉'
        }}</span>
      </div>
    </div>
  </div>
</template>
