import { expect, test } from 'claude-code/testing'

import { cautionIn, lastSentence, questionAtEnd } from '../hooks/reading'

// a loaded machine draws slowly: these tests wait for the drawing, not for a stopwatch
const SLOW = { timeoutMs: 30_000 }

const PANE = {
  plugin: 'claudia-companion',
  component: 'Pane',
  requestId: 'claudia',
  surface: 'terminal',
  props: { title: 'Claudia', isFocused: false, bodyColumns: 40, placement: 'dock', scroll: { offset: 0, bodyRows: 60 }, view: {} },
} as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function engine(on: any, stored: Record<string, unknown>, haiku: string[] = [], said: string[] = [], prompts: string[] = [], model?: (e: { prompt?: string }) => unknown) {
  on('command.register', () => ({ value: { command: 'claudia' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('turn.start', () => ({ turnId: 't' }))
  on('turn.complete', (_: unknown, e: { text?: string }) => ({ text: e.text ?? '' }))
  on('prompt.submit', (_: unknown, e: unknown) => e)
  on('clock.now', () => ({ value: new Date(2026, 10, 10, 14, 0).getTime() }))
  on('clock.every', () => ({ value: undefined }))
  on('clock.after', () => ({ value: undefined }))
  on('ui.status', (_: unknown, e: unknown) => {
    said.push(JSON.stringify(e))
    return { value: undefined }
  })
  on('ui.toast', (_: unknown, e: unknown) => {
    said.push(JSON.stringify(e))
    return { value: undefined }
  })
  on('ui.notify', () => ({ value: undefined }))
  on('store.get', (_: unknown, e: { key: string }) => ({ value: stored[e.key] }))
  on('store.set', () => ({ value: undefined }))
  on('store.delete', () => ({ value: undefined }))
  on('process.run', () => ({ value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false } }))
  on('model.complete', (_: unknown, e: { prompt?: string }) => {
    if (model) return model(e)
    prompts.push(String(e.prompt ?? ''))
    return { value: { isAnswered: true, text: haiku.shift() ?? 'Nice. ♪', usage: { input_tokens: 1, output_tokens: 1 } } }
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function answered($: any, prompt: string, answer: string) {
  await $.prompt.submit({ text: prompt } as never)
  await $.turn.start({ text: prompt, turnId: 'm' } as never)
  await $.turn.complete({ turnId: 'm', reason: 'answer', answer, text: answer, durationMs: 10, isAborted: false } as never)
  // two seconds on: the check and the comment (due 1.5 s after the turn) run; her one-minute calm does not
  const ui = await $.ui.mount(PANE)
  await ui.advance(2000)
  await ui.unmount()
}

// ------------------------------------------------------------------ what she notices, locally

test('a question left for the person at the end of the answer', () => {
  expect(questionAtEnd('Done: the bars are split.\n\nWhich do we ship first, 1 or 2?')).toBe('Which do we ship first, 1 or 2?')
  expect(questionAtEnd('Done. The bars are split. Do we build 1 + 4?')).toBe('Do we build 1 + 4?')
  expect(questionAtEnd('**Shall we?**')).toBe('Shall we?')
  expect(questionAtEnd('Why? Because the line was cut.\n\nAll fixed.')).toBe(null)
  expect(questionAtEnd('Here:\n```js\nconst x = a ? b : c\n```')).toBe(null)
  expect(questionAtEnd('')).toBe(null)
})

test('a word of caution inside the answer; a strong one first', () => {
  expect(cautionIn('Fixed the bars. I have not tested it in the desktop app. Tests pass.')).toEqual({ text: 'I have not tested it in the desktop app.', isStrong: false })
  expect(cautionIn('Done. I cannot test this here: check it live.')).toEqual({ text: 'I cannot test this here: check it live.', isStrong: false })
  expect(cautionIn('Tests are failing on the second table.')).toEqual({ text: 'Tests are failing on the second table.', isStrong: true })
  expect(cautionIn('I did not test it. The migration failed to apply.')).toEqual({ text: 'The migration failed to apply.', isStrong: true })
  expect(cautionIn('Done. Tests pass, 49 of 49. Nothing committed.')).toBe(null)
  expect(cautionIn('All done, tests pass.')).toBe(null)
})

// ------------------------------------------------------------------ in a session
// (the test kit runs her timers at once, so her bubble settles back to rest before a test can read it:
// these read what she put in the status bar and in toasts instead)

test('an answer that ends with a question: she waves and repeats it', SLOW, async ($, on) => {
  const said: string[] = []
  engine(on, { onboarded: true }, [], said)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await answered($, 'what next?', ['Three options below.', '', 'Which one do we build?'].join('\n'))
  expect(said.join(' ')).toMatch(/Your turn|Over to you|left you a question/)
})

test('an answer with a caution: she points at the sentence', SLOW, async ($, on) => {
  const said: string[] = []
  engine(on, { onboarded: true }, [], said)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await answered($, 'fix it', 'Fixed. I could not run the e2e tests here.')
  expect(said.join(' ')).toMatch(/couldn’t check|couldn’t test/)
})

test('reading the exchange: Haiku names what is missing', SLOW, async ($, on) => {
  const said: string[] = []
  engine(on, { onboarded: true, isReading: true }, ['point 3, the desktop app, is not covered'], said)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await answered($, 'please do points 1, 2, 3 and 4 from the list above, all of them', 'Done 1, 2 and 4. All tests pass.')
  expect(said.join(' ')).toContain('I may have missed something: point 3, the desktop app, is not covered')
})

test('reading the exchange: OK means no alarm, and the comment comes as usual', SLOW, async ($, on) => {
  const said: string[] = []
  const haiku = ['OK', 'All four, nice. ♪']
  engine(on, { onboarded: true, isReading: true, isCommenting: true }, haiku, said)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await answered($, 'please do points 1, 2, 3 and 4 from the list above, all of them', 'Done all four. Tests pass.')
  expect(said.join(' ')).not.toContain('missed something')
  // both Haiku answers were asked for: the check, then the comment
  expect(haiku).toHaveLength(0)
})

test('without reading the exchange, no check is made', SLOW, async ($, on) => {
  const said: string[] = []
  const haiku = ['point 3 is missing']
  engine(on, { onboarded: true }, haiku, said)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await answered($, 'please do points 1, 2, 3 and 4 from the list above, all of them', 'Done 1, 2 and 4.')
  expect(said.join(' ')).not.toContain('missed something')
  expect(haiku).toHaveLength(1)
})

test('a strong caution: a nervous face and a toast', SLOW, async ($, on) => {
  const said: string[] = []
  engine(on, { onboarded: true }, [], said)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await answered($, 'migrate it', 'Ran it. The migration failed to apply on the second table.')
  expect(said.join(' ')).toMatch(/something failed|didn’t work out/)
})

test('with comments on, the comment answers Claude’s question and takes the bubble; the question stays in the status bar', SLOW, async ($, on) => {
  const said: string[] = []
  const prompts: string[] = []
  engine(on, { onboarded: true, isCommenting: true }, ['I’d pick 1 and 4, honestly! 👋'], said, prompts)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  // (the test kit runs every pending timer when a pane mounts, her calm included, so the bubble itself
  // cannot be read here: the prompt Haiku got and the status bar can)
  await answered($, 'what next?', ['Three options below.', '', 'Do we build 1 and 4?'].join('\n'))
  expect(prompts.join(' ')).toContain('asking the user: “Do we build 1 and 4?”')
  expect(said.join(' ')).toMatch(/Your turn|Over to you|left you a question/)
})

test('a weak caution only goes to the status bar, and the comment is told about it', SLOW, async ($, on) => {
  const said: string[] = []
  const prompts: string[] = []
  engine(on, { onboarded: true, isCommenting: true }, ['Bigger me! Check the app though. ♪'], said, prompts)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await answered($, 'make her bigger', 'Done: a big size. I have not tested it in the desktop app.')
  expect(said.join(' ')).toMatch(/couldn’t check|couldn’t test/)
  expect(prompts.join(' ')).toContain('In your answer you said: “I have not tested it in the desktop app.”')
})

test('the last sentence Claude wrote before a tool', () => {
  expect(lastSentence('Found it. Checking what the session line shows:')).toBe('Checking what the session line shows.')
  expect(lastSentence('Now the tests.')).toBe('Now the tests.')
  expect(lastSentence('Ok.')).toBe(null)
  expect(lastSentence('')).toBe(null)
  expect(lastSentence('Here is the plan, step by step, in a long sentence that keeps on going far past what a bubble can hold at all.')!.length).toBeLessThanOrEqual(100)
})

test('narration: Claude’s note on a step becomes her own English line', SLOW, async ($, on) => {
  const prompts: string[] = []
  engine(on, { onboarded: true, isNarrating: true }, ['Checking the types before the tests.'], [], prompts)
  on('tool.call', () => ({ result: {} }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  await $.tool.call({ tool: 'Bash', command: 'npm run dev', description: 'Sprawdź typy przed testami' } as never)
  expect(prompts.join(' ')).toContain('Note: Sprawdź typy przed testami')
  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /Checking the types before the tests\./ })).toBeTruthy()
  await ui.unmount()
})

test('narration: one call at a time, a step that comes meanwhile asks for none', SLOW, async ($, on) => {
  const asked: string[] = []
  let answer: (v: unknown) => void = () => undefined
  // a call stays out until the test lets it back
  engine(on, { onboarded: true, isNarrating: true }, [], [], [], e => {
    asked.push(String(e.prompt ?? ''))
    return new Promise<unknown>(done => {
      answer = done
    })
  })
  on('tool.call', () => ({ result: {} }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  await $.tool.call({ tool: 'Bash', command: 'npm run dev', description: 'First step of the work' } as never)
  await $.tool.call({ tool: 'Bash', command: 'npm run lint', description: 'Second step of the work' } as never)
  await $.tool.call({ tool: 'Bash', command: 'npm run fmt', description: 'Third step of the work' } as never)
  expect(asked).toHaveLength(1)
  answer({ value: { isAnswered: true, text: 'Starting the first step.', usage: { input_tokens: 1, output_tokens: 1 } } })
  for (let i = 0; i < 50; i++) await Promise.resolve()
  // back: the next step may ask again
  await $.tool.call({ tool: 'Bash', command: 'npm run types', description: 'Fourth step of the work' } as never)
  expect(asked).toHaveLength(2)
  answer({ value: { isAnswered: true, text: 'x', usage: { input_tokens: 1, output_tokens: 1 } } })
})

test('her comment on the answer stays in the bubble until the next message', SLOW, async ($, on) => {
  engine(on, { onboarded: true, isCommenting: true }, ['Tidy work on the bars. ♪'])
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await answered($, 'split the bars', 'Done: the bars are split.')
  // a mount runs every pending timer, her rest included: the comment is still there
  const ui = await $.ui.mount(PANE)
  await ui.advance(120_000)
  expect(await ui.find({ type: 'Text', text: /Tidy work on the bars/ })).toBeTruthy()
  await ui.unmount()
})

test('a moment in the turn: a commit gets her own Haiku word over the stock line', SLOW, async ($, on) => {
  const prompts: string[] = []
  engine(on, { onboarded: true, isCommenting: true }, ['Committed, and it reads clean! ✷'], [], prompts)
  on('tool.call', () => ({ result: {} }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.turn.start({ text: 'commit it', turnId: 'm' } as never)
  await $.tool.call({ tool: 'Bash', command: 'git commit -m "bars"' } as never)
  const ui = await $.ui.mount(PANE)
  await ui.advance(100)
  expect(prompts.join(' ')).toContain('You just made a git commit')
  expect(await ui.find({ type: 'Text', text: /Committed, and it reads clean/ })).toBeTruthy()
  await ui.unmount()
  const report = ((await $.command.run({ command: 'claudia', args: 'doctor' } as never)) as { text: string }).text
  expect(report).toContain('Haiku this session: 1 calls, 1 answered, 1 shown')
  expect(report).toContain('Haiku tokens this session: 1 in, 1 out')
})

test('moments with comments off: no call', SLOW, async ($, on) => {
  const prompts: string[] = []
  engine(on, { onboarded: true }, ['x'], [], prompts)
  on('tool.call', () => ({ result: {} }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.turn.start({ text: 'commit it', turnId: 'm' } as never)
  await $.tool.call({ tool: 'Bash', command: 'git commit -m "bars"' } as never)
  const ui = await $.ui.mount(PANE)
  await ui.advance(100)
  await ui.unmount()
  expect(prompts).toHaveLength(0)
})

test('narration off: no call, her own free line', SLOW, async ($, on) => {
  const prompts: string[] = []
  engine(on, { onboarded: true }, ['x'], [], prompts)
  on('tool.call', () => ({ result: {} }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  await $.tool.call({ tool: 'Bash', command: 'npx tsc -p .', description: 'Sprawdź typy' } as never)
  expect(prompts).toHaveLength(0)
})
