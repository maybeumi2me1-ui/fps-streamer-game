import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import assert from 'node:assert/strict'

const external = process.env.BASE_URL
const url = external || 'http://127.0.0.1:4180/fps-streamer-game/'
const server = external
  ? null
  : spawn(
      'npm',
      ['run', 'preview', '--', '--port', '4180', '--strictPort', '--mode', 'github-pages'],
      { stdio: 'ignore', detached: process.platform !== 'win32' },
    )
let browser
try {
  let ready = false
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(url)
      if (r.ok) {
        ready = true
        break
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 100))
  }
  assert.ok(ready, 'Production preview must start; first run npm run build -- --mode github-pages')
  browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
      (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`)
  })
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('fps-streamer-save-v1')))
  const noOverflow = async () =>
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      'No horizontal overflow',
    )
  const click = async (name) => page.getByRole('button', { name, exact: true }).click()
  await page.goto(url)
  await noOverflow()
  await page.locator('.prep-actions button').nth(0).click()
  await page.locator('.prep-actions button').nth(1).click()
  await page.locator('.prep-actions button').nth(2).click()
  await page.locator('.prep-actions button').nth(3).click()
  await page.getByRole('button', { name: '娱乐型' }).click()
  await page.locator('.start-stream').click()
  const first = await saved()
  assert.equal(first.phase, 'live')
  assert.equal(first.match.style, 'entertainment')
  await page.waitForTimeout(3900)
  const chatted = await saved()
  assert.ok(chatted.match.chatCursor > first.match.chatCursor)
  assert.ok(chatted.match.chatCursor <= first.match.chatCursor + 2, 'Only one chat timeout chain')
  mkdirSync('artifacts', { recursive: true })
  await page.screenshot({ path: 'artifacts/v04-desktop-live.png', fullPage: true })
  for (let day = 1; day <= 7; day++) {
    for (let stage = 0; stage < 5; stage++) {
      if (day === 1 && stage === 0) {
        await page.getByRole('button', { name: '射击预瞄点' }).click()
        await page.reload()
        assert.equal((await saved()).match.hits, 1)
      }
      if (day === 1 && stage === 1) {
        await page.setViewportSize({ width: 390, height: 844 })
        await noOverflow()
        await page.screenshot({ path: 'artifacts/v04-mobile-live.png', fullPage: true })
      }
      if (await page.getByRole('button', { name: '放弃挑战', exact: true }).count()) {
        if (
          (await page.locator('.strategy-choices:not(.interaction) button:enabled').count()) === 0
        )
          await click('放弃挑战')
      }
      await page.locator('.strategy-choices:not(.interaction) button:enabled').first().click()
      const decided = await saved()
      assert.equal(decided.match.results.length, stage + 1)
      await page.reload()
      assert.equal((await saved()).match.results.length, stage + 1)
      assert.equal(
        await page.locator('.strategy-choices:not(.interaction)').count(),
        0,
        'Cannot repeat ranked decision',
      )
      if (stage === 0 && day === 1) {
        await page.locator('.interaction button').first().click()
        const accepted = await saved()
        assert.equal(accepted.match.challenges.length, 1)
        assert.equal(accepted.match.challenges[0].from, 1)
      } else await page.locator('.interaction button').last().click()
      await click(stage === 4 ? '下播结算 →' : '进入下一回合 →')
    }
    const report = await saved()
    assert.equal(report.phase, 'report')
    assert.equal(report.match.results.length, 5)
    assert.ok(report.report.score.includes(13))
    assert.ok(report.report.clip)
    await click('免费发布切片')
    assert.ok((await saved()).report.clip.published)
    assert.ok(await page.getByRole('button', { name: '已发布 ✓', exact: true }).isDisabled())
    if (await page.getByRole('button', { name: '金币推广 ¥80', exact: true }).isEnabled())
      await click('金币推广 ¥80')
    await click('广告推广（未接入）')
    await page.getByRole('status').filter({ hasText: '激励广告尚未接入' }).waitFor()
    await page.reload()
    assert.equal((await saved()).report.clip.published, true)
    await noOverflow()
    if (day < 7) {
      await click(`休息一下，迎接第 ${day + 1} 天 →`)
      await page.getByRole('button', { name: day % 2 ? '技术型' : '均衡型' }).click()
      await page.locator('.start-stream').click()
    }
  }
  assert.equal((await saved()).history.length, 7)
  await page.getByRole('button', { name: '▥ 数据中心 · 成长与常驻观众 →', exact: true }).click()
  assert.equal(await page.locator('.history-row').count(), 7)
  assert.equal(await page.locator('.audience-row').count(), 8)
  await click('关闭 ×')
  await page.screenshot({ path: 'artifacts/v04-mobile-report.png', fullPage: true })
  page.once('dialog', (d) => d.accept())
  await click('开启新的主播生涯 →')
  assert.equal((await saved()).day, 1)
  assert.equal((await saved()).phase, 'desk')
  const legacy = {
    day: 3,
    fans: 999,
    money: 700,
    skill: 66,
    energy: 80,
    rank: 1200,
    trained: true,
    phase: 'desk',
    report: null,
    history: [{ day: 2, fans: 999, money: 120 }],
  }
  await page.evaluate(
    (v) => localStorage.setItem('fps-streamer-save-v1', JSON.stringify(v)),
    legacy,
  )
  await page.reload()
  await page.getByRole('status').filter({ hasText: '旧版存档已升级' }).waitFor()
  await page.locator('.start-stream').click()
  assert.equal((await saved()).fans, 999)
  assert.equal((await saved()).day, 3)
  await page.evaluate(() => localStorage.setItem('fps-streamer-save-v1', 'broken'))
  await page.reload()
  await page.getByRole('status').filter({ hasText: '存档损坏' }).waitFor()
  assert.equal(await page.locator('.start-stream').count(), 1)
  assert.deepEqual(errors, [])
  console.log(
    'PASS browser: 7 days / 35 ranked rounds and interactions, delayed challenge, timed chat, live+report reload, one-shot choices, clips+promotion, ad fallback, history, reset, legacy migration, corrupt recovery, desktop+390px layout, Pages JS/CSS paths; zero browser/HTTP errors.',
  )
} finally {
  if (browser) await browser.close()
  if (server) {
    try {
      if (process.platform === 'win32') server.kill('SIGTERM')
      else process.kill(-server.pid, 'SIGTERM')
    } catch {}
  }
}
