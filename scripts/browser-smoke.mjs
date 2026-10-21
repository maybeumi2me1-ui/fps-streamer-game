import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
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
let browser, page
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
  page = await browser.newPage({ viewport: { width: 1440, height: 1050 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`)
  })
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('fps-streamer-save-v1')))
  const layoutDetails = () =>
    page.evaluate(() => {
      const width = innerWidth
      return {
        viewport: width,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
        devicePixelRatio,
        fonts: document.fonts.status,
        mobileRules: matchMedia('(max-width: 720px)').matches,
        elements: [...document.querySelectorAll('body *')]
          .flatMap((element) => {
            const rect = element.getBoundingClientRect()
            if (rect.width === 0 || (rect.right <= width && rect.left >= 0)) return []
            const css = getComputedStyle(element)
            return [
              {
                tag: element.tagName,
                class: element.getAttribute('class'),
                left: rect.left,
                right: rect.right,
                width: rect.width,
                minWidth: css.minWidth,
                overflowX: css.overflowX,
                position: css.position,
                text: element.textContent?.trim().slice(0, 80),
              },
            ]
          })
          .slice(0, 40),
      }
    })
  const noOverflow = async () => {
    // setViewportSize updates the viewport, but style/media-query and font layout
    // may finish on the following render frames in a different Chromium version.
    await page.evaluate(async () => {
      await document.fonts.ready
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    })
    const details = await layoutDetails()
    assert.ok(
      details.document <= details.viewport,
      `No horizontal overflow: ${JSON.stringify(details)}`,
    )
  }
  const click = async (name) => page.getByRole('button', { name, exact: true }).click()
  await page.goto(url)
  await noOverflow()
  assert.equal(await page.locator('.map-card').count(), 3)
  for (const id of ['transit', 'harbor', 'oldtown']) {
    await page
      .locator(`.map-card`)
      .filter({
        has: page.locator(`.map-card-copy b`, {
          hasText: id === 'transit' ? '蓝隙通道' : id === 'harbor' ? '晴湾交火区' : '曦光旧城',
        }),
      })
      .click()
    await page.reload()
    assert.equal((await saved()).mapId, id)
    assert.equal(await page.locator('.v05-scene').getAttribute('data-map'), id)
    await noOverflow()
  }
  const asset = await page.request.get(new URL('art/tactical-maps.webp', url).href)
  assert.equal(asset.status(), 200)
  assert.ok((await asset.body()).length < 500 * 1024, 'Shared original atlas stays under 500 KB')
  await page.locator('.prep-actions button').nth(0).click()
  await page.locator('.prep-actions button').nth(1).click()
  await page.locator('.prep-actions button').nth(2).click()
  await page.locator('.prep-actions button').nth(3).click()
  await page.getByRole('button', { name: '娱乐型' }).click()
  await page.locator('.start-stream').click()
  assert.ok(await page.locator('.map-card').first().isDisabled())
  await page.getByRole('textbox', { name: '发送主播弹幕' }).fill('今天继续冲分！')
  await page.getByRole('button', { name: '发送弹幕', exact: true }).click()
  assert.ok((await saved()).match.feed.some((line) => line.text === '今天继续冲分！'))
  for (const [selector, effect] of [
    ['.tactic-scan', 'scan'],
    ['.tactic-dash', 'dash'],
    ['.tactic-smoke', 'smoke'],
  ]) {
    await page.locator(selector).first().hover()
    assert.equal(await page.locator('.v05-scene').getAttribute('data-effect'), effect)
  }
  await page
    .getByRole('group', { name: '弹幕筛选' })
    .getByRole('button', { name: '♛ 礼物', exact: true })
    .click()
  await page
    .getByRole('group', { name: '弹幕筛选' })
    .getByRole('button', { name: '直播弹幕', exact: true })
    .click()
  assert.equal(await page.locator('.tactic-art').count(), 3)
  const first = await saved()
  assert.equal(first.phase, 'live')
  assert.equal(first.match.style, 'entertainment')
  await page.waitForTimeout(3900)
  const chatted = await saved()
  assert.ok(chatted.match.chatCursor > first.match.chatCursor)
  assert.ok(chatted.match.chatCursor <= first.match.chatCursor + 2, 'Only one chat timeout chain')
  mkdirSync('artifacts', { recursive: true })
  await page.locator('.tactic-smoke').first().hover()
  await page.waitForTimeout(650)
  assert.equal(await page.locator('.smoke-dome').count(), 1)
  await page.screenshot({ path: 'artifacts/v05-desktop-live.png', fullPage: true })
  await page.mouse.move(0, 0)
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
        // Replay every challenge label at narrow widths: the failed CI state
        // is the economic round with an active audience challenge.
        const baseline = await saved()
        for (const challenge of ['pistol', 'aggressive', 'no-rifle', 'no-eco', 'solo']) {
          const variant = structuredClone(baseline)
          variant.match.challenges[0].id = challenge
          await page.evaluate(
            (v) => localStorage.setItem('fps-streamer-save-v1', JSON.stringify(v)),
            variant,
          )
          await page.reload()
          for (const width of [320, 360, 390]) {
            await page.setViewportSize({ width, height: 844 })
            await noOverflow()
          }
        }
        await page.evaluate(
          (v) => localStorage.setItem('fps-streamer-save-v1', JSON.stringify(v)),
          baseline,
        )
        await page.reload()
        await noOverflow()
        await page.screenshot({ path: 'artifacts/v05-mobile-live.png', fullPage: true })
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
      assert.equal(
        await page.locator('.v05-scene').getAttribute('data-outcome'),
        decided.match.results.at(-1).tag === 'save'
          ? 'saved'
          : decided.match.results.at(-1).won
            ? 'won'
            : 'lost',
      )
      assert.equal(await page.locator('.round-banner').count(), 1)
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
  await page.screenshot({ path: 'artifacts/v05-mobile-report.png', fullPage: true })
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
    'PASS browser: V0.5 maps + persisted selection, original atlas budget, live tactical effects, actual win/loss feedback, player chat, filtering; 7 days / 35 ranked rounds and interactions, delayed challenge, timed chat, live+report reload, one-shot choices, clips+promotion, ad fallback, history, reset, legacy migration, corrupt recovery, desktop+390px layout, Pages JS/CSS paths; zero browser/HTTP errors.',
  )
} catch (error) {
  mkdirSync('artifacts', { recursive: true })
  if (page && !page.isClosed()) {
    try {
      const details = await page.evaluate(() => ({
        url: location.href,
        viewport: { width: innerWidth, height: innerHeight },
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        fonts: document.fonts.status,
        elements: [...document.querySelectorAll('body *')]
          .flatMap((e) => {
            const r = e.getBoundingClientRect()
            return r.right > innerWidth || r.left < 0
              ? [
                  {
                    tag: e.tagName,
                    class: e.getAttribute('class'),
                    left: r.left,
                    right: r.right,
                    width: r.width,
                    minWidth: getComputedStyle(e).minWidth,
                  },
                ]
              : []
          })
          .slice(0, 60),
      }))
      writeFileSync('artifacts/failure-layout.json', JSON.stringify(details, null, 2))
      console.error('Browser failure layout:', JSON.stringify(details))
      await page.screenshot({ path: 'artifacts/failure.png', fullPage: true })
    } catch (diagnosticError) {
      console.error('Could not capture diagnostics:', diagnosticError)
    }
  }
  throw error
} finally {
  if (browser) await browser.close()
  if (server) {
    try {
      if (process.platform === 'win32') server.kill('SIGTERM')
      else process.kill(-server.pid, 'SIGTERM')
    } catch {}
  }
}
