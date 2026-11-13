import { expect, test } from 'claude-code/testing'

// a loaded machine draws slowly: these tests wait for the drawing, not for a stopwatch
const SLOW = { timeoutMs: 30_000 }

const PANE = {
  plugin: 'claudia-companion',
  component: 'Pane',
  requestId: 'claudia',
  surface: 'terminal',
  props: {
    title: 'Claudia',
    isFocused: false,
    bodyColumns: 40,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 24 },
    view: {},
  },
} as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function engine(on: any, stored: Record<string, unknown> = { onboarded: true }) {
  on('command.register', () => ({ value: { command: 'claudia' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))
  on('prompt.submit', (_: unknown, e: unknown) => e)
  on('clock.now', () => ({ value: Date.UTC(2026, 10, 1, 14, 0) }))
  on('clock.every', () => ({ value: undefined }))
  on('clock.after', () => ({ value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('store.get', (_: unknown, e: { key: string }) => ({ value: stored[e.key] }))
  on('store.set', () => ({ value: undefined }))
  on('store.delete', () => ({ value: undefined }))
}

test('draws Claudia and blushes at thanks, in English by default', SLOW, async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.prompt.submit({ text: 'thanks!' } as never)

  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Raster' })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /any time|welcome|Happy to help|Thank you/i })).toBeTruthy()
  await ui.unmount()
})

test('git push: the guard warns, then a DOWNFORCE launch', SLOW, async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.tool.call({ tool: 'Bash', command: 'git push origin dev' })

  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /Launched|Pushed|ALL pending commits/ })).toBeTruthy()
  await ui.unmount()
})

test('a working subagent gets a little Claudia', SLOW, async ($, on) => {
  engine(on)
  on('turn.start', () => ({ turnId: 't1' }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.turn.start({ text: 'task', turnId: 't1', agentId: 'a1' } as never)

  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /helpers: general/ })).toBeTruthy()
  await ui.unmount()
})

test('helpers show their kind: Explore with a magnifier, Plan with a notebook', SLOW, async ($, on) => {
  engine(on)
  let n = 0
  on('agent.spawn', () => ({ model: 'haiku', agentId: `s${++n}` }))
  on('turn.start', () => ({ turnId: 't' }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.agent.spawn({ prompt: 'look', subagentType: 'Explore' } as never)
  await $.agent.spawn({ prompt: 'look', subagentType: 'Explore' } as never)
  await $.agent.spawn({ prompt: 'plan', subagentType: 'Plan' } as never)
  for (const id of ['s1', 's2', 's3']) await $.turn.start({ text: 'task', turnId: id, agentId: id } as never)

  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /helpers: Explore ×2 · Plan/ })).toBeTruthy()
  expect(JSON.stringify(await ui.findAll({ type: 'Raster' }))).toContain('"rows":6')
  await ui.unmount()
})

test('more helpers than a row holds: they go on in a second row, none left out', SLOW, async ($, on) => {
  engine(on)
  let n = 0
  on('agent.spawn', () => ({ model: 'haiku', agentId: `s${++n}` }))
  on('turn.start', () => ({ turnId: 't' }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  for (let i = 0; i < 5; i++) await $.agent.spawn({ prompt: 'look', subagentType: 'Explore' } as never)
  for (const id of ['s1', 's2', 's3', 's4', 's5']) await $.turn.start({ text: 'task', turnId: id, agentId: id } as never)
  const ui = await $.ui.mount(PANE)
  const rasters = JSON.stringify(await ui.findAll({ type: 'Raster' }))
  // a 40-column pane holds three with a magnifier in a row: the other two go in a second
  expect(rasters).toContain('minis-0')
  expect(rasters).toContain('minis-1')
  expect(rasters).not.toContain('minis-2')
  await ui.unmount()
})

test('THE CAKE IS NOT A LIE: passing tests bring the cake', SLOW, async ($, on) => {
  // the first-green badge is already hers, so its word does not take the bubble
  engine(on, { onboarded: true, bond: { firstDay: 1, lastDay: 1, streak: 1, best: 1, days: 1, total: {}, badges: { firstGreen: 1 } } })
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.tool.call({ tool: 'Bash', command: 'npx bun test src' })

  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /cake/i })).toBeTruthy()
  await ui.unmount()
})

test('/claudia about tells who she is', SLOW, async ($, on) => {
  engine(on)
  on('command.run', () => ({ text: '' }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const r = await $.command.run({ command: 'claudia', args: 'about' } as never)
  expect(JSON.stringify(r)).toContain('Claudia by anabology')
})

test('first run opens the settings, with comments and reminders off', SLOW, async ($, on) => {
  engine(on, {})
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /settings/ })).toBeTruthy()
  expect(await ui.find({ type: 'Button', key: 'isCommenting' })).toBeTruthy()
  expect(JSON.stringify(await ui.find({ type: 'Button', key: 'isCommenting' }))).toContain('off')
  await ui.unmount()
})

test('the desktop app gets her as SVG', SLOW, async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Svg' })).toBeTruthy()
  await ui.unmount()
})

test('a narrow pane draws her compact', SLOW, async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, props: { ...PANE.props, bodyColumns: 30, placement: 'inline' } })
  const r = await ui.find({ type: 'Raster' })
  expect(JSON.stringify(r)).toContain('"rows":13')
  await ui.unmount()
})

test('the bubble says what a command is for, never a cut description', SLOW, async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const bubble = async (command: string, description: string) => {
    await $.tool.call({ tool: 'Bash', command, description } as never)
    const ui = await $.ui.mount(PANE)
    const t = (await ui.findAll({ type: 'Text' }))[0]?.text ?? ''
    await ui.unmount()
    return t
  }
  // a long description: what the command is for, in plain words
  const script = await bubble('cd "C:/x/y" && D=1 python claudia_art.py out.png hooks/art.ts', 'Restore previous mic drawing, re-export and check')
  expect(script).toContain('Running a script (claudia_art.py)')
  expect(script).not.toContain('Restore previous')
  expect(await bubble("sed -i 's/a/b/' x.ts", 'Replace every old name with the new one in the file')).toContain('Tweaking a file')
  expect(await bubble('git status --short', 'Show which files changed in the working tree since')).toContain('Checking git')
  // a short description, whole: Claude's own words
  // a chain: what first, then what (and never Claude's own description)
  expect(await bubble('git status && rg TODO src', 'Pokaż status i szukaj TODO')).toContain('Checking git, then searching the code.')
})

test('she shrinks with the pane: full, head, then words only', SLOW, async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const full = await $.ui.mount({ ...PANE, props: { ...PANE.props, bodyColumns: 40, placement: 'dock' } })
  expect(JSON.stringify(await full.find({ type: 'Raster' }))).toContain('"rows":18')
  await full.unmount()

  const head = await $.ui.mount({ ...PANE, props: { ...PANE.props, bodyColumns: 31, placement: 'dock' } })
  expect(JSON.stringify(await head.find({ type: 'Raster' }))).toContain('"rows":13')
  await head.unmount()

  const words = await $.ui.mount({ ...PANE, props: { ...PANE.props, bodyColumns: 24, placement: 'dock' } })
  expect(await words.find({ type: 'Raster' })).toBeFalsy()
  expect(await words.find({ type: 'Text' })).toBeTruthy()
  await words.unmount()
})

test('words of your own from the local overlay: she reacts to them too', SLOW, async ($, on) => {
  engine(on)
  on('fs.read', () => ({ value: JSON.stringify({ words: { thanks: ['merci'], laugh: ['mdr'] } }) }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.prompt.submit({ text: 'merci beaucoup' } as never)
  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /any time|welcome|Happy to help|Thank you/i })).toBeTruthy()
  await ui.unmount()
})
