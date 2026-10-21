import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  fresh,
  startMatch,
  resolveRound,
  interact,
  advance,
  chance,
  choiceBlocked,
  dailyAction,
  nextDay,
  publishClip,
  promoteClip,
  activeChallenges,
  abandonChallenge,
  appendChat,
  tick,
  shoot,
} from '../src/game/engine'
import { events, eventById, challenges } from '../src/game/content'
import { audience, chatContext } from '../src/game/chat'
import { migrate } from '../src/game/storage'
import { adService } from '../src/game/ads'
import type { Save, Tag, Style } from '../src/game/types'
function round(s: Save, tag?: Tag) {
  const m = s.match!
  const choices = eventById(m.eventId).choices.filter((c) => !choiceBlocked(s, c))
  const c = choices.find((c) => c.tag === tag) ?? choices[0]!
  assert.ok(c)
  assert.ok(resolveRound(s, c.id))
  assert.ok(interact(s, eventById(m.sideId).choices.find((c) => !c.challengeId)!.id))
  assert.ok(advance(s))
}
function finish(s: Save, tag?: Tag) {
  while (s.phase === 'live') round(s, tag)
}
test('30 distinct conditional events: required 10/5/5/5/5 categories; 96 unique authored chats', () => {
  assert.equal(events.length, 30)
  assert.equal(new Set(events.map((e) => e.id)).size, 30)
  for (const [k, n] of Object.entries({
    tactical: 10,
    clutch: 5,
    teammate: 5,
    challenge: 5,
    business: 5,
  }))
    assert.equal(events.filter((e) => e.category === k).length, n)
  assert.equal(audience.length, 8)
  assert.equal(new Set(audience.flatMap((a) => a.lines)).size, 96)
})
test('five stages and duplicate guards, even after serialization/reload', () => {
  let s = fresh()
  startMatch(s, 'balanced', 123)
  for (let i = 0; i < 5; i++) {
    const c = eventById(s.match!.eventId).choices[0]!
    assert.equal(s.match!.stage, i)
    assert.ok(resolveRound(s, c.id))
    const after = JSON.stringify(s)
    assert.equal(resolveRound(s, c.id), false)
    assert.equal(JSON.stringify(s), after)
    s = migrate(JSON.parse(JSON.stringify(s)))
    assert.equal(resolveRound(s, c.id), false)
    assert.equal(advance(s), false)
    const side = eventById(s.match!.sideId).choices.find((c) => !c.challengeId)!
    assert.ok(interact(s, side.id))
    const afterSide = JSON.stringify(s)
    assert.equal(interact(s, side.id), false)
    assert.equal(JSON.stringify(s), afterSide)
    advance(s)
  }
  assert.equal(s.phase, 'report')
  assert.equal(s.match!.results.length, 5)
  assert.equal(s.history.length, 1)
  assert.ok(s.report!.score.includes(13))
  const after = JSON.stringify(s)
  assert.equal(advance(s), false)
  assert.equal(JSON.stringify(s), after)
})
test('tactics change probability and outcomes for identical seeded matches', () => {
  let differences = 0
  for (let seed = 1; seed <= 70; seed++) {
    const a = fresh(),
      b = fresh()
    startMatch(a, 'balanced', seed)
    startMatch(b, 'balanced', seed)
    assert.ok(
      chance(a, eventById(a.match!.eventId).choices[0]!) >
        chance(b, eventById(b.match!.eventId).choices[1]!),
    )
    finish(a, 'steady')
    finish(b, 'risky')
    if (a.report!.won !== b.report!.won) differences++
  }
  assert.ok(differences > 0)
})
test('ECO and full buy change resources and gear; unaffordable full cannot resolve', () => {
  const a = fresh()
  startMatch(a, 'balanced', 42)
  round(a)
  a.match!.economy = 3
  a.match!.eventId = 'eco-base'
  const b = migrate(JSON.parse(JSON.stringify(a)))
  assert.ok(resolveRound(a, 'eco'))
  assert.ok(resolveRound(b, 'full'))
  assert.ok(a.match!.economy > b.match!.economy)
  assert.ok(
    chance(b, eventById('eco-base').choices[2]!) > chance(a, eventById('eco-base').choices[0]!),
  )
  const c = fresh()
  startMatch(c, 'balanced', 42)
  round(c)
  c.match!.economy = 0
  c.match!.eventId = 'eco-base'
  assert.equal(resolveRound(c, 'full'), false)
})
test('all five challenges are delayed and constrain actual subsequent decisions', () => {
  for (const def of challenges) {
    const s = fresh()
    startMatch(s, 'balanced', 8)
    resolveRound(s, eventById(s.match!.eventId).choices[0]!.id)
    s.match!.sideId = `challenge-${def.id}`
    const before = s.match!.gifts
    interact(s, 'accept')
    assert.equal(s.match!.gifts, before)
    assert.equal(activeChallenges(s.match!).length, 0)
    advance(s)
    assert.equal(activeChallenges(s.match!).length, 1)
    const base = eventById('eco-base').choices
    const baseline = chance({ ...s, match: { ...s.match!, challenges: [] } }, base[1]!)
    assert.ok(chance(s, base[1]!) < baseline)
    if (def.maxGear) assert.ok(choiceBlocked(s, base[2]!))
    if (def.requiredTag) assert.ok(choiceBlocked(s, base[0]!))
    if (def.bannedTag === 'eco') assert.ok(choiceBlocked(s, base[0]!))
    if (def.bannedTag === 'team') assert.ok(choiceBlocked(s, eventById('mid-trade').choices[0]!))
    assert.ok(abandonChallenge(s))
    assert.equal(activeChallenges(s.match!).length, 0)
  }
})
test('challenge reward requires winning both future rounds, not accepting', () => {
  const s = fresh()
  s.skill = 100
  startMatch(s, 'technical', 12)
  resolveRound(s, eventById(s.match!.eventId).choices[0]!.id)
  s.match!.sideId = 'challenge-pistol'
  interact(s, 'accept')
  advance(s)
  const active = s.match!.challenges[0]!
  round(s)
  assert.equal(active.settled, false)
  round(s)
  assert.equal(active.settled, true)
  assert.equal(active.successes + active.failures, 2)
})
test('chat responds to score, tactic, streak, challenge and remembered history; ticking cannot farm rewards', () => {
  const s = fresh()
  startMatch(s, 'entertainment', 123)
  s.match!.score = [1, 3]
  s.match!.tags = ['risky']
  s.match!.streak = -2
  s.archive = ['eco-base']
  assert.ok(chatContext(s, s.match!).includes('behind'))
  assert.ok(chatContext(s, s.match!).includes('risky'))
  assert.ok(chatContext(s, s.match!).includes('streak'))
  assert.ok(chatContext(s, s.match!).includes('history'))
  const before = [s.fans, s.money, s.match!.gifts, s.match!.hype]
  for (let i = 0; i < 100; i++) tick(s, 3)
  assert.deepEqual([s.fans, s.money, s.match!.gifts, s.match!.hype], before)
  assert.equal(s.match!.feed.length, 12)
  assert.ok(
    s.match!.feed.some((l) =>
      /逆风|落后|追分|干拉|起伏|节奏|血压|掉分|切片|之前|昨天|大心脏|稳/.test(l.text),
    ),
  )
})
test('all clip types can be generated; one best per day; publishing and promotion are capped and idempotent', () => {
  const types = new Set<string>()
  for (const tag of ['steady', 'risky', 'team', 'save'] as Tag[])
    for (let seed = 1; seed <= 10; seed++) {
      const s = fresh()
      startMatch(s, 'balanced', seed)
      finish(s, tag)
      assert.ok(s.report!.clip)
      types.add(s.report!.clip!.type)
      const before = s.fans
      assert.ok(publishClip(s))
      assert.ok(s.fans - before <= 45)
      const after = s.fans
      assert.equal(publishClip(s), false)
      assert.equal(s.fans, after)
      s.money = 1000
      assert.ok(promoteClip(s))
      const money = s.money
      assert.equal(promoteClip(s), false)
      assert.equal(s.money, money)
      assert.ok(s.exposure <= 120)
      assert.equal(s.history.length, 1)
    }
  assert.deepEqual([...types].sort(), ['娱乐型', '技术型', '教学型'].sort())
})
test('7 days across 3 styles: bounded resources, event conditions, no repeated actions and finite end state', () => {
  for (const style of ['technical', 'entertainment', 'balanced'] as Style[])
    for (let seed = 1; seed <= 30; seed++) {
      const s = fresh()
      for (let day = 1; day <= 7; day++) {
        assert.ok(dailyAction(s, 'train'))
        const energy = s.energy
        assert.equal(dailyAction(s, 'train'), false)
        assert.equal(s.energy, energy)
        dailyAction(s, 'edit')
        dailyAction(s, 'rest')
        dailyAction(s, 'upgrade')
        startMatch(s, style, seed * 17 + day)
        while (s.phase === 'live') {
          const e = eventById(s.match!.eventId),
            side = eventById(s.match!.sideId)
          for (const ev of [e, side]) {
            assert.ok(s.rank >= (ev.minRank || 0))
            assert.ok(s.fans >= (ev.minFans || 0))
            if (ev.requiresTag) assert.ok(s.match!.tags.includes(ev.requiresTag))
            if (ev.condition === 'ahead') assert.ok(s.match!.score[0] > s.match!.score[1])
            if (ev.condition === 'behind') assert.ok(s.match!.score[0] < s.match!.score[1])
          }
          round(s, style === 'entertainment' ? 'risky' : style === 'technical' ? 'steady' : 'team')
          assert.ok(s.energy >= 0 && s.energy <= 100)
          assert.ok(s.match!.economy >= 0 && s.match!.economy <= 4)
        }
        assert.ok(s.report!.fans <= 240)
        assert.ok(s.report!.money <= 180)
        publishClip(s)
        if (s.money >= 80) promoteClip(s)
        const report = s.report!
        assert.equal(nextDay(s), day < 7)
        if (day === 7) assert.equal(s.report, report)
      }
      assert.equal(s.history.length, 7)
      assert.equal(s.day, 7)
      assert.ok(s.fans <= 128 + 7 * 285)
      assert.ok(s.rank <= 1400)
      assert.equal(s.phase, 'report')
    }
})
test('old desktop and report saves migrate with assets and day retained; new live RNG restores exactly', () => {
  const old = {
    day: 4,
    fans: 1200,
    money: 900,
    skill: 70,
    energy: 80,
    rank: 1300,
    trained: false,
    phase: 'desk',
    report: null,
  }
  const s = migrate(old)
  assert.equal(s.version, 4)
  assert.equal(s.fans, 1200)
  assert.equal(s.day, 4)
  assert.equal(s.phase, 'desk')
  assert.equal(
    migrate({
      ...old,
      phase: 'report',
      report: { fans: 50, money: 40, rank: 20, kills: 12, promoted: false },
    }).report!.legacy,
    true,
  )
  startMatch(s, 'balanced', 765)
  shoot(s)
  const restored = migrate(JSON.parse(JSON.stringify(s)))
  const c = eventById(s.match!.eventId).choices[0]!
  resolveRound(s, c.id)
  resolveRound(restored, c.id)
  assert.deepEqual(s.match, restored.match)
  assert.throws(() => migrate({}))
  assert.throws(() => migrate({ ...s, match: { ...s.match, stage: 8 } }))
})
test('saving forfeits this segment but preserves gear and builds economy; hits capped', () => {
  const s = fresh()
  startMatch(s, 'balanced', 5)
  round(s)
  round(s)
  round(s)
  s.match!.gear = 3
  s.match!.economy = 0
  assert.equal(chance(s, eventById('clutch-base').choices[2]!), 0)
  s.match!.eventId = 'clutch-base'
  for (let i = 0; i < 20; i++) shoot(s)
  assert.equal(s.match!.hits, 3)
  resolveRound(s, 'save')
  assert.equal(s.match!.gear, 3)
  assert.equal(s.match!.economy, 4)
  assert.equal(s.match!.results.at(-1)!.won, false)
})
test('unavailable ads never prevent progressing', async () => {
  assert.equal(await adService.isAvailable(), false)
  assert.equal((await adService.showRewarded()).completed, false)
  const s = fresh()
  startMatch(s, 'balanced', 7)
  finish(s)
  assert.ok(publishClip(s))
  assert.ok(nextDay(s))
})

test('report reload retains the five-round recap and clip publication state', () => {
  const s = fresh()
  startMatch(s, 'entertainment', 88)
  finish(s, 'risky')
  publishClip(s)
  const restored = migrate(JSON.parse(JSON.stringify(s)))
  assert.equal(restored.match!.results.length, 5)
  assert.equal(restored.report!.clip!.published, true)
  const broken = JSON.parse(JSON.stringify(s))
  broken.report.clip.quality = 'bad'
  assert.throws(() => migrate(broken))
})

test('all 30 events are reachable through their filters over different careers', () => {
  const reached = new Set<string>()
  for (let seed = 1; seed <= 500; seed++) {
    const s = fresh()
    s.rank = 1000 + (seed % 4) * 120
    s.fans = 128 + (seed % 3) * 300
    startMatch(s, 'balanced', Math.imul(seed, 2654435761) >>> 0)
    while (s.phase === 'live') {
      const m = s.match!
      reached.add(m.eventId)
      reached.add(m.sideId)
      const options = eventById(m.eventId).choices.filter((c) => !choiceBlocked(s, c))
      assert.ok(options.length)
      resolveRound(s, options[seed % options.length]!.id)
      interact(s, eventById(m.sideId).choices.find((c) => !c.challengeId)!.id)
      advance(s)
    }
  }
  assert.equal(
    reached.size,
    30,
    `unreached: ${events.filter((e) => !reached.has(e.id)).map((e) => e.id)}`,
  )
})

test('successful two-round challenge pays once on completion and reload cannot pay it again', () => {
  const s = fresh()
  s.skill = 100
  startMatch(s, 'technical', 1)
  resolveRound(s, eventById(s.match!.eventId).choices[0]!.id)
  s.match!.sideId = 'challenge-pistol'
  interact(s, 'accept')
  advance(s)
  for (let i = 0; i < 2; i++) {
    s.match!.seed = 1
    const c = eventById(s.match!.eventId).choices.find((c) => !choiceBlocked(s, c))!
    resolveRound(s, c.id)
    assert.equal(s.match!.results.at(-1)!.won, true)
    interact(s, eventById(s.match!.sideId).choices.find((c) => !c.challengeId)!.id)
    if (i === 0) advance(s)
  }
  assert.equal(s.match!.challenges[0]!.successes, 2)
  assert.ok(s.match!.feed.some((l) => l.kind === 'gift' && l.text.includes('挑战完成')))
  const loaded = migrate(JSON.parse(JSON.stringify(s)))
  const gift = loaded.match!.gifts
  assert.equal(resolveRound(loaded, eventById(loaded.match!.eventId).choices[0]!.id), false)
  assert.equal(loaded.match!.gifts, gift)
})

test('technical, entertainment and balanced careers have different viable growth profiles', () => {
  const summary: Record<string, { rank: number; fans: number; wins: number }> = {}
  for (const style of ['technical', 'entertainment', 'balanced'] as Style[]) {
    let rank = 0,
      fans = 0,
      wins = 0
    for (let run = 1; run <= 60; run++) {
      const s = fresh()
      for (let day = 1; day <= 7; day++) {
        dailyAction(s, 'train')
        dailyAction(s, 'edit')
        dailyAction(s, 'rest')
        startMatch(s, style, Math.imul(run * 11 + day, 2654435761) >>> 0)
        while (s.phase === 'live') {
          const m = s.match!
          const pool = eventById(m.eventId).choices.filter((c) => !choiceBlocked(s, c))
          const desired =
            style === 'technical' ? 'steady' : style === 'entertainment' ? 'risky' : 'team'
          const c = pool.find((c) => c.tag === desired) ?? pool[0]!
          resolveRound(s, c.id)
          const interactions = eventById(m.sideId).choices.filter((c) => !c.challengeId)
          interactions.sort((a, b) =>
            style === 'entertainment' ? b.hype - a.hype : b.team - a.team,
          )
          interact(s, interactions[0]!.id)
          advance(s)
        }
        if (s.report!.won) wins++
        publishClip(s)
        nextDay(s)
      }
      rank += s.rank
      fans += s.fans
    }
    summary[style] = { rank: Math.round(rank / 60), fans: Math.round(fans / 60), wins }
  }
  assert.ok(summary.technical!.rank > summary.entertainment!.rank)
  assert.ok(summary.entertainment!.fans > summary.technical!.fans)
  for (const profile of Object.values(summary)) {
    assert.ok(profile.fans > 128)
    assert.ok(profile.wins > 0)
  }
  console.log('60 seeded seven-day careers per style:', summary)
})
