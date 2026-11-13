import { expect, test } from 'claude-code/testing'

// a loaded machine draws slowly: these tests wait for the drawing, not for a stopwatch
const SLOW = { timeoutMs: 30_000 }

// Regression tests for the issues a code review found.

const PANE = {
  plugin: 'claudia-companion',
  component: 'Pane',
  requestId: 'claudia',
  surface: 'terminal',
  props: { title: 'Claudia', isFocused: false, bodyColumns: 40, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function engine(on: any, extra: { modelFails?: boolean } = {}) {
  on('command.register', () => ({ value: { command: 'claudia' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))
  on('turn.start', () => ({ turnId: 't' }))
  on('turn.complete', () => ({ text: 'done' }))
  on('command.run', () => ({ text: '' }))
  on('classic.PermissionRequest', () => ({}))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on('ui.render', ($: any, e: any) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  on('clock.now', () => ({ value: Date.UTC(2026, 10, 1, 14, 0) }))
  on('clock.every', () => ({ value: undefined }))
  on('clock.after', () => ({ value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('ui.notify', () => ({ value: { isSent: true } }))
  on('store.get', (_: unknown, e: { key: string }) => ({ value: e.key === 'onboarded' ? true : undefined }))
  on('store.set', () => ({ value: undefined }))
  on('fs.read', () => {
    throw new Error('no file')
  })
  on('fs.list', () => ({ value: [] }))
  on('process.run', () => ({ value: { exitCode: 0, stdout: 'Linux\n', stderr: '', isStdoutTruncated: false } }))
  on('model.complete', () => {
    if (extra.modelFails) throw new Error('offline')
    return { value: { isAnswered: true, text: 'Hm. ♪', usage: { input_tokens: 1, output_tokens: 1 } } }
  })
}

test('she stops waving once the approved tool shows progress', { timeoutMs: 30_000 }, async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/p', surface: 'terminal', isInteractive: true })
  await $.classic.PermissionRequest({ tool_name: 'Bash', tool_input: { command: 'npm test' } } as never)

  let ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /need your OK/ })).toBeTruthy()
  await ui.unmount()

  const progress = await $.ui.mount({ ...PANE, plugin: 'claudia-companion', component: 'ToolProgress', requestId: 'tu1', props: {} } as never)
  await progress.unmount()

  ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /need your OK/ })).toBeFalsy()
  await ui.unmount()
})

test('no helper stays counted after the main turn ends', SLOW, async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/p', surface: 'terminal', isInteractive: true })
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  await $.turn.start({ text: 'x', turnId: 'a', agentId: 'sub1' } as never)
  // the subagent's own end never arrives (it errored somewhere); the main turn ends
  await $.turn.complete({ turnId: 'm', reason: 'answer', answer: 'done', durationMs: 10, isAborted: false } as never)

  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /helpers/ })).toBeFalsy()
  await ui.unmount()
})

test('/claudia say answers even when the model call fails', SLOW, async ($, on) => {
  engine(on, { modelFails: true })
  await $.session.start({ cwd: '/p', surface: 'terminal', isInteractive: true })
  await $.command.run({ command: 'claudia', args: 'say hello' } as never)

  // the test kit runs her timers at once, so she has already moved on: what matters is she is not stuck thinking
  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /You: hello/ })).toBeFalsy()
  await ui.unmount()
})

test('rm -fr and rm -r -f both make her careful; git restore --staged does not', SLOW, async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/p', surface: 'terminal', isInteractive: true })
  for (const command of ['rm -fr build', 'rm -r -f build']) {
    await $.tool.call({ tool: 'Bash', command } as never)
    const ui = await $.ui.mount(PANE)
    expect(await ui.find({ type: 'Text', text: /Recursive delete/ })).toBeTruthy()
    await ui.unmount()
  }
  await $.tool.call({ tool: 'Bash', command: 'git restore --staged a.ts' } as never)
  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /wipe/ })).toBeFalsy()
  await ui.unmount()
})
