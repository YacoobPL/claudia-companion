import { expect, test } from 'claude-code/testing'

import { FAIL_LINES, OK_LINES, STACK_LINES, TIPS, scriptNamed, scriptsOf, stackOf } from '../hooks/tech'

// a loaded machine draws slowly: these tests wait for the drawing, not for a stopwatch
const SLOW = { timeoutMs: 30_000 }

const PANE = {
  plugin: 'claudia-companion',
  component: 'Pane',
  requestId: 'claudia',
  surface: 'terminal',
  props: { title: 'Claudia', isFocused: false, bodyColumns: 40, placement: 'dock', scroll: { offset: 0, bodyRows: 60 }, view: {} },
} as const

const FRONT = JSON.stringify({
  scripts: { typecheck: 'tsc --noEmit', check: 'rg TODO src && git status', 'e2e:smoke': 'playwright test --grep @smoke' },
  dependencies: { next: '15', react: '19', payload: '3', '@supabase/supabase-js': '2', leaflet: '1' },
  devDependencies: { tailwindcss: '3', '@playwright/test': '1' },
})
const API = '[project]\ndependencies = [\n  "fastapi>=0.1",\n  "asyncpg",\n  "shapely",\n  "pyproj",\n  "stripe",\n]\n'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function engine(on: any, tool: (e: Record<string, unknown>) => unknown = () => ({ result: {} })) {
  const dirs: Record<string, string[]> = {
    '/work': ['web', 'api', 'notes'],
    '/work/web': ['package.json', 'next.config.ts', 'src'],
    '/work/api': ['pyproject.toml', 'api'],
    '/work/notes': ['a.md'],
  }
  on('command.register', () => ({ value: { command: 'claudia' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('tool.call', (_: unknown, e: Record<string, unknown>) => tool(e))
  on('turn.start', () => ({ turnId: 't' }))
  on('command.run', () => ({ text: '' }))
  on('clock.now', () => ({ value: new Date(2026, 10, 10, 14, 0).getTime() }))
  on('clock.every', () => ({ value: undefined }))
  on('clock.after', () => ({ value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('store.get', (_: unknown, e: { key: string }) => ({ value: e.key === 'onboarded' ? true : undefined }))
  on('store.set', () => ({ value: undefined }))
  // the kit hands paths over absolute (C:/work/web): match by their end
  on('fs.list', (_: unknown, e: { path?: string }) => {
    const p = (e.path ?? '/work').replace(/\\/g, '/').replace(/\/$/, '')
    const key = Object.keys(dirs)
      .sort((a, b) => b.length - a.length)
      .find(k => p.endsWith(k))
    return { value: (key ? dirs[key]! : []).map(name => ({ name, kind: name.includes('.') ? 'file' : 'dir', size: 0 })) }
  })
  on('fs.read', (_: unknown, e: { path: string }) => {
    const p = e.path.replace(/\\/g, '/')
    if (p.endsWith('web/package.json')) return { value: FRONT }
    if (p.endsWith('api/pyproject.toml')) return { value: API }
    throw new Error('no file')
  })
  on('process.run', () => ({ value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false } }))
}

const bubble = async ($: any) => {
  const ui = await $.ui.mount(PANE)
  const t = (await ui.findAll({ type: 'Text' }))[0]?.text ?? ''
  await ui.unmount()
  return t as string
}

// ------------------------------------------------------------------ pure

test('the stack: frameworks, data, maps and tests from the manifests', () => {
  expect(stackOf(['package.json'], FRONT)).toEqual(['Next.js', 'Tailwind', 'Payload CMS', 'Supabase', 'Maps', 'Playwright'])
  expect(stackOf(['pyproject.toml'], null, API)).toEqual(['FastAPI', 'PostgreSQL', 'GIS', 'Stripe'])
  expect(stackOf(['requirements.txt'], null, 'pandas\nnumpy\n')).toEqual(['Data', 'Python'])
})

test('package scripts: read by name, and runs that name them', () => {
  expect(scriptsOf(FRONT).typecheck).toBe('tsc --noEmit')
  expect(scriptNamed('npm run typecheck')).toBe('typecheck')
  expect(scriptNamed('pnpm e2e:smoke')).toBe('e2e:smoke')
  expect(scriptNamed('npm install')).toBe(null)
  expect(scriptNamed('npm test')).toBe(null)
})

test('her words: enough of them, and short', () => {
  for (const lines of [...Object.values(OK_LINES), ...Object.values(FAIL_LINES), ...Object.values(TIPS), ...Object.values(STACK_LINES)]) {
    for (const s of lines ?? []) if (!s.trim() || s.length > 110) throw new Error(`"${s}"`)
  }
  expect(Object.keys(TIPS)).toContain('FastAPI')
})

// ------------------------------------------------------------------ in a session

test('a project of a web app and an API: the stack by folder, the scripts known', SLOW, async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount(PANE)
  await ui.advance(100)
  await ui.unmount()
  const report = ((await $.command.run({ command: 'claudia', args: 'doctor' } as never)) as { text: string }).text
  expect(report).toContain('web: Next.js, Tailwind, Payload CMS')
  expect(report).toContain('api: FastAPI, PostgreSQL, GIS, Stripe')
  expect(report).toContain('typecheck')
})

test('a package script reads as what it runs', SLOW, async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount(PANE)
  await ui.advance(100)
  await ui.unmount()
  await $.tool.call({ tool: 'Bash', command: 'npm run check' } as never)
  expect(await bubble($)).toContain('Searching the code, then checking git.')
})

test('a build that goes through, and one that fails, in their own world', SLOW, async ($, on) => {
  let fail = false
  engine(on, () => (fail ? { result: {}, isError: true, text: 'error[E0382]: borrow of moved value' } : { result: {} }))
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  await $.tool.call({ tool: 'Bash', command: 'cargo build' } as never)
  expect(OK_LINES.rust).toContain((await bubble($)).replace(/^✷ /, ''))
  fail = true
  await $.tool.call({ tool: 'Bash', command: 'cargo build' } as never)
  expect(FAIL_LINES.rust).toContain((await bubble($)).replace(/^✷ /, ''))
})

test('a quoted ; and a heredoc body are not steps of a chain', SLOW, async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount(PANE)
  await ui.advance(100)
  await ui.unmount()
  await $.tool.call({ tool: 'Bash', command: `python -c "import winpty; print('winpty ok')"` } as never)
  const one = await bubble($)
  expect(one).toContain('quick script')
  expect(one).not.toContain('print')
  expect(one).not.toContain(', then')
  await $.tool.call({ tool: 'Bash', command: "cd /work && python - <<'EOF'\np = 'hooks/register.tsx'\ns = open(p).read(); print(len(s))\nEOF" } as never)
  const two = await bubble($)
  expect(two).toContain('quick script')
  expect(two).not.toContain('register.tsx')
  expect(two).not.toContain(', then')
})
