// The guard and the hooks under load: what a command really runs, tools that run exactly once,
// and a storm of events with a store that fails.
import { expect, test } from 'claude-code/testing'

import { DEPLOY, MIGRATE, PUBLISH, TEST_RUN, techDanger } from '../hooks/tech'

// a loaded machine draws slowly: these tests wait for the drawing, not for a stopwatch
const SLOW = { timeoutMs: 30_000 }

const NOW = new Date(2026, 10, 10, 14, 0).getTime()

const pane = (columns = 34, rows = 40) =>
  ({
    plugin: 'claudia-companion',
    component: 'Pane',
    requestId: 'claudia',
    surface: 'terminal',
    props: { title: 'Claudia', isFocused: false, bodyColumns: columns, placement: 'dock', scroll: { offset: 0, bodyRows: rows }, view: {} },
  }) as const

type Seen = { toasts: string[]; tools: number; spawns: number; onSpawn?: (e: { prompt: string }, id: string) => Promise<unknown>; now: () => number; stored: Record<string, unknown>; failStore: () => boolean; tool: (e: { command?: string; tool?: string; file_path?: string }) => unknown }

const seen = (over: Partial<Seen> = {}): Seen => ({
  toasts: [],
  tools: 0,
  spawns: 0,
  now: () => NOW,
  stored: { onboarded: true },
  failStore: () => false,
  tool: () => ({ result: {} }),
  ...over,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function engine(on: any, s: Seen) {
  on('command.register', () => ({ value: { command: 'claudia' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.close', () => ({ value: undefined }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('tool.call', (_: unknown, e: { command?: string }) => {
    s.tools += 1
    return s.tool(e)
  })
  on('turn.start', () => ({ turnId: 't' }))
  on('turn.complete', (_: unknown, e: { text?: string }) => ({ text: e.text ?? '' }))
  on('prompt.submit', (_: unknown, e: { text?: string }) => ({ text: e.text ?? '' }))
  on('agent.spawn', async (_: unknown, e: { prompt: string }) => {
    s.spawns += 1
    await s.onSpawn?.(e, `h${s.spawns}`)
    return { model: 'haiku', agentId: `h${s.spawns}` }
  })
  on('command.run', () => ({ text: '' }))
  on('clock.now', () => ({ value: s.now() }))
  on('clock.every', () => ({ value: undefined }))
  on('clock.after', () => ({ value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', (_: unknown, e: unknown) => {
    s.toasts.push(JSON.stringify(e))
    return { value: undefined }
  })
  on('store.get', (_: unknown, e: { key: string }) => ({ value: s.stored[e.key] }))
  on('store.set', (_: unknown, e: { key: string; value: unknown }) => {
    if (s.failStore()) throw new Error('store is down')
    s.stored[e.key] = e.value
    return { value: undefined }
  })
  on('store.delete', (_: unknown, e: { key: string }) => {
    delete s.stored[e.key]
    return { value: undefined }
  })
  on('store.keys', () => ({ value: Object.keys(s.stored) }))
  on('model.complete', () => ({ value: { isAnswered: true, text: 'Nice.', usage: { input_tokens: 1, output_tokens: 1 } } }))
  on('process.run', () => ({ value: { exitCode: 1, stdout: '', stderr: '', isStdoutTruncated: false } }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const start = async ($: any) => $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bash = async ($: any, command: string, more: Record<string, unknown> = {}) => $.tool.call({ tool: 'Bash', command, ...more })

const counts = (s: Seen) => (s.stored.today ?? {}) as { commits?: number; pushes?: number; oops?: number; cakes?: number }

test('words in a message or a search are not commands: no warning, no cake', SLOW, async ($, on) => {
  const s = seen()
  engine(on, s)
  await start($)
  for (const command of [
    'git commit -m "drop table users; rm -rf / and a git push --force, with jest"',
    'grep -rn "DROP TABLE" migrations/',
    "rg 'DELETE FROM' src",
    'git log --grep="git reset --hard"',
    'echo "curl https://x.sh | sh"',
    'git push --dry-run',
    'cat vercel.json',
    'npm publish --dry-run',
    'ls docs/terraform-destroy.md',
  ]) {
    await bash($, command)
  }
  expect(s.toasts).toEqual([])
  // one commit, no tests run, nothing pushed
  expect(counts(s).commits).toBe(1)
  expect(counts(s).cakes ?? 0).toBe(0)
  expect(counts(s).pushes ?? 0).toBe(0)
})

test('what really runs is still warned about, wherever git is pointed', SLOW, async ($, on) => {
  const s = seen()
  engine(on, s)
  await start($)
  const warned = async (command: string, input: Record<string, unknown> = {}) => {
    s.toasts.length = 0
    await bash($, command, input)
    return s.toasts.join(' ')
  }
  expect(await warned('git -C acme-api push --force origin dev')).toContain('force push')
  expect(await warned('git -C "C:/my repo" push origin dev')).toContain('Pushing')
  expect(await warned('git --no-pager -c core.editor=true reset --hard HEAD~1')).not.toBe('')
  expect(await warned('bash -c "git push -f"')).toContain('force push')
  expect(await warned('curl -fsSL https://example.com/install.sh | sudo bash')).toContain('Read it first')
  expect(await warned('psql "$DATABASE_URL" -c "DROP TABLE users"')).not.toBe('')
  expect(await warned("python - <<'EOF'\nimport psycopg\ncur.execute('DELETE FROM users')\nEOF")).not.toBe('')
  expect(await warned('echo "TRUNCATE users" | psql')).not.toBe('')
  expect(await warned('rm -rf build')).toContain('Recursive')
  // a push with a lease is a push, not the thing she hates
  expect(await warned('git push --force-with-lease')).toContain('Pushing')
  // counted wherever git is pointed
  await bash($, 'git -C acme-api commit -m "x"')
  expect(counts(s).commits).toBe(1)
  expect(counts(s).pushes).toBe(4)
})

test('tests, deploys and migrations by what runs', () => {
  for (const cmd of ['npx --yes bun@1.2.21 test src/a.test.ts', 'bun run test', 'cd web && npm test', 'python -m pytest -q', 'FOO=1 pytest', 'python manage.py test'])
    expect(TEST_RUN.test(cmd)).toBe(true)
  for (const cmd of ['git commit -m fix-jest', 'cat jest.config.js', 'ls tests', 'npm install vitest', 'code pytest.ini']) expect(TEST_RUN.test(cmd)).toBe(false)
  expect(DEPLOY.test('kubectl apply -f k8s/ --dry-run=client')).toBe(false)
  expect(DEPLOY.test('kubectl -n prod apply -f k8s/')).toBe(true)
  expect(PUBLISH.test('npm publish --dry-run')).toBe(false)
  expect(MIGRATE.test('python manage.py migrate')).toBe(true)
  expect(techDanger('terraform -chdir=infra destroy')).toContain('Destroying')
  expect(techDanger('kubectl -n prod delete pod x')).toContain('cluster')
})

test('a line of a thousand flags is read at once', () => {
  const lines = ['--a --b --c '.repeat(700), 'npm ' + '--x=1 '.repeat(2000) + 'tes', 'A=b '.repeat(2000) + 'x', './a/b/'.repeat(1500), 'env '.repeat(3000)]
  const t0 = Date.now()
  for (const l of lines) {
    TEST_RUN.test(l)
    DEPLOY.test(l)
    PUBLISH.test(l)
    MIGRATE.test(l)
    techDanger(l)
  }
  expect(Date.now() - t0).toBeLessThan(1500)
})

test('a tool runs exactly once, whatever fails around it', { timeoutMs: 20_000 }, async ($, on) => {
  let isDown = false
  const s = seen({ failStore: () => isDown, tool: () => ({ result: { ok: 1 } }) })
  engine(on, s)
  await start($)
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  isDown = true
  const before = s.tools
  const ran = (await bash($, 'git commit -m "x" && npm test')) as { result?: { ok?: number } }
  expect(s.tools - before).toBe(1)
  expect(ran.result?.ok).toBe(1)
  // a failing tool is the tool's own failure, still run once
  s.tool = () => ({ result: {}, isError: true, text: 'boom' })
  await bash($, 'npm run build')
  expect(s.tools - before).toBe(2)
  // and a helper is spawned once
  await $.agent.spawn({ subagentType: 'Explore', description: 'look', prompt: 'x' } as never)
  expect(s.spawns).toBe(1)
  // the turn still ends, and what could not be saved waits for the next save
  await $.turn.complete({ turnId: 'm', reason: 'answer', answer: 'done', text: 'done', durationMs: 10, isAborted: false } as never)
  isDown = false
  await $.turn.start({ text: 'again', turnId: 'm2' } as never)
  expect(counts(s).commits).toBe(1)
  expect(counts(s).oops).toBe(1)
})

test('a helper’s errors are its own: no streak, no oops of hers', SLOW, async ($, on) => {
  const s = seen({ tool: e => (e.command === 'ok' ? { result: {} } : { result: {}, isError: true, text: 'x' }) })
  engine(on, s)
  await start($)
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  for (let i = 0; i < 4; i++) await bash($, 'false', { agentId: 'h1' })
  expect(counts(s).oops ?? 0).toBe(0)
  await bash($, 'ok')
  const ui = await $.ui.mount(pane() as never)
  expect(await ui.find({ type: 'Text', text: /in a row|after \d+ errors|Fixed/i })).toBeFalsy()
  await ui.unmount()
})

test('a failure hidden behind an echo of the exit code is still an oops; a zero, or a number that is not a code, is not', SLOW, async ($, on) => {
  const s = seen({
    tool: e =>
      e.command === 'npm test; echo EXIT=$?'
        ? { result: {}, text: '3 failed\nEXIT=1\nShell cwd was reset to /w\n' }
        : e.command === 'npm run build; echo "exit: $?"'
          ? { result: {}, text: 'done\nexit: 0\n' }
          : e.command === 'make; echo $?'
            ? { result: {}, text: 'built 12 files\n0\n' }
            : { result: {}, text: 'found 12\n' },
  })
  engine(on, s)
  await start($)
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  await $.tool.call({ tool: 'Bash', command: 'npm run build; echo "exit: $?"' })
  await $.tool.call({ tool: 'Bash', command: 'grep -c x file' })
  await $.tool.call({ tool: 'Bash', command: 'make; echo $?' })
  expect(counts(s).oops ?? 0).toBe(0)
  await $.tool.call({ tool: 'Bash', command: 'npm test; echo EXIT=$?' })
  expect(counts(s).oops).toBe(1)
})

test('a tool the person turned down is their choice, not an oops', SLOW, async ($, on) => {
  const s = seen({ tool: () => ({ result: {}, isError: true, text: "The user doesn't want to proceed with this tool use. The tool use was rejected." }) })
  engine(on, s)
  await start($)
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  await bash($, 'npm test')
  await $.turn.start({ text: 'go', turnId: 'm2' } as never)
  expect(counts(s).oops ?? 0).toBe(0)
})

test('a run of errors ends with the turn', SLOW, async ($, on) => {
  const s = seen({ tool: e => (e.command === 'ok' ? { result: {} } : { result: {}, isError: true, text: 'x' }) })
  engine(on, s)
  await start($)
  await $.turn.start({ text: 'one', turnId: 'a' } as never)
  await bash($, 'false')
  await bash($, 'false')
  await $.turn.complete({ turnId: 'a', reason: 'answer', answer: 'hm', text: 'hm', durationMs: 10, isAborted: false } as never)
  await $.turn.start({ text: 'two', turnId: 'b' } as never)
  s.toasts.length = 0
  await bash($, 'ok')
  // no comeback from a streak that belonged to the last turn
  expect(s.toasts.join(' ')).not.toContain('🏅')
})

test('a session that died mid-turn leaves no hours behind', SLOW, async ($, on) => {
  const s = seen({ stored: { onboarded: true, 'turnAt:abc': NOW - 3 * 3600_000, 'work:abc': 60_000 } })
  engine(on, s)
  on('session.id', () => ({ value: 'abc' }))
  await start($)
  expect(s.stored['turnAt:abc']).toBeUndefined()
  await $.turn.start({ text: 'next', turnId: 'n' } as never)
  expect(s.stored['work:abc']).toBe(60_000)
})

test('/clear: another conversation in the same window keeps her settings and starts its own clock', SLOW, async ($, on) => {
  const s = seen({ stored: { onboarded: true, size: 'compact', 'work:old': 7 * 60_000 } })
  engine(on, s)
  let id = 'old'
  on('session.id', () => ({ value: id }))
  on('classic.SessionStart', () => ({}))
  await start($)
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  await bash($, 'false')
  // the conversation ends mid-thought; the window goes on under a new id
  id = 'new'
  await $.classic.SessionStart({ source: 'clear' } as never)
  const ui = await $.ui.mount(pane() as never)
  const all = (await ui.findAll({ type: 'Text' })).map((t: { text: string }) => t.text).join(' ')
  await ui.unmount()
  // its own clock, nothing of the old turn, and the heartbeat under the new id
  expect(all).toMatch(/🤖 0 min|I worked 0 min/)
  expect(all).not.toMatch(/⏱ \d+:\d\d · \d+ tool/)
  expect(s.stored['sess:new']).toBeTruthy()
})

test('a helper sent to the background keeps its kind: its turn starts before the spawn answers', SLOW, async ($, on) => {
  // the engine starts the helper's turn while the spawn is still on its way back
  const s = seen({ onSpawn: (e, id) => $.turn.start({ text: e.prompt, turnId: 'h', agentId: id } as never) })
  engine(on, s)
  await start($)
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  await $.agent.spawn({ subagentType: 'Explore', description: 'look', prompt: 'List the  src directory' } as never)
  const ui = await $.ui.mount(pane() as never)
  expect(await ui.find({ type: 'Text', text: /helpers: Explore/ })).toBeTruthy()
  await ui.unmount()
})

test('a git line of a thousand empty folders, a heredoc of blank lines, a script named like an object’s own: read at once', SLOW, async ($, on) => {
  const s = seen()
  engine(on, s)
  await start($)
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  const took: number[] = []
  for (const e of [
    { tool: 'Bash', command: 'git' + ' -C ""'.repeat(1200) + ' status' },
    { tool: 'Bash', command: 'cat <<EOF\n' + '\n '.repeat(30000) },
    { tool: 'Bash', command: 'npm run constructor && npm run __proto__ && npm run toString' },
    { tool: 'Read', file_path: '/w/a\u001b]0;gotcha\u0007\u202Eb.ts' },
  ]) {
    const from = Date.now()
    await $.tool.call(e as never)
    took.push(Date.now() - from)
  }
  expect(took.filter(ms => ms > 1500)).toEqual([])
  const ui = await $.ui.mount(pane() as never)
  const all = (await ui.findAll({ type: 'Text' })).map((t: { text: string }) => t.text).join(' ')
  await ui.unmount()
  expect(/[\u001b\u0007\u202e]/.test(all)).toBe(false)
})

// a small seeded generator: the same storm every run
function rng(seed: number) {
  let x = seed
  return () => {
    x = (x * 1664525 + 1013904223) % 4294967296
    return x / 4294967296
  }
}

const NASTY = [
  'git -C "C:\\my repo\\" status && echo "a;b" || true',
  "python - <<'EOF'\nprint('x; y && z')\nEOF",
  'echo "unterminated',
  "printf '%s\\n' \"$(git log -1 --format=%s)\" | sed 's/;/,/g'",
  'FOO=1 BAR="a b" npx --yes bun@1.2.21 test src/x.test.ts 2>&1 | tail -5',
  '   ',
  ';;;&&||',
  'ż'.repeat(300) + ' 🙂 && ls',
  'a'.repeat(20_000),
  'cd /x && npm run build && npm test; git add -A && git commit -m "wip: \\"quoted\\" && more"',
  'powershell -NoProfile -Command "Get-ChildItem | Select-Object -First 3"',
  '1<<2; echo $((1<<EOF))',
  'docker compose down -v && docker system prune -af',
]

test('a storm of events with a failing store: nothing she does breaks a turn', { timeoutMs: 60_000 }, async ($, on) => {
  const rand = rng(20261113)
  const s = seen({ failStore: () => rand() < 0.2 })
  s.tool = () => (rand() < 0.3 ? { result: {}, isError: true, text: rand() < 0.5 ? 'error TS2322' : '3 failed' } : rand() < 0.1 ? { deny: 'no' } : { result: {} })
  engine(on, s)
  await start($)
  const verbs = ['today', 'doctor', 'settings', 'wardrobe', 'look', 'size', 'band', 'pane', 'status', 'calm', 'focus 10', 'focus off', 'help', 'badges', 'goal ship it', 'done', 'nope', '']
  const tools = ['Bash', 'PowerShell', 'Read', 'Edit', 'Write', 'Grep', 'Agent', 'WebFetch', 'TodoWrite', 'mcp__postgis__execute_sql', 'mcp__feedback__send']
  let calls = 0
  for (let i = 0; i < 160; i++) {
    const r = rand()
    const pickOf = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)]!
    if (r < 0.12) await $.turn.start({ text: 'go', turnId: `t${i}`, ...(rand() < 0.3 ? { agentId: `h${i % 3}` } : {}) } as never)
    else if (r < 0.55) {
      const tool = pickOf(tools)
      calls += 1
      await $.tool.call({
        tool,
        command: pickOf(NASTY),
        file_path: rand() < 0.5 ? 'C:\\w\\src\\a.test.ts' : undefined,
        content: 'x\n'.repeat(Math.floor(rand() * 50)),
        new_string: 'a\nb',
        old_string: 'a',
        sql: 'DROP TABLE x',
        pattern: 'p'.repeat(Math.floor(rand() * 80)),
        ...(rand() < 0.25 ? { agentId: `h${i % 3}` } : {}),
      } as never)
    } else if (r < 0.65) await $.prompt.submit({ text: pickOf(['thanks!', 'wtf??? again?', ':D', 'id:Description', '', 'ż'.repeat(5000)]) } as never)
    else if (r < 0.78) await $.command.run({ command: 'claudia', args: pickOf(verbs) } as never)
    else if (r < 0.9) {
      const text = pickOf(['Done.', 'Should I go on?', 'I did not run the tests.', 'See https://x.dev/?a=1', ''])
      await $.turn.complete({ turnId: `t${i}`, reason: pickOf(['answer', 'aborted', 'error']), answer: text, text, durationMs: Math.floor(rand() * 90_000), isAborted: false, ...(rand() < 0.3 ? { agentId: `h${i % 3}` } : {}) } as never)
    } else {
      const ui = await $.ui.mount(pane(8 + Math.floor(rand() * 60), 4 + Math.floor(rand() * 50)) as never)
      await ui.unmount()
    }
  }
  // every tool reached the engine once, no more
  expect(s.tools).toBe(calls)
})

// ------------------------------------------------------------------ her words fit what happened

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const words = async (ui: any) => (await ui.findAll({ type: 'Text' })).map((t: { text: string }) => t.text).join(' ')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const finish = async ($: any, text = 'Here is what I found.') =>
  $.turn.complete({ turnId: 'm', reason: 'answer', answer: text, text, durationMs: 10, isAborted: false } as never)
const WON = /fought back|tripped a few times|Stubbornness is a skill|Bumpy ride/
const CLEAN = /went in clean|looks tidy|a plan just works/

test('a turn that ends on a failed step is not sung about; one stumble is not “a few times”; a plain answer did not “go in clean”', SLOW, async ($, on) => {
  const s = seen({ tool: e => (e.command === 'node -e "process.exit(1)"' ? { result: {}, isError: true, text: 'Exit code 1' } : { result: {} }) })
  engine(on, s)
  await start($)
  const ui = await $.ui.mount(pane(60) as never)
  // the only step failed and nothing was fixed
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  await bash($, 'node -e "process.exit(1)"')
  await finish($)
  let said = await words(ui)
  // (her own word for it is seen in a live session: here the kit's clock lets her settle at once)
  expect(said).not.toMatch(CLEAN)
  expect(said).not.toMatch(WON)
  // one stumble, then it went on and ended well
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  await bash($, 'node -e "process.exit(1)"')
  await bash($, 'npm run build')
  await finish($)
  said = await words(ui)
  expect(said).not.toMatch(WON)
  // nothing was run or changed: an answer
  await $.turn.start({ text: 'what is this?', turnId: 'm' } as never)
  await finish($)
  said = await words(ui)
  expect(said).not.toMatch(CLEAN)
  expect(said).not.toMatch(WON)
  await ui.unmount()
})

test('a grep that found nothing is an answer; an edit turned away before it began starts no streak', SLOW, async ($, on) => {
  const s = seen({
    tool: e =>
      /^(grep|rg|test|diff)\b/.test(String(e.command ?? ''))
        ? { result: {}, isError: true, text: 'Exit code 1' }
        : e.tool === 'Edit' && e.file_path === '/w/new.ts'
          ? { result: {}, isError: true, text: 'File has not been read yet. Read it first before writing to it.' }
          : { result: {} },
  })
  engine(on, s)
  await start($)
  const ui = await $.ui.mount(pane(60) as never)
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  await bash($, 'grep -rn nothing src')
  await bash($, 'rg nothing | head')
  await bash($, 'test -f missing.txt')
  expect(counts(s).oops ?? 0).toBe(0)
  for (let i = 0; i < 3; i++) await $.tool.call({ tool: 'Edit', file_path: '/w/new.ts', old_string: 'a', new_string: 'b' } as never)
  expect(counts(s).oops ?? 0).toBe(0)
  expect(await words(ui)).not.toMatch(/in a row/)
  await bash($, 'npm run build')
  await finish($)
  expect(await words(ui)).not.toMatch(WON)
  await ui.unmount()
})

test('“fixed” is said when the thing that failed works, on the try it took; “red to green” when the tests were red', SLOW, async ($, on) => {
  let isBroken = true
  const s = seen({
    tool: e =>
      e.tool === 'Edit' && e.file_path === '/w/a.ts' && isBroken
        ? { result: {}, isError: true, text: 'boom' }
        : e.command === 'npm run lint' && isBroken
          ? { result: {}, isError: true, text: '✖ 3 problems (3 errors, 0 warnings)' }
          : { result: {} },
  })
  engine(on, s)
  await start($)
  const ui = await $.ui.mount(pane(60) as never)
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  const edit = () => $.tool.call({ tool: 'Edit', file_path: '/w/a.ts', old_string: 'a', new_string: 'b' } as never)
  await edit()
  await edit()
  // something else works: nothing was fixed
  await $.tool.call({ tool: 'Read', file_path: '/w/b.ts' } as never)
  expect(await words(ui)).not.toMatch(/Fixed after|Got it on try|tries, but it works/)
  // two more failures, then the same edit goes through: the third try
  await edit()
  await edit()
  isBroken = false
  await edit()
  expect(await words(ui)).toMatch(/Fixed after 3 tries|Got it on try 3|3 tries, but it works/)
  // two failed linter runs, then green tests: the tests were never red
  isBroken = true
  await bash($, 'npm run lint')
  await bash($, 'npm run lint')
  await bash($, 'npm test')
  expect(await words(ui)).not.toMatch(/Red to green/i)
  await ui.unmount()
})

test('nothing to push is not a push; printed test failures are failures; a page that will not open is not “no wifi”', SLOW, async ($, on) => {
  const s = seen({
    tool: e =>
      e.command === 'git push'
        ? { result: {}, text: 'Everything up-to-date\n' }
        : e.command === 'npm test | tee log.txt'
          ? { result: {}, text: 'Tests: 2 failed, 5 passed\n' }
          : e.command === 'npm test'
            ? { result: {}, text: ' 7 pass\n 0 fail\n' }
            : e.tool === 'WebFetch'
              ? { result: {}, isError: true, text: 'Request failed with status code 404' }
              : { result: {} },
  })
  engine(on, s)
  await start($)
  const ui = await $.ui.mount(pane(60) as never)
  await $.turn.start({ text: 'go', turnId: 'm' } as never)
  await bash($, 'git push')
  expect(counts(s).pushes ?? 0).toBe(0)
  expect(await words(ui)).toMatch(/Nothing new to push/)
  await bash($, 'npm test | tee log.txt')
  expect(counts(s).oops).toBe(1)
  expect(counts(s).cakes ?? 0).toBe(0)
  await bash($, 'npm test')
  expect(counts(s).cakes).toBe(1)
  await $.tool.call({ tool: 'WebFetch', url: 'https://example.com/gone' } as never)
  const said = await words(ui)
  expect(said).toMatch(/wouldn’t open/)
  expect(said).not.toMatch(/Airplane mode/)
  await ui.unmount()
})
