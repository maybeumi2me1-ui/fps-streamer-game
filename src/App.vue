<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import FpsScene from './components/FpsScene.vue'
import { events, eventById, styles, challenges, stageNames } from './game/content'
import { audience } from './game/chat'
import {
  fresh,
  startMatch,
  dailyAction,
  resolveRound,
  interact,
  advance,
  shoot,
  chance,
  choiceBlocked,
  activeChallenges,
  abandonChallenge,
  tick,
  publishClip,
  promoteClip,
  nextDay,
} from './game/engine'
import { load, persist } from './game/storage'
import { adService } from './game/ads'
import type { Choice, Style } from './game/types'
const initial = load(),
  s = ref(initial.state),
  notice = ref(initial.notice),
  showData = ref(false)
const live = computed(() => s.value.phase === 'live'),
  m = computed(() => s.value.match)
const current = computed(() => (m.value ? eventById(m.value.eventId) : null))
const side = computed(() => (m.value ? eventById(m.value.sideId) : null))
const tier = computed(() =>
  s.value.rank >= 1400
    ? '铂金 III'
    : s.value.rank >= 1250
      ? '黄金 III'
      : s.value.rank >= 1100
        ? '白银 I'
        : '白银 III',
)
const ended = computed(() => s.value.day === 7 && s.value.phase === 'report')
const active = computed(() => (m.value ? activeChallenges(m.value) : []))
const styleKeys = Object.keys(styles) as Style[]
const timerText = computed(() => {
  const t = m.value?.elapsed ?? 0
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
})
function save() {
  if (!persist(s.value)) notice.value = '浏览器存储不可用，进度暂时只保留在当前页面。'
}
function act(action: 'train' | 'rest' | 'edit' | 'upgrade') {
  if (dailyAction(s.value, action)) {
    notice.value = {
      train: '训练完成：枪法 +6，体力 -20。',
      rest: '休息完成：体力 +25。',
      edit: '剪辑预热完成：下场曝光 +20，体力 -15。',
      upgrade: '设备升级完成，提升后续直播收益。',
    }[action]
    save()
  }
}
function styleSelect(style: Style) {
  if (s.value.phase !== 'desk') return
  s.value.style = style
  save()
}
function start() {
  if (startMatch(s.value, s.value.style)) {
    notice.value = '已开播。每回合先做排位决策，再回应一次直播互动。'
    save()
  }
}
function choose(c: Choice) {
  if (resolveRound(s.value, c.id)) save()
}
function respond(c: Choice) {
  if (interact(s.value, c.id)) save()
}
function next() {
  if (advance(s.value)) {
    notice.value = ''
    save()
  }
}
function hit() {
  if (shoot(s.value)) save()
}
function cancelChallenge() {
  if (abandonChallenge(s.value)) save()
}
function publish() {
  if (publishClip(s.value)) {
    notice.value = '切片已发布！获得少量即时关注，主要曝光会在下一场直播转化。'
    save()
  }
}
function promote() {
  if (promoteClip(s.value)) {
    notice.value = '已花费 ¥80 推广，下一场曝光 +25（总上限 120）。'
    save()
  }
}
async function ad() {
  if (!(await adService.isAvailable())) {
    notice.value = '激励广告尚未接入，免费发布和金币推广均可正常使用。'
    return
  }
  const result = await adService.showRewarded()
  notice.value = result.completed
    ? '广告完成；本版本尚未启用广告奖励。'
    : '广告未完成，不影响继续游戏。'
}
function tomorrow() {
  if (nextDay(s.value)) {
    notice.value = '新的一天：体力恢复 65，昨夜切片曝光将进入下一场直播。'
    save()
  }
}
function restart() {
  if (!confirm('重新开始会覆盖当前 7 天存档，确定吗？')) return
  s.value = fresh()
  showData.value = false
  notice.value = '新的主播生涯开始了。'
  save()
}
// Exactly one timeout chain; phase transitions and unmount always stop it.
let timer: ReturnType<typeof setTimeout> | undefined
function stopTimer() {
  clearTimeout(timer)
  timer = undefined
}
function schedule() {
  stopTimer()
  if (!live.value) return
  const delay = 1800 + Math.round(Math.random() * 1800)
  timer = setTimeout(() => {
    if (live.value && document.visibilityState !== 'hidden') {
      tick(s.value, Math.round(delay / 1000))
      save()
    }
    schedule()
  }, delay)
}
watch(
  live,
  (value) => {
    stopTimer()
    if (value) schedule()
  },
  { immediate: true },
)
onUnmounted(stopTimer)
const probability = (c: Choice) => Math.round(chance(s.value, c) * 100)
</script>

<template>
  <div class="shell">
    <header>
      <a class="brand" href="./"
        ><span class="logo">⌖</span> STREAMER<span class="brand-light">
          / FPS 主播模拟器 <b>V0.4</b></span
        ></a
      >
      <div class="header-right">
        <span class="saved">● 本地自动存档</span
        ><button class="quiet" @click="restart">重新开始</button>
      </div>
    </header>
    <main>
      <div class="heading">
        <div>
          <div class="eyebrow">RANKED × STREAMING / TWO WAYS TO SHINE</div>
          <h1>
            {{
              live
                ? '每一回合，都有人看见。'
                : s.phase === 'report'
                  ? ended
                    ? '七天之后，找到你的主场。'
                    : '胜负有结果，直播有故事。'
                  : '从一张桌子，到整个舞台。'
            }}
          </h1>
          <p>
            {{
              live
                ? '竞技与节目效果同样重要。五个关键节点，决定今天的排位与直播。'
                : '开播准备 → 选择风格 → 排位比赛 → 直播互动 → 下播成长'
            }}
          </p>
        </div>
        <div class="day">
          <small>生涯进度</small
          ><strong>DAY {{ String(s.day).padStart(2, '0') }}<em> / 07</em></strong>
          <div class="day-track"><i v-for="d in 7" :key="d" :class="{ done: d <= s.day }"></i></div>
        </div>
      </div>
      <div class="layout">
        <section class="workspace">
          <div class="window-bar">
            <span
              ><b class="dot"></b
              >{{ live ? 'LIVE STUDIO' : s.phase === 'report' ? 'STREAM REPORT' : 'MY DESKTOP' }}
              <small
                >/
                {{
                  live ? '● ' + timerText : s.phase === 'report' ? '直播结算' : '主播工作台'
                }}</small
              ></span
            ><span class="window-icons">V0.4　—　□</span>
          </div>
          <template v-if="s.phase !== 'report'">
            <div class="game" :class="{ desktop: !live }">
              <div class="game-top">
                <span class="map">▧ TWILIGHT HARBOR <small>暮光港区 · 原创地图</small></span
                ><span class="live-badge" v-if="live">● LIVE · {{ m?.viewers }} 人观看</span
                ><span class="offline" v-else>排位准备</span>
              </div>
              <FpsScene :match="live ? m : null" @shoot="hit" />
            </div>
            <div v-if="!live" class="desk-actions">
              <div class="section-title">
                <span>01 / 开播准备</span><small>每日行动各一次 · 设备最高 Lv.4</small>
              </div>
              <div class="prep-actions">
                <button :disabled="s.trained || s.energy < 20" @click="act('train')">
                  ⌖ {{ s.trained ? '已练枪' : '练枪' }}<small>枪法 +6 / 体力 -20</small></button
                ><button :disabled="s.edited || s.energy < 15" @click="act('edit')">
                  ✂ {{ s.edited ? '已剪辑' : '剪辑预热'
                  }}<small>下场曝光 +20 / 体力 -15</small></button
                ><button :disabled="s.rested" @click="act('rest')">
                  ☾ {{ s.rested ? '已休息' : '休息' }}<small>体力 +25</small></button
                ><button
                  :disabled="s.gear >= 3 || s.money < 150 * (s.gear + 1)"
                  @click="act('upgrade')"
                >
                  ▣ 升级设备<small>{{ s.gear >= 3 ? '已满级' : '¥' + 150 * (s.gear + 1) }}</small>
                </button>
              </div>
              <div class="section-title style-heading">
                <span>02 / 今天以什么风格开播？</span><small>每场固定，下一天可调整</small>
              </div>
              <div class="style-options" role="group" aria-label="直播风格">
                <button
                  v-for="key in styleKeys"
                  :key="key"
                  :aria-pressed="s.style === key"
                  :class="{ selected: s.style === key }"
                  @click="styleSelect(key)"
                >
                  <b>{{ styles[key].name }}</b
                  ><small>{{ styles[key].text }}</small>
                </button>
              </div>
              <button class="start-stream" @click="start">
                ▷ 开始今日直播 <span>五个关键回合，竞技与经营各占一半 →</span>
              </button>
              <p class="hint">
                当前下场曝光 {{ s.exposure }} / 120 · 切片转化有上限，广告不是通关条件。
              </p>
            </div>
            <div v-else-if="m && current && side" class="event-panel">
              <div class="round-steps">
                <span
                  v-for="(name, i) in stageNames"
                  :key="name"
                  :class="{ complete: i < m.stage, current: i === m.stage }"
                  >{{ i + 1 }} {{ name }}</span
                >
              </div>
              <div class="match-resources">
                <span
                  >经济 <b>{{ m.economy }} / 4</b></span
                ><span
                  >装备 <b>{{ ['', '手枪', '冲锋枪', '步枪重甲'][m.gear] }}</b></span
                ><span
                  >队伍状态 <b>{{ m.team > 0 ? '+' : '' }}{{ m.team }}</b></span
                ><span
                  >预瞄 <b>{{ m.hits }} / 3</b></span
                >
              </div>
              <div v-for="a in active" :key="a.id" class="challenge-active">
                <span
                  >⚑ {{ challenges.find((d) => d.id === a.id)?.title }} · 节点 {{ a.from + 1 }}–{{
                    a.to + 1
                  }}<small
                    >{{ challenges.find((d) => d.id === a.id)?.text }} 全部获胜后才发奖励。</small
                  ></span
                ><button v-if="!m.resolved" @click="cancelChallenge">放弃挑战</button>
              </div>
              <template v-if="!m.resolved"
                ><div class="section-title">
                  <span>竞技决策 · {{ m.stage + 1 }} / 5</span
                  ><small>可选预瞄每次 +1% · 上限 +3%</small>
                </div>
                <h2>{{ current.title }}</h2>
                <p>{{ current.text }}</p>
                <div class="strategy-choices">
                  <button
                    v-for="c in current.choices"
                    :key="c.id"
                    :disabled="!!choiceBlocked(s, c)"
                    :title="choiceBlocked(s, c)"
                    @click="choose(c)"
                  >
                    <div>
                      <b>{{ c.label }}</b
                      ><strong :class="{ danger: probability(c) < 45 }"
                        >{{ probability(c) }}%<small> 预计胜率</small></strong
                      >
                    </div>
                    <small>{{ c.hint }}</small
                    ><em v-if="choiceBlocked(s, c)">{{ choiceBlocked(s, c) }}</em>
                  </button>
                </div>
                <p class="hint">
                  胜率综合枪法、精力、装备、战术、队伍、局势和挑战。关键节点代表若干普通回合，五次结果共同决定整场。
                </p></template
              >
              <template v-else
                ><div class="round-result" :class="{ negative: !m.results.at(-1)?.won }">
                  <b>{{ m.results.at(-1)?.won ? '拿下关键回合' : '本回合失利' }}</b
                  ><span
                    >{{ m.results.at(-1)?.choice }} · 实际决策胜率
                    {{ Math.round((m.results.at(-1)?.chance ?? 0) * 100) }}%</span
                  >
                </div>
                <template v-if="!m.interacted"
                  ><div class="section-title">
                    <span
                      >直播互动 ·
                      {{
                        side.category === 'challenge'
                          ? '观众挑战'
                          : side.category === 'teammate'
                            ? '队友沟通'
                            : '主播经营'
                      }}</span
                    ><small>互动也会影响后续状态</small>
                  </div>
                  <h2>{{ side.title }}</h2>
                  <p>{{ side.text }}</p>
                  <div class="strategy-choices interaction">
                    <button v-for="c in side.choices" :key="c.id" @click="respond(c)">
                      <b>{{ c.label }}</b
                      ><small>{{ c.hint }}</small>
                    </button>
                  </div></template
                ><template v-else
                  ><div class="interaction-done">✓ 本回合互动已完成，进度已保存。</div>
                  <button class="continue" @click="next">
                    {{ m.stage === 4 ? '下播结算' : '进入下一回合' }} →
                  </button></template
                ></template
              >
            </div>
          </template>
          <div v-else-if="s.report" class="report">
            <div class="report-icon">{{ s.report.won ? '✦' : '◇' }}</div>
            <div class="eyebrow">{{ ended ? 'SEASON COMPLETE' : 'STREAM COMPLETE' }}</div>
            <h2>
              {{
                ended
                  ? '你的第一季，圆满收官'
                  : s.report.legacy
                    ? '旧版直播记录'
                    : s.report.won
                      ? '赢下排位，也赢得关注。'
                      : '排位失利，故事还在继续。'
              }}
            </h2>
            <p>
              {{
                ended
                  ? `7 天积累 ${s.fans} 位粉丝 · ${tier} · 找到属于自己的直播风格。`
                  : '输赢之外，每一次互动也在积累你的主播生涯。'
              }}
            </p>
            <div v-if="!s.report.legacy" class="final-score" :class="{ negative: !s.report.won }">
              {{ s.report.won ? 'VICTORY' : 'DEFEAT' }}
              <strong>{{ s.report.score[0] }} : {{ s.report.score[1] }}</strong>
            </div>
            <div class="results report-results">
              <div>
                <small>排位分</small
                ><strong>{{ s.report.rank > 0 ? '+' : '' }}{{ s.report.rank }}</strong>
              </div>
              <div>
                <small>新增粉丝</small><strong>+{{ s.report.fans }}</strong>
              </div>
              <div>
                <small>直播收入</small><strong>¥{{ s.report.money }}</strong>
              </div>
              <div>
                <small>最高人气</small><strong>{{ s.report.peak }}</strong>
              </div>
            </div>
            <div v-if="s.report.clip" class="best-clip">
              <div class="clip-label">TODAY'S BEST / 每日仅保留最佳一条</div>
              <div class="clip-title">
                <span>{{ s.report.clip.type }}</span>
                <h3>{{ s.report.clip.title }}</h3>
                <strong>{{ s.report.clip.quality }}<small> / 100</small></strong>
              </div>
              <p>
                免费发布获得最多 45 位即时关注，质量决定次日曝光。金币推广只增加次日曝光，总上限
                120。
              </p>
              <div class="clip-buttons">
                <button :disabled="s.report.clip.published" @click="publish">
                  {{ s.report.clip.published ? '已发布 ✓' : '免费发布切片' }}</button
                ><button
                  :disabled="!s.report.clip.published || s.report.clip.promoted || s.money < 80"
                  @click="promote"
                >
                  {{ s.report.clip.promoted ? '已推广 ✓' : '金币推广 ¥80' }}</button
                ><button class="ad-placeholder" @click="ad">广告推广（未接入）</button>
              </div>
              <p class="exposure-note">
                下一场曝光 {{ s.exposure }} / 120{{ ended ? ' · 本季结束，曝光不跨新档保留' : '' }}
              </p>
            </div>
            <div v-if="m" class="round-history">
              <div v-for="r in m.results" :key="r.stage">
                <span>{{ stageNames[r.stage] }}</span
                ><b :class="{ loss: !r.won }">{{ r.won ? '胜' : '负' }}</b
                ><small>{{ r.choice }}</small>
              </div>
            </div>
            <button class="next-day" @click="ended ? restart() : tomorrow()">
              {{ ended ? '开启新的主播生涯' : '休息一下，迎接第 ' + (s.day + 1) + ' 天' }} →
            </button>
          </div>
        </section>
        <aside>
          <section class="profile">
            <div class="profile-label">
              主播档案 <span>{{ styles[s.style].name }} / DAY {{ s.day }}</span>
            </div>
            <div class="identity">
              <div class="avatar">⌐■_■</div>
              <div>
                <h2>无名之辈</h2>
                <small>排位有起伏，直播不止输赢。</small>
              </div>
              <span class="status-light"></span>
            </div>
            <div class="stats">
              <div>
                <small>关注粉丝</small><strong>{{ s.fans.toLocaleString() }}<em> 人</em></strong>
              </div>
              <div>
                <small>钱包余额</small><strong><em>¥ </em>{{ s.money.toLocaleString() }}</strong>
              </div>
            </div>
            <div class="rank">
              <span>◇</span>
              <div>
                <small>当前段位</small><b>{{ tier }}</b>
              </div>
              <small>{{ s.rank }} RP</small>
            </div>
            <div class="meter-label">
              <span>枪法水平</span><b>{{ s.skill }} / 100</b>
            </div>
            <div class="meter"><i :style="{ width: s.skill + '%' }"></i></div>
            <div class="meter-label">
              <span>今日精力</span><b>{{ s.energy }} / 100</b>
            </div>
            <div class="meter energy"><i :style="{ width: s.energy + '%' }"></i></div>
            <div v-if="live && m" class="live-metrics">
              <div>
                <small>本场表现</small><strong>{{ m.performance }}<em>/100</em></strong>
              </div>
              <div>
                <small>节目效果</small><strong>{{ m.hype }}<em>/160</em></strong>
              </div>
              <div>
                <small>最高人气</small><strong>{{ m.peak }}</strong>
              </div>
              <div>
                <small>本场礼物</small><strong>¥{{ m.gifts }}</strong>
              </div>
            </div>
          </section>
          <section class="chat">
            <div class="section-title">
              <span>◌ 直播弹幕</span><small>{{ live ? '实时连线' : '等待开播' }}</small>
            </div>
            <div v-if="live && m" class="messages live-chat" role="log" aria-label="实时弹幕">
              <p v-for="line in m.feed" :key="line.id" :class="line.kind">
                <span>{{ line.name }}</span> {{ line.text }}
              </p>
            </div>
            <div v-else class="chat-empty">
              <span>☏</span>
              <p>有人在等你开播。</p>
              <small>8 位常驻观众，每个人都有自己的偏好。</small>
            </div>
            <div class="chat-input">
              {{ live ? '弹幕逐条刷新 · 不影响决策时间' : '直播间还没有开启…' }}<span>↵</span>
            </div>
          </section>
          <button class="data-button" @click="showData = true">
            ▥ 数据中心 · 成长与常驻观众 →
          </button>
          <div class="tip">
            <span>↗</span>
            <p>
              <b>今日主播小贴士</b><br />稳健赢分，冒险出片。<br />ECO 攒资源，保枪保装备。<br />倒计时仅表现氛围，不会替你决策。
            </p>
          </div>
        </aside>
      </div>
      <p v-if="notice" class="notice" role="status">{{ notice }}</p>
      <footer>
        <span>FPS STREAMER SIMULATOR / V0.4</span
        ><span>原创港区 · 五回合排位 · 七天生涯 <b>GLHF ↗</b></span>
      </footer>
    </main>
    <div
      v-if="showData"
      class="modal-backdrop"
      @click.self="showData = false"
      @keydown.esc="showData = false"
    >
      <section
        class="data-modal"
        role="dialog"
        aria-modal="true"
        aria-label="数据中心"
        tabindex="-1"
      >
        <button class="close" @click="showData = false">关闭 ×</button>
        <div class="eyebrow">CAREER OVERVIEW</div>
        <h2>数据中心</h2>
        <p>{{ s.fans }} 位粉丝 · {{ tier }} · 设备 Lv.{{ s.gear + 1 }}</p>
        <p v-if="!s.history.length">完成首场直播后记录成长。旧版资产与历史记录已保留。</p>
        <div v-for="h in s.history" :key="h.day" class="history-row">
          <b>第 {{ h.day }} 天 {{ h.legacy ? '旧版' : h.won ? '胜' : '负' }}</b
          ><span>{{ h.fans }} 粉丝</span><span>{{ h.legacy ? '—' : h.rank + ' RP' }}</span
          ><span>¥{{ h.money }}</span>
        </div>
        <h3>常驻观众</h3>
        <div v-for="a in audience" :key="a.name" class="audience-row">
          <b>{{ a.name }}</b
          ><small>{{ a.personality }}</small>
        </div>
        <p class="hint">
          内容库：{{ events.length }} 个条件事件 · 96 条基础弹幕，另有动态状态、关注与礼物通知。
        </p>
      </section>
    </div>
  </div>
</template>
