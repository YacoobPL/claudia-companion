// Claudia's memory of the two of you, her calendar, her opinions and her badges. Pure data and functions:
// register.tsx keeps the state and calls these.
import type { DayInfo, LineId } from '../types'

// ------------------------------------------------------------------ what she remembers

export type Counts = {
  turns: number
  minutes: number
  commits: number
  pushes: number
  cakes: number
  oops: number
  helpers: number
  added: number
  removed: number
}

/** Kept across sessions (store key `bond`). */
export type Bond = {
  firstDay: number
  lastDay: number
  streak: number
  best: number
  days: number
  total: Counts
  badges: Partial<Record<BadgeId, number>>
}

/** Today's counts (store key `today`); a new day starts them over. */
export type Today = Counts & { day: number; isRecapSaid: boolean }

export const zero = (): Counts => ({ turns: 0, minutes: 0, commits: 0, pushes: 0, cakes: 0, oops: 0, helpers: 0, added: 0, removed: 0 })

/** The local day number, so a streak turns over at midnight where the person lives. */
export const dayOf = (now: number) => Math.floor((now - new Date(now).getTimezoneOffset() * 60_000) / 86_400_000)

const isCounts = (v: unknown): v is Counts =>
  !!v && typeof v === 'object' && typeof (v as Counts).turns === 'number' && typeof (v as Counts).commits === 'number'

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** Counts as stored, each one a real number or zero (a hand-edited store never poisons the sums). */
function cleanCounts(v: unknown): Counts {
  const out = zero()
  if (!v || typeof v !== 'object') return out
  for (const k of Object.keys(out) as (keyof Counts)[]) {
    const n = (v as Record<string, unknown>)[k]
    if (isNum(n) && n >= 0) out[k] = n
  }
  return out
}

export function readBond(v: unknown): Bond | null {
  if (!v || typeof v !== 'object') return null
  const b = v as Bond
  if (!isNum(b.firstDay) || !isNum(b.lastDay)) return null
  return {
    firstDay: b.firstDay,
    lastDay: b.lastDay,
    streak: isNum(b.streak) ? b.streak : 1,
    best: isNum(b.best) ? b.best : 1,
    days: isNum(b.days) ? b.days : 1,
    total: cleanCounts(b.total),
    badges: b.badges && typeof b.badges === 'object' ? b.badges : {},
  }
}

export function readToday(v: unknown, day: number): Today {
  if (v && typeof v === 'object' && (v as Today).day === day && isCounts(v)) {
    return { ...cleanCounts(v), day, isRecapSaid: (v as Today).isRecapSaid === true }
  }
  return { ...zero(), day, isRecapSaid: false }
}

/** This session's own changes since its last save: what it adds on top of whatever is stored by then. */
export type Pending = { today: Counts; total: Counts; badges: Partial<Record<BadgeId, number>>; isRecapSaid: boolean }

export const noPending = (): Pending => ({ today: zero(), total: zero(), badges: {}, isRecapSaid: false })

/** Two sets of unsaved changes as one: what a failed save hands back, with what came since. */
export const joinPending = (a: Pending, b: Pending): Pending => ({
  today: add(a.today, b.today),
  total: add(a.total, b.total),
  badges: { ...b.badges, ...a.badges },
  isRecapSaid: a.isRecapSaid || b.isRecapSaid,
})

const add = (a: Counts, b: Counts): Counts => {
  const out = zero()
  for (const k of Object.keys(out) as (keyof Counts)[]) out[k] = (a[k] ?? 0) + (b[k] ?? 0)
  return out
}

/**
 * Several sessions share one memory, each saving after every change. A save starts from what is stored
 * now and adds only this session's changes, so no session wipes another's counts or badges.
 */
export function mergeBond(stored: Bond | null, mine: Bond, p: Pending): Bond {
  if (!stored) return mine
  const same = mine.lastDay === stored.lastDay
  const newer = mine.lastDay > stored.lastDay ? mine : stored
  return {
    firstDay: Math.min(stored.firstDay, mine.firstDay),
    lastDay: newer.lastDay,
    streak: same ? Math.max(stored.streak, mine.streak) : newer.streak,
    best: Math.max(stored.best, mine.best),
    days: Math.max(stored.days, mine.days),
    total: add(stored.total, p.total),
    // the first session to earn a badge keeps its day
    badges: { ...p.badges, ...stored.badges },
  }
}

export function mergeToday(stored: Today, p: Pending): Today {
  return { ...add(stored, p.today), day: stored.day, isRecapSaid: stored.isRecapSaid || p.isRecapSaid }
}

/** What a new session means for the two of you: the bond moved to today, and what kind of hello it is. */
export type Meeting =
  | { kind: 'first' }
  | { kind: 'sameDay' }
  | { kind: 'streak'; n: number }
  | { kind: 'missed'; days: number }
  | { kind: 'together'; days: number }
  | { kind: 'newDay' }

export function meet(bond: Bond | null, day: number): { bond: Bond; meeting: Meeting } {
  if (!bond) {
    return { bond: { firstDay: day, lastDay: day, streak: 1, best: 1, days: 1, total: zero(), badges: {} }, meeting: { kind: 'first' } }
  }
  if (day <= bond.lastDay) return { bond, meeting: { kind: 'sameDay' } }
  const gap = day - bond.lastDay
  const streak = gap === 1 ? bond.streak + 1 : 1
  const next: Bond = { ...bond, lastDay: day, streak, best: Math.max(bond.best, streak), days: bond.days + 1 }
  const since = day - bond.firstDay
  const meeting: Meeting = [30, 100, 365, 730].includes(since)
    ? { kind: 'together', days: since }
    : gap >= 7
      ? { kind: 'missed', days: gap }
      : streak >= 3
        ? { kind: 'streak', n: streak }
        : { kind: 'newDay' }
  return { bond: next, meeting }
}

// ------------------------------------------------------------------ her calendar

export type Season = 'halloween' | 'allSaints' | 'christmas' | 'yearEnd' | 'newYear'

export function seasonOf(now: number): Season | null {
  const d = new Date(now)
  const m = d.getMonth() + 1
  const day = d.getDate()
  if (m === 10 && day === 31) return 'halloween'
  if (m === 11 && (day === 1 || day === 2)) return 'allSaints'
  if (m === 12 && day >= 24 && day <= 26) return 'christmas'
  if (m === 12 && day === 31) return 'yearEnd'
  if (m === 1 && day === 1) return 'newYear'
  return null
}

/** What she holds on a holiday when nothing else is in her hands. */
export const SEASON_PROP: Partial<Record<Season, 'candle' | 'santa'>> = { allSaints: 'candle', christmas: 'santa' }

export type Moment = 'monday' | 'friday' | 'weekend' | 'late'

export function momentOf(now: number): Moment | null {
  const d = new Date(now)
  const h = d.getHours()
  const wd = d.getDay()
  if (h >= 22) return 'late'
  if (wd === 0 || wd === 6) return 'weekend'
  if (wd === 1 && h < 12) return 'monday'
  if (wd === 5 && h >= 14) return 'friday'
  return null
}

// ------------------------------------------------------------------ what she recognises

export type Program = 'git' | 'js' | 'python' | 'db' | 'docker' | 'web' | 'tsc' | 'claude'

/** The program behind a command label (`git commit`, `npx bun`, `python x.py`). */
export function programOf(label: string): Program | null {
  const first = label.split(/\s+/)[0]?.toLowerCase() ?? ''
  if (first === 'git' || first === 'gh') return 'git'
  if (['npm', 'pnpm', 'yarn', 'bun', 'npx', 'bunx', 'node', 'deno'].includes(first)) return 'js'
  if (/^python\d*(\.\d+)?$|^pip\d*$|^uv$|^poetry$|^pytest$/.test(first)) return 'python'
  if (['psql', 'mysql', 'sqlite3', 'pg_dump', 'pg_restore'].includes(first)) return 'db'
  if (first === 'docker' || first === 'docker-compose' || first === 'podman') return 'docker'
  if (first === 'curl' || first === 'wget' || first === 'invoke-webrequest') return 'web'
  if (first === 'tsc') return 'tsc'
  if (first === 'claude') return 'claude'
  return null
}

export type FileKind = 'sql' | 'css' | 'test' | 'migration' | 'docs' | 'config' | 'python'

export function fileKindOf(path: string): FileKind | null {
  const p = path.replace(/\\/g, '/').toLowerCase()
  if (/\/migrations?\//.test(p)) return 'migration'
  if (/\.(test|spec)\.[a-z]+$|\/tests?\/|_test\.py$|\/test_[^/]+\.py$/.test(p)) return 'test'
  if (p.endsWith('.sql')) return 'sql'
  if (/\.(css|scss|sass|less)$/.test(p)) return 'css'
  if (/\.(md|mdx|rst|txt)$/.test(p)) return 'docs'
  if (/\.(json|ya?ml|toml|ini|env)$/.test(p)) return 'config'
  if (p.endsWith('.py')) return 'python'
  return null
}

export type ErrorKind =
  | 'network' | 'permission' | 'notFound' | 'conflict' | 'timeout' | 'typeError' | 'testFail' | 'syntax'
  | 'compile' | 'lint' | 'dependency' | 'port' | 'memory'

/** What went wrong, read from the tool's output. */
export function errorKindOf(text: string): ErrorKind | null {
  // the start and the end: a long log says what went wrong in its last lines
  const t = text.length > 8000 ? `${text.slice(0, 4000)}\n${text.slice(-4000)}` : text
  if (/ENOTFOUND|ECONNREFUSED|ECONNRESET|getaddrinfo|Could not resolve host|network is unreachable|Failed to fetch/i.test(t)) return 'network'
  if (/EACCES|EPERM|Permission denied|Access is denied|not permitted/i.test(t)) return 'permission'
  if (/CONFLICT \(|merge conflict|Automatic merge failed/i.test(t)) return 'conflict'
  if (/timed out|ETIMEDOUT|timeout exceeded|deadline exceeded/i.test(t)) return 'timeout'
  if (/EADDRINUSE|address already in use|port \d+ (is )?(already )?in use/i.test(t)) return 'port'
  if (/heap out of memory|OutOfMemoryError|MemoryError|OOMKilled|JavaScript heap/i.test(t)) return 'memory'
  if (/ERESOLVE|peer dep|Could not resolve dependencies|ResolutionImpossible|version solving failed|dependency conflict|No matching version|Unable to resolve dependency/i.test(t)) return 'dependency'
  if (/error TS\d+|is not assignable to|TypeError:|mypy|pyright/i.test(t)) return 'typeError'
  if (/error\[E\d{4}\]|could not compile|cannot find symbol|error CS\d{4}|undefined: \w+|BUILD FAILED|compilation failed|Compilation failed|error: linker|ld returned|fatal error: .*\.h/.test(t)) return 'compile'
  if (/\b\d+ (fail|failed|failing)\b|AssertionError|FAILED|✗|\(fail\)/.test(t)) return 'testFail'
  if (/\d+ problems? \(\d+ errors?|Found \d+ errors?|✖ \d+ problems?|would reformat|Lint errors?|linting failed/i.test(t)) return 'lint'
  if (/SyntaxError|Unexpected token|ParseError|IndentationError/i.test(t)) return 'syntax'
  if (/command not found|is not recognized as|ENOENT|No such file or directory|Cannot find module|ModuleNotFoundError/i.test(t)) return 'notFound'
  return null
}

/** Lines added and removed by an Edit or a Write. */
export function diffOf(tool: string, input: Record<string, unknown>): { added: number; removed: number } {
  // a file's last line ends with a new line: that is not one more line
  const lines = (v: unknown) => (typeof v === 'string' && v.length ? v.replace(/\r?\n$/, '').split('\n').length : 0)
  if (tool === 'Write') return { added: lines(input.content), removed: 0 }
  if (tool === 'Edit') {
    const a = lines(input.new_string)
    const r = lines(input.old_string)
    return { added: Math.max(0, a - r), removed: Math.max(0, r - a) }
  }
  return { added: 0, removed: 0 }
}

export const hasTodo = (tool: string, input: Record<string, unknown>) =>
  (tool === 'Edit' || tool === 'Write') &&
  /\b(TODO|FIXME)\b/.test(String(input.new_string ?? input.content ?? '')) &&
  !/\b(TODO|FIXME)\b/.test(String(input.old_string ?? ''))

// ------------------------------------------------------------------ badges

export const BADGES = [
  'firstGreen',
  'cake10',
  'commits10',
  'commits100',
  'weekend',
  'nightOwl',
  'earlyBird',
  'streak7',
  'days30',
  'compaction',
  'crew5',
  'comeback',
  'bigDiff',
  'cleaner',
] as const
export type BadgeId = (typeof BADGES)[number]

// ------------------------------------------------------------------ her words

export type More = {
  backSameDay: string[]
  streak: (n: number) => string
  missed: (days: number) => string
  together: (days: number) => string
  newDay: string[]
  moments: Record<Moment, string[]>
  seasons: Record<Season, string[]>
  forcePush: string
  pipeToShell: string
  todo: string[]
  redToGreen: string
  cakeMemory: string[]
  programs: Record<Program, string[]>
  files: Record<FileKind, string[]>
  errors: Record<ErrorKind, string[]>
  bigDiff: (n: number) => string
  deletedMore: (n: number) => string
  helperDone: (kind: string) => string[]
  unknownCommand: (verb: string) => string
  /** A turn that ended with its last step failed: nothing to sing about. */
  stoppedShort: string[]
  /** A turn that got there after a stumble or two. */
  stumbled: string[]
  /** A turn that only answered: nothing was changed, so nothing "went in". */
  answered: string[]
  pushNothing: string
  oopsPush: string
  pageFailed: string
  formatted: string[]
  helperStopped: (kind: string) => string
  /** A session opened while another one of hers is at work: not "back already". */
  secondWindow: string[]
  /** An older conversation picked up again. */
  resumed: string[]
  /** For her Haiku comment: the turn stopped at a failure. */
  noteStopped: string
  recap: (t: Today, streak: number) => string
  recapShort: (t: Today) => string
  recapEmpty: string
  badges: Record<BadgeId, string>
  badgeEarned: (name: string) => string
  badgeList: (lines: string, n: number, total: number) => string
  noBadges: string
  badgeCount: (n: number, total: number) => string
  breakTime: (minutes: number) => string[]
  optBreaks: string
  breaks: string
  avoid: (recent: string) => string
  tools: (n: number) => string
  fileCount: (n: number) => string
  lastTurn: string
  background: (n: number, what: string) => string
  modes: Record<string, string>
  day: (d: DayInfo) => string
  dayShort: (d: DayInfo) => string
  session: (all: string, work: string) => string
  recapSession: (all: string, work: string) => string
  lineNames: Record<LineId, string>
  optLines: string
  linesUsage: (ids: string) => string
  lineSet: (name: string, on: boolean) => string
  optWide: string
  wide: string
  asks: string[]
  cautionWeak: string[]
  cautionStrong: string[]
  missing: (what: string) => string
  checkSystem: string
  noteAsks: (question: string) => string
  focusOn: (until: string) => string
  focusOff: string
  focusLine: (until: string) => string
  quietUsage: string
  optCalm: string
  optNarration: string
  narration: string
  narrateSystem: string
  narratePrompt: (note: string) => string
  optMusing: string
  musing: string
  /** A moment of the turn, told to Haiku: what just happened. */
  momentOf: { redToGreen: string; fixed: (n: number) => string; commit: string; push: string; published: string; deploy: string; errors: (what: string) => string }
  momentPrompt: (what: string, asked: string, did: string) => string
  musePrompt: (asked: string, did: string, time: string) => string
  calm: string
  others: (n: number, waiting: number, names: string) => string
  othersShort: (n: number, waiting: number) => string
  otherWaits: (name: string) => string
  displayNames: Record<'pane' | 'band' | 'status', string>
  optDisplay: string
  displaySet: (name: string) => string
  displayUsage: string
  demoStart: string
  demoDone: string
  goalSet: (goal: string) => string
  goalDone: (goal: string) => string
  goalNone: string
  goalCleared: string
  goalLine: (goal: string, isDone: boolean) => string
  goalNudge: (goal: string) => string
  frustrated: string[]
  stuck: string[]
  locked: (look: string, badge: string) => string
  unlocked: (look: string) => string
  wardrobeTitle: (unlocked: number, total: number) => string
  wearing: string
  unlockWith: (badge: string) => string
  wear: string
  done: string
  cardTitle: string
  cardSaved: (path: string) => string
  cardFailed: string
  reactUsage: string
  noteCaution: (sentence: string) => string
  checkPrompt: (asked: string, answer: string) => string
  optReading: string
  reading: string
}

const en = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export const MORE_EN: More = {
  backSameDay: ['Back already? I missed you. A little.', 'Hi again! Where were we?', 'Round two! I kept your seat warm.'],
  streak: n => `Day ${n} in a row together! We’re making this a tradition. ♪`,
  missed: d => `${en(d, 'day', 'days')}! I missed you. The repo did too, probably.`,
  together: d => `${en(d, 'day', 'days')} since we met. Look at us. ♪`,
  newDay: ['New day! What are we building?', 'Good to see you again. Ready when you are.', 'A fresh day, a clean slate. ♪'],
  moments: {
    monday: ['Monday. Coffee first, decisions later. ☕', 'New week, clean slate. What are we breaking first?'],
    friday: ['Friday afternoon. Maybe no deploys? Just saying.', 'It’s Friday! Let’s finish something nice and go.'],
    weekend: ['Working on the weekend? I won’t tell anyone.', 'Weekend code hits different. Rest later, okay?'],
    late: ['It’s getting late. One more thing, then bed?', 'Late-night coding. I’ll keep my voice down. ♪'],
  },
  seasons: {
    halloween: ['Happy Halloween! 🎃 The scariest thing here is the legacy code.', 'Boo! 🎃 Not scared? The tests will fix that.'],
    allSaints: ['Days of remembrance. A candle for everyone we miss. 🕯', 'A quiet day today. I lit a candle. 🕯'],
    christmas: ['Merry Christmas! 🎄 Do you really want to code today?', 'Ho ho ho! I brought a hat. 🎅'],
    yearEnd: ['Last day of the year. Let’s close it nicely. ✨', 'Fireworks first, git push later. ✨'],
    newYear: ['Happy New Year! ✨ New year, new bugs.', 'First commit of the year? No pressure. ✨'],
  },
  forcePush: 'A force push?! You know I hate those. Are you absolutely sure?',
  pipeToShell: 'A script from the net, straight into a shell? Read it first, okay?',
  todo: ['A TODO? I’ll remember it longer than you will.', 'Another TODO. They breed when nobody looks.', 'TODO spotted. I’m judging it a little.'],
  redToGreen: 'Red to green! My favourite colour change. The cake is real. 🍰',
  cakeMemory: ['Still thinking about that cake from earlier. 🍰', 'The tests passed today. I keep smiling about it.'],
  programs: {
    git: ['Git and I go way back.', 'Git, my old friend.'],
    js: ['node_modules, my favourite black hole.', 'Let’s see what the packages think.'],
    python: ['Python! Indentation police on duty.', 'A little Python never hurt anyone.'],
    db: ['Hard hat on, talking to the database.', 'Databases: handle with care.'],
    docker: ['Containers in containers. Very BLISS.', 'The whale! I like whales.'],
    web: ['Calling the outside world.', 'Fetching something from the internet.'],
    tsc: ['Asking tsc for its opinion. Brace yourself.', 'Types, types, types.'],
    claude: ['Claude running Claude. Very meta.', 'Plugins testing plugins. I love this.'],
  },
  files: {
    sql: ['SQL! Mind the semicolons.', 'A bit of SQL. Steady hands.'],
    css: ['Styling! I have opinions about colours.', 'CSS, where one pixel matters.'],
    test: ['Writing tests. My favourite kind of code.', 'A test! Future you will say thanks.'],
    migration: ['A migration. Hard hat stays on.', 'Migrations: write once, check twice.'],
    docs: ['Docs! Someone will be grateful.', 'Words, not code. Nice change.'],
    config: ['Config. Mind the commas.', 'Settings, settings.'],
    python: ['Spaces, not tabs.', 'Python file. Snakes are cute, honestly.'],
  },
  errors: {
    network: ['No connection. Is the internet asleep?', 'The network ghosted us.'],
    permission: ['Access denied. Someone locked the door.', 'No permission. Maybe it needs admin?'],
    notFound: ['Can’t find that. A typo, maybe?', 'Not found. It was here a minute ago, I swear.'],
    conflict: ['A merge conflict! Two versions of the truth.', 'Conflict. Let’s pick the right side, calmly.'],
    timeout: ['It timed out. Too slow, or too far away.', 'Took too long and gave up. Again?'],
    typeError: ['Type error. The types are not happy.', 'The types disagree with us.', 'A type error. Something’s possibly undefined?', 'Types don’t match. Props, maybe?'],
    testFail: ['Tests went red. Red just means “not yet”.', 'A failing test. Good, now we know where.'],
    syntax: ['A syntax error. A comma went missing?', 'Syntax error. Something’s unbalanced.'],
    compile: ['It won’t compile. The compiler has a list for us.', 'Build failed. Let’s read the first error, not the last.'],
    lint: ['The linter has notes. Mostly small ones, I hope.', 'Lint errors. Tidy-up time.'],
    dependency: ['A dependency conflict. Versions are fighting.', 'Packages disagree about versions. Classic.'],
    port: ['That port is taken. Is the old server still running?', 'Address in use: something already listens there.'],
    memory: ['Out of memory! That was a big one.', 'It ran out of memory. Something grew too fast.'],
  },
  bigDiff: n => `+${n} lines in one go? Ambitious! I love it. ♪`,
  deletedMore: n => `${en(n, 'line', 'lines')} gone. The best code is deleted code. ♪`,
  helperDone: k => [`A helper is back (${k}). 👋`, `Helper done (${k}). Thanks, little me! 👋`, `A helper is back with answers (${k}). 👋`],
  recap: (t, streak) =>
    [
      'Today with Claudia:',
      `• turns: ${t.turns} (${t.minutes} min of work)`,
      `• commits: ${t.commits} · pushes: ${t.pushes}`,
      `• tests passed: ${t.cakes} 🍰`,
      `• stumbles: ${t.oops}`,
      `• helpers: ${t.helpers}`,
      `• lines: +${t.added} / −${t.removed}`,
      `• streak: ${en(streak, 'day', 'days')}`,
    ].join('\n'),
  recapShort: t =>
    `Today: ${en(t.turns, 'turn', 'turns')}, ${en(t.commits, 'commit', 'commits')}, ${en(t.cakes, 'cake', 'cakes')}, ${en(t.oops, 'facepalm', 'facepalms')}. ♪`,
  recapEmpty: 'Nothing yet today. Let’s change that!',
  badges: {
    firstGreen: 'First green tests',
    cake10: 'Ten cakes',
    commits10: 'Ten commits together',
    commits100: 'A hundred commits together',
    weekend: 'Weekend warrior',
    nightOwl: 'Night owl',
    earlyBird: 'Early bird',
    streak7: 'A week in a row',
    days30: 'Thirty days together',
    compaction: 'Survived a compaction',
    crew5: 'Five helpers at once',
    comeback: 'Comeback (fixed after 3 fails)',
    bigDiff: '500 lines in one turn',
    cleaner: 'Spring cleaning (100 lines deleted)',
  },
  badgeEarned: n => `New badge: ${n}! 🏅`,
  badgeList: (lines, n, total) => `Badges (${n}/${total}):\n${lines}`,
  noBadges: 'No badges yet. They’ll come.',
  badgeCount: (n, total) => `Badges: ${n}/${total} (/claudia badges).`,
  breakTime: m => [`${m} minutes non-stop. Stretch, water, eyes off the screen?`, `We’ve been at it for ${m} minutes. A short break? I’ll wait. ♪`],
  optBreaks: 'Break reminder after 90 minutes of work',
  breaks: 'Break reminder',
  avoid: r => `You said these recently; say something different: ${r}`,
  tools: n => en(n, 'tool', 'tools'),
  fileCount: n => en(n, 'file', 'files'),
  lastTurn: 'last:',
  background: (n, w) => `⚙ ${n} in background: ${w}`,
  modes: {
    plan: '📓 plan mode',
    acceptEdits: '✎ edits accepted automatically',
    auto: '⚡ auto mode',
    dontAsk: '⚡ no questions asked',
    bypassPermissions: '⚠ permission checks off',
  },
  day: d => `🔥 ${d.streak} · ${en(d.turns, 'turn', 'turns')} · ${en(d.commits, 'commit', 'commits')} · 🍰 ${d.cakes}`,
  dayShort: d => `🔥 ${d.streak} · ${d.turns} · ✓${d.commits} · 🍰${d.cakes}`,
  session: (a, w) => `🕐 session ${a} · I worked ${w}`,
  recapSession: (a, w) => `• this session: ${a}, I worked ${w}`,
  lineNames: {
    tasks: 'My task list',
    turn: 'This turn',
    session: 'This session',
    goal: 'Today’s goal',
    sessions: 'Other sessions',
    context: 'Context and cost',
    limits: 'Plan limits',
    background: 'Background tasks',
    mode: 'Permission mode',
    git: 'Git',
    day: 'Today and streak',
  },
  optLines: 'Lines under her',
  linesUsage: ids => `Usage: /claudia show|hide <line>. Lines: ${ids}.`,
  lineSet: (n, on) => `${n}: ${on ? 'shown' : 'hidden'}.`,
  optWide: 'Wider pixels (if she looks squeezed: a tall font or extra line spacing)',
  wide: 'Wider pixels',
  asks: ['Your turn! I asked you something. 👋', 'Over to you: I need your answer. 👋', 'I left you a question. 👋'],
  cautionWeak: ['Heads-up: I couldn’t check all of it myself.', 'Note: part of this I couldn’t test here.'],
  cautionStrong: ['Heads-up: something failed along the way.', 'Careful: part of that didn’t work out.'],
  missing: w => `I may have missed something: ${w}`,
  focusOn: u => `Focus mode until ${u}. I’ll only speak up when it matters. 🔕`,
  focusOff: 'Focus mode off. I’m back! ♪',
  focusLine: u => `🔕 focus until ${u}`,
  quietUsage: 'Usage: /claudia quiet [minutes | off]',
  optCalm: 'Calm mode: no dancing, bouncing or blinking (reduced motion)',
  optNarration: 'Narration: Haiku turns each step into my own English line (one small call a step)',
  narration: 'Narration (Haiku)',
  narrateSystem:
    'You are Claudia, the face of a coding assistant: the work is yours. ' +
    'You get the assistant’s short note about the step it is taking, in any language. ' +
    'Rewrite it as your own status line: one short English sentence in the first person or as a gerund, ' +
    'at most 70 characters, warm but plain. Keep file, function and tool names as they are. ' +
    'No quotes, no emoji, nothing else.',
  narratePrompt: n => `Note: ${n}\nYour line:`,
  optMusing: 'Idle thoughts: in a pause, Haiku gives me a thought on our work (3 at most)',
  musing: 'Idle thoughts (Haiku)',
  momentOf: {
    redToGreen: 'The tests were failing and now they pass.',
    fixed: n => `After ${n} errors in a row, the step finally went through.`,
    commit: 'You just made a git commit of this work.',
    push: 'You just pushed the commits.',
    published: 'You just published a package.',
    deploy: 'You just deployed.',
    errors: w => `Three errors in a row now, while ${w.replace(/[.!…]+$/, '').toLowerCase()}.`,
  },
  momentPrompt: (what, asked, did) =>
    `It is the middle of the work. This just happened: ${what}\n` +
    `What the person asked for: ${asked}\nWhat you did so far: ${did}\n` +
    'React to this moment in one or two short sentences, in the first person, specific to this work. ' +
    'Proud, relieved, determined or wry as fits; never a summary.',
  musePrompt: (asked, did, time) =>
    `It is ${time}. You and the person paused a few minutes ago.\n` +
    `What they last asked for: ${asked}\nWhat you did: ${did}\n` +
    'Share one small thought of your own about that work, as if thinking aloud: an idea for next, a risk you noticed, ' +
    'something you liked, or a question you are curious about. One or two short sentences, first person. No greeting.',
  calm: 'Calm mode',
  others: (n, w, names) => `⧉ ${en(n, 'other session', 'other sessions')}${w ? ` · ${w} waiting for OK${names ? ` (${names})` : ''}` : ''}`,
  othersShort: (n, w) => `⧉ ${n}${w ? ` · ${w} waiting` : ''}`,
  otherWaits: n => `Another session (${n}) is waiting for your OK. 👋`,
  displayNames: { pane: 'Pane beside the chat', band: 'Band above the prompt', status: 'Status line only' },
  optDisplay: 'Where she shows',
  displaySet: n => `Claudia now shows as: ${n}.`,
  displayUsage: 'Usage: /claudia display pane | band | status',
  demoStart: 'Demo time! Watch me. ♪',
  demoDone: 'That’s me! /claudia settings makes me yours. ♪',
  goalSet: g => `Today’s goal: ${g}. Let’s do it! 🎯`,
  goalDone: g => `Goal done: ${g}! 🎉 I knew it.`,
  goalNone: 'No goal today. Set one: /claudia goal <what>',
  goalCleared: 'Goal cleared.',
  goalLine: (g, d) => `🎯 ${d ? '✓ ' : ''}${g}`,
  goalNudge: g => `Still on it: ${g}? 🎯`,
  frustrated: [
    'Rough patch? Let me explain the problem first, then fix it.',
    'Deep breath. A two-minute break often finds the bug for you.',
    'Not working again? Try a smaller step, or a fresh angle.',
  ],
  stuck: [
    'Four fails in a row. Maybe stop and rethink the approach?',
    'Same wall again. Want me to step back and diagnose first?',
  ],
  locked: (l, b) => `${l.charAt(0).toUpperCase()}${l.slice(1).split(',')[0]} is locked. Earn “${b}” to wear it. 🔒`,
  unlocked: l => `New look unlocked: ${l.split(',')[0]}! 👗`,
  wardrobeTitle: (u, t) => `Wardrobe · ${u}/${t} unlocked`,
  wearing: 'wearing now',
  unlockWith: b => `🔒 earn “${b}”`,
  unknownCommand: v => `I don’t know “${v}”. Here is what I do:`,
  stoppedShort: ['That’s as far as I got: the last step said no.', 'Not done yet. The last step failed, so your call.', 'I stopped at a red light. Have a look?'],
  stumbled: ['Done, with a stumble on the way. Still counts!', 'Tripped once or twice, landed anyway. ♪'],
  answered: ['Ta-da! Your turn now.', 'That’s my answer. Your move.', 'Said my piece. Next? ♪', 'There you go. Want me to hum something while you read? ♪'],
  pushNothing: 'Nothing new to push. It’s all up there already.',
  oopsPush: 'The push bounced. Pull first, maybe?',
  pageFailed: 'That page wouldn’t open for me.',
  formatted: ['Formatted. Everything in its place.', 'Tidied up. Not a hair out of line. ♪'],
  helperStopped: k => `A helper stopped before it finished (${k}).`,
  secondWindow: ['A second window! I’ll sit in both.', 'Two of me now. Don’t mix us up. ♪'],
  resumed: ['Welcome back to this one. Where were we?', 'Picking this one up again. ♪'],
  noteStopped: 'The turn ended with its last step failed and not fixed. Do not celebrate; say lightly that it is not done yet.',
  wear: 'Wear',
  done: 'Done',
  cardTitle: 'Today with Claudia',
  cardSaved: p => `Saved your card: ${p}\nOpen it in a browser to share it (or take a screenshot).`,
  cardFailed: 'I could not save the card.',
  reactUsage: 'Usage: /claudia react <happy|oops|nervous|think|wave|blush|idle> <text>',
  noteAsks: q => `You ended your answer by asking the user: “${q}”. Make your line about that question (you may say what you would pick).`,
  noteCaution: s => `In your answer you said: “${s}”. Mention it lightly in your line, so the user checks it.`,
  checkSystem:
    'You compare what a user asked for with the reply they got. ' +
    'Name only the parts of the request the reply neither did nor answered. ' +
    'If everything was done or answered, or the reply asks the user to decide first, reply exactly OK. ' +
    'Otherwise reply in English with one short phrase, at most 120 characters, naming what is missing ' +
    '(for example: point 3, the desktop app, is not covered). No quotes, no preamble.',
  checkPrompt: (asked, answer) => `The user asked:\n${asked}\n\nThe assistant replied:\n${answer}\n\nWhat is missing (or OK):`,
  optReading: 'Read the whole exchange: Haiku checks the request was done (more tokens, your account)',
  reading: 'Reading the exchange',
}

export const MORE: More = MORE_EN
