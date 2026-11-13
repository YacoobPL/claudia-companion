import { expect, test } from 'claude-code/testing'

import {
  BADGES,
  MORE_EN,
  dayOf,
  diffOf,
  errorKindOf,
  fileKindOf,
  meet,
  mergeBond,
  mergeToday,
  momentOf,
  noPending,
  programOf,
  readToday,
  seasonOf,
} from '../hooks/bond'
import type { Bond } from '../hooks/bond'

// a loaded machine draws slowly: these tests wait for the drawing, not for a stopwatch
const SLOW = { timeoutMs: 30_000 }

const PANE = {
  plugin: 'claudia-companion',
  component: 'Pane',
  requestId: 'claudia',
  surface: 'terminal',
  props: { title: 'Claudia', isFocused: false, bodyColumns: 40, placement: 'dock', scroll: { offset: 0, bodyRows: 24 }, view: {} },
} as const

const NOV1 = new Date(2026, 10, 1, 14, 0).getTime()
const TUE = new Date(2026, 10, 10, 11, 0).getTime()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function engine(
  on: any,
  stored: Record<string, unknown> = { onboarded: true },
  now = TUE,
  tool: (e: { command?: string }) => unknown = () => ({ result: {} }),
  toasts: string[] = [],
) {
  on('command.register', () => ({ value: { command: 'claudia' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('tool.call', (_: unknown, e: { command?: string }) => tool(e))
  on('turn.start', () => ({ turnId: 't' }))
  on('command.run', () => ({ text: '' }))
  on('clock.now', () => ({ value: now }))
  on('clock.every', () => ({ value: undefined }))
  on('clock.after', () => ({ value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', (_: unknown, e: unknown) => {
    toasts.push(JSON.stringify(e))
    return { value: undefined }
  })
  on('store.get', (_: unknown, e: { key: string }) => ({ value: stored[e.key] }))
  on('store.set', (_: unknown, e: { key: string; value: unknown }) => {
    stored[e.key] = e.value
    return { value: undefined }
  })
  on('store.delete', () => ({ value: undefined }))
}

const bondOn = (day: number, extra: Partial<Bond> = {}): Bond => ({
  firstDay: day - 5,
  lastDay: day,
  streak: 1,
  best: 1,
  days: 5,
  total: { turns: 0, minutes: 0, commits: 0, pushes: 0, cakes: 0, oops: 0, helpers: 0, added: 0, removed: 0 },
  badges: { firstGreen: 1 },
  ...extra,
})

// ------------------------------------------------------------------ pure functions

test('the bond: a streak, a long absence, a milestone, the same day', () => {
  const day = dayOf(TUE)
  expect(meet(null, day).meeting.kind).toBe('first')
  expect(meet(bondOn(day), day).meeting.kind).toBe('sameDay')
  const streak = meet(bondOn(day - 1, { streak: 4 }), day)
  expect(streak.meeting).toEqual({ kind: 'streak', n: 5 })
  expect(streak.bond.best).toBe(5)
  expect(meet(bondOn(day - 9, { streak: 4 }), day).meeting).toEqual({ kind: 'missed', days: 9 })
  expect(meet(bondOn(day - 1, { firstDay: day - 30 }), day).meeting).toEqual({ kind: 'together', days: 30 })
  expect(meet(bondOn(day - 2, { streak: 4 }), day).bond.streak).toBe(1)
})

test('her calendar: holidays and the week', () => {
  expect(seasonOf(NOV1)).toBe('allSaints')
  expect(seasonOf(new Date(2026, 11, 25, 10).getTime())).toBe('christmas')
  expect(seasonOf(TUE)).toBe(null)
  expect(momentOf(new Date(2026, 10, 9, 9).getTime())).toBe('monday')
  expect(momentOf(new Date(2026, 10, 13, 16).getTime())).toBe('friday')
  expect(momentOf(new Date(2026, 10, 14, 12).getTime())).toBe('weekend')
  expect(momentOf(new Date(2026, 10, 10, 23).getTime())).toBe('late')
})

test('what she recognises: programs, files, errors, the size of a change', () => {
  expect(programOf('git commit')).toBe('git')
  expect(programOf('npx bun')).toBe('js')
  expect(programOf('python claudia_art.py')).toBe('python')
  expect(programOf('ls')).toBe(null)
  expect(fileKindOf('C:\\repo\\scripts\\migrations\\001.sql')).toBe('migration')
  expect(fileKindOf('src/a.test.tsx')).toBe('test')
  expect(fileKindOf('styles/globals.css')).toBe('css')
  expect(errorKindOf('src/x.ts(3,1): error TS2345: nope')).toBe('typeError')
  expect(errorKindOf('curl: (6) Could not resolve host: x')).toBe('network')
  expect(errorKindOf('bash: foo: command not found')).toBe('notFound')
  expect(errorKindOf(' 3 pass\n 1 fail')).toBe('testFail')
  expect(errorKindOf('all good')).toBe(null)
  expect(diffOf('Edit', { old_string: 'a\nb\nc', new_string: 'a' })).toEqual({ added: 0, removed: 2 })
  expect(diffOf('Write', { content: 'a\nb' })).toEqual({ added: 2, removed: 0 })
})

test('her words are there and fit a bubble', () => {
  // what she says, not what she tells Haiku (checkSystem is a prompt)
  const lines = (o: object): string[] =>
    Object.entries(o)
      .filter(([k]) => k !== 'checkSystem' && k !== 'narrateSystem')
      .flatMap(([, v]) => (Array.isArray(v) ? v : v && typeof v === 'object' ? lines(v) : typeof v === 'string' ? [v] : []))
  for (const s of lines(MORE_EN)) {
    if (!s.trim()) throw new Error('an empty line')
    if (s.length > 110 && !s.includes('\n')) throw new Error(`too long for a bubble: "${s}"`)
  }
  expect(Object.keys(MORE_EN.badges).sort()).toEqual([...BADGES].sort())
})

// ------------------------------------------------------------------ in a session

test('a returning person on All Saints’ Day: a candle and a quiet word', SLOW, async ($, on) => {
  engine(on, { onboarded: true, bond: bondOn(dayOf(NOV1) - 1) }, NOV1)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /candle/ })).toBeTruthy()
  await ui.unmount()
})

test('a fifth day in a row is a streak she names', SLOW, async ($, on) => {
  engine(on, { onboarded: true, bond: bondOn(dayOf(TUE) - 1, { streak: 4 }) })
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /Day 5 in a row/ })).toBeTruthy()
  await ui.unmount()
})

test('a force push is the one thing she hates', SLOW, async ($, on) => {
  const toasts: string[] = []
  engine(on, { onboarded: true, bond: bondOn(dayOf(TUE)) }, TUE, () => ({ result: {} }), toasts)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.tool.call({ tool: 'Bash', command: 'git push --force origin main' })
  expect(toasts.join(' ')).toContain('force push')
})

test('a type error gets its own words', SLOW, async ($, on) => {
  engine(on, { onboarded: true, bond: bondOn(dayOf(TUE)) }, TUE, () => ({ result: {}, isError: true, text: 'src/a.ts(1,1): error TS2322: no' }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.tool.call({ tool: 'Bash', command: 'npm run build' })
  const ui = await $.ui.mount(PANE)
  // one of several lines, each about the types (or tsc)
  expect(await ui.find({ type: 'Text', text: /\btypes?\b|\btsc\b/i })).toBeTruthy()
  await ui.unmount()
})

test('red, then green: her favourite colour change', SLOW, async ($, on) => {
  let calls = 0
  engine(on, { onboarded: true, bond: bondOn(dayOf(TUE)) }, TUE, () =>
    ++calls === 1 ? { result: {}, isError: true, text: ' 1 fail' } : { result: {} },
  )
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.turn.start({ text: 'fix it', turnId: 'm' } as never)
  await $.tool.call({ tool: 'Bash', command: 'npx bun test' })
  await $.tool.call({ tool: 'Bash', command: 'npx bun test' })
  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /Red to green/ })).toBeTruthy()
  await ui.unmount()
})

test('/claudia today counts the day; /claudia badges lists them', SLOW, async ($, on) => {
  const stored: Record<string, unknown> = { onboarded: true, bond: bondOn(dayOf(TUE)) }
  engine(on, stored)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  await $.tool.call({ tool: 'Bash', command: 'git commit -m x' })
  const today = await $.command.run({ command: 'claudia', args: 'today' } as never)
  expect(today.text).toContain('turns: 1')
  expect(today.text).toContain('commits: 1')
  const badges = await $.command.run({ command: 'claudia', args: 'badges' } as never)
  expect(badges.text).toContain('First green tests')
  expect((stored.today as { commits: number }).commits).toBe(1)
})

test('the first green tests earn a badge', SLOW, async ($, on) => {
  engine(on, { onboarded: true, bond: bondOn(dayOf(TUE), { badges: {} }) })
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.tool.call({ tool: 'Bash', command: 'npx bun test' })
  const badges = await $.command.run({ command: 'claudia', args: 'badges' } as never)
  expect(badges.text).toContain('🏅 First green tests')
})

test('two sessions share one memory: a save adds its own changes, never wipes the other’s', () => {
  const day = dayOf(TUE)
  const mine = bondOn(day, { badges: { firstGreen: 1, nightOwl: day } })
  const p = noPending()
  p.total.commits = 2
  p.today.turns = 3
  p.badges.nightOwl = day
  // meanwhile another session saved a commit and a badge of its own
  const stored = bondOn(day, { badges: { firstGreen: 1, weekend: day } })
  stored.total.commits = 10
  const merged = mergeBond(stored, mine, p)
  expect(merged.total.commits).toBe(12)
  expect(Object.keys(merged.badges).sort()).toEqual(['firstGreen', 'nightOwl', 'weekend'])
  const t = mergeToday({ ...readToday(null, day), turns: 5 }, p)
  expect(t.turns).toBe(8)
})

test('in a session: what another session saved meanwhile survives the next save', SLOW, async ($, on) => {
  const stored: Record<string, unknown> = { onboarded: true, bond: bondOn(dayOf(TUE)) }
  engine(on, stored)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  // another session: five turns today and a badge
  const other = stored.today as { turns: number }
  stored.today = { ...other, turns: other.turns + 5 }
  stored.bond = { ...(stored.bond as Bond), badges: { ...(stored.bond as Bond).badges, weekend: 1 } }
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  expect((stored.today as { turns: number }).turns).toBe(6)
  expect((stored.bond as Bond).badges.weekend).toBe(1)
})

test('the cake is a reward: once a turn, then a short word', SLOW, async ($, on) => {
  const stored: Record<string, unknown> = { onboarded: true, bond: bondOn(dayOf(TUE)) }
  engine(on, stored)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  expect((stored.today as { cakes: number }).cakes).toBe(1)
  // a new turn, a new cake
  await $.turn.start({ text: 'again', turnId: 'n' } as never)
  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  expect((stored.today as { cakes: number }).cakes).toBe(2)
})
