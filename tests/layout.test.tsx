import { expect, test } from 'claude-code/testing'

import { EN } from '../hooks/i18n'
import { LOOKS } from '../hooks/looks'
import { BADGES } from '../hooks/bond'
import { cells } from '../hooks/under'

// a loaded machine draws slowly: these tests wait for the drawing, not for a stopwatch
const SLOW = { timeoutMs: 30_000 }

const CWD = '/work/a-rather-long-repository-name-for-testing'

const pane = (bodyColumns: number, placement: 'dock' | 'inline' = 'dock') =>
  ({
    plugin: 'claudia-companion',
    component: 'Pane',
    requestId: 'claudia',
    surface: 'terminal',
    props: {
      title: 'Claudia',
      isFocused: false,
      bodyColumns,
      placement,
      scroll: { offset: 0, bodyRows: 30 },
      view: {},
    },
  }) as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function engine(on: any, stored: Record<string, unknown> = { onboarded: true }, failing = '') {
  on('command.register', () => ({ value: { command: 'claudia' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('tool.call', (_: unknown, e: { command?: string }) =>
    failing && e.command === failing ? { result: {}, isError: true, text: 'exit 1' } : { result: {} },
  )
  on('prompt.submit', (_: unknown, e: unknown) => e)
  on('turn.start', () => ({ turnId: 't' }))
  on('session.measure', () => ({ changed: ['context', 'cost'] }))
  on('command.run', () => ({ text: '' }))
  on('clock.now', () => ({ value: Date.UTC(2026, 10, 1, 14, 0) }))
  on('clock.every', () => ({ value: undefined }))
  on('clock.after', () => ({ value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('store.get', (_: unknown, e: { key: string }) => ({ value: stored[e.key] }))
  on('store.set', () => ({ value: undefined }))
  on('store.delete', () => ({ value: undefined }))
  on('fs.read', () => {
    throw new Error('no file')
  })
  on('fs.list', () => ({ value: [{ name: '.git', kind: 'dir', size: 0 }] }))
  on('process.run', (_: unknown, e: { argv: string[] }) => {
    const argv = e.argv ?? []
    if (argv.includes('status')) return { value: { exitCode: 0, stdout: ' M a\n M b\n?? c\n', stderr: '', isStdoutTruncated: false } }
    if (argv.includes('rev-list')) return { value: { exitCode: 0, stdout: '12\n', stderr: '', isStdoutTruncated: false } }
    return { value: { exitCode: 0, stdout: 'Linux\n', stderr: '', isStdoutTruncated: false } }
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function busySession($: any, on: any) {
  engine(on, { onboarded: true })
  await $.session.start({ cwd: CWD, surface: 'terminal', isInteractive: true })
  await $.session.measure({
    context: { tokens: 120_000, window: 200_000, percent: 63 },
    rateLimits: [
      { kind: 'five_hour', percentUsed: 62.5, resetsAt: new Date(Date.UTC(2026, 10, 1, 16, 40)).toISOString() },
      { kind: 'seven_day', percentUsed: 18 },
    ],
    cost: { usd: 12.3456 },
    units: ['context', 'cost', 'rateLimits'],
  } as never)
  await $.command.run({ command: 'claudia', args: 'git' } as never)
  await $.turn.start({ text: 'build it', turnId: 'm' } as never)
  await $.tool.call({
    tool: 'TodoWrite',
    todos: [
      { content: 'Read the code', status: 'completed', activeForm: 'Reading the code' },
      { content: 'Write the tests for the long module name', status: 'in_progress', activeForm: 'Writing the tests for the long module name' },
      { content: 'Run them', status: 'pending', activeForm: 'Running them' },
    ],
  } as never)
  await $.tool.call({ tool: 'Edit', file_path: '/w/a.ts', old_string: 'a', new_string: ['a', 'b', 'c'].join('\n') } as never)
  await $.turn.start({ text: 'x', turnId: 'a', agentId: 'a1' } as never)
  await $.turn.start({ text: 'x', turnId: 'b', agentId: 'a2' } as never)
}

/** The lines under her that must fit the pane: context, git, helpers. */
const UNDER = /context|✎|helpers|☑|⏱|🕐|5h|7d|⚙|📓|⚠|🔥/

{
  for (const placement of ['dock', 'inline'] as const) {
    test(`${placement}: every line under her fits the pane, from 10 to 120 columns`, { timeoutMs: 60_000 }, async ($, on) => {
      await busySession($, on)
      for (const columns of [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 40, 48, 60, 70, 80, 100, 120]) {
        const ui = await $.ui.mount(pane(columns, placement))
        const width = Math.max(8, columns - 2)
        for (const el of await ui.findAll({ type: 'Text' })) {
          if (!UNDER.test(el.text)) continue
          if (cells(el.text) > width) {
            throw new Error(`${placement} ${columns} cols: "${el.text}" is ${cells(el.text)} > ${width}`)
          }
        }
        for (const r of await ui.findAll({ type: 'Raster' })) {
          const cols = Number(r.props.columns)
          if (cols > columns) throw new Error(`${columns} cols: a Raster of ${cols} columns`)
          const cells = String(r.props.cells)
          const rows = Number(r.props.rows)
          // 3 u32 words per cell, base64 of 12 bytes per cell
          expect(cells.length).toBe(Math.ceil((cols * rows * 12) / 3) * 4)
        }
        await ui.unmount()
      }
    })
  }
}

test('every look draws in every size', { timeoutMs: 60_000 }, async ($, on) => {
  // every badge earned, so every look opens
  const badges = Object.fromEntries(BADGES.map(b => [b, 1]))
  engine(on, { onboarded: true, bond: { firstDay: 1, lastDay: 1, streak: 1, best: 1, days: 1, total: {}, badges } })
  await $.session.start({ cwd: CWD, surface: 'terminal', isInteractive: true })
  for (const key of Object.keys(LOOKS)) {
    await $.command.run({ command: 'claudia', args: `outfit ${key}` } as never)
    for (const [columns, placement, rows] of [
      [40, 'dock', 18],
      [30, 'dock', 13],
      [30, 'inline', 13],
    ] as const) {
      const ui = await $.ui.mount(pane(columns, placement))
      const r = await ui.find({ type: 'Raster', key: 'claudia' })
      if (!r) throw new Error(`${key} at ${columns} ${placement}: no drawing`)
      expect(Number(r.props.rows)).toBe(rows)
      await ui.unmount()
    }
  }
})

test('the faces a session raises all draw: thinking, talking, oops, nervous, happy, blush', SLOW, async ($, on) => {
  engine(on, { onboarded: true }, 'false')
  await $.session.start({ cwd: CWD, surface: 'terminal', isInteractive: true })
  const steps: [string, () => Promise<unknown>][] = [
    ['thinking', () => $.turn.start({ text: 'go', turnId: 'm' } as never)],
    ['oops', () => $.tool.call({ tool: 'Bash', command: 'false' })],
    ['nervous', () => $.tool.call({ tool: 'Bash', command: 'rm -rf build' })],
    ['blush', () => $.prompt.submit({ text: 'thanks' } as never)],
    ['laugh', () => $.prompt.submit({ text: 'haha' } as never)],
  ]
  for (const [name, step] of steps) {
    await step()
    for (const [columns, placement] of [
      [40, 'dock'],
      [30, 'dock'],
      [30, 'inline'],
    ] as const) {
      const ui = await $.ui.mount(pane(columns, placement))
      if (!(await ui.find({ type: 'Raster', key: 'claudia' }))) throw new Error(`${name} at ${columns}: no drawing`)
      await ui.unmount()
    }
  }
})

test('her lines: none empty, no double spaces, bubble lines short', () => {
  const en = EN as unknown as Record<string, unknown>
  const lines: [string, string][] = []
  for (const [k, v] of Object.entries(en)) {
    if (typeof v === 'string') lines.push([k, v])
    if (Array.isArray(v)) v.forEach((s, i) => lines.push([`${k}[${i}]`, String(s)]))
  }
  for (const [where, s] of lines) {
    if (!s.trim()) throw new Error(`${where} is empty`)
    if (/\s{2,}/.test(s.replace(/\n/g, ' ').replace(/ {2}(?=\S)/g, ' '))) throw new Error(`${where} has a double space`)
  }
  // bubble lines: a few lines in a 34-column pane at most
  const bubbles = ['happy', 'happyAfterTrouble', 'idle', 'hums', 'talk', 'think', 'praise', 'swear', 'thanks', 'laugh', 'morning']
  for (const k of bubbles) {
    for (const s of en[k] as string[]) {
      if (s.length > 110) throw new Error(`${k}: "${s}" is ${s.length} characters`)
    }
  }
  // every look has a name
  for (const key of Object.keys(LOOKS)) expect(typeof EN.looks[key as keyof typeof EN.looks]).toBe('string')
})

test('numbers agree with their nouns', () => {
  expect(EN.gitAhead('api', 1)).toBe('api: 1 commit waits for a push.')
  expect(EN.gitAhead('api', 3)).toBe('api: 3 commits wait for a push.')
  expect(EN.gitDirty('api', 2)).toBe('api: 2 files uncommitted.')
  expect(EN.pushGeneric(1, 'origin/main')).toBe('Push: 1 commit goes to origin/main.')
})

test('a long repository name gives way: the git counts stay readable', { timeoutMs: 60_000 }, async ($, on) => {
  await busySession($, on)
  for (const columns of [30, 34, 40]) {
    const tall = pane(columns)
    const ui = await $.ui.mount({ ...tall, props: { ...tall.props, scroll: { offset: 0, bodyRows: 60 } } })
    const git = await ui.find({ type: 'Text', text: /↑/ })
    expect(git?.text).toContain('✎ 3  ↑ 12')
    await ui.unmount()
  }
})

test('a wide, tall pane gets her big; a wide but short one keeps her full size', { timeoutMs: 60_000 }, async ($, on) => {
  engine(on)
  await $.session.start({ cwd: CWD, surface: 'terminal', isInteractive: true })
  for (const [columns, rows, expected] of [
    [70, 50, 36],
    [70, 30, 18],
    [120, 60, 36],
    [60, 60, 18],
  ] as const) {
    const p = pane(columns)
    const ui = await $.ui.mount({ ...p, props: { ...p.props, scroll: { offset: 0, bodyRows: rows } } })
    const r = await ui.find({ type: 'Raster', key: 'claudia' })
    expect(Number(r?.props.rows)).toBe(expected)
    expect(Number(r?.props.columns)).toBeLessThanOrEqual(columns)
    await ui.unmount()
  }
})

test('wider pixels: a column more for every four, and she still fits', { timeoutMs: 60_000 }, async ($, on) => {
  engine(on, { onboarded: true, isWide: true })
  await $.session.start({ cwd: CWD, surface: 'terminal', isInteractive: true })
  const full = await $.ui.mount(pane(44))
  expect(Number((await full.find({ type: 'Raster', key: 'claudia' }))?.props.columns)).toBe(40)
  await full.unmount()
  const head = await $.ui.mount(pane(38))
  expect(Number((await head.find({ type: 'Raster', key: 'claudia' }))?.props.columns)).toBe(35)
  await head.unmount()
})

test('symbols a terminal may widen count as two cells', () => {
  expect(cells('abc')).toBe(3)
  expect(cells('⏱ 2:14')).toBe(7)
  expect(cells('🔥 5')).toBe(4)
  expect(cells('☕')).toBe(2)
  expect(cells('energy ▰▱ 5% · ↑')).toBe(16)
})
