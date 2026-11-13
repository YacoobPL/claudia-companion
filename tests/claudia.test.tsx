import { expect, test } from 'claude-code/testing'

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

test('draws Claudia and blushes at thanks, in English by default', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.prompt.submit({ text: 'thanks!' } as never)

  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Raster' })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /Stop it|Any time|Noted/ })).toBeTruthy()
  await ui.unmount()
})

test('speaks Polish when Polish is stored', async ($, on) => {
  engine(on, { lang: 'pl', onboarded: true })
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.prompt.submit({ text: 'dzięki!' } as never)

  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /Przestań|Zawsze|Odnotowane/ })).toBeTruthy()
  await ui.unmount()
})

test('git push: the guard warns, then a DOWNFORCE launch', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.tool.call({ tool: 'Bash', command: 'git push origin dev' })

  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /Launched|ALL pending commits/ })).toBeTruthy()
  await ui.unmount()
})

test('a working subagent gets a little Claudia', async ($, on) => {
  engine(on)
  on('turn.start', () => ({ turnId: 't1' }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.turn.start({ text: 'task', turnId: 't1', agentId: 'a1' } as never)

  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /helpers: 1/ })).toBeTruthy()
  await ui.unmount()
})

test('THE CAKE IS NOT A LIE: passing tests bring the cake', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.tool.call({ tool: 'Bash', command: 'npx bun test src' })

  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /The cake is real/ })).toBeTruthy()
  await ui.unmount()
})

test('/claudia about tells who she is', async ($, on) => {
  engine(on)
  on('command.run', () => ({ text: '' }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const r = await $.command.run({ command: 'claudia', args: 'about' } as never)
  expect(JSON.stringify(r)).toContain('Claudia by anabology')
})

test('first run opens the settings, with comments and reminders off', async ($, on) => {
  engine(on, {})
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /settings/ })).toBeTruthy()
  expect(await ui.find({ type: 'Button', key: 'isCommenting' })).toBeTruthy()
  expect(JSON.stringify(await ui.find({ type: 'Button', key: 'isCommenting' }))).toContain('off')
  await ui.unmount()
})

test('the desktop app gets her as SVG', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Svg' })).toBeTruthy()
  await ui.unmount()
})

test('a narrow pane draws her compact', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, props: { ...PANE.props, bodyColumns: 28, placement: 'inline' } })
  const r = await ui.find({ type: 'Raster' })
  expect(JSON.stringify(r)).toContain('"rows":14')
  await ui.unmount()
})
