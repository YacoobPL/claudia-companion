import { expect, test } from 'claude-code/testing'

// a loaded machine draws slowly: these tests wait for the drawing, not for a stopwatch
const SLOW = { timeoutMs: 30_000 }

let clock = new Date(2026, 10, 10, 14, 0).getTime()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function engine(on: any, played: string[], stored: Record<string, unknown> = {}) {
  const store: Record<string, unknown> = { onboarded: true, isSound: true, ...stored }
  on('command.register', () => ({ value: { command: 'claudia' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('command.run', () => ({ text: '' }))
  on('turn.start', () => ({ turnId: 't' }))
  on('turn.complete', (_: unknown, e: { text?: string }) => ({ text: e.text ?? '' }))
  on('prompt.submit', (_: unknown, e: unknown) => e)
  on('clock.now', () => ({ value: clock }))
  on('clock.every', () => ({ value: undefined }))
  on('clock.after', () => ({ value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('ui.notify', () => ({ value: undefined }))
  on('store.get', (_: unknown, e: { key: string }) => ({ value: store[e.key] }))
  on('store.set', (_: unknown, e: { key: string; value: unknown }) => {
    store[e.key] = e.value
    return { value: undefined }
  })
  on('store.delete', () => ({ value: undefined }))
  on('process.run', (_: unknown, e: { argv?: string[]; command?: string[] }) => {
    const argv = (e.argv ?? e.command ?? []) as string[]
    const wav = argv.join(' ').match(/(\w+)\.wav/)
    if (wav) played.push(wav[1]!)
    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false } }
  })
  on('audio.play', (_: unknown, e: { asset: string }) => {
    played.push(e.asset.replace(/^.*\/|\.wav$/g, ''))
    return { value: undefined }
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function turn($: any, ms: number, reason = 'answer', text = 'Done.') {
  clock += 60_000
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  await $.turn.complete({ turnId: 'm', reason, answer: text, text, durationMs: ms, isAborted: reason === 'aborted' } as never)
  // the sound plays on its own after the turn: a command later it has
  await $.command.run({ command: 'claudia', args: 'today' } as never)
}

test('a long turn ends with the jingle; a short one you watched, with none', SLOW, async ($, on) => {
  const played: string[] = []
  engine(on, played)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  await turn($, 5_000)
  expect(played).toEqual([])
  await turn($, 45_000)
  expect(played).toEqual(['jingle'])
})

test('an answer that leaves you a question: the two rising tones, not the jingle', SLOW, async ($, on) => {
  const played: string[] = []
  engine(on, played)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  await turn($, 45_000, 'answer', 'Three options here.\n\nWhich one do we build?')
  expect(played).toEqual(['needyou'])
})

test('a turn that ended in an error: the low tone; one you stopped: nothing', SLOW, async ($, on) => {
  const played: string[] = []
  engine(on, played)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  await turn($, 45_000, 'aborted')
  expect(played).toEqual([])
  await turn($, 45_000, 'error')
  expect(played).toEqual(['oops'])
})

test('sounds off, or focus mode: silence', SLOW, async ($, on) => {
  const played: string[] = []
  engine(on, played, { isSound: false })
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  await turn($, 45_000)
  expect(played).toEqual([])
})
