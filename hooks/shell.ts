// Reading a shell line: its steps, what really runs in it (quotes and heredocs aside), its programs.
// Pure functions and patterns: nothing here knows about Claudia or the session.

/** Text from outside (a file's name, a tool's, a folder's) with nothing in it a terminal would act on: no escapes, no direction marks. */
const CONTROL = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g
export const plain = (text: string) => text.replace(CONTROL, '')

export function base(path: unknown) {
  return typeof path === 'string' ? plain(path.split(/[\\/]/).filter(Boolean).pop() ?? path) : ''
}

export const short = (text: unknown, n = 34) => {
  const s = typeof text === 'string' ? plain(text).replace(/\s+/g, ' ').trim() : ''
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

export const DB_WRITE = /\b(INSERT\s+INTO|UPDATE\s+\w+\s+SET|ALTER\s+TABLE|CREATE\s+(TABLE|INDEX|SCHEMA|VIEW|MATERIALIZED))\b/i
export const isDbWork = (cmd: string) => /psycopg|psql|mysql|sqlite3|migrat|prisma\s+migrate|\.sql\b/i.test(cmd)
/** A database tool by its name: `db` counts only as a word of its own (never the one inside `feedback`). */
export const isDbTool = (tool: string) => /^mcp__.*(postgres|postgis|sql|supabase|mongo|bigquery|snowflake|(?<![a-z])(db|database)(?![a-z]))/i.test(tool)
/** A program that runs SQL: only there does a `DROP TABLE` in the line mean one. */
export const SQL_CLIENT = /\b(psql|mysql|mariadb|sqlite3|sqlcmd|duckdb|clickhouse-client|psycopg\d?|asyncpg|pymysql|sqlalchemy|pg_restore)\b/i
/** Programs that only read or print: SQL in their line is text, not a statement. */
export const READER = /^(grep|rg|ag|cat|bat|echo|printf|head|tail|less|more|wc|ls|dir|find|findstr|sed|awk|git|gh|diff|type|select-string|get-content|sls|gc)$/i

/** `git`, past its own options (`-C <folder>`, `-c key=value`, `--no-pager`), up to the subcommand. */
const GIT = String.raw`\bgit(?:\.exe)?(?:\s+(?:-C\s+(?:"[^"]*"|'[^']*'|[^\s"']\S*)|-c\s+\S+|--[\w-]+(?:=\S+)?))*\s+`
export const GIT_COMMIT = new RegExp(String.raw`${GIT}commit\b`)
export const GIT_PUSH = new RegExp(String.raw`${GIT}push\b`)
export const GIT_FORCE_PUSH = new RegExp(String.raw`${GIT}push\b[^|&;\n]*\s(?:--force|-f)(?=[\s"']|$)`)
export const GIT_WIPE = new RegExp(String.raw`${GIT}(?:reset\s+--hard|clean\s+-[a-z]*f|checkout\s+--\s|restore\s(?!--staged))`)
/** The command prints its own exit code after itself (`…; echo EXIT=$?`), so the shell always ends well. */
export const ECHOES_EXIT = /(?:^|[;&|\n])\s*(?:echo|write-host|write-output)\b\s*([^;&|\n$]*)\$(?:\?|\{?LASTEXITCODE\}?|\{?PIPESTATUS\b)/i
/** A test run's own count of failures (never "0 failed"). */
export const TESTS_FAILED = /\b[1-9]\d* (?:fail|failed|failing|failures?)\b|\(fail\)|^FAILED\b|✗/m
/** Programs that only look: no match, no difference, no such file is their answer, not a stumble. */
const PROBE = /^(grep|rg|ag|findstr|head|tail|wc|sort|uniq|diff|cmp|test|\[|which|where|ls|dir|select-string|sls|test-path)$/i
export function isProbe(runs: string) {
  const programs = programsOf(runs).filter(Boolean)
  return programs.length > 0 && programs.every(p => PROBE.test(p))
}
/** What a call was about, to tell "the same thing works now" from "something else worked". */
export function callKey(tool: string, input: Record<string, unknown>, runs: string, isTests: boolean) {
  if (tool === 'Bash' || tool === 'PowerShell') return isTests ? 'tests' : `run:${programsOf(runs).filter(Boolean).pop() ?? ''}`
  return `${tool === 'Write' ? 'Edit' : tool}:${typeof input.file_path === 'string' ? input.file_path : ''}`
}

/** A tool the person turned down at its prompt, in the engine's own words for it. */
export const REFUSED = /doesn.t want to proceed with this tool use|tool use was rejected|\[Request interrupted by user/i
export const PIPE_TO_SHELL = /\b(curl|wget)\b[^|;&\n]*\|\s*(sudo\s+)?(ba|z|da|k)?sh\b|\b(iwr|irm|invoke-webrequest|invoke-restmethod)\b[^|;&\n]*\|\s*(iex|invoke-expression)\b/i

/** Programs whose next word says what they do: `git commit`, `npm test`, `gh pr`. */
const WITH_SUBCOMMAND = new Set([
  'git', 'npm', 'pnpm', 'yarn', 'bun', 'npx', 'bunx', 'gh', 'docker', 'kubectl', 'gcloud', 'claude',
  'cargo', 'go', 'pip', 'uv', 'poetry', 'terraform', 'make', 'deno', 'dotnet', 'brew', 'apt', 'winget',
])

/**
 * The steps of a shell line: split at `&&`, `||`, `;` and new lines, but never inside quotes
 * (`python -c "import x; print(x)"` is one step) and never inside a heredoc's body (the lines of a
 * script fed to `python - <<'EOF'` are not commands).
 */
export function splitSteps(command: string): string[] {
  const text = withoutHeredocs(command)
  const mask = quotedMask(text)
  const steps: string[] = []
  let cur = ''
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!
    if (!mask[i]) {
      const two = text.slice(i, i + 2)
      if ((two === '&&' || two === '||') && !mask[i + 1]) {
        steps.push(cur)
        cur = ''
        i++
        continue
      }
      if (c === ';' || c === '\n') {
        steps.push(cur)
        cur = ''
        continue
      }
    }
    cur += c
  }
  steps.push(cur)
  return steps.map(t => t.trim()).filter(Boolean)
}

/** A shell line without its heredoc bodies: from the end of the heredoc's line to its closing word. */
function withoutHeredocs(whole: string): string {
  if (typeof whole !== 'string') return ''
  // no command is read past its first 8000 characters, whoever asks: a long script costs no more than a short one
  const command = whole.length > 8000 ? whole.slice(0, 8000) : whole
  return command.replace(/<<-?\s*(['"]?)([A-Za-z_]\w*)\1([^\n]*)\n[\s\S]*?\n[ \t]*\2[ \t\r]*(?=\n|$)/g, (_m, _q, _w, after: string) => after)
}

/**
 * For each character of a shell line: is it inside quotes (the quote marks too)? A backslash escapes
 * a double quote, except at the end of a quoted Windows path (`"C:\dir\" next`), where it is the path's own.
 */
function quotedMask(text: string): boolean[] {
  const mask = new Array<boolean>(text.length).fill(false)
  let quote: string | null = null
  let from = 0
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!
    if (quote) {
      mask[i] = true
      if (c === '\\' && quote === '"' && i + 1 < text.length) {
        const isPathEnd = text[i + 1] === '"' && /^([A-Za-z]:\\|\\\\)/.test(text.slice(from + 1, i)) && /^(\s|$)/.test(text.slice(i + 2, i + 3))
        if (!isPathEnd) {
          mask[++i] = true
          continue
        }
      }
      if (c === quote) quote = null
    } else if (c === '"' || c === "'") {
      quote = c
      from = i
      mask[i] = true
    }
  }
  return mask
}

/**
 * What a shell line really runs: heredoc bodies dropped and quoted text blanked, so a commit message
 * that says `jest` or `DROP TABLE` is not read as a command. A script handed to a shell
 * (`bash -c "…"`, `powershell -Command "…"`, `eval "…"`, `ssh host "…"`) stays: that text does run.
 */
export function bare(command: string): string {
  const text = withoutHeredocs(command)
  const mask = quotedMask(text)
  let out = ''
  let keep = false
  for (let i = 0; i < text.length; i++) {
    if (mask[i] && !mask[i - 1]) keep = /(?:^|\s)(?:-l?i?c|-command|eval|ssh\s+\S+)\s*$/i.test(text.slice(Math.max(0, i - 60), i))
    out += mask[i] && !keep && text[i] !== '"' && text[i] !== "'" ? ' ' : text[i]
  }
  return out
}

/** The programs of a line, step by step and pipe by pipe: `echo x | psql` is `echo` and `psql`. */
export function programsOf(command: string): string[] {
  return splitSteps(command)
    .flatMap(step => bare(step).split('|'))
    .map(part => commandLabel(part).split(' ')[0] ?? '')
    .filter(Boolean)
}

/** What a shell command runs, in two or three words: `git commit`, `python claudia_art.py`, `tsc`. */
export function commandLabel(command: unknown): string {
  if (typeof command !== 'string') return ''
  // the first real step: past `cd x &&`, env assignments, `timeout 120`, `sudo`
  const steps = splitSteps(command)
  const step = steps.find(t => !/^(cd|pushd|popd|set|export|echo)(?=\s|$)/.test(t) && !/^\w+=\S*$/.test(t)) ?? steps[0] ?? ''
  const words = step
    .replace(/^(\w+=\S+\s+)+/, '')
    .replace(/^(sudo|timeout\s+\d+[a-z]?|time|nice)\s+/i, '')
    // git's own options before the subcommand: `git -C repo status` is `git status`
    .replace(/^(git(?:\.exe)?)(?:\s+(?:-C\s+(?:"[^"]*"|'[^']*'|[^\s"']\S*)|-c\s+\S+|--[\w-]+(?:=\S+)?))+(?=\s)/i, '$1')
    .split(/\s+/)
    .filter(Boolean)
  const exe = (words[0] ?? '').replace(/^["']|["']$/g, '')
  const name = (exe.split(/[\\/]/).pop() ?? exe).replace(/\.(exe|cmd|bat|ps1)$/i, '')
  if (!name) return ''
  const rest = words.slice(1).filter(w => !w.startsWith('-') && !/^["'$]/.test(w))
  if (/^python\d*(\.\d+)?$|^node$|^tsx$|^ts-node$/i.test(name)) {
    const script = rest.find(w => /\.(py|js|mjs|cjs|ts|tsx)$/i.test(w))
    return script ? `${name} ${script.split(/[\\/]/).pop()}` : name
  }
  if (WITH_SUBCOMMAND.has(name.toLowerCase()) && rest[0]) {
    const sub = rest[0].split(/[\\/]/).pop() ?? rest[0]
    return `${name} ${sub}`.slice(0, 32)
  }
  return name.slice(0, 32)
}

/** A short line that ends at a word, never in the middle of one. */
export function clip(text: unknown, n = 30): string {
  const s = typeof text === 'string' ? plain(text).replace(/\s+/g, ' ').trim() : ''
  if (s.length <= n) return s
  const cut = s.slice(0, n).replace(/\s+\S*$/, '')
  return cut.length >= n / 2 ? cut : s.slice(0, n)
}
