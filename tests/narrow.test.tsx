import { expect, test } from 'claude-code/testing'

// a loaded machine draws slowly: these tests wait for the drawing, not for a stopwatch
const SLOW = { timeoutMs: 30_000 }

const NOW = new Date(2026, 10, 10, 14, 0).getTime()

/** Her pane as the surface seats it: beside the chat (dock) or, in a narrow fullscreen window, under it. */
const pane = (placement: 'dock' | 'inline', columns: number) =>
  ({
    plugin: 'claudia-companion',
    component: 'Pane',
    requestId: 'claudia',
    surface: 'terminal',
    viewport: { columns, rows: 40, isFullscreen: true },
    props: { title: 'Claudia', isFocused: false, bodyColumns: placement === 'dock' ? 34 : columns - 4, placement, scroll: { offset: 0, bodyRows: 30 }, view: {} },
  }) as const

const band = (columns: number) =>
  ({
    plugin: 'claudia-companion',
    component: 'AbovePrompt',
    surface: 'terminal',
    viewport: { columns, rows: 40, isFullscreen: true },
    props: { hasSurvey: false, isWorking: false, maxRows: 8, bodyColumns: columns - 4 },
  }) as const

type Seen = { opens: number; closes: number; placed: boolean }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function engine(on: any, seen: Seen) {
  const stored: Record<string, unknown> = { onboarded: true }
  on('command.register', () => ({ value: { command: 'claudia' } }))
  on('ui.open', () => {
    seen.opens += 1
    return { value: seen.placed ? { isPlaced: true } : { isPlaced: false, reason: 'unasked below 110 columns (the window is 90)' } }
  })
  on('ui.close', () => {
    seen.closes += 1
    return { value: undefined }
  })
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
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
  on('process.run', () => ({ value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false } }))
  return stored
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const shownAs = async ($: any) =>
  (((await $.command.run({ command: 'claudia', args: 'doctor' } as never)) as { text: string }).text.match(/shows as: (.*)/) ?? [])[1]

/** Draw one thing and put it away (what it saw is settled at the next command: here, doctor). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const draw = async ($: any, what: unknown) => {
  const ui = await $.ui.mount(what as never)
  await ui.unmount()
}

test('a narrow window: the pane under the chat becomes the band, and comes back beside it when the window widens', SLOW, async ($, on) => {
  const seen: Seen = { opens: 0, closes: 0, placed: true }
  const stored = engine(on, seen)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  await shownAs($)
  // narrowed to 90 columns: the surface seats her pane under the chat
  const under = await $.ui.mount(pane('inline', 90) as never)
  // no figure there: nothing of a fixed width that would hold the window from narrowing
  expect(await under.find({ type: 'Raster' })).toBeFalsy()
  await under.unmount()
  await draw($, band(90))
  expect(await shownAs($)).toBe('Band above the prompt')
  expect(seen.closes).toBe(1)
  // the person's choice is kept: the band was the window's, not theirs
  expect(stored.display).toBeUndefined()
  // widened to 150: back beside the chat
  const opensBefore = seen.opens
  await draw($, band(150))
  await shownAs($)
  expect(seen.opens).toBe(opensBefore + 1)
  expect(await shownAs($)).toBe('Pane beside the chat')
})

test('a pane the person asked for under the chat stays there', SLOW, async ($, on) => {
  const seen: Seen = { opens: 0, closes: 0, placed: true }
  engine(on, seen)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  await $.command.run({ command: 'claudia', args: 'settings' } as never)
  // (the settings may close and reopen the pane to hand it the keys)
  const closes = seen.closes
  await draw($, pane('inline', 90))
  expect(seen.closes).toBe(closes)
  expect(await shownAs($)).toBe('Pane beside the chat')
})

test('starting in a narrow window: the band at once, the pane once it widens', SLOW, async ($, on) => {
  const seen: Seen = { opens: 0, closes: 0, placed: false }
  engine(on, seen)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  // her first open runs on its own after the start: a command or two later it has settled
  if ((await shownAs($)) !== 'Band above the prompt') await shownAs($)
  expect(await shownAs($)).toBe('Band above the prompt')
  const first = await $.ui.mount(band(90) as never)
  const head = (await first.find({ type: 'Raster', key: 'band-claudia' })) as unknown as { props?: { columns?: number; rows?: number } } | null
  expect(head).toBeTruthy()
  // the helpers' chibi: 8 pixels across
  expect(head?.props?.columns ?? 8).toBe(8)
  await first.unmount()
  seen.placed = true
  await draw($, band(150))
  expect(await shownAs($)).toBe('Pane beside the chat')
})
