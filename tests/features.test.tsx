import { expect, test } from 'claude-code/testing'

// a loaded machine draws slowly: these tests wait for the drawing, not for a stopwatch
const SLOW = { timeoutMs: 30_000 }

const NOW = new Date(2026, 10, 10, 14, 0).getTime()

const pane = (bodyRows = 60, bodyColumns = 40) =>
  ({
    plugin: 'claudia-companion',
    component: 'Pane',
    requestId: 'claudia',
    surface: 'terminal',
    props: { title: 'Claudia', isFocused: false, bodyColumns, placement: 'dock', scroll: { offset: 0, bodyRows }, view: {} },
  }) as const

type Box = { said: string[]; written: Record<string, string> }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function engine(on: any, stored: Record<string, unknown> = { onboarded: true }, box: Box = { said: [], written: {} }, tool: () => unknown = () => ({ result: {} })) {
  on('command.register', () => ({ value: { command: 'claudia' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('session.id', () => ({ value: 'me' }))
  on('tool.call', () => tool())
  on('turn.start', () => ({ turnId: 't' }))
  on('prompt.submit', (_: unknown, e: unknown) => e)
  on('command.run', () => ({ text: '' }))
  on('clock.now', () => ({ value: NOW }))
  on('clock.every', () => ({ value: undefined }))
  on('clock.after', () => ({ value: undefined }))
  on('ui.status', (_: unknown, e: unknown) => {
    box.said.push(JSON.stringify(e))
    return { value: undefined }
  })
  on('ui.toast', (_: unknown, e: unknown) => {
    box.said.push(JSON.stringify(e))
    return { value: undefined }
  })
  on('store.get', (_: unknown, e: { key: string }) => ({ value: stored[e.key] }))
  on('store.set', (_: unknown, e: { key: string; value: unknown }) => {
    stored[e.key] = e.value
    return { value: undefined }
  })
  on('store.delete', (_: unknown, e: { key: string }) => {
    delete stored[e.key]
    return { value: undefined }
  })
  on('store.keys', () => ({ value: Object.keys(stored) }))
  on('env.get', (_: unknown, e: { name: string }) => ({ value: e.name === 'USERPROFILE' ? 'C:\\Users\\tester' : undefined }))
  on('fs.write', (_: unknown, e: { path: string; text: string }) => {
    box.written[e.path] = e.text
    return { value: undefined }
  })
  on('process.run', () => ({ value: { exitCode: 0, stdout: 'git version 2.47\n', stderr: '', isStdoutTruncated: false } }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const run = async ($: any, args: string) => ((await $.command.run({ command: 'claudia', args } as never)) as { text: string }).text

const bubble = async ($: any) => {
  const ui = await $.ui.mount(pane())
  const texts = (await ui.findAll({ type: 'Text' })).map((t: { text: string }) => t.text)
  await ui.unmount()
  return texts.join(' | ')
}

test('focus mode: on for a while, shown under her, then off', SLOW, async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  expect(await run($, 'quiet 30')).toContain('Focus mode until 14:30')
  expect(await bubble($)).toContain('🔕 focus until 14:30')
  expect(await run($, 'quiet off')).toContain('Focus mode off')
  expect(await run($, 'quiet soon')).toContain('Usage')
})

test('where she shows: the status line carries her word', SLOW, async ($, on) => {
  const box: Box = { said: [], written: {} }
  const stored: Record<string, unknown> = { onboarded: true }
  engine(on, stored, box)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  expect(await run($, 'display status')).toContain('Status line only')
  expect(stored.display).toBe('status')
  await $.prompt.submit({ text: 'thanks!' } as never)
  expect(box.said.join(' ')).toMatch(/✷ (Aw|You’re|Happy|Thank)/)
  expect(await run($, 'display somewhere')).toContain('Usage')
})

test('the band above the prompt: a small Claudia and her word', SLOW, async ($, on) => {
  engine(on, { onboarded: true, display: 'band' })
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({
    plugin: 'claudia-companion',
    component: 'AbovePrompt',
    surface: 'terminal',
    props: { hasSurvey: false, isWorking: false, maxRows: 8, bodyColumns: 80 },
  } as never)
  expect(await ui.find({ type: 'Raster', key: 'band-claudia' })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /✷/ })).toBeTruthy()
  await ui.unmount()
})

test('the demo starts, and doctor reports', SLOW, async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  expect(await run($, 'demo')).toContain('Demo time')
  const report = await run($, 'doctor')
  expect(report).toContain('Claudia doctor')
  expect(report).toContain('git version 2.47')
  expect(report).toContain('badges')
})

test('today’s goal: set, shown under her, done', SLOW, async ($, on) => {
  const stored: Record<string, unknown> = { onboarded: true }
  engine(on, stored)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  expect(await run($, 'goal')).toContain('No goal today')
  expect(await run($, 'goal Finish the Tests')).toContain('Finish the Tests')
  expect(await bubble($)).toContain('🎯 Finish the Tests')
  expect(await run($, 'goal done')).toContain('Goal done')
  expect((stored.goal as { isDone: boolean }).isDone).toBe(true)
})

test('frustration: the third frustrated message gets a gentle word', SLOW, async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  for (const text of ['still not working', 'same error again?', 'ugh, not working!!']) await $.prompt.submit({ text } as never)
  expect(await bubble($)).toMatch(/Rough patch|Deep breath|Not working again/)
})

test('four fails in a row: she suggests stepping back', SLOW, async ($, on) => {
  engine(on, { onboarded: true }, { said: [], written: {} }, () => ({ result: {}, isError: true, text: 'exit 1' }))
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  for (let i = 0; i < 4; i++) await $.tool.call({ tool: 'Bash', command: 'make' } as never)
  expect(await bubble($)).toMatch(/Four fails|Same wall/)
})

test('earned looks: locked without the badge, worn with it', SLOW, async ($, on) => {
  const stored: Record<string, unknown> = { onboarded: true }
  engine(on, stored)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  expect(await run($, 'outfit glados')).toContain('locked')
  expect(await run($, 'outfit')).toContain('🔒')
  expect(await run($, 'outfit bliss')).toContain('Claudia wears')
})

test('earned looks: the badge opens one', SLOW, async ($, on) => {
  const day = Math.floor((NOW - new Date(NOW).getTimezoneOffset() * 60_000) / 86_400_000)
  const bond = { firstDay: day - 3, lastDay: day, streak: 1, best: 1, days: 3, total: {}, badges: { cake10: day } }
  engine(on, { onboarded: true, bond })
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  expect(await run($, 'outfit glados')).toContain('Claudia wears')
})

test('the wardrobe: a look at a time, locked ones as an outline', SLOW, async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  expect(await run($, 'wardrobe glados')).toContain('Wardrobe')
  const ui = await $.ui.mount(pane())
  expect(await ui.find({ type: 'Raster', key: 'wardrobe' })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /🔒/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /Ten cakes/ })).toBeTruthy()
  await ui.unmount()
})

test('the share card: an SVG saved under ~/.claude/claudia', SLOW, async ($, on) => {
  const box: Box = { said: [], written: {} }
  engine(on, { onboarded: true }, box)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  expect(await run($, 'card')).toContain('Saved your card')
  const [path, svg] = Object.entries(box.written)[0] ?? []
  expect((path ?? '').split('\\').join('/')).toContain('C:/Users/tester/.claude/claudia/card-2026-11-10.svg')
  expect(svg).toContain('<svg')
  expect(svg).toContain('Today with Claudia')
})

test('other plugins make her react: /claudia react <mood> <text>', SLOW, async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  expect(await run($, 'react happy Build passed')).toBe('✷')
  expect(await run($, 'react dance Build passed')).toContain('Usage')
})

test('other sessions: counted from their heartbeats; one waiting for an OK gets a toast', SLOW, async ($, on) => {
  const box: Box = { said: [], written: {} }
  const stored: Record<string, unknown> = {
    onboarded: true,
    'sess:a': { name: 'acme-api', state: 'waiting', at: NOW - 10_000 },
    'sess:b': { name: 'acme-web', state: 'working', at: NOW - 20_000 },
    'sess:old': { name: 'gone', state: 'idle', at: NOW - 10 * 60_000 },
  }
  engine(on, stored, box)
  await $.session.start({ cwd: '/w/claudia', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount(pane())
  await ui.advance(2500)
  await ui.unmount()
  // (40 columns: the short form)
  expect(await bubble($)).toContain('⧉ 2 · 1 waiting')
  expect(box.said.join(' ')).toContain('Another session (acme-api) is waiting for your OK')
  expect(stored['sess:me']).toBeTruthy()
})

test('calm mode is a toggle', SLOW, async ($, on) => {
  const stored: Record<string, unknown> = { onboarded: true }
  engine(on, stored)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  expect(await run($, 'calm on')).toContain('Calm mode: on')
  expect(stored.isCalm).toBe(true)
})

test('a new person: a bare /claudia keeps the first-run settings, a command of hers ends them, an unknown one says so', SLOW, async ($, on) => {
  const stored: Record<string, unknown> = {}
  engine(on, stored)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount(pane() as never)
  expect(await ui.find({ type: 'Text', text: /settings/i })).toBeTruthy()
  await run($, '')
  expect(await ui.find({ type: 'Text', text: /Tab to move/ })).toBeTruthy()
  expect(stored.onboarded).toBeUndefined()
  expect(await run($, 'today')).toBeTruthy()
  expect(stored.onboarded).toBe(true)
  expect(await ui.find({ type: 'Text', text: /Tab to move/ })).toBeFalsy()
  expect(await ui.find({ type: 'Text', text: /Pick what/ })).toBeFalsy()
  expect(await run($, 'xyzzy')).toMatch(/I don’t know “xyzzy”[\s\S]*outfit/)
  expect(await run($, '')).not.toMatch(/don’t know/)
  await ui.unmount()
})

test('thanks inside a task is not thanks to her; a DELETE with its WHERE is not asked about one', SLOW, async ($, on) => {
  const box: Box = { said: [], written: {} }
  engine(on, { onboarded: true }, box)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  await run($, 'display status')
  box.said.length = 0
  await $.prompt.submit({ text: 'Please build an awesome thank you page for the shop, with a form, a header and a footer' } as never)
  expect(box.said.join(' ')).not.toMatch(/You’re welcome|Aw|make me blush|Happy to/)
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  box.said.length = 0
  await $.tool.call({ tool: 'Bash', command: 'psql -c "DELETE FROM users WHERE id = 3"' })
  expect(box.said.join(' ')).not.toMatch(/is there a WHERE/)
  await $.tool.call({ tool: 'Bash', command: 'psql -c "DELETE FROM users"' })
  expect(box.said.join(' ')).toMatch(/is there a WHERE/)
})
