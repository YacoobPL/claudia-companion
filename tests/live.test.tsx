// What a live session showed (a test Claude Code driven in a virtual terminal), kept as tests.
import { expect, test } from 'claude-code/testing'

// a loaded machine draws slowly: these tests wait for the drawing, not for a stopwatch
const SLOW = { timeoutMs: 30_000 }

const NOW = new Date(2026, 10, 10, 14, 0).getTime()

const pane = () =>
  ({
    plugin: 'claudia-companion',
    component: 'Pane',
    requestId: 'claudia',
    surface: 'terminal',
    props: { title: 'Claudia', isFocused: false, bodyColumns: 34, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
  }) as const

const OVERLAY = JSON.stringify({ project: 'Acme Shop (a web store)', repos: ['acme-web', 'acme-api'] })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function engine(on: any, seen: { closes: number; systems: string[] }, folders: Record<string, string[]> = {}) {
  const stored: Record<string, unknown> = { onboarded: true, isCommenting: true }
  on('command.register', () => ({ value: { command: 'claudia' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
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
  on('env.get', (_: unknown, e: { name: string }) => ({ value: e.name === 'USERPROFILE' ? 'C:\\Users\\tester' : undefined }))
  on('fs.read', (_: unknown, e: { path: string }) => {
    if (e.path.replace(/\\/g, '/').endsWith('claudia/local.json')) return { value: OVERLAY }
    throw new Error('no file')
  })
  on('fs.list', (_: unknown, e: { path?: string }) => {
    const p = (e.path ?? '').replace(/\\/g, '/').replace(/\/$/, '')
    const key = Object.keys(folders).find(k => p.endsWith(k))
    return { value: (key ? folders[key]! : []).map(name => ({ name, kind: 'dir', size: 0 })) }
  })
  on('model.complete', (_: unknown, e: { system?: string }) => {
    seen.systems.push(String(e.system ?? ''))
    return { value: { isAnswered: true, text: 'Nice.', usage: { input_tokens: 1, output_tokens: 1 } } }
  })
  on('process.run', () => ({ value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false } }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const run = async ($: any, args: string) => ((await $.command.run({ command: 'claudia', args } as never)) as { text: string }).text

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const texts = async ($: any) => {
  const ui = await $.ui.mount(pane() as never)
  const all = (await ui.findAll({ type: 'Text' })).map((t: { text: string }) => t.text).join(' ')
  await ui.unmount()
  return all as string
}

test('any other command brings her back from the settings', SLOW, async ($, on) => {
  engine(on, { closes: 0, systems: [] })
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  await run($, 'settings')
  expect(await texts($)).toContain('settings')
  await run($, 'today')
  expect(await texts($)).not.toContain('Tab to move')
})

test('the band or the status line alone: her pane closes', SLOW, async ($, on) => {
  const seen = { closes: 0, systems: [] as string[] }
  engine(on, seen)
  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
  await texts($)
  await run($, 'display band')
  expect(seen.closes).toBe(1)
})

const bandOn = (surface: 'terminal' | 'desktop') =>
  ({
    plugin: 'claudia-companion',
    component: 'AbovePrompt',
    surface,
    viewport: { columns: 160, rows: 40, isFullscreen: true },
    props: { hasSurvey: false, isWorking: false, maxRows: 8, bodyColumns: 156 },
  }) as const

for (const surface of ['terminal', 'desktop'] as const) {
  test(`${surface}: the wardrobe from the band shows her once, and closes its pane when left`, SLOW, async ($, on) => {
    const seen = { closes: 0, systems: [] as string[] }
    engine(on, seen)
    await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })
    await run($, 'display band')
    const closed = seen.closes
    await run($, 'wardrobe')
    const p = await $.ui.mount({ ...pane(), surface } as never)
    // the pane holds the wardrobe; the band above the prompt gives way while it is up
    const up = await $.ui.mount(bandOn(surface) as never)
    expect((await up.findAll({ type: 'Text' })).map((t: { text: string }) => t.text).join(' ')).not.toContain('✷')
    await up.unmount()
    await run($, 'today')
    expect(seen.closes).toBe(closed + 1)
    await p.unmount()
    // the band is hers again
    const back = await $.ui.mount(bandOn(surface) as never)
    expect((await back.findAll({ type: 'Text' })).map((t: { text: string }) => t.text).join(' ')).toContain('✷')
    await back.unmount()
  })
}

test('the overlay’s project only where its repositories are', SLOW, async ($, on) => {
  const seen = { closes: 0, systems: [] as string[] }
  engine(on, seen, { '/elsewhere': ['src'], '/acme': ['acme-web', 'acme-api'] })
  await $.session.start({ cwd: '/elsewhere', surface: 'terminal', isInteractive: true })
  await run($, 'say hi')
  expect(seen.systems.join(' ')).not.toContain('Acme Shop')
})

test('…and there it is', SLOW, async ($, on) => {
  const seen = { closes: 0, systems: [] as string[] }
  engine(on, seen, { '/elsewhere': ['src'], '/acme': ['acme-web', 'acme-api'] })
  await $.session.start({ cwd: '/acme', surface: 'terminal', isInteractive: true })
  await run($, 'say hi')
  expect(seen.systems.join(' ')).toContain('Acme Shop')
})
