import { challenges, events, eventById, styles } from './content'
import { audience, chatContext, contexts } from './chat'
import type { Choice, GameEvent, Match, Save, Style, ClipType } from './types'
export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
export const fresh = (): Save => ({
  version: 4,
  day: 1,
  fans: 128,
  money: 200,
  skill: 42,
  energy: 100,
  rank: 1000,
  trained: false,
  rested: false,
  edited: false,
  gear: 0,
  phase: 'desk',
  report: null,
  match: null,
  history: [],
  archive: [],
  exposure: 0,
  style: 'balanced',
})
// Match RNG is saved after every mutation: a reload cannot reroll a decision.
export function random(m: Match) {
  m.seed = (Math.imul(1664525, m.seed) + 1013904223) >>> 0
  return m.seed / 4294967296
}
function eligible(s: Save, e: GameEvent, allowUsed = false) {
  const m = s.match!
  return (
    e.stages.includes(m.stage) &&
    (allowUsed || !m.used.includes(e.id)) &&
    s.rank >= (e.minRank || 0) &&
    s.fans >= (e.minFans || 0) &&
    (!e.requiresTag || m.tags.includes(e.requiresTag)) &&
    (!e.condition ||
      {
        behind: m.score[0] < m.score[1],
        ahead: m.score[0] > m.score[1],
        rich: m.economy >= 3,
        poor: m.economy <= 2,
      }[e.condition])
  )
}
function pick(s: Save, category: GameEvent['category']) {
  const m = s.match!
  let pool = events.filter((e) => e.category === category && eligible(s, e))
  if (!pool.length) pool = events.filter((e) => e.category === category && eligible(s, e, true))
  if (!pool.length) throw new Error(`No event for ${category}/${m.stage}`)
  const recent = pool.filter((e) => !s.archive.slice(-12).includes(e.id))
  if (recent.length) pool = recent
  return pool[Math.floor(random(m) * pool.length)]!.id
}
function selectEvents(s: Save) {
  const m = s.match!
  m.eventId = pick(s, m.stage === 3 ? 'clutch' : 'tactical')
  m.used.push(m.eventId)
  m.sideId = pick(
    s,
    m.stage === 0 ? 'challenge' : m.stage === 1 || m.stage === 3 ? 'teammate' : 'business',
  )
  m.used.push(m.sideId)
}
export function startMatch(s: Save, style: Style, seed = Date.now() >>> 0) {
  if (s.phase !== 'desk') return false
  s.style = style
  s.phase = 'live'
  s.match = {
    style,
    seed,
    stage: 0,
    score: [0, 0],
    economy: 3,
    gear: 1,
    team: style === 'balanced' ? 1 : 0,
    performance: 0,
    hype: 0,
    viewers: 0,
    peak: 0,
    gifts: 0,
    kills: 0,
    streak: 0,
    eventId: '',
    sideId: '',
    resolved: false,
    interacted: false,
    results: [],
    used: [],
    tags: [],
    challenges: [],
    best: null,
    feed: [],
    chatCursor: 0,
    chatSeen: [],
    elapsed: 0,
    hits: 0,
    roundSeconds: 95,
    notifications: [],
    pendingReward: 0,
  }
  selectEvents(s)
  updateViewers(s)
  appendChat(s)
  return true
}
export function activeChallenges(m: Match) {
  return m.challenges.filter((c) => !c.settled && m.stage >= c.from && m.stage <= c.to)
}
export function choiceBlocked(s: Save, c: Choice): string {
  const m = s.match
  if (!m) return '尚未开播'
  if (c.economy < 0 && m.economy < -c.economy) return '经济不足'
  for (const a of activeChallenges(m)) {
    const d = challenges.find((x) => x.id === a.id)!
    if (d.requiredTag && c.tag !== d.requiredTag && c.tag !== 'full') return '挑战要求激进打法'
    if (d.bannedTag === 'eco' && (c.tag === 'eco' || c.tag === 'save')) return '挑战禁止 ECO / 保枪'
    if (d.bannedTag === c.tag) return '挑战禁止团队配合'
    if (d.maxGear && c.gear && c.gear > d.maxGear) return '挑战限制装备档位'
  }
  return ''
}
export function chance(s: Save, c: Choice) {
  const m = s.match!
  if (c.tag === 'save') return 0
  const gear = Math.min(
    c.gear ?? m.gear,
    ...activeChallenges(m).map((a) => challenges.find((d) => d.id === a.id)!.maxGear ?? 3),
  )
  const penalty = activeChallenges(m).reduce(
    (sum, a) => sum + challenges.find((d) => d.id === a.id)!.penalty,
    0,
  )
  const pressure = m.score[0] < m.score[1] ? -0.025 : m.score[0] > m.score[1] ? 0.015 : 0
  return clamp(
    0.39 +
      s.skill * 0.003 +
      (s.energy - 70) * 0.0015 +
      (gear - 1) * 0.065 +
      m.team * 0.015 +
      c.chance +
      styles[m.style].chance +
      pressure -
      penalty +
      m.hits * 0.01 -
      (s.rank - 1000) * 0.00006,
    0.12,
    0.92,
  )
}
function updateViewers(s: Save) {
  const m = s.match!
  m.viewers = Math.round(
    clamp(
      12 +
        s.fans * 0.16 +
        s.exposure * 0.6 +
        m.hype * 1.4 +
        m.performance * 0.6 +
        m.stage * 8 +
        Math.max(0, m.streak) * 8,
      5,
      12000,
    ),
  )
  m.peak = Math.max(m.peak, m.viewers)
}
function say(
  m: Match,
  name: string,
  text: string,
  kind: 'chat' | 'follow' | 'gift' | 'challenge' = 'chat',
) {
  m.feed.push({ id: ++m.chatCursor, name, text, kind })
  m.feed = m.feed.slice(-12)
}
function mark(s: Save, text: string) {
  const m = s.match!
  m.notifications.push(text)
  m.notifications = m.notifications.slice(-5)
}
function makeClip(s: Save, type: ClipType, title: string, quality: number) {
  const m = s.match!
  const q = clamp(
    Math.round(
      quality +
        (type === '技术型' && m.style === 'technical' ? 8 : 0) +
        (type === '娱乐型' && m.style === 'entertainment' ? 8 : 0),
    ),
    1,
    100,
  )
  if (!m.best || q > m.best.quality)
    m.best = { type, title, quality: q, day: s.day, published: false, promoted: false }
}
export function shoot(s: Save) {
  const m = s.match
  if (s.phase !== 'live' || !m || m.resolved || m.hits >= 3) return false
  m.hits++
  return true
}
export function resolveRound(s: Save, id: string) {
  const m = s.match
  if (s.phase !== 'live' || !m || m.resolved) return false
  const e = eventById(m.eventId),
    c = e.choices.find((c) => c.id === id)
  if (!c || choiceBlocked(s, c)) return false
  const p = chance(s, c),
    won = c.tag !== 'save' && random(m) < p
  m.economy = clamp(m.economy + c.economy, 0, 4)
  m.gear = c.gear ?? m.gear
  for (const a of activeChallenges(m)) {
    const d = challenges.find((d) => d.id === a.id)!
    if (d.maxGear) m.gear = Math.min(m.gear, d.maxGear)
  }
  m.team = clamp(m.team + c.team + (won ? 1 : -1), -4, 6)
  s.energy = clamp(s.energy - 7, 0, 100)
  m.kills += won ? 3 : 1
  m.performance = clamp(m.performance + (won ? 16 : 5) + (c.tag === 'save' ? -4 : 0), 0, 100)
  const hype = c.hype + (c.tag === 'risky' ? (won ? 18 : 6) : won ? 3 : 5)
  m.hype = clamp(m.hype + Math.round(hype * styles[m.style].hype), 0, 160)
  m.streak = won ? Math.max(0, m.streak) + 1 : Math.min(0, m.streak) - 1
  m.tags.push(c.tag)
  m.economy = clamp(m.economy + 1 + (won ? 0 : 1), 0, 4)
  if (!won && c.tag !== 'save') m.gear = Math.max(1, m.gear - 1)
  // Each key round represents a four-round segment. All five segments decide the match.
  m.score = [m.score[0] + (won ? 3 : 1), m.score[1] + (won ? 1 : 3)]
  if (m.stage === 4) {
    const win = m.score[0] > m.score[1]
    const margin = Math.abs(m.score[0] - m.score[1])
    m.score = win
      ? [13, Math.max(3, 12 - Math.ceil(margin / 2))]
      : [Math.max(3, 12 - Math.ceil(margin / 2)), 13]
  }
  for (const a of activeChallenges(m)) {
    if (won) a.successes++
    else a.failures++
    if (m.stage === a.to) {
      a.settled = true
      if (a.failures === 0) {
        m.hype = clamp(m.hype + 18, 0, 160)
        m.gifts = clamp(m.gifts + 12, 0, 90)
        m.pendingReward += 12
        say(m, '老板不差钱', '挑战完成，送上 ¥12 咖啡！', 'gift')
        makeClip(s, '娱乐型', '挑战兑现：说到做到', 65 + m.hype * 0.15)
      } else say(m, '老粉阿强', '挑战结束，没全赢也算勇气可嘉。', 'challenge')
    }
  }
  const message =
    c.tag === 'save'
      ? '保留装备，主动放弃本回合'
      : won
        ? '关键回合拿下，队伍获得主动权'
        : '对手抓住机会，准备调整下一波'
  m.results.push({
    stage: m.stage,
    title: e.title,
    choice: c.label,
    tag: c.tag,
    won,
    chance: p,
    kills: won ? 3 : 1,
    score: [...m.score],
    message,
  })
  m.resolved = true
  makeClip(
    s,
    !won ? '娱乐型' : c.clip,
    won ? (m.stage === 3 ? '港区极限残局' : `${c.label} · 精彩回合`) : `${c.label} · 意外现场`,
    (won ? 48 : 30) +
      m.stage * 3 +
      (c.tag === 'risky' ? 14 : 0) +
      m.hype * 0.15 +
      (m.streak >= 2 && c.clip === '教学型' ? 12 : 0),
  )
  updateViewers(s)
  say(
    m,
    won ? '枪法质检员' : '老粉阿强',
    `${c.label}，${won ? '漂亮拿下' : '这波没成，调整一下'}。`,
  )
  if (m.hype > 15) {
    say(
      m,
      '关注通知',
      `路人${100 + s.day * 10 + m.stage}关注了你，新增关注计入下播结算。`,
      'follow',
    )
    mark(s, '新观众已关注 · 下播统一结算')
  }
  if (m.hype >= 35 && m.stage % 2 === 0) {
    const gift = clamp(Math.round(m.hype / 15), 2, 10)
    m.gifts = clamp(m.gifts + gift, 0, 90)
    m.pendingReward += gift
    say(m, '老板不差钱', `送出 ¥${gift} 咖啡，已计入本场礼物。`, 'gift')
  }
  return true
}
export function interact(s: Save, id: string) {
  const m = s.match
  if (s.phase !== 'live' || !m || !m.resolved || m.interacted) return false
  const e = eventById(m.sideId),
    c = e.choices.find((c) => c.id === id)
  if (!c) return false
  m.interacted = true
  if (c.challengeId) {
    m.challenges.push({
      id: c.challengeId,
      from: m.stage + 1,
      to: m.stage + 2,
      successes: 0,
      failures: 0,
      settled: false,
    })
    say(
      m,
      '切片大师',
      `接受了${challenges.find((d) => d.id === c.challengeId)!.title}，下一回合生效！`,
      'challenge',
    )
  }
  m.team = clamp(m.team + c.team, -4, 6)
  m.economy = clamp(m.economy + c.economy, 0, 4)
  m.hype = clamp(m.hype + Math.round(c.hype * styles[m.style].hype), 0, 160)
  if (e.category === 'business' || e.id === 'mate-behind') s.energy = clamp(s.energy - 3, 0, 100)
  if (c.hype > 0) makeClip(s, c.clip, e.title, 35 + m.hype * 0.24 + m.performance * 0.15)
  say(m, e.category === 'teammate' ? '排位受害者' : '老粉阿强', `${c.label}，直播间收到。`)
  updateViewers(s)
  return true
}
export function abandonChallenge(s: Save) {
  const m = s.match
  if (s.phase !== 'live' || !m || m.resolved) return false
  const active = activeChallenges(m)
  if (!active.length) return false
  for (const a of active) a.settled = true
  m.hype = clamp(m.hype - 5, 0, 160)
  say(m, '切片大师', '挑战已放弃，后续限制解除，本次不发挑战奖励。', 'challenge')
  return true
}
export function advance(s: Save) {
  const m = s.match
  if (s.phase !== 'live' || !m || !m.resolved || !m.interacted) return false
  if (m.stage === 4) {
    settle(s)
    return true
  }
  m.stage++
  m.resolved = false
  m.interacted = false
  m.hits = 0
  m.roundSeconds = 95
  selectEvents(s)
  updateViewers(s)
  return true
}
function settle(s: Save) {
  const m = s.match!
  const won = m.score[0] > m.score[1]
  const desiredRank = won
    ? Math.round(24 + m.performance * 0.24)
    : -Math.round(12 + (100 - m.performance) * 0.07)
  const rank = clamp(s.rank + desiredRank, 0, 4000) - s.rank
  const fans = Math.round(
    clamp(12 + m.hype * 0.85 + m.performance * 0.35 + s.exposure * 0.45 + s.gear * 4, 12, 240),
  )
  const money = Math.round(clamp(18 + m.peak * 0.12 + m.gifts + s.gear * 10, 18, 180))
  s.report = {
    fans,
    money,
    rank,
    kills: m.kills,
    promoted: false,
    won,
    score: [...m.score],
    peak: m.peak,
    clip: m.best,
  }
  s.fans += fans
  s.money += money
  s.rank = clamp(s.rank + rank, 0, 4000)
  s.archive = [...s.archive, ...m.used].slice(-60)
  s.history.push({ day: s.day, fans: s.fans, money, rank: s.rank, won, clip: m.best })
  s.history = s.history.slice(-7)
  s.exposure = 0
  s.phase = 'report'
}
export function publishClip(s: Save) {
  const c = s.report?.clip
  if (s.phase !== 'report' || !c || c.published) return false
  c.published = true
  const gain = Math.min(45, Math.round(c.quality * 0.4))
  s.fans += gain
  s.report!.fans += gain
  s.exposure = Math.min(100, Math.round(c.quality * 0.8))
  const h = s.history.at(-1)
  if (h) {
    h.fans = s.fans
    h.clip = c
  }
  return true
}
export function promoteClip(s: Save) {
  const c = s.report?.clip
  if (s.phase !== 'report' || !c || !c.published || c.promoted || s.money < 80) return false
  c.promoted = true
  s.report!.promoted = true
  s.money -= 80
  s.exposure = Math.min(120, s.exposure + 25)
  return true
}
export function nextDay(s: Save) {
  if (s.phase !== 'report' || s.day >= 7) return false
  s.day++
  s.phase = 'desk'
  s.energy = clamp(s.energy + 65, 0, 100)
  s.trained = false
  s.rested = false
  s.edited = false
  s.report = null
  s.match = null
  return true
}
export function dailyAction(s: Save, action: 'train' | 'rest' | 'edit' | 'upgrade') {
  if (s.phase !== 'desk') return false
  if (action === 'train') {
    if (s.trained || s.energy < 20) return false
    s.trained = true
    s.energy -= 20
    s.skill = clamp(s.skill + 6, 0, 100)
  } else if (action === 'rest') {
    if (s.rested) return false
    s.rested = true
    s.energy = clamp(s.energy + 25, 0, 100)
  } else if (action === 'edit') {
    if (s.edited || s.energy < 15) return false
    s.edited = true
    s.energy -= 15
    s.exposure = Math.min(120, s.exposure + 20)
  } else {
    const cost = 150 * (s.gear + 1)
    if (s.gear >= 3 || s.money < cost) return false
    s.gear++
    s.money -= cost
  }
  return true
}
export function appendChat(s: Save) {
  const m = s.match
  if (s.phase !== 'live' || !m) return
  const pool = chatContext(s, m)
  const context = pool[Math.floor(random(m) * pool.length)]!
  const idx = contexts.indexOf(context)
  let people = audience.filter((a) => !m.chatSeen.includes(`${a.name}:${idx}`))
  if (!people.length) {
    m.chatSeen = m.chatSeen.slice(-12)
    people = audience.filter((a) => !m.chatSeen.includes(`${a.name}:${idx}`))
  }
  const a = people[Math.floor(random(m) * people.length)] ?? audience[0]!
  let text = a.lines[idx]!
  if (context === 'streak')
    text = `连续${m.streak > 0 ? '拿下' : '丢掉'} ${Math.abs(m.streak)} 个关键回合。${text}`
  if (context === 'history') {
    const remembered = eventById(s.archive.at(-1) ?? '')
    if (remembered) text = `上次的「${remembered.title}」我还记得。${text}`
  }
  if (m.chatCursor % 7 === 0) {
    if (m.hype >= 70) text = `节目效果 ${m.hype}，今天的直播有点热闹。`
    else if (s.fans >= 350) text = `已经 ${s.fans} 个粉丝了，记得照顾新朋友。`
    else text = `${s.fans} 人的小直播间，慢慢来。`
  }
  m.chatSeen.push(`${a.name}:${idx}`)
  m.chatSeen = m.chatSeen.slice(-60)
  say(m, a.name, text)
}
export function tick(s: Save, seconds: number) {
  const m = s.match
  if (s.phase !== 'live' || !m) return
  m.elapsed += seconds
  if (!m.resolved) m.roundSeconds = Math.max(0, m.roundSeconds - seconds)
  appendChat(s)
}
