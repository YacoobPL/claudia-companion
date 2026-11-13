import { expect, test } from 'claude-code/testing'

import { MORE_EN } from '../hooks/bond'
import { backgroundLine, cells, dayLine, duration, goalLine, limitsLines, modeLine, sessionLine, sessionsLine, tasksLine, turnLine } from '../hooks/under'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function engine(on: any, stored: Record<string, unknown> = { onboarded: true }, tool: (e: Record<string, unknown>) => unknown = () => ({ result: {} })) {
  on('command.register', () => ({ value: { command: 'claudia' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('tool.call', (_: unknown, e: Record<string, unknown>) => tool(e))
  on('turn.start', () => ({ turnId: 't' }))
  on('classic.UserPromptSubmit', () => ({}))
  on('prompt.submit', (_: unknown, e: unknown) => e)
  on('session.measure', () => ({ changed: ['context', 'rateLimits'] }))
  on('command.run', () => ({ text: '' }))
  on('clock.now', () => ({ value: NOW }))
  on('clock.every', () => ({ value: undefined }))
  on('clock.after', () => ({ value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('store.get', (_: unknown, e: { key: string }) => ({ value: stored[e.key] }))
  on('store.set', (_: unknown, e: { key: string; value: unknown }) => {
    stored[e.key] = e.value
    return { value: undefined }
  })
  on('store.delete', () => ({ value: undefined }))
}

// ------------------------------------------------------------------ the lines themselves

test('the task list: what is being done, then a tick', () => {
  expect(tasksLine({ done: 3, total: 7, current: 'Writing tests' }, 40)).toBe('☑ 3/7 · Writing tests')
  expect(tasksLine({ done: 7, total: 7, current: '' }, 40)).toBe('☑ 7/7 ✓')
  expect(tasksLine({ done: 1, total: 2, current: 'A very long description of the current task' }, 20)!.length).toBeLessThanOrEqual(20)
  expect(tasksLine(null, 40)).toBe(null)
})

test('the turn: time, tools, files; shorter when narrow; a summary once done', () => {
  const t = { startedAt: NOW - 134_000, endedAt: null, tools: 9, files: 3, added: 120, removed: 40 }
  expect(turnLine(MORE_EN, t, NOW, 60)).toBe('⏱ 2:14 · 9 tools · ✎ 3 files +120 −40')
  expect(turnLine(MORE_EN, t, NOW, 29)).toBe('⏱ 2:14 · ✎ 3 +120 −40 · 🔧 9')
  expect(turnLine(MORE_EN, { ...t, endedAt: NOW }, NOW + 60_000, 60)).toBe('last: ⏱ 2:14 · 9 tools · ✎ 3 files +120 −40')
})

test('the limits: a bar per window, the five-hour one first, each with its reset', () => {
  const at = new Date(2026, 10, 10, 16, 40).toISOString()
  const week = new Date(2026, 10, 14, 4, 0).toISOString()
  const [five, seven] = limitsLines(
    [
      { kind: 'seven_day', pct: 53, resetsAt: week },
      { kind: 'five_hour', pct: 20.4, resetsAt: at },
    ],
    NOW,
    38,
  )
  expect(five!.label).toBe('5h ')
  expect(five!.tail).toBe(' 20% · ↻16:40')
  expect(five!.filled).toBe(2)
  expect(seven!.label).toBe('7d ')
  expect(seven!.tail).toBe(' 53% · ↻14.11 04:00')
  for (const l of [five!, seven!]) expect(cells(l.label) + l.bars + cells(l.tail)).toBeLessThanOrEqual(38)
  // narrow: the reset goes first, then the bar shortens; both windows stay
  const narrow = limitsLines(
    [
      { kind: 'five_hour', pct: 20.4, resetsAt: at },
      { kind: 'seven_day', pct: 53, resetsAt: week },
    ],
    NOW,
    14,
  )
  expect(narrow).toHaveLength(2)
  for (const l of narrow) expect(cells(l.label) + l.bars + cells(l.tail)).toBeLessThanOrEqual(14)
  expect(limitsLines([], NOW, 40)).toEqual([])
})

test('background tasks, the mode, the day', () => {
  expect(backgroundLine(MORE_EN, ['npm run dev'], 40)).toBe('⚙ 1 in background: npm run dev')
  expect(backgroundLine(MORE_EN, ['npm run dev', 'bun test'], 12)).toBe('⚙ 2')
  expect(modeLine(MORE_EN, 'default', 40)).toBe(null)
  expect(modeLine(MORE_EN, 'plan', 40)).toBe('📓 plan mode')
  expect(dayLine(MORE_EN, { streak: 5, turns: 14, commits: 3, cakes: 2 }, 40)).toBe('🔥 5 · 14 turns · 3 commits · 🍰 2')
  expect(dayLine(MORE_EN, { streak: 5, turns: 14, commits: 3, cakes: 2 }, 24)).toBe('🔥 5 · 14 · ✓3 · 🍰2')
  expect(dayLine(MORE_EN, { streak: 5, turns: 0, commits: 0, cakes: 0 }, 40)).toBe(null)
})

// ------------------------------------------------------------------ in a session

test('in the pane: tasks, the turn, limits, a background task, the mode', SLOW, async ($, on) => {
  engine(on, { onboarded: true }, e =>
    e.tool === 'Bash' && e.run_in_background ? { result: { stdout: '', stderr: '', interrupted: false, backgroundTaskId: 'b1' } } : { result: {} },
  )
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.classic.UserPromptSubmit({ prompt: 'go', permission_mode: 'plan' } as never)
  await $.session.measure({
    context: { tokens: 1, window: 100, percent: 10 },
    rateLimits: [{ kind: 'five_hour', percentUsed: 40 }],
    units: ['context', 'rateLimits'],
  } as never)
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  await $.tool.call({ tool: 'TaskCreate', subject: 'Write tests', description: 'x', activeForm: 'Writing tests' } as never)
  await $.tool.call({ tool: 'Bash', command: 'npm run dev', run_in_background: true } as never)

  const ui = await $.ui.mount(pane())
  expect(await ui.find({ type: 'Text', text: /☑ 0\/1 · Writing tests/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /⏱/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /5h/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /⚙ 1 in background: npm run/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /📓 plan mode/ })).toBeTruthy()
  await ui.unmount()

  // a short pane: only as many lines as fit under her, the most important first
  const short = await $.ui.mount(pane(24))
  expect(await short.find({ type: 'Text', text: /☑/ })).toBeTruthy()
  expect(await short.find({ type: 'Text', text: /📓/ })).toBeFalsy()
  await short.unmount()

  // the task's notification ends it
  await $.prompt.submit({ text: '<task-notification><task-id>b1</task-id><status>completed</status></task-notification>', origin: { kind: 'task-notification' } } as never)
  const after = await $.ui.mount(pane())
  expect(await after.find({ type: 'Text', text: /⚙/ })).toBeFalsy()
  await after.unmount()
})

test('a short pane keeps the most important lines; a hidden line stays hidden', SLOW, async ($, on) => {
  const stored: Record<string, unknown> = { onboarded: true }
  engine(on, stored)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.classic.UserPromptSubmit({ prompt: 'go', permission_mode: 'plan' } as never)
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  await $.tool.call({ tool: 'TaskCreate', subject: 'Write tests', description: 'x', activeForm: 'Writing tests' } as never)

  // 18 rows of her, one of words, the rule: three rows left for the lines
  const short = await $.ui.mount(pane(23))
  expect(await short.find({ type: 'Text', text: /☑/ })).toBeTruthy()
  expect(await short.find({ type: 'Text', text: /📓/ })).toBeFalsy()
  await short.unmount()

  // shorter still: her head instead of her figure, so her words and the lines stay
  const shorter = await $.ui.mount(pane(16))
  expect(await shorter.find({ type: 'Text', text: /☑/ })).toBeTruthy()
  expect(await shorter.find({ type: 'Text', text: /✷/ })).toBeTruthy()
  await shorter.unmount()

  const r = await $.command.run({ command: 'claudia', args: 'hide tasks' } as never)
  expect(r.text).toContain('hidden')
  expect(stored.hiddenLines).toEqual(['tasks'])
  const ui = await $.ui.mount(pane())
  expect(await ui.find({ type: 'Text', text: /☑/ })).toBeFalsy()
  expect(await ui.find({ type: 'Text', text: /📓/ })).toBeTruthy()
  await ui.unmount()
})

test('a notification is not the person: no blush at a “thanks” inside it', SLOW, async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.prompt.submit({ text: '<task-notification>thanks</task-notification>', origin: { kind: 'task-notification' } } as never)
  const ui = await $.ui.mount(pane())
  expect(await ui.find({ type: 'Text', text: /any time|welcome|Happy to help|Thank you/i })).toBeFalsy()
  await ui.unmount()
})

test('the session: how long it has been open, how long Claude worked', () => {
  expect(duration(41 * 60_000)).toBe('41 min')
  expect(duration(161 * 60_000)).toBe('2 h 41 min')
  const s = { startedAt: NOW - 161 * 60_000, workMs: 72 * 60_000, openMs: 160 * 60_000, openAt: NOW - 60_000 }
  // open for 160 minutes counted a minute ago, and that minute
  expect(sessionLine(MORE_EN, s, NOW, 60)).toBe('🕐 session 2 h 41 min · I worked 1 h 12 min')
  // started twenty hours ago, the computer off overnight: only the time it was open counts
  const night = { startedAt: NOW - 20 * 3600_000, workMs: 30 * 60_000, openMs: 95 * 60_000, openAt: NOW - 11 * 3600_000 }
  expect(sessionLine(MORE_EN, night, NOW, 60)).toBe('🕐 session 1 h 35 min · I worked 30 min')
  expect(cells(sessionLine(MORE_EN, s, NOW, 28)!)).toBeLessThanOrEqual(28)
  expect(sessionLine(MORE_EN, null, NOW, 60)).toBe(null)
})

test('the session clock survives a reload and a resume: its start from the engine, the work kept by first launch', SLOW, async ($, on) => {
  // the work is kept under the conversation's first launch, which a resumed session (with a new id) keeps
  const first = NOW - 3600_000
  const stored: Record<string, unknown> = { onboarded: true, [`work:${first}`]: 10 * 60_000, [`open:${first}`]: 60 * 60_000 }
  engine(on, stored)
  on('session.id', () => ({ value: 'abc' }))
  on('session.usage', () => ({ value: { startedAt: NOW - 3600_000, context: { tokens: 0, window: 1, percent: 0 }, rateLimits: [] } }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(on as any)('turn.complete', (_: unknown, e: { text?: string }) => ({ text: e.text ?? '' }))
  // she wakes as after a reload: the session began an hour ago, ten minutes of work were saved
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  await $.turn.complete({ turnId: 'm', reason: 'answer', answer: 'ok', text: 'ok', durationMs: 2 * 60_000, isAborted: false } as never)
  expect(stored[`work:${first}`]).toBe(12 * 60_000)
  const ui = await $.ui.mount(pane())
  expect(await ui.find({ type: 'Text', text: /🕐 session 1 h 0 min · I worked 12 min/ })).toBeTruthy()
  await ui.unmount()
})

test('a session begun long ago with nothing kept of its open time: it counts from its work, not the clock', SLOW, async ($, on) => {
  const first = NOW - 20 * 3600_000
  const stored: Record<string, unknown> = { onboarded: true, [`work:${first}`]: 25 * 60_000 }
  engine(on, stored)
  on('session.id', () => ({ value: 'abc' }))
  on('session.usage', () => ({ value: { startedAt: first, context: { tokens: 0, window: 1, percent: 0 }, rateLimits: [] } }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount(pane())
  expect(await ui.find({ type: 'Text', text: /🕐 session 25 min · I worked 25 min/ })).toBeTruthy()
  await ui.unmount()
})

test('the turn line shows what runs now, and gives it up first when narrow', () => {
  const t = { startedAt: NOW - 134_000, endedAt: null, tools: 9, files: 3, added: 120, removed: 40, current: 'python' }
  expect(turnLine(MORE_EN, t, NOW, 60)).toBe('⏱ 2:14 · 9 tools · ✎ 3 files +120 −40 · ▶ python')
  expect(turnLine(MORE_EN, t, NOW, 40)).toBe('⏱ 2:14 · ✎ 3 +120 −40 · 🔧 9 · ▶ python')
  expect(turnLine(MORE_EN, t, NOW, 36)).toBe('⏱ 2:14 · ✎ 3 +120 −40 · 🔧 9')
  expect(turnLine(MORE_EN, { ...t, endedAt: NOW }, NOW, 60)).toBe('last: ⏱ 2:14 · 9 tools · ✎ 3 files +120 −40')
})

test('a reload during a turn: its clock goes on, and its time is counted when the next turn starts', SLOW, async ($, on) => {
  // her own heartbeat is a moment old: the session went on, only she was reloaded
  const stored: Record<string, unknown> = { onboarded: true, 'work:abc': 5 * 60_000, 'turnAt:abc': NOW - 10 * 60_000, 'sess:abc': { name: 'x', state: 'working', at: NOW - 20_000 } }
  engine(on, stored)
  on('session.id', () => ({ value: 'abc' }))
  // she wakes in the middle of a turn that began ten minutes ago
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount(pane())
  // live: five minutes done before, ten in the running turn
  expect(await ui.find({ type: 'Text', text: /I worked 15 min/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /⏱ 10:00/ })).toBeTruthy()
  await ui.unmount()
  // that turn's end never reaches her; the next one starts: the ten minutes are kept
  await $.turn.start({ text: 'next', turnId: 'n' } as never)
  expect(stored['work:abc']).toBe(15 * 60_000)
  expect(stored['turnAt:abc']).toBe(NOW)
})

test('every line fits every width and never prints a number that is not one', () => {
  const now = new Date(2026, 10, 13, 15, 0).getTime()
  const n = (x: unknown) => x as number
  const seen: string[] = []
  for (let w = 8; w <= 70; w++) {
    const lines: (string | null)[] = [
      tasksLine({ done: 1, total: 3, current: 'line one\nline two of a task with a long name' }, w),
      tasksLine({ done: 7, total: 5, current: '' }, w),
      tasksLine({ done: 0, total: 1234, current: '🙂🙂🙂🙂🙂🙂🙂🙂🙂🙂🙂🙂' }, w),
      turnLine(MORE_EN, { startedAt: now - 3 * 3600_000, endedAt: null, tools: 1234, files: 99, added: 123456, removed: 98765, current: 'python some_long_script_name.py' }, now, w),
      turnLine(MORE_EN, { startedAt: now + 5000, endedAt: null, tools: n(undefined), files: n(NaN), added: n(NaN), removed: n(undefined) }, now, w),
      sessionLine(MORE_EN, { startedAt: now - 1000, workMs: n(NaN), openMs: n(undefined), openAt: n(undefined) }, now, w),
      sessionLine(MORE_EN, { startedAt: now - 1000, workMs: 500 * 3600_000, openMs: 900 * 3600_000, openAt: now - 60_000 }, now, w),
      backgroundLine(MORE_EN, ['npm run dev', 'bun test', 'python server.py', 'x'.repeat(40)], w),
      backgroundLine(MORE_EN, [''], w),
      goalLine(MORE_EN, { day: 1, text: 'a goal\nin two lines, and a long one at that, longer than any pane', isDone: true }, 1, w),
      sessionsLine(MORE_EN, { total: 2, waiting: 5, names: [''] }, w),
      sessionsLine(MORE_EN, { total: 12, waiting: 3, names: ['acme-web', 'acme-api', 'acme-api'] }, w),
      dayLine(MORE_EN, { streak: n(NaN), turns: 2.5, commits: n(undefined), cakes: -1 }, w),
      ...['plan', 'acceptEdits', 'auto', 'dontAsk', 'bypassPermissions'].map(m => modeLine(MORE_EN, m, w)),
      ...limitsLines(
        [
          { kind: 'five_hour', pct: -5 },
          { kind: 'seven_day', pct: n(NaN) },
          { kind: 'spend_limit', pct: 250 },
          { kind: 'some_new_long_window_kind', pct: 0.4, resetsAt: 'not a date' },
        ],
        now,
        w,
      ).map(b => {
        expect(b.filled >= 0 && b.filled <= b.bars).toBe(true)
        return b.label + '▰'.repeat(b.filled) + '▱'.repeat(b.bars - b.filled) + b.tail
      }),
    ]
    for (const l of lines) {
      if (l === null) continue
      if (cells(l) > w || /undefined|NaN|null|Infinity|\n|\(\)|-\d/.test(l) || !l.trim()) seen.push(`${w}: ${JSON.stringify(l)}`)
    }
  }
  expect(seen).toEqual([])
})

test('a turn that is over says so at any width; a window past its reset is not shown; no more waiting than there are', () => {
  const now = new Date(2026, 10, 13, 15, 0).getTime()
  const ended = { startedAt: now - 7000, endedAt: now, tools: 4, files: 2, added: 6, removed: 0 }
  expect(turnLine(MORE_EN, ended, now, 60)).toBe('last: ⏱ 0:07 · 4 tools · ✎ 2 files +6 −0')
  // too narrow for that: the short form, still with the word
  expect(turnLine(MORE_EN, ended, now, 34)).toMatch(/^last: ⏱ 0:07/)
  expect(turnLine(MORE_EN, ended, now, 13)).toBe('last: ⏱ 0:07')
  // a reading from before the window's reset is not today's usage
  const past = limitsLines([{ kind: 'five_hour', pct: 99, resetsAt: new Date(now - 3600_000).toISOString() }, { kind: 'seven_day', pct: 40, resetsAt: new Date(now + 3600_000).toISOString() }], now, 40)
  expect(past.map(b => b.label.trim())).toEqual(['7d'])
  expect(sessionsLine(MORE_EN, { total: 2, waiting: 5, names: ['api', 'api'] }, 60)).toBe('⧉ 2 other sessions · 2 waiting for OK (api)')
  expect(tasksLine({ done: 7, total: 5, current: '' }, 40)).toBe('☑ 5/5 ✓')
})
