import { fresh, clamp } from './engine'
import { eventById, challenges } from './content'
import type { Save, Report, Clip } from './types'
export const SAVE_KEY = 'fps-streamer-save-v1'
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const obj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
function validClip(v: unknown): v is Clip | null {
  return (
    v === null ||
    (obj(v) &&
      ['技术型', '娱乐型', '教学型'].includes(String(v.type)) &&
      typeof v.title === 'string' &&
      finite(v.quality) &&
      v.quality >= 1 &&
      v.quality <= 100 &&
      finite(v.day) &&
      v.day >= 1 &&
      v.day <= 7 &&
      typeof v.published === 'boolean' &&
      typeof v.promoted === 'boolean')
  )
}
function bounded(v: unknown, lo: number, hi: number, otherwise: number) {
  return finite(v) ? clamp(Math.round(v), lo, hi) : otherwise
}
export function migrate(raw: unknown): Save {
  if (!obj(raw)) throw new Error('存档格式无效')
  const s = fresh()
  for (const k of ['day', 'fans', 'money', 'skill', 'energy', 'rank'] as const)
    if (!finite(raw[k])) throw new Error('存档数据不完整')
  s.day = bounded(raw.day, 1, 7, 1)
  s.fans = bounded(raw.fans, 0, 10000000, 128)
  s.money = bounded(raw.money, 0, 10000000, 200)
  s.skill = bounded(raw.skill, 0, 100, 42)
  s.energy = bounded(raw.energy, 0, 100, 100)
  s.rank = bounded(raw.rank, 0, 4000, 1000)
  s.gear = bounded(raw.gear, 0, 3, 0)
  for (const k of ['trained', 'rested', 'edited'] as const) s[k] = raw[k] === true
  s.style = ['technical', 'entertainment', 'balanced'].includes(String(raw.style))
    ? (raw.style as Save['style'])
    : 'balanced'
  s.exposure = bounded(raw.exposure, 0, 120, 0)
  if (raw.version !== undefined && raw.version !== 4) throw new Error('不支持的存档版本')
  if (raw.version === 4) {
    if (
      !['desk', 'live', 'report'].includes(String(raw.phase)) ||
      !Array.isArray(raw.history) ||
      !Array.isArray(raw.archive)
    )
      throw new Error('存档状态无效')
    s.archive = raw.archive.filter((v): v is string => typeof v === 'string').slice(-60)
    s.history = (raw.history as Save['history'])
      .filter(
        (h) =>
          obj(h) &&
          finite(h.day) &&
          finite(h.fans) &&
          finite(h.money) &&
          finite(h.rank) &&
          typeof h.won === 'boolean',
      )
      .slice(-7)
    s.phase = raw.phase as Save['phase']
    if (s.phase === 'live' || (s.phase === 'report' && raw.match)) {
      const m = raw.match as Save['match']
      if (
        !m ||
        !Number.isInteger(m.stage) ||
        m.stage < 0 ||
        m.stage > 4 ||
        !eventById(m.eventId) ||
        !eventById(m.sideId) ||
        !['technical', 'entertainment', 'balanced'].includes(m.style)
      )
        throw new Error('比赛状态无效')
      for (const k of [
        'seed',
        'economy',
        'gear',
        'team',
        'performance',
        'hype',
        'viewers',
        'peak',
        'gifts',
        'kills',
        'streak',
        'chatCursor',
        'elapsed',
        'hits',
        'roundSeconds',
        'pendingReward',
      ] as const)
        if (!finite(m[k])) throw new Error('比赛数值无效')
      if (
        !Array.isArray(m.score) ||
        m.score.length !== 2 ||
        !m.score.every(finite) ||
        !Array.isArray(m.results) ||
        m.results.length !== m.stage + (m.resolved ? 1 : 0) ||
        typeof m.resolved !== 'boolean' ||
        typeof m.interacted !== 'boolean' ||
        (m.interacted && !m.resolved)
      )
        throw new Error('回合状态无效')
      if (![m.used, m.tags, m.challenges, m.feed, m.chatSeen, m.notifications].every(Array.isArray))
        throw new Error('比赛记录无效')
      if (
        !m.challenges.every(
          (c) =>
            obj(c) &&
            challenges.some((d) => d.id === c.id) &&
            finite(c.from) &&
            finite(c.to) &&
            finite(c.successes) &&
            finite(c.failures) &&
            typeof c.settled === 'boolean',
        )
      )
        throw new Error('挑战无效')
      if (
        !m.feed.every(
          (l) => obj(l) && finite(l.id) && typeof l.name === 'string' && typeof l.text === 'string',
        )
      )
        throw new Error('弹幕无效')
      if (
        !eventById(m.eventId).stages.includes(m.stage) ||
        !eventById(m.sideId).stages.includes(m.stage)
      )
        throw new Error('事件阶段不匹配')
      if (
        !validClip(m.best) ||
        !m.results.every(
          (r, i) =>
            obj(r) &&
            r.stage === i &&
            typeof r.won === 'boolean' &&
            typeof r.choice === 'string' &&
            finite(r.chance) &&
            r.chance >= 0 &&
            r.chance <= 1 &&
            Array.isArray(r.score) &&
            r.score.length === 2 &&
            r.score.every(finite),
        )
      )
        throw new Error('比赛结果损坏')
      if (s.phase === 'report' && (m.stage !== 4 || !m.resolved || !m.interacted))
        throw new Error('结算比赛不完整')
      m.performance = bounded(m.performance, 0, 100, 0)
      m.roundSeconds = bounded(m.roundSeconds, 0, 95, 95)
      m.seed = bounded(m.seed, 0, 4294967295, 1)
      m.economy = bounded(m.economy, 0, 4, 2)
      m.gear = bounded(m.gear, 1, 3, 1)
      m.hype = bounded(m.hype, 0, 160, 0)
      m.team = bounded(m.team, -4, 6, 0)
      m.hits = bounded(m.hits, 0, 3, 0)
      m.feed = m.feed.slice(-12)
      s.match = m
    }
  }
  if (raw.version === undefined && Array.isArray(raw.history))
    s.history = raw.history
      .filter((h) => obj(h) && finite(h.day) && finite(h.fans) && finite(h.money))
      .slice(-7)
      .map((h) => ({
        day: h.day,
        fans: h.fans,
        money: h.money,
        rank: 0,
        won: false,
        clip: null,
        legacy: true,
      }))
  if (raw.phase === 'report') {
    const r = raw.report
    if (!obj(r) || !['fans', 'money', 'rank', 'kills'].every((k) => finite(r[k])))
      throw new Error('结算无效')
    if (raw.version === 4) {
      if (
        typeof r.won !== 'boolean' ||
        !Array.isArray(r.score) ||
        r.score.length !== 2 ||
        !r.score.every(finite) ||
        !finite(r.peak) ||
        !validClip(r.clip) ||
        typeof r.promoted !== 'boolean'
      )
        throw new Error('结算记录无效')
      s.report = r as unknown as Report
    } else
      s.report = {
        fans: r.fans as number,
        money: r.money as number,
        rank: r.rank as number,
        kills: r.kills as number,
        promoted: r.promoted === true,
        won: (r.rank as number) >= 0,
        score: [0, 0],
        peak: 0,
        clip: null,
        legacy: true,
      }
    s.phase = 'report'
  }
  return s
}
export function load(): { state: Save; notice: string } {
  try {
    const text = localStorage.getItem(SAVE_KEY)
    if (!text) return { state: fresh(), notice: '' }
    const raw = JSON.parse(text)
    return {
      state: migrate(raw),
      notice: raw.version === 4 ? '' : '旧版存档已升级到 V0.4，粉丝、资产与生涯进度已保留。',
    }
  } catch {
    return { state: fresh(), notice: '存档损坏或浏览器存储不可用，已安全开启新档。' }
  }
}
export function persist(s: Save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s))
    return true
  } catch {
    return false
  }
}
