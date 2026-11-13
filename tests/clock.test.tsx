// Her clocks: what counts as work, what does not (a wait for the person, the computer asleep, a
// session closed), and helpers that work on after the main turn.
import { expect, test } from 'claude-code/testing'

const SLOW = { timeoutMs: 30_000 }
const T0 = new Date(2026, 10, 10, 14, 0).getTime()
const SEC = 1000
const MIN = 60 * SEC

const pane = () =>
  ({
    plugin: 'claudia-companion',
    component: 'Pane',
    requestId: 'claudia',
    surface: 'terminal',
    props: { title: 'Claudia', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
  }) as const

type World = { now: number; stored: Record<string, unknown>; running: string[]; tool: () => unknown }

const world = (): World => ({ now: T0, stored: { onboarded: true }, running: [], tool: () => ({ result: {} }) })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function engine(on: any, w: World) {
  on('command.register', () => ({ value: { command: 'claudia' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.close', () => ({ value: undefined }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('session.end', () => ({ sessionId: 'abc' }))
  on('session.id', () => ({ value: 'abc' }))
  on('tool.call', () => w.tool())
  on('turn.start', () => ({ turnId: 't' }))
  on('turn.complete', (_: unknown, e: { text?: string }) => ({ text: e.text ?? '' }))
  on('classic.PermissionRequest', () => ({}))
  on('classic.PostToolUse', () => ({}))
  on('agent.list', () => ({ value: w.running.map(id => ({ id, status: 'running' })) }))
  on('command.run', () => ({ text: '' }))
  on('clock.now', () => ({ value: w.now }))
  on('clock.every', () => ({ value: undefined }))
  on('clock.after', () => ({ value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('ui.notify', () => ({ value: undefined }))
  on('store.get', (_: unknown, e: { key: string }) => ({ value: w.stored[e.key] }))
  on('store.set', (_: unknown, e: { key: string; value: unknown }) => {
    w.stored[e.key] = e.value
    return { value: undefined }
  })
  on('store.delete', (_: unknown, e: { key: string }) => {
    delete w.stored[e.key]
    return { value: undefined }
  })
  on('store.keys', () => ({ value: Object.keys(w.stored) }))
  on('process.run', () => ({ value: { exitCode: 1, stdout: '', stderr: '', isStdoutTruncated: false } }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const start = async ($: any) => $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const begin = async ($: any, agentId?: string) => $.turn.start({ text: agentId ? 'look' : 'go', turnId: agentId ?? 'm', ...(agentId ? { agentId } : {}) } as never)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const end = async ($: any, durationMs: number, agentId?: string) =>
  $.turn.complete({ turnId: agentId ?? 'm', reason: 'answer', answer: 'ok', text: 'ok', durationMs, isAborted: false, ...(agentId ? { agentId } : {}) } as never)

const worked = (w: World) => Math.round(((w.stored['work:abc'] as number | undefined) ?? 0) / SEC)

test('a plain turn: its length is her work, once', SLOW, async ($, on) => {
  const w = world()
  engine(on, w)
  await start($)
  await begin($)
  w.now += 90 * SEC
  await end($, 90 * SEC)
  expect(worked(w)).toBe(90)
  // today's minutes say the same
  expect(Math.round(((w.stored.today as { minutes: number }).minutes) * 60)).toBe(90)
})

test('waiting for your OK is not her work', SLOW, async ($, on) => {
  const w = world()
  engine(on, w)
  await start($)
  await begin($)
  w.now += 5 * SEC
  await $.classic.PermissionRequest({ tool_name: 'Bash', permission_mode: 'default' } as never)
  // ten minutes until the OK, then the command takes twenty seconds
  w.now += 10 * MIN
  w.tool = () => {
    w.now += 20 * SEC
    return { result: {} }
  }
  await $.tool.call({ tool: 'Bash', command: 'npm run build' })
  w.now += 5 * SEC
  await end($, 10 * MIN + 30 * SEC)
  // twenty seconds of the command are waited too in this test (the OK comes when the tool ends here): at most 30 s of work
  expect(worked(w)).toBeLessThanOrEqual(30)
  expect(worked(w)).toBeGreaterThanOrEqual(10)
})

test('a short command after a long wait for the OK: the engine says how long it ran, and that much is work', SLOW, async ($, on) => {
  const w = world()
  engine(on, w)
  await start($)
  await begin($)
  await $.classic.PermissionRequest({ tool_name: 'Bash', permission_mode: 'default' } as never)
  w.now += 10 * MIN
  w.tool = () => {
    w.now += 20 * SEC
    return { result: {} }
  }
  await $.tool.call({ tool: 'Bash', command: 'npm run build' })
  await $.classic.PostToolUse({ tool_name: 'Bash', tool_input: {}, tool_response: {}, tool_use_id: 'x', duration_ms: 20 * SEC } as never)
  w.now += 5 * SEC
  await end($, 10 * MIN + 25 * SEC)
  expect(worked(w)).toBe(25)
})

test('a question to you, or a plan to approve, is your time', SLOW, async ($, on) => {
  const w = world()
  engine(on, w)
  await start($)
  await begin($)
  w.now += 10 * SEC
  w.tool = () => {
    w.now += 7 * MIN
    return { result: {} }
  }
  await $.tool.call({ tool: 'AskUserQuestion', questions: [] } as never)
  w.tool = () => ({ result: {} })
  w.now += 10 * SEC
  await end($, 7 * MIN + 20 * SEC)
  expect(worked(w)).toBe(20)
})

test('the computer asleep in the middle of a turn: those hours are not work, nor on the turn’s clock', SLOW, async ($, on) => {
  const w = world()
  engine(on, w)
  await start($)
  await begin($)
  const ui = await $.ui.mount(pane())
  w.now += 2 * SEC
  await ui.advance(1100)
  // the lid closes for three hours
  w.now += 3 * 60 * MIN
  await ui.advance(1100)
  w.now += 8 * SEC
  await ui.advance(100)
  const all = (await ui.findAll({ type: 'Text' })).map((t: { text: string }) => t.text).join(' ')
  await ui.unmount()
  expect(all).toMatch(/⏱ 0:\d\d/)
  await end($, 3 * 60 * MIN + 10 * SEC)
  expect(worked(w)).toBeLessThan(30)
})

test('a helper sent to the background works on after the turn: its time counts, without overlap', SLOW, async ($, on) => {
  const w = world()
  engine(on, w)
  await start($)
  await begin($)
  w.now += 2 * SEC
  await begin($, 'h1')
  w.running = ['h1']
  w.now += 8 * SEC
  await end($, 10 * SEC)
  expect(worked(w)).toBe(10)
  // five more minutes alone, then it comes back
  w.now += 5 * MIN
  await end($, 5 * MIN + 8 * SEC, 'h1')
  expect(worked(w)).toBe(10 + 300)
})

test('a helper that never comes back does not run the clock for hours', SLOW, async ($, on) => {
  const w = world()
  engine(on, w)
  await start($)
  await begin($)
  await begin($, 'h1')
  w.running = ['h1']
  w.now += 10 * SEC
  await end($, 10 * SEC)
  // nothing is heard of it; four hours later the next turn starts
  w.running = []
  w.now += 4 * 60 * MIN
  await begin($)
  // the turn, and two minutes past the last sign of the helper
  expect(worked(w)).toBe(10 + 120)
})

test('closing the session in the middle of a turn keeps the work done so far, and the open minute', SLOW, async ($, on) => {
  const w = world()
  engine(on, w)
  await start($)
  await begin($)
  w.now += 50 * SEC
  await $.session.end({ reason: 'prompt_input_exit', sessionId: 'abc', resume: { id: 'abc' } } as never)
  expect(worked(w)).toBe(50)
  expect(Math.round((w.stored['open:abc'] as number) / SEC)).toBe(50)
  expect(w.stored['turnAt:abc']).toBeUndefined()
  expect(w.stored['sess:abc']).toBeUndefined()
  // should the turn's own end still arrive, nothing is counted twice
  w.now += 1 * SEC
  await end($, 51 * SEC)
  expect(worked(w)).toBeLessThanOrEqual(51)
})

test('idle hours with the session open are open time, never work', SLOW, async ($, on) => {
  const w = world()
  engine(on, w)
  await start($)
  await begin($)
  w.now += 30 * SEC
  await end($, 30 * SEC)
  w.now += 5 * 60 * MIN
  await begin($)
  w.now += 30 * SEC
  await end($, 30 * SEC)
  expect(worked(w)).toBe(60)
})
