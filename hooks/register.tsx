// Claudia: open character by anabology (claudia.gallery). Fan work, not affiliated with Anthropic.
import { atom, read, update } from 'claude-code'
import type { Atom } from 'claude-code'
import type { EngineInterface, Register, RenderSurface } from 'claude-code'

import type { ChatTurn, Display, GoalInfo, HelperKind, LineId, Mood, PropName, RepoInfo, Size } from '../types'
import { FACES } from './art'
import type { BandFace, Face } from './art'
import {
  BADGES,
  MORE,
  SEASON_PROP,
  dayOf,
  diffOf,
  errorKindOf,
  hasTodo,
  meet,
  mergeBond,
  mergeToday,
  momentOf,
  noPending,
  joinPending,
  readBond,
  readToday,
  seasonOf,
  zero,
} from './bond'
import type { BadgeId, Bond, Counts, More, Pending, Today } from './bond'
import { EN } from './i18n'
import { cautionIn, lastSentence, questionAtEnd } from './reading'
import {
  COMMAND_LINES,
  DEPLOY,
  FAIL_LINES,
  FILE_LINES,
  MIGRATE,
  OK_LINES,
  PUBLISH,
  STACK_LINES,
  TEST_RUN,
  TIPS,
  doingOf,
  propForFile,
  scriptNamed,
  scriptsOf,
  stackOf,
  techDanger,
  techOfFile,
} from './tech'
import {
  LINES,
  backgroundLine,
  cells,
  contextLine,
  crewLine,
  dayLine,
  duration,
  fitLine,
  gitLine,
  goalLine,
  isLineId,
  limitsLines,
  modeLine,
  openNow,
  sessionLine,
  sessionsLine,
  stopwatch as elapsed,
  tasksLine,
  turnLine,
  wrappedRows,
} from './under'
import type { Strings } from './i18n'
import { DAY_LOOKS, LOCKS, LOOKS, isUnlocked, lookOf } from './looks'
import type { Look, LookKey } from './looks'
import { DB_WRITE, ECHOES_EXIT, GIT_COMMIT, GIT_FORCE_PUSH, GIT_PUSH, GIT_WIPE, PIPE_TO_SHELL, READER, REFUSED, SQL_CLIENT, TESTS_FAILED, bare, base, callKey, clip, commandLabel, isDbTool, isDbWork, isProbe, programsOf, short, splitSteps } from './shell'
import { MINI_ROWS, artSize, bandSprite, cache, cellsFor, frameId, gridFor, minisFor, minisThatFit, pack, svgFor, tierFor } from './draw'
import type { Frame, Tint } from './draw'

const PANE = 'claudia'
const TITLE = 'Claudia'

const mood = atom({ plugin: 'claudia-companion', key: 'mood' } as const, 'idle')
const line = atom({ plugin: 'claudia-companion', key: 'line' } as const, EN.hello)
const isBlinking = atom({ plugin: 'claudia-companion', key: 'isBlinking' } as const, false)
const isMouthOpen = atom({ plugin: 'claudia-companion', key: 'isMouthOpen' } as const, false)
const prop = atom({ plugin: 'claudia-companion', key: 'prop' } as const, null)
const outfitPick = atom({ plugin: 'claudia-companion', key: 'outfitPick' } as const, null)
const helpers = atom({ plugin: 'claudia-companion', key: 'helpers' } as const, 0)
const crew = atom({ plugin: 'claudia-companion', key: 'crew' } as const, [])
const danceStep = atom({ plugin: 'claudia-companion', key: 'danceStep' } as const, 0)
const contextPercent = atom({ plugin: 'claudia-companion', key: 'contextPercent' } as const, null)
const costUsd = atom({ plugin: 'claudia-companion', key: 'costUsd' } as const, null)
const isCommenting = atom({ plugin: 'claudia-companion', key: 'isCommenting' } as const, false)
const isReminding = atom({ plugin: 'claudia-companion', key: 'isReminding' } as const, false)
const isSound = atom({ plugin: 'claudia-companion', key: 'isSound' } as const, true)
const isGitGuard = atom({ plugin: 'claudia-companion', key: 'isGitGuard' } as const, true)
const isNotifying = atom({ plugin: 'claudia-companion', key: 'isNotifying' } as const, true)
const isBreaks = atom({ plugin: 'claudia-companion', key: 'isBreaks' } as const, false)
const isWide = atom({ plugin: 'claudia-companion', key: 'isWide' } as const, false)
const isReading = atom({ plugin: 'claudia-companion', key: 'isReading' } as const, false)
const isCalm = atom({ plugin: 'claudia-companion', key: 'isCalm' } as const, false)
const isNarrating = atom({ plugin: 'claudia-companion', key: 'isNarrating' } as const, false)
const isMusing = atom({ plugin: 'claudia-companion', key: 'isMusing' } as const, false)
const quietUntil = atom({ plugin: 'claudia-companion', key: 'quietUntil' } as const, 0)
const display = atom({ plugin: 'claudia-companion', key: 'display' } as const, 'pane')
const others = atom({ plugin: 'claudia-companion', key: 'others' } as const, null)
const goal = atom({ plugin: 'claudia-companion', key: 'goal' } as const, null)
const wardrobeAt = atom({ plugin: 'claudia-companion', key: 'wardrobeAt' } as const, 0)
const todos = atom({ plugin: 'claudia-companion', key: 'todos' } as const, null)
const turnInfo = atom({ plugin: 'claudia-companion', key: 'turnInfo' } as const, null)
const tick = atom({ plugin: 'claudia-companion', key: 'tick' } as const, 0)
/**
 * What her pane was last drawn from. A drawing takes all its state in one go (`takeAll`) and reads it
 * back from here (`seen`), not with some thirty questions to the engine one after another: a drawing that
 * waits on the engine thirty times is thirty chances to be caught by a busy moment, and skipped past its
 * ten seconds. Only the pane's drawing, and the buttons it drew, read from here: every change of state
 * draws her again, so what a button finds here is what the person saw when pressing it.
 */
const drawnFrom = new Map<unknown, unknown>()
const statusText = atom({ plugin: 'claudia-companion', key: 'statusText' } as const, '')
const limits = atom({ plugin: 'claudia-companion', key: 'limits' } as const, [])
const background = atom({ plugin: 'claudia-companion', key: 'background' } as const, [])
const permMode = atom({ plugin: 'claudia-companion', key: 'permMode' } as const, 'default')
const dayInfo = atom({ plugin: 'claudia-companion', key: 'dayInfo' } as const, null)
const sessionInfo = atom({ plugin: 'claudia-companion', key: 'sessionInfo' } as const, null)
const hiddenLines = atom({ plugin: 'claudia-companion', key: 'hiddenLines' } as const, [])
const size = atom({ plugin: 'claudia-companion', key: 'size' } as const, 'auto')
const view = atom({ plugin: 'claudia-companion', key: 'view' } as const, 'main')
const gitInfo = atom({ plugin: 'claudia-companion', key: 'gitInfo' } as const, [] as RepoInfo[])
const chat = atom({ plugin: 'claudia-companion', key: 'chat' } as const, [] as ChatTurn[])
const idleFace = atom({ plugin: 'claudia-companion', key: 'idleFace' } as const, null)

// ------------------------------------------------------------------ local overlay (local.json, never published)

type StringOverrides = Partial<Record<keyof Strings, string>>

type Overlay = {
  /** Your project, for her persona: a sentence (or `{ "en": "…" }`). */
  project?: string | { en?: string }
  repos?: string[]
  defaults?: Partial<Record<Toggle, boolean>>
  /** Your own lines for her plain-string ones (or `{ "en": { … } }`). */
  strings?: StringOverrides | { en?: StringOverrides }
  /** Words of your own she also reacts to, in any language: regular-expression fragments. */
  words?: Partial<Record<keyof typeof WORDS_BASE, string[]>>
}

type Toggle = 'isCommenting' | 'isReading' | 'isNarrating' | 'isMusing' | 'isReminding' | 'isSound' | 'isGitGuard' | 'isNotifying' | 'isBreaks' | 'isWide' | 'isCalm'
const TOGGLES: Toggle[] = ['isCommenting', 'isReading', 'isNarrating', 'isMusing', 'isReminding', 'isSound', 'isGitGuard', 'isNotifying', 'isBreaks', 'isWide', 'isCalm']

let overlay: Overlay = {}

/** Her lines, with the overlay's plain-string overrides on top. */
let S: Strings = EN
/** Her memory, calendar and opinions. */
const M: More = MORE

function withOverlay(): Strings {
  const raw = (overlay.strings ?? {}) as Record<string, unknown>
  const extra = (raw.en && typeof raw.en === 'object' ? raw.en : raw) as Record<string, unknown>
  const out = { ...EN } as Record<string, unknown>
  for (const [k, v] of Object.entries(extra)) {
    if (typeof v === 'string' && typeof out[k] === 'string') out[k] = v
  }
  return out as Strings
}

/** The stack, by folder when there are several (`web: Next.js, Tailwind; api: FastAPI, PostgreSQL`). */
const stackText = () => (stackByFolder.length > 1 ? stackByFolder.map(f => `${f.name}: ${f.stack.join(', ')}`).join('; ') : stack.join(', '))

const projectName = () => {
  const p = overlayHere ? overlay.project : undefined
  const own = typeof p === 'string' ? p : p?.en
  const name = own || base(cwd) || 'a software project'
  const st = stackText()
  return st ? `${name} (stack: ${st})` : name
}

// ------------------------------------------------------------------ text helpers

const pick = <T,>(list: readonly T[]): T | undefined => list[Math.floor(Math.random() * list.length)] ?? list[0]
/** The last lines she said: she does not repeat one while it is fresh. */
const recentLines: string[] = []
const say = (list: readonly string[]): string => {
  const fresh = list.filter(t => !recentLines.includes(t))
  const choice = pick(fresh.length ? fresh : list) ?? ''
  recentLines.push(choice)
  if (recentLines.length > 24) recentLines.shift()
  return choice
}

const isFace = (v: unknown): v is Face => typeof v === 'string' && v in FACES
const isSize = (v: unknown): v is Size => v === 'auto' || v === 'full' || v === 'compact'

/**
 * A shell call that ended well and still failed: a test run that printed its failures (`| tee log`,
 * `|| true`), or a command that prints its own exit code (`…; echo EXIT=$?`) and printed one that is
 * not zero among the last lines of the output (the engine may add a line of its own after it): after
 * the words the echo puts before it (`EXIT=3`), or alone on its line for a bare `echo $?`.
 */
function hidFailure(tool: string, input: Record<string, unknown>, output: string) {
  if (tool !== 'Bash' && tool !== 'PowerShell') return false
  // a test run that printed failures and still ended well (`| tee log`, `|| true`)
  const whole = typeof input.command === 'string' ? withScripts(bare(input.command)) : ''
  if (whole && TEST_RUN.test(whole) && TESTS_FAILED.test(output.slice(-3000))) return true
  const cmd = typeof input.command === 'string' ? input.command.slice(-400) : ''
  const echo = ECHOES_EXIT.exec(cmd)
  if (!echo) return false
  const said = (echo[1] ?? '').replace(/["']/g, '').trim()
  const last = output.slice(-600).split('\n').map(l => l.trim()).filter(Boolean).slice(-4)
  return last.some(l => {
    const at = said ? l.lastIndexOf(said) : 0
    if (at < 0) return false
    const code = /^\s*(\d{1,3})\b/.exec(said ? l.slice(at + said.length) : l)
    return !!code && (said !== '' || code[0].trim() === l) && Number(code[1]) > 0
  })
}

/** What a shell command is for, in plain words (`Searching the code`, `Checking git`); its program as a last resort. */
/** What each step of a chain is for (`npx tsc && npm test`), package scripts read through, moves like `cd` skipped. */
function whatsOf(cmd: string, depth = 0): string[] {
  const out: string[] = []
  for (const step of splitSteps(cmd)) {
    const name = scriptNamed(step)
    const body = name && Object.hasOwn(scripts, name) ? scripts[name] : undefined
    if (body && depth < 2) {
      for (const w of whatsOf(body, depth + 1)) if (!out.includes(w)) out.push(w)
      continue
    }
    const label = commandLabel(step)
    if (!label || /^(cd|pushd|popd|set|export|echo|sleep|timeout)$/i.test(label)) continue
    const what = doingOf(step, label)?.what ?? S.run(label)
    if (!out.includes(what)) out.push(what)
  }
  return out
}

/** A command with the package scripts it names written out, so `npm run e2e` is known as tests. */
function withScripts(cmd: string): string {
  return splitSteps(cmd)
    .map(part => {
      const name = scriptNamed(part)
      const body = name && Object.hasOwn(scripts, name) ? scripts[name] : undefined
      return body ?? part
    })
    .join(' && ')
}

function friendly(command: unknown): string {
  const cmd = typeof command === 'string' ? command : ''
  const steps = whatsOf(cmd)
  const [first, second] = steps
  if (!first) return ''
  if (second) return `${first}, then ${second.charAt(0).toLowerCase()}${second.slice(1)}.`
  // the one run she hopes for
  return first === 'Running the tests' ? 'Running the tests. Fingers crossed!' : first
}

/** A build, a type check or a lint that went through, in its own world; null for anything else. */
function okLine(cmd: string): string | null {
  const runs = withScripts(bare(cmd)).trim()
  const d = doingOf(runs, commandLabel(runs))
  if (d && /^Formatting/.test(d.what)) return say(M.formatted)
  if (!d?.tech || !/^(Building|Checking the types|Checking the crate|Linting)/.test(d.what)) return null
  const lines = OK_LINES[d.tech]
  return lines ? say(lines) : null
}

function describe(tool: string, input: Record<string, unknown>): string {
  switch (tool) {
    case 'Bash':
    case 'PowerShell':
      // what the command is for, in her words (never the description Claude wrote, which may not be English)
      return friendly(input.command) || S.run(commandLabel(input.command) || 'a command')
    case 'Read':
      return S.read(base(input.file_path))
    case 'Edit':
    case 'Write':
      return S.write(base(input.file_path))
    case 'Grep':
    case 'Glob':
      return S.search(clip(input.pattern, 24))
    case 'WebSearch':
      return S.google(clip(input.query, 30))
    case 'WebFetch':
      return S.web
    case 'Agent':
      return S.agent
    default:
      return isDbTool(tool) ? S.db : S.use(short(tool, 24))
  }
}

function propFor(tool: string, input: Record<string, unknown>): PropName | null {
  const cmd = typeof input.command === 'string' ? input.command : ''
  const path = typeof input.file_path === 'string' ? input.file_path : ''
  if (isDbTool(tool)) return 'hardhat'
  if ((tool === 'Bash' || tool === 'PowerShell') && isDbWork(cmd)) return 'hardhat'
  if ((tool === 'Bash' || tool === 'PowerShell') && MIGRATE.test(cmd)) return 'hardhat'
  // Java and Kotlin get coffee; migrations, SQL, Prisma and Terraform the hard hat
  if (tool === 'Edit' || tool === 'Write') {
    const held = propForFile(techOfFile(path))
    if (held) return held
  }
  switch (tool) {
    case 'Read':
      return 'glasses'
    case 'Grep':
    case 'Glob':
      return 'magnifier'
    case 'WebSearch':
    case 'WebFetch':
      return 'globe'
    case 'Edit':
    case 'Write':
    case 'NotebookEdit':
      return 'pencil'
    default:
      return isPlanning ? 'notebook' : null
  }
}

/** The guard: a warning when a command is risky. */
function danger(tool: string, input: Record<string, unknown>): string | null {
  const isShell = tool === 'Bash' || tool === 'PowerShell'
  const raw = (typeof input.command === 'string' ? input.command : typeof input.sql === 'string' ? input.sql : typeof input.query === 'string' ? input.query : '').slice(0, 8000)
  if (!raw) return null
  if (isShell) {
    // what runs, not what a message or a search pattern says
    const cmd = bare(raw)
    if (/\s--no-verify\b/.test(cmd)) return S.noVerify
    if (GIT_FORCE_PUSH.test(cmd)) return M.forcePush
    if (GIT_PUSH.test(cmd) && !/\s--dry-run\b/.test(cmd)) return S.push
    if (GIT_WIPE.test(cmd)) return S.wipe
    if (/\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r|-r\s+-f|-f\s+-r)|Remove-Item[^|]*-Recurse/i.test(cmd)) return S.rmrf
    if (PIPE_TO_SHELL.test(cmd)) return M.pipeToShell
    const risky = techDanger(cmd)
    if (risky) return risky
  }
  // SQL: in a database tool, or in a shell line that hands it to a database (not one that greps for it)
  const isSql = isShell ? SQL_CLIENT.test(raw) && programsOf(raw).some(name => !READER.test(name)) : isDbTool(tool) || typeof input.sql === 'string'
  if (!isSql) return null
  if (/\b(DROP\s+(TABLE|SCHEMA|INDEX|VIEW|DATABASE)|TRUNCATE)\b/i.test(raw)) return S.drop
  if (/\bDELETE\s+FROM\b/i.test(raw) && !/\bDELETE\s+FROM\b[^;]*\bWHERE\b/i.test(raw)) return S.deleteFrom
  if (DB_WRITE.test(raw)) return S.dbWrite
  return null
}

function oopsLine(tool: string, input: Record<string, unknown>, output = ''): string {
  const cmd = typeof input.command === 'string' ? input.command : ''
  const kind = errorKindOf(output)
  // no wifi up there only when it is the network: a page that is gone, or refused, just did not open
  if (tool === 'WebFetch' || tool === 'WebSearch') return kind === 'network' ? S.offline : M.pageFailed
  // what the output says beats what the command was
  if (kind === 'network' || kind === 'permission' || kind === 'conflict' || kind === 'timeout') return say(M.errors[kind])
  // the push that bounced, and the commit that did not go through (not whatever else ran beside them)
  if (GIT_PUSH.test(bare(cmd)) && /\[rejected\]|non-fast-forward|failed to push|fetch first/i.test(output)) return M.oopsPush
  if (GIT_COMMIT.test(bare(cmd)) && /hook|pre-commit|commit-msg|nothing to commit|no changes added|Aborting commit|tell me who you are/i.test(output)) return S.oopsCommit
  const runs = withScripts(bare(cmd))
  // tests went red when the tests say so (or say nothing): a linter before them that failed is not the tests
  if (TEST_RUN.test(runs) && (kind === 'testFail' || !kind)) return kind === 'testFail' ? say(M.errors.testFail) : S.oopsTests
  // a type error is about the types when a type checker says it (a script's own TypeError is a plain crash)
  const isTypeCheck = /error TS\d+|is not assignable to/.test(output) || /\b(tsc|mypy|pyright)\b/.test(runs)
  if (kind === 'typeError' && isTypeCheck) return say([...(FAIL_LINES.tsc ?? []), ...M.errors.typeError])
  // a build or a check that failed, in its own world
  const doing = cmd ? doingOf(runs.trim(), commandLabel(runs.trim())) : null
  const tech = doing?.tech
  // "the build failed" only for a build: any other script of the project just failed
  // "the build failed" only for a build or a check (any other command of that world just failed), and a
  // traceback only when there is one
  const isBuild = /^(Building|Compiling|Checking|Linting)/.test(doing?.what ?? '')
  const fails = tech && (isBuild || (tech === 'python' && /Traceback/.test(output))) ? FAIL_LINES[tech] : undefined
  if (fails && kind !== 'notFound' && kind !== 'dependency' && kind !== 'port' && kind !== 'memory') return say(fails)
  // what the output says (tsc missing is "not found", not tsc grumbling)
  if (kind && kind !== 'typeError') return say(M.errors[kind])
  if (/\btsc\b/.test(runs)) return S.oopsTsc
  if (tool === 'Edit') return S.oopsEdit
  return S.oopsTool(short(tool.replace(/^mcp__/, '').replace(/__/g, ' '), 28))
}

// ------------------------------------------------------------------ drawing

/** Cuts a line to the pane's width at a word, never in the middle of one. */
function fit(text: string, width: number): string {
  return fitLine(text, width)
}

/** Her face in the band, from her mood (and her mouth, while she talks). */
async function bandFace($: EngineInterface): Promise<BandFace> {
  const m = await read($, mood)
  if (m === 'talk') return (await read($, isMouthOpen)) ? 'talk' : 'rest'
  if (m === 'blush') return 'happy'
  if (m === 'yawn' || m === 'sleep') return 'sleep'
  if (m === 'think' || m === 'happy' || m === 'oops' || m === 'nervous' || m === 'wave') return m
  return 'rest'
}

/** The agent type a subagent was spawned as, as the kind of little Claudia she gets. */
function kindOf(subagentType: string | undefined): HelperKind {
  const t = (subagentType ?? '').toLowerCase()
  if (t === 'explore' || t.endsWith(':explore')) return 'explore'
  if (t === 'plan' || t.endsWith(':plan')) return 'plan'
  if (/(^|[^a-z])review/.test(t)) return 'review'
  return 'general'
}

/** Keeps only the subagents the engine still lists as working; with no list, none stay. */
async function keepWorkingAgents($: EngineInterface) {
  let working = new Set<string>()
  try {
    const list = await $.agent.list()
    working = new Set(list.filter(a => a.status === 'running' || a.status === 'pending').map(a => a.id))
  } catch {
    // no list: nobody stays counted
  }
  for (const id of [...agents.keys()]) if (!working.has(id)) agents.delete(id)
  for (const id of [...spawnedKinds.keys()]) if (!working.has(id)) spawnedKinds.delete(id)
  await syncCrew($)
}

/** Writes the working subagents to state: their count and their kinds. */
async function syncCrew($: EngineInterface) {
  await update($, helpers, () => agents.size)
  await update($, crew, () => [...agents.values()])
  if (agents.size >= 5) await award($, 'crew5')
}

function autoLook(now: number, badges?: Partial<Record<BadgeId, number>>): LookKey {
  const d = new Date(now)
  const hour = d.getHours()
  if (hour >= 23 || hour < 6) return 'pyjamas'
  const day = Math.floor((now - d.getTimezoneOffset() * 60_000) / 86_400_000)
  const open = DAY_LOOKS.filter(k => isUnlocked(k, badges))
  return open[day % open.length] ?? 'look00'
}

async function currentLook($: EngineInterface): Promise<LookKey> {
  const picked = lookOf(await read($, outfitPick))
  if (picked && (isDemo || isUnlocked(picked, bond?.badges))) return picked
  return autoLook(await $.clock.now(), bond?.badges)
}

// ------------------------------------------------------------------ module state

type Timer = { cancel: () => void }

/** False until she wakes (`wake`); a `claude -p` run keeps it false, so she stays silent. */
let active = false
/** Whether a surface draws the pane now: animations pause while it does not. */
let visible = false
let platform: 'win' | 'mac' | 'linux' | null = null
/** Where she is drawn (the terminal, the desktop app, the editor, the phone): what `doctor` checks. */
let drawnOn: RenderSurface | null = null
let isPlanning = false
let errorsThisTurn = 0
let errorStreak = 0
let holdUntil = 0
let lastActivity = 0
let sessionStartedAt = 0
/** Where the time this session has been open is kept (`open:<first launch>`). */
let openKey = ''

/**
 * The session's open time, once a minute: the minute since the last count is added, a longer gap
 * (the computer asleep or off) is not; kept, so a resumed session counts on.
 */
async function tickOpen($: EngineInterface, now: number) {
  const ses = await update($, sessionInfo, s => (s ? { ...s, openMs: openNow(s, now), openAt: now } : s))
  if (ses && openKey) await $.store.set(openKey, ses.openMs)
}
/** Where this session's work time is kept (`work:<session id>`), so a reload does not lose it. */
let sessionKey = ''
/** This session's id, for its heartbeat among the others. */
let sessionId = ''
let sessionState: 'working' | 'waiting' | 'idle' = 'idle'
let lastWaitingNames: string[] = []
/** The pane's size when it was last drawn, for /claudia doctor. */
let lastPane = { columns: 0, rows: 0 }
/** When the person sounded frustrated lately, and when she last said something about it. */
const frustrations: number[] = []
let frustrationSaidAt = 0
let isDemo = false
/** A turn that began before a reload of the plugin: its end will not reach her, so she closes it herself. */
let orphanStart = 0
/** What an orphaned turn was already credited with, should its end come after all. */
let orphanCredit = 0
/** Since when this turn waits for the person (an OK to give, a question to answer), and how long it has waited: not work. */
let waitSince = 0
let waitedMs = 0
/**
 * A wait that ended only when its tool did (no sign of the OK in between) holds the tool's own run too.
 * The engine says how long the tool ran, before or after that end: that much is given back to her work.
 */
let waitWithRunMs = 0
/** The turn ran a shell command: only then (or after an edit) is git looked at when it ends. */
let turnRanShell = false
let ranUnseenMs = 0
/** The turn's ticker last ran then: a long silence between two ticks is the computer asleep, not work. */
let lastTickAt = 0
/** Time of this turn the computer slept through. */
let turnGapMs = 0
/** Helpers working with no main turn running (sent to the background): since when, and when one was last seen at work. */
let soloSince = 0
let lastHelperAt = 0
/** The minute timer last ran then. */
let lastMinuteAt = 0
/** A tool that is the person's turn to act, not Claude's. */
const ASKS_THE_PERSON = new Set(['AskUserQuestion', 'ExitPlanMode'])
/** The last moment she saw Claude at work (a turn starting, a tool running). */
let lastWorkAt = 0
/** The project's stack as she reads it from its top folder: `Next.js`, `Tailwind`, `Django`… */
let stack: string[] = []
/** The stack by folder, when the project keeps its parts in folders of their own. */
let stackByFolder: { name: string; stack: string[] }[] = []
/** The package scripts she knows by name: `npm run typecheck` is what `typecheck` runs. */
let scripts: Record<string, string> = {}
let turnStartedAt = 0
let isTalking = false
let helloDay = -1
let isGrassSaid = false
let calm: Timer | undefined
let mouthTimer: Timer | undefined
let danceTimer: Timer | undefined
let danceTicks = 0
let stopwatch: Timer | undefined
let permissionTimer: Timer | undefined
/** True while Claude waits for the person's OK, until the tool starts or the turn ends. */
let isWaving = false
/** Counts main turns, so a late comment or nudge never lands in the next one. */
let turnCount = 0
/** Working subagents by id, with their kind. */
const agents = new Map<string, HelperKind>()
/** Kinds learnt at spawn, for a subagent whose turn starts before its spawn settles. */
const spawnedKinds = new Map<string, HelperKind>()
/** Helpers being spawned whose id is not known yet: the kind of each, by the start of its prompt. */
const pendingSpawns: { prompt: string; kind: HelperKind }[] = []
const spawnKey = (prompt: unknown) => (typeof prompt === 'string' ? prompt.replace(/\s+/g, ' ').trim().slice(0, 200) : '')
let turnAsked = ''
let cwd = ''
let repoDirs: string[] = []
let lastNudge = 0
let nudgeFlip = false
let shownMemos: string[] = []
let turnDid: string[] = []
let bond: Bond | null = null
let today: Today = { ...zero(), day: 0, isRecapSaid: false }
/** What this session changed since its last save. */
let pending: Pending = noPending()
/** Saves run one after another, never two at once. */
let saving: Promise<void> = Promise.resolve()
let testsFailedThisTurn = false
/** The main turn's last tool failed and nothing has worked since: a turn ending here did not get there. */
let lastToolFailed = false
/** What failed last (the tool and its file, or the program it ran): "fixed" is said when the same thing works. */
let failKey = ''
/** The turn fought something and won (red to green, fixed after tries). */
let recoveredThisTurn = false
/** Her morning word and her midnight one are said once a day, not after every turn of that hour. */
let morningDay = 0
let scrollDay = 0
/** Whether this turn's tests went green already: the cake comes once a turn. */
let isGreenThisTurn = false
/** What Claude writes in the current text block, piece by piece, and its last sentence before a tool. */
let narration = ''
let noteBeforeTool: string | null = null
/** Counts main tool calls, so a narration that comes late never lands on a later step. */
let toolSeq = 0
/** Narrations already made: the same note costs no second call. */
const narrated = new Map<string, string>()
let addedThisTurn = 0
let removedThisTurn = 0
/** When the current stretch of work began: a 15-minute pause starts a new one. */
let workStart = 0
let lastTurnEnd = 0
let isBreakSaid = false
const recentComments: string[] = []
/** Her Haiku calls this session, for /claudia doctor: how many, how many reached the bubble, the last failure. */
const haikuStats = { calls: 0, answered: 0, shown: 0, dropped: 0, lastAt: 0, lastKind: '', lastError: '', tokensIn: 0, tokensOut: 0 }
/** A comment on the last answer holds the bubble until the next message (no hum, no rest over it). */
let isCommentHeld = false
/** Grows with every word the person gets from her on their own doing (a message, a command, a badge): a late Haiku line never lands over one. */
let voiceSeq = 0
/** Moments in a turn that got a Haiku word, and when the last one did: a few, spaced out. */
let momentsThisTurn = 0
let lastMomentAt = 0
/** Idle musings since the last turn, and when the last one came. */
let musings = 0
let lastMuseAt = 0
/** The last finished turn, for her idle thoughts. */
let lastAsked = ''
let lastDid: string[] = []
/** What each helper was sent to do (the Agent call's description). */
const spawnedWhat = new Map<string, string>()

/** Her note on the last answer (Claude's question, a caution): it stays in the status bar until the next turn. */
let statusNote: string | null = null

/** All her state at once, each atom by its name (the engine wants to see which). */
async function takeAll($: EngineInterface) {
  const got = await Promise.all([
    read($, tick),
    read($, view),
    read($, line),
    read($, mood),
    read($, danceStep),
    read($, prop),
    read($, size),
    read($, isWide),
    read($, crew),
    read($, contextPercent),
    read($, costUsd),
    read($, isGitGuard),
    read($, gitInfo),
    read($, goal),
    read($, others),
    read($, quietUntil),
    read($, isCalm),
    read($, hiddenLines),
    read($, todos),
    read($, turnInfo),
    read($, limits),
    read($, background),
    read($, permMode),
    read($, dayInfo),
    read($, sessionInfo),
    read($, outfitPick),
    read($, display),
    read($, wardrobeAt),
  ])
  drawnFrom.set(tick, got[0])
  drawnFrom.set(view, got[1])
  drawnFrom.set(line, got[2])
  drawnFrom.set(mood, got[3])
  drawnFrom.set(danceStep, got[4])
  drawnFrom.set(prop, got[5])
  drawnFrom.set(size, got[6])
  drawnFrom.set(isWide, got[7])
  drawnFrom.set(crew, got[8])
  drawnFrom.set(contextPercent, got[9])
  drawnFrom.set(costUsd, got[10])
  drawnFrom.set(isGitGuard, got[11])
  drawnFrom.set(gitInfo, got[12])
  drawnFrom.set(goal, got[13])
  drawnFrom.set(others, got[14])
  drawnFrom.set(quietUntil, got[15])
  drawnFrom.set(isCalm, got[16])
  drawnFrom.set(hiddenLines, got[17])
  drawnFrom.set(todos, got[18])
  drawnFrom.set(turnInfo, got[19])
  drawnFrom.set(limits, got[20])
  drawnFrom.set(background, got[21])
  drawnFrom.set(permMode, got[22])
  drawnFrom.set(dayInfo, got[23])
  drawnFrom.set(sessionInfo, got[24])
  drawnFrom.set(outfitPick, got[25])
  drawnFrom.set(display, got[26])
  drawnFrom.set(wardrobeAt, got[27])
}
/** One of them, as taken for the drawing. */
function seen<T>(_$: EngineInterface, a: Atom<T>): Promise<T> {
  return Promise.resolve(drawnFrom.get(a) as T)
}

async function set($: EngineInterface, next: Mood, text: string) {
  lastActivity = await $.clock.now()
  await update($, idleFace, () => null)
  await update($, mood, () => next)
  await update($, line, () => text)
  const note = statusNote ? `✷ ${statusNote}` : undefined
  $.ui.status(next === 'oops' ? S.statusOops : next === 'nervous' ? (note ?? S.statusCareful) : next === 'wave' ? (note ?? `✷ ${S.waiting}`) : note)
  await pushStatus($)
  // calm mode: no dancing
  if (next === 'happy' && !(await read($, isCalm))) {
    danceTicks = 0
    if (!danceTimer) {
      danceTimer = $.clock.every(300, () => {
        // a dance of twelve seconds, then she stands: nothing redraws the pane for as long as she stays happy
        if (++danceTicks > 40) {
          danceTimer?.cancel()
          danceTimer = undefined
          void update($, danceStep, () => 0).catch(() => undefined)
        } else if (visible) void update($, danceStep, s => (s + 1) % 4).catch(() => undefined)
      })
    }
  } else if (danceTimer) {
    danceTimer.cancel()
    danceTimer = undefined
    await update($, danceStep, () => 0)
  }
}

/** Claude no longer waits for the person: drop the wave, its notification and its hold. */
async function stopWaving($: EngineInterface, label?: string) {
  isWaving = false
  if (sessionState === 'waiting') void beat($, 'working').catch(() => undefined)
  permissionTimer?.cancel()
  permissionTimer = undefined
  holdUntil = 0
  await endWait($, await $.clock.now())
  if ((await read($, mood)) === 'wave') await set($, 'think', label ?? say(S.think))
}

/** Rest depends on the hour: coffee in the morning, no scrolling at midnight, yawning at night. */
async function rest($: EngineInterface) {
  const now = await $.clock.now()
  const hour = new Date(now).getHours()
  const season = seasonOf(now)
  const moment = momentOf(now)
  await update($, prop, () => (season ? (SEASON_PROP[season] ?? null) : null))
  // focus mode: one quiet word, nothing else
  const focus = await read($, quietUntil)
  if (focus > now) {
    await set($, 'idle', M.focusOn(hhmm(focus)))
    return
  }
  const g = await read($, goal)
  const goalWord = g && g.day === dayOf(now) && !g.isDone && Math.random() < 0.3 ? M.goalNudge(g.text) : null
  if (goalWord) {
    await set($, 'idle', goalWord)
    return
  }
  if (hour >= 6 && hour < 10 && morningDay !== dayOf(now)) {
    // her morning word once a day, not after every turn before ten
    morningDay = dayOf(now)
    await update($, prop, () => 'coffee')
    await set($, 'idle', say(S.morning))
  } else if (hour === 0 && scrollDay !== dayOf(now)) {
    scrollDay = dayOf(now)
    await set($, 'idle', S.dontScroll)
  } else if (hour >= 1 && hour < 5) {
    await set($, 'yawn', say(S.night(hour)))
  } else if (((await read($, contextPercent)) ?? 0) >= 80) {
    await set($, 'yawn', say(S.fullContext((await read($, contextPercent)) ?? 0)))
  } else if ((await read($, isBreaks)) && !isBreakSaid && workStart && now - workStart >= 90 * 60_000 && now - lastTurnEnd < 15 * 60_000) {
    isBreakSaid = true
    const text = say(M.breakTime(Math.round((now - workStart) / 60_000)))
    $.ui.toast(`✷ Claudia: ${text}`)
    await set($, 'idle', text)
  } else if (hour >= 17 && today.day === dayOf(now) && today.turns >= 5 && !today.isRecapSaid) {
    today.isRecapSaid = true
    pending.isRecapSaid = true
    void saveBond($).catch(() => undefined)
    await set($, 'idle', M.recapShort(roundedToday()))
  } else {
    const pool = [
      ...S.idle,
      ...(today.cakes > 0 && today.day === dayOf(now) ? M.cakeMemory : []),
      ...(season ? M.seasons[season] : []),
      ...(moment ? M.moments[moment] : []),
      ...stack.flatMap(t => STACK_LINES[t] ?? []),
    ]
    // now and then, a small true tip for the stack she sees
    const tips = [...stack, ...(stack.some(t => t === 'Next.js' || t === 'React') ? ['TypeScript'] : [])].flatMap(t => TIPS[t] ?? [])
    if (tips.length && Math.random() < 0.25) {
      await set($, 'idle', say(tips))
      return
    }
    await set($, 'idle', say(pool))
  }
}

/** Always doing something, never waiting: a glance, a hum. */
async function fidget($: EngineInterface) {
  if (!visible || (await read($, mood)) !== 'idle' || (await read($, isBlinking))) return
  if ((await read($, isCalm)) || (await isQuietNow($))) return
  // her word on the last answer: only glances, no hum over it
  if (isCommentHeld) {
    await update($, idleFace, () => pick<Face>(['glanceL', 'glanceR'])!)
    $.clock.after(1400, () => void update($, idleFace, () => null).catch(() => undefined))
    return
  }
  // a fresh word (a greeting, a badge) stays a while before a hum takes the bubble
  const isFresh = (await $.clock.now()) - lastActivity < 30_000
  const move = pick<Face>(isFresh ? ['glanceL', 'glanceR'] : ['glanceL', 'glanceR', 'glanceL', 'glanceR', 'hum'])!
  await update($, idleFace, () => move)
  if (move === 'hum') await update($, line, () => say(S.hums))
  $.clock.after(move === 'hum' ? 2600 : 1400, () => void update($, idleFace, () => null).catch(() => undefined))
}

async function detectPlatform($: EngineInterface) {
  if (/^[A-Za-z]:[\\/]/.test($.plugin.root)) {
    platform = 'win'
    return
  }
  try {
    const r = await $.process.run(['uname'], { timeoutMs: 3000 })
    platform = /darwin/i.test(r.stdout) ? 'mac' : 'linux'
  } catch {
    platform = 'linux'
  }
}

/**
 * Her three sounds, each with a meaning: `done` (the jingle: a turn is over), `needYou` (two rising
 * tones: an OK to give, a question to answer), `oops` (one low tone: something went wrong).
 */
type Sound = 'done' | 'needYou' | 'oops'
const SOUND_FILES: Record<Sound, string> = { done: 'jingle.wav', needYou: 'needyou.wav', oops: 'oops.wav' }
/** When each sound last played: the same one waits a while before it plays again. */
const soundAt: Record<Sound, number> = { done: 0, needYou: 0, oops: 0 }

/** Plays one of her sounds: Media.SoundPlayer on Windows, the engine's player on macOS, paplay or aplay on Linux. */
async function playSound($: EngineInterface, sound: Sound) {
  if (!(await read($, isSound)) || (await read($, isCalm)) || (await isQuietNow($))) return
  const now = await $.clock.now()
  if (now - soundAt[sound] < 15_000) return
  soundAt[sound] = now
  const file = `${$.plugin.root}/assets/${SOUND_FILES[sound]}`
  try {
    if (platform === 'win') {
      const win = file.replace(/\//g, '\\').replace(/'/g, "''")
      await $.process.run(
        ['powershell', '-NoProfile', '-NonInteractive', '-Command', `(New-Object Media.SoundPlayer '${win.replace(/[‘’‚‛]/g, q => q + q)}').PlaySync()`],
        { timeoutMs: 5000 },
      )
    } else if (platform === 'linux') {
      const r = await $.process.run(['paplay', file], { timeoutMs: 5000 }).catch(() => null)
      if (!r || r.exitCode !== 0) await $.process.run(['aplay', '-q', file], { timeoutMs: 5000 }).catch(() => null)
    } else if (sound === 'done') await $.audio.play({ asset: 'assets/jingle.wav' })
    else if (sound === 'needYou') await $.audio.play({ asset: 'assets/needyou.wav' })
    else await $.audio.play({ asset: 'assets/oops.wav' })
  } catch {
    // no player: stay quiet
  }
}

/** Whole sentences up to 240 characters; a hard cut at a word only when one sentence runs longer. */
function fitComment(raw: string): string {
  const t = raw.replace(/\s+/g, ' ').trim().replace(/^["„”“'«»]+|["„”“'«»]+$/g, '').trim()
  if (t.length <= 240) return t
  const head = t.slice(0, 240)
  const end = Math.max(head.lastIndexOf('. '), head.lastIndexOf('! '), head.lastIndexOf('? '), head.lastIndexOf('… '))
  if (end > 40) return head.slice(0, end + 1)
  return `${head.replace(/\s+\S*$/, '')}…`
}

const quote = (text: string) => `“${text}”`

type HaikuAsk = { system?: string; prompt: string }

/** 1234 as 1.2k, 980 as 980. */
const tokensText = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n))

/** One Haiku call, counted for /claudia doctor; the text, or null when there is none. */
async function haiku($: EngineInterface, kind: string, ask: HaikuAsk): Promise<string | null> {
  haikuStats.calls += 1
  haikuStats.lastAt = await $.clock.now()
  haikuStats.lastKind = kind
  // a reply that takes this long is no longer about the moment
  const stop = new AbortController()
  const limit = $.clock.after(25_000, () => stop.abort())
  try {
    const r = await $.model.complete({ model: 'haiku', ...ask }, { signal: stop.signal })
    // what it took, as the reply counts it (a refused call can carry usage too)
    const u = (r as { usage?: { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number } }).usage
    if (u) {
      haikuStats.tokensIn += (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0)
      haikuStats.tokensOut += u.output_tokens ?? 0
    }
    if (r.isAnswered) {
      haikuStats.answered += 1
      return r.text
    }
    haikuStats.lastError = `${kind}: ${r.reason}`
  } catch (err) {
    haikuStats.lastError = `${kind}: ${err instanceof Error ? err.message : String(err)}`.slice(0, 120)
  } finally {
    limit.cancel()
  }
  return null
}

/** A Haiku line reached the bubble, or came when the bubble was taken. */
function shown(isShown: boolean) {
  if (isShown) haikuStats.shown += 1
  else haikuStats.dropped += 1
}

/** One line from Claudia (Haiku) about what I did this turn, in the mood of the look she wears. */
async function comment($: EngineInterface, asked: string, did: string[], answer: string, turn: number, isFull = false, note: string | null = null) {
  if (!(await read($, isCommenting)) || turn !== turnCount || (await isQuietNow($))) return
  const key = await currentLook($)
  const voice = voiceSeq
  const raw = await haiku($, 'comment', {
    system: S.commentSystem(S.looks[key], S.films[LOOKS[key].film], projectName()),
    prompt:
      (recentComments.length ? `${M.avoid(recentComments.join(' | '))}\n\n` : '') +
      (note ? `${note}\n\n` : '') +
      (turnContext() ? `${turnContext()}\n\n` : '') +
      S.commentPrompt(
        short(asked, isFull ? 1500 : 200) || S.continuation,
        did.slice(-15).join('; ') || S.onlyText,
        short(answer, isFull ? 3000 : 500),
      ),
  })
  if (raw === null) return
  const text = fitComment(raw)
  remember(text)
  // the person moved on while Haiku answered, or something else holds the bubble: keep quiet
  if (!text || turn !== turnCount || voice !== voiceSeq || !['idle', 'happy', 'wave', 'nervous'].includes(await read($, mood))) {
    if (text) shown(false)
    return
  }
  shown(true)
  holdUntil = 0
  // her word on the answer stays until the next message
  calm?.cancel()
  isCommentHeld = true
  lastActivity = await $.clock.now()
  await update($, line, () => quote(text))
}

function remember(text: string) {
  if (!text) return
  recentComments.push(text)
  if (recentComments.length > 5) recentComments.shift()
}

/**
 * A moment in the turn (red turned green, a commit, a deploy, a run of errors) in her own words:
 * the stock line shows at once, Haiku's takes its place when it comes. A few a turn, spaced out.
 */
async function moment($: EngineInterface, what: string, turn: number) {
  if (!(await read($, isCommenting)) || (await isQuietNow($)) || (await read($, isCalm))) return
  const now = await $.clock.now()
  if (momentsThisTurn >= 3 || now - lastMomentAt < 45_000) return
  momentsThisTurn += 1
  lastMomentAt = now
  const shownLine = await read($, line)
  const key = await currentLook($)
  const raw = await haiku($, 'moment', {
    system: S.commentSystem(S.looks[key], S.films[LOOKS[key].film], projectName()),
    prompt:
      (recentComments.length ? `${M.avoid(recentComments.join(' | '))}\n\n` : '') +
      (turnContext() ? `${turnContext()}\n\n` : '') +
      M.momentPrompt(what, short(turnAsked, 300) || S.continuation, turnDid.slice(-8).join('; ') || S.onlyText),
  })
  if (raw === null) return
  const text = fitComment(raw)
  remember(text)
  // only over her own stock line for that moment, never over something newer
  if (!text || turn !== turnCount || (await read($, line)) !== shownLine) {
    if (text) shown(false)
    return
  }
  shown(true)
  holdUntil = (await $.clock.now()) + 6000
  await update($, line, () => quote(text))
}

/** Idle a while after work: a thought of her own about what we did, now and then (opt-in, uses Haiku). */
async function muse($: EngineInterface, now: number) {
  if (!(await read($, isMusing)) || (await isQuietNow($)) || isCommentHeld) return
  if (musings >= 3 || now - lastActivity < 3 * 60_000 || now - lastActivity > 9 * 60_000 || now - lastMuseAt < 5 * 60_000) return
  if ((await read($, mood)) !== 'idle') return
  lastMuseAt = now
  musings += 1
  const voice = voiceSeq
  const lineBefore = await read($, line)
  const key = await currentLook($)
  const raw = await haiku($, 'musing', {
    system: S.commentSystem(S.looks[key], S.films[LOOKS[key].film], projectName()),
    prompt:
      (recentComments.length ? `${M.avoid(recentComments.join(' | '))}\n\n` : '') +
      (turnContext() ? `${turnContext()}\n\n` : '') +
      M.musePrompt(lastAsked || S.continuation, lastDid.slice(-10).join('; ') || S.onlyText, hhmm(now)),
  })
  if (raw === null) return
  const text = fitComment(raw)
  remember(text)
  // only into the quiet she started in: a word that came meanwhile stays
  if (!text || (await read($, mood)) !== 'idle' || voice !== voiceSeq || (await read($, line)) !== lineBefore) {
    if (text) shown(false)
    return
  }
  shown(true)
  await update($, line, () => quote(text))
}

/** Reading the whole exchange: was everything the person asked for done? Says so only when something is missing. */
async function checkDone($: EngineInterface, asked: string, answer: string, turn: number): Promise<boolean> {
  if (asked.trim().length < 40 || !answer.trim() || turn !== turnCount) return false
  const raw = await haiku($, 'check', { system: M.checkSystem, prompt: M.checkPrompt(short(asked, 3000), short(answer, 4000)) })
  if (raw === null) return false
  const what = raw.replace(/\s+/g, ' ').trim().replace(/^["„“'«]+|["”'»]+$/g, '').trim()
  if (!what || /^\W*(ok(ay)?|none|nothing(\s+(is\s+|was\s+)?missing)?|all\s+(is\s+|was\s+)?done)\W*$/i.test(what) || turn !== turnCount || !['idle', 'happy', 'nervous'].includes(await read($, mood))) return false
  holdUntil = 0
  await set($, 'nervous', M.missing(clip(what, 140)))
  $.ui.toast(`✷ Claudia: ${M.missing(clip(what, 140))}`)
  calmDown($, 60_000)
  return true
}

/** After a turn: the check first (when she reads the exchange), then a comment, unless her own word on the answer stands. */
async function afterAnswer($: EngineInterface, asked: string, did: string[], answer: string, turn: number, note: string | null, isAsk: boolean) {
  const isFull = await read($, isReading)
  // a reply that asks the person to decide first has nothing missing yet
  if (isFull && !isAsk && (await checkDone($, asked, answer, turn))) return
  await comment($, asked, did, answer, turn, isFull, note)
}

function calmDown($: EngineInterface, ms: number) {
  calm?.cancel()
  calm = $.clock.after(ms, () => {
    void rest($).catch(() => undefined)
  })
}

const clockText = (ms: number) => {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Stopwatch: a counter in the bubble after 30 s, a yawn after 3 min; never over a wave for an OK. */
function startStopwatch($: EngineInterface, label: string, startedAt: number) {
  stopwatch?.cancel()
  stopwatchFrom = startedAt
  stopwatch = $.clock.every(1000, () => {
    void (async () => {
      // from the tool's start, or from the OK it waited for
      const took = (await $.clock.now()) - stopwatchFrom
      let face = await read($, mood)
      // a wave that outlived its OK (the request for it came late): back to what she does
      if (face === 'wave' && !isWaving && !wantStopWave) {
        holdUntil = 0
        await set($, 'think', label)
        face = 'think'
      }
      // only over her working face: never over a wave for an OK, a warning or an oops
      if (took < 30_000 || (face !== 'think' && face !== 'yawn' && face !== 'talk') || (await $.clock.now()) < holdUntil) return
      if (took >= 180_000) {
        await update($, mood, () => 'yawn')
        await update($, line, () => S.stopwatchLong(clockText(took)))
      } else {
        await update($, line, () => `${label} · ⏱ ${clockText(took)}`)
      }
    })().catch(() => undefined)
  })
}

let stopwatchFrom = 0

function stopStopwatch() {
  stopwatch?.cancel()
  stopwatch = undefined
}

// What she reacts to in a message, and what in Claude's memory reads as unfinished. A local overlay can
// add words of its own (`words` in local.json), in any language.
const WORDS_BASE = {
  thanks: /\b(thx|thanks|thank you|awesome|great job|love it|nice one|well done)/i,
  swear: /\b(fuck|shit|damn|wtf)/i,
  /** Praise in strong slang: a compliment, not a swear word. */
  praise: /(fucking\s+(great|awesome|amazing|good)|hell\s+yeah)/i,
  // a smiley stands alone: never the `:D` inside `id:Description` or the `xd` inside a word
  laugh: /(?<![\w:]):D+(?!\w)|(?<!\w)xD+(?!\w)|\b(a?ha(ha)+|he(he)+|lol|lmao)\b|😂|🤣/i,
  frustration: /(doesn'?t work|does not work|not working|still (broken|failing|wrong|not)|same (error|problem)|again\?|\bugh+\b|\bargh+\b|[!?]{3,})/i,
  reminders: /\b(uncommitted|not pushed|pending|in progress|todo|unfinished|blocked)\b/i,
}
let WORDS: Record<keyof typeof WORDS_BASE, RegExp> = { ...WORDS_BASE }

/** The base words with the overlay's own; a fragment that is not a valid pattern is left out. */
function wordsWithOverlay(): Record<keyof typeof WORDS_BASE, RegExp> {
  const out = { ...WORDS_BASE }
  for (const key of Object.keys(WORDS_BASE) as (keyof typeof WORDS_BASE)[]) {
    const list = overlay.words?.[key]
    // checked the way it is used: one that is not a pattern there is left out
    const extra = (Array.isArray(list) ? list : []).filter(w => {
      try {
        if (typeof w !== 'string' || !w.length) return false
        new RegExp(`(?:${w})`, 'iu')
        return true
      } catch {
        return false
      }
    })
    try {
      if (extra.length) out[key] = new RegExp(`(?:${WORDS_BASE[key].source})|(?:${extra.join('|')})`, 'iu')
    } catch {
      // together they do not make a pattern: her own words only
    }
  }
  return out
}

async function startTalking($: EngineInterface) {
  if (isTalking) return
  isTalking = true
  const look = LOOKS[await currentLook($)]
  if ((await $.clock.now()) > holdUntil) {
    await update($, prop, () => (isPlanning ? 'notebook' : null))
    await set($, 'talk', say(look.lips === 'phone' ? S.phoneSings : S.talk))
  }
  mouthTimer?.cancel()
  mouthTimer = undefined
  // the text ended while she was getting ready: no mouth left moving
  if ((await read($, isCalm)) || !isTalking) return
  mouthTimer = $.clock.every(170, () => {
    if (visible) void update($, isMouthOpen, open => !open).catch(() => undefined)
  })
}

async function stopTalking($: EngineInterface) {
  if (!isTalking) return
  isTalking = false
  mouthTimer?.cancel()
  mouthTimer = undefined
  await update($, isMouthOpen, () => false)
}

const isMain = (e: unknown) => {
  const x = e as { agentId?: string; agent_id?: string }
  return !x.agentId && !x.agent_id
}

async function openPane($: EngineInterface, focus = false, force = false) {
  if (!force && (await read($, display)) !== 'pane') return
  // asked by the person (a command, a press): where the surface seats it, it stays
  if (focus || force) {
    askedAt = await $.clock.now()
    dockFailedAt = 0
    // the pane is drawn anew: the mark she left when she moved to the band is a drawing of its own,
    // and nothing else it read would change (an asked-for pane above the prompt stayed an empty frame)
    await update($, tick, n => n + 1)
  }
  const { columns, rows } = artSize((await read($, size)) === 'compact' ? 'head' : 'full')
  const r = await $.ui.open({ id: PANE, title: TITLE, columns: columns + 2, rows: rows + 8, ...(focus ? { focus: true as const } : {}) })
  if (r.isPlaced) visible = true
  // opened on her own on a window too narrow for the dock: she waits in the band instead
  else if (!focus && !force && /column/i.test(r.reason)) await toBand($)
  return r
}

/**
 * The settings and the wardrobe are worked with the keys. A pane already up when they are asked for is
 * only retitled by a second open and gets no keys: it is closed and opened anew, once.
 */
async function openWithKeys($: EngineInterface) {
  const r = await openPane($, true, true)
  try {
    const mine = (await $.ui.panes()).find(p => p.id === PANE)
    if (mine && mine.isPlaced && !mine.isFocused) {
      await $.ui.close({ id: PANE })
      return await openPane($, true, true)
    }
  } catch {
    // she is up either way; a click or the focus chord still gives her the keys
  }
  return r
}

// ------------------------------------------------------------------ a narrow window: the band, then back

/** Where the dock ends: below this many columns the surface seats a pane above the prompt. */
const DOCK_COLUMNS = 110
/** The width from which the surface docks a pane nobody asked for. */
const DOCK_UNASKED = 144
/** The widest window at which the dock was tried and not given: no new try until it is wider. */
let dockFailedAt = 0
/** When the dock was last tried from the band. */
let dockTriedTime = 0
/** The fullscreen window's width as the band last saw it (0 when not fullscreen). */
let bandColumns = 0
/** She went to the band because the window got narrow (never saved: the person's choice stays the pane). */
let isAutoBand = false
/** When the person last opened her pane themselves, and whether they keep it above the prompt on purpose. */
let askedAt = 0
let isInlineAsked = false
/** The width she last tried the dock at, so a resize tries once. */
let triedAt = 0
/** What a drawing saw (a drawing may not change state): the band wanted, or the dock's width again. */
let wantBand = false
let wantPaneAt = 0
/** A tool started after the person's OK (seen by a drawing): her wave gives way to what she does. */
let wantStopWave = false
/** What the tool waiting for the OK is for, in her words. */
let waitingFor: string | null = null

/** Moves between the pane and the band that drawings asked for, outside any drawing. */
async function settleLayout($: EngineInterface) {
  if (wantStopWave) {
    wantStopWave = false
    await stopWaving($, waitingFor ?? undefined)
  }
  if (wantBand) {
    wantBand = false
    await toBand($)
  }
  if (wantPaneAt) {
    const columns = wantPaneAt
    wantPaneAt = 0
    await fromBand($, columns)
  }
}

/** The window got narrow and the pane would drop under the chat: the band above the prompt instead. */
async function toBand($: EngineInterface) {
  if ((await read($, display)) !== 'pane') return
  isAutoBand = true
  await update($, display, () => 'band')
  if (visible) await $.ui.close({ id: PANE }).catch(() => undefined)
  visible = false
}

/** The window is wide again: back to the pane beside the chat (or still the band, if the surface keeps it). */
async function fromBand($: EngineInterface, columns: number) {
  const now = await $.clock.now()
  if (!isAutoBand || (triedAt === columns && now - dockTriedTime < 10_000)) return
  triedAt = columns
  dockTriedTime = now
  isAutoBand = false
  await update($, display, () => 'pane')
  const r = await openPane($)
  if (r && !r.isPlaced) {
    dockFailedAt = Math.max(dockFailedAt, columns)
    isAutoBand = true
    await update($, display, () => 'band')
  }
}

// ------------------------------------------------------------------ settings kept across sessions

async function readToggle($: EngineInterface, key: Toggle): Promise<boolean> {
  switch (key) {
    case 'isCommenting':
      return read($, isCommenting)
    case 'isReminding':
      return read($, isReminding)
    case 'isSound':
      return read($, isSound)
    case 'isGitGuard':
      return read($, isGitGuard)
    case 'isNotifying':
      return read($, isNotifying)
    case 'isBreaks':
      return read($, isBreaks)
    case 'isWide':
      return read($, isWide)
    case 'isReading':
      return read($, isReading)
    case 'isCalm':
      return read($, isCalm)
    case 'isNarrating':
      return read($, isNarrating)
    case 'isMusing':
      return read($, isMusing)
  }
}

async function writeToggle($: EngineInterface, key: Toggle, value: boolean) {
  switch (key) {
    case 'isCommenting':
      await update($, isCommenting, () => value)
      break
    case 'isReminding':
      await update($, isReminding, () => value)
      break
    case 'isSound':
      await update($, isSound, () => value)
      break
    case 'isGitGuard':
      await update($, isGitGuard, () => value)
      break
    case 'isNotifying':
      await update($, isNotifying, () => value)
      break
    case 'isBreaks':
      await update($, isBreaks, () => value)
      break
    case 'isWide':
      await update($, isWide, () => value)
      break
    case 'isReading':
      await update($, isReading, () => value)
      break
    case 'isCalm':
      await update($, isCalm, () => value)
      break
    case 'isNarrating':
      await update($, isNarrating, () => value)
      break
    case 'isMusing':
      await update($, isMusing, () => value)
      break
  }
  await $.store.set(key, value)
  if (key === 'isGitGuard' && value) void checkGit($).catch(() => undefined)
}

/**
 * The ~/.claude folder: from where the plugin is installed, else (a dev copy loaded from any folder)
 * from the home folder.
 */
async function claudeHome($: EngineInterface): Promise<string | null> {
  const fromRoot = $.plugin.root.replace(/(?<=[\\/]\.claude)[\\/](dev-mods|plugins)[\\/].*$/, '')
  if (fromRoot !== $.plugin.root) return fromRoot
  let home = ''
  try {
    home = (await $.env.get('USERPROFILE')) || (await $.env.get('HOME')) || ''
  } catch {
    // no environment to read: no home folder
  }
  return home ? `${home.replace(/\\/g, '/')}/.claude` : null
}

/**
 * Whether the overlay's project is this folder: with no repos named, anywhere; else where one of them
 * is the folder, sits in it, or holds it. Its words (thanks, reminders) are the person's own and go everywhere.
 */
let overlayHere = true

async function overlayFits($: EngineInterface): Promise<boolean> {
  const repos = overlay.repos ?? []
  if (!repos.length || !cwd) return true
  const path = cwd.replace(/\\/g, '/').toLowerCase()
  if (repos.some(r => path.split('/').includes(r.toLowerCase()))) return true
  try {
    const names = new Set((await $.fs.list(cwd)).map(e => e.name.toLowerCase()))
    return repos.some(r => names.has(r.toLowerCase()))
  } catch {
    return false
  }
}

async function loadSettings($: EngineInterface) {
  // The overlay lives beside the plugin while developing, or in ~/.claude/claudia/ so updates keep it.
  overlay = {}
  const claudeDir = await claudeHome($)
  for (const path of [`${$.plugin.root}/local.json`, ...(claudeDir ? [`${claudeDir}/claudia/local.json`] : [])]) {
    try {
      const parsed: unknown = JSON.parse(await $.fs.read(path))
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const found = parsed as Overlay
        // the repositories are folder names, a handful: anything else is left out
        const repos: unknown = found.repos
        overlay = { ...found, repos: Array.isArray(repos) ? repos.filter((r): r is string => typeof r === 'string' && !!r.trim() && !r.includes('..')).slice(0, 20) : undefined }
        break
      }
    } catch {
      // not there: try the next place
    }
  }
  S = withOverlay()
  WORDS = wordsWithOverlay()
  overlayHere = await overlayFits($)
  const disp = await $.store.get('display')
  if (disp === 'pane' || disp === 'band' || disp === 'status') await update($, display, () => disp)
  const qu = await $.store.get('quietUntil')
  if (typeof qu === 'number') await update($, quietUntil, () => qu)
  const gl = await $.store.get('goal')
  if (gl && typeof gl === 'object' && typeof (gl as GoalInfo).day === 'number' && typeof (gl as GoalInfo).text === 'string') {
    const kept = gl as GoalInfo
    await update($, goal, () => ({ day: kept.day, text: kept.text, isDone: kept.isDone === true }))
  }
  const o = await $.store.get('outfitPick')
  const look = typeof o === 'string' ? lookOf(o) : null
  if (look) await update($, outfitPick, () => look)
  const hl = await $.store.get('hiddenLines')
  if (Array.isArray(hl)) {
    const ids = hl.map(id => (id === 'energy' ? 'context' : id)).filter(isLineId)
    await update($, hiddenLines, () => ids)
  }
  const sz = await $.store.get('size')
  if (isSize(sz)) await update($, size, () => sz)
  for (const key of TOGGLES) {
    const stored = await $.store.get(key)
    const fallback = overlay.defaults?.[key]
    const value = typeof stored === 'boolean' ? stored : typeof fallback === 'boolean' ? fallback : null
    if (value !== null) {
      switch (key) {
        case 'isCommenting':
          await update($, isCommenting, () => value)
          break
        case 'isReminding':
          await update($, isReminding, () => value)
          break
        case 'isSound':
          await update($, isSound, () => value)
          break
        case 'isGitGuard':
          await update($, isGitGuard, () => value)
          break
        case 'isNotifying':
          await update($, isNotifying, () => value)
          break
        case 'isBreaks':
          await update($, isBreaks, () => value)
          break
        case 'isWide':
          await update($, isWide, () => value)
          break
        case 'isReading':
          await update($, isReading, () => value)
          break
        case 'isCalm':
          await update($, isCalm, () => value)
          break
        case 'isNarrating':
          await update($, isNarrating, () => value)
          break
        case 'isMusing':
          await update($, isMusing, () => value)
          break
      }
    }
  }
  return (await $.store.get('onboarded')) === true
}

// ------------------------------------------------------------------ git and memory

/** The repositories to watch: the overlay's, else the working directory and its child folders that hold one. */
async function findRepos($: EngineInterface): Promise<string[]> {
  if (overlay.repos?.length && overlayHere) return overlay.repos
  try {
    const top = await $.fs.list(cwd)
    if (top.some(e => e.name === '.git')) return ['.']
    const found: string[] = []
    for (const dir of top.filter(e => e.kind === 'dir' && !e.name.startsWith('.')).slice(0, 30)) {
      const inner = await $.fs.list(`${cwd}/${dir.name}`).catch(() => [])
      if (inner.some(e => e.name === '.git')) found.push(dir.name)
      if (found.length >= 4) break
    }
    if (found.length) return found
    // a folder inside a repository: git itself knows
    const inside = await $.process.run(['git', '--no-optional-locks', '-C', cwd, 'rev-parse', '--is-inside-work-tree'], { timeoutMs: 5000 })
    return inside.exitCode === 0 && inside.stdout.trim() === 'true' ? ['.'] : []
  } catch {
    return []
  }
}

/** Git guard: counts uncommitted files and commits waiting for a push, without taking locks. */
async function checkGit($: EngineInterface) {
  if (!cwd || !(await read($, isGitGuard))) return
  const out: RepoInfo[] = []
  for (const dir of repoDirs) {
    const repo = dir === '.' ? cwd : `${cwd}/${dir}`
    try {
      const st = await $.process.run(['git', '--no-optional-locks', '-c', 'core.fsmonitor=false', '-C', repo, 'status', '--porcelain'], { timeoutMs: 15_000 })
      if (st.exitCode !== 0) continue
      const ah = await $.process.run(['git', '--no-optional-locks', '-C', repo, 'rev-list', '--count', '@{u}..HEAD'], { timeoutMs: 15_000 })
      out.push({
        name: dir === '.' ? base(cwd) : dir,
        dirty: st.stdout.split('\n').filter(l => l.trim()).length,
        ahead: ah.exitCode === 0 ? Number.parseInt(ah.stdout.trim(), 10) || 0 : 0,
      })
    } catch {
      // no git: skip
    }
  }
  await update($, gitInfo, () => out)
}

/** Before a push: how many commits go, and where. */
async function pushPreview($: EngineInterface, cmd: string): Promise<string | null> {
  // the overlay's own push line wins over the count
  if (S.push !== EN.push) return null
  const at = /git\s+-C\s+("[^"]+"|\S+)/.exec(cmd)?.[1]?.replace(/"/g, '')
  const repo = at ? (/^([A-Za-z]:)?[\\/]/.test(at) ? at : `${cwd}/${at}`) : cwd
  try {
    const up = await $.process.run(['git', '--no-optional-locks', '-C', repo, 'rev-parse', '--abbrev-ref', '@{u}'], { timeoutMs: 5000 })
    const n = await $.process.run(['git', '--no-optional-locks', '-C', repo, 'rev-list', '--count', '@{u}..HEAD'], { timeoutMs: 5000 })
    if (up.exitCode !== 0 || n.exitCode !== 0) return null
    return S.pushGeneric(Number.parseInt(n.stdout.trim(), 10) || 0, up.stdout.trim())
  } catch {
    return null
  }
}

function gitWorry(info: RepoInfo[]): string | null {
  const worst = [...info].sort((a, b) => b.dirty + b.ahead * 3 - (a.dirty + a.ahead * 3))[0]
  if (!worst) return null
  if (worst.ahead >= 5) return S.gitAhead(worst.name, worst.ahead)
  if (worst.dirty >= 10) return S.gitDirty(worst.name, worst.dirty)
  return null
}

/** Reminders: entries of Claude's project memory index that speak of something unfinished. */
async function memoNudge($: EngineInterface): Promise<string | null> {
  if (!(await read($, isReminding))) return null
  const claudeDir = await claudeHome($)
  if (!cwd || !claudeDir) return null
  const slug = cwd.replace(/[^A-Za-z0-9]/g, '-')
  let text = ''
  try {
    text = await $.fs.read(`${claudeDir}/projects/${slug}/memory/MEMORY.md`)
  } catch {
    return null
  }
  const open = text
    .split('\n')
    .map(l => /^- \[([^\]]+)\]\([^)]*\)\s*[—-]\s*(.+)$/.exec(l.trim()))
    .filter((m): m is RegExpExecArray => m !== null)
    .filter(m =>
      WORDS.reminders.test(m[2] ?? ''),
    )
    .map(m => `${m[1]}: ${m[2]}`)
  const fresh = open.filter(t => !shownMemos.includes(t))
  const choice = pick(fresh.length ? fresh : open)
  if (!choice) return null
  shownMemos = [...shownMemos.slice(-20), choice]
  return `📌 ${short(choice, 120)}`
}

/** Now and then, when nothing happens: a git worry or a reminder. */
async function nudge($: EngineInterface, now: number) {
  if (await isQuietNow($)) return
  if ((await read($, mood)) !== 'idle') return
  if (now - lastActivity < 3 * 60_000 || now - lastNudge < 15 * 60_000) return
  lastNudge = now
  nudgeFlip = !nudgeFlip
  const worry = (await read($, isGitGuard)) ? gitWorry(await read($, gitInfo)) : null
  const text = worry && (nudgeFlip || Math.random() < 0.5) ? worry : ((await memoNudge($)) ?? worry)
  if (!text) return
  await update($, line, () => text)
  if (text === worry) {
    await update($, mood, () => 'nervous')
    $.clock.after(4000, () => {
      void (async () => {
        if ((await read($, mood)) === 'nervous') await update($, mood, () => 'idle')
      })().catch(() => undefined)
    })
  }
}

/** /claudia say: small talk with Haiku, remembering the last few exchanges. */
async function chatReply($: EngineInterface, said: string): Promise<string> {
  const history = await read($, chat)
  const key = await currentLook($)
  const doing = turnDid.slice(-5).join('; ') || S.nothing
  const raw = await haiku($, 'say', {
    system: S.chatSystem(S.looks[key], S.films[LOOKS[key].film], projectName()),
    prompt: S.chatPrompt(
      history.map(t => `${t.who === 'you' ? S.you : 'Claudia'}: ${t.text}`).join('\n'),
      doing,
      said,
    ),
  })
  const reply = raw !== null ? fitComment(raw) || '…' : S.chatFail
  await update($, chat, list =>
    [...list, { who: 'you' as const, text: said }, { who: 'claudia' as const, text: reply }].slice(-12),
  )
  return reply
}

/** Which face the pane draws, from her mood, the look's rules and the moment. */
async function faceNow($: EngineInterface, look: Look, now: Mood, step: number): Promise<Face | null> {
  if (now === 'idle') {
    if (await read($, isBlinking)) return 'blink'
    const f = await read($, idleFace)
    return isFace(f) ? f : null
  }
  if (now === 'talk') return look.lips === 'sing' && (await read($, isMouthOpen)) ? 'talk' : null
  if (now === 'happy') {
    if (look.winks && step % 2 === 1) return 'wink'
    return look.lips === 'closed' ? 'blush' : 'happy'
  }
  return isFace(now) ? now : null
}

async function cycleLook($: EngineInterface) {
  const keys = (Object.keys(LOOKS) as LookKey[]).filter(k => isUnlocked(k, bond?.badges))
  const now = lookOf(await read($, outfitPick))
  const at = now === null ? -1 : keys.indexOf(now)
  const next = at === keys.length - 1 ? null : keys[at + 1]!
  await update($, outfitPick, () => next)
  if (next) await $.store.set('outfitPick', next)
  else await $.store.delete('outfitPick')
}

async function cycleSize($: EngineInterface) {
  const order: Size[] = ['auto', 'full', 'compact']
  const now = await read($, size)
  const next = order[(order.indexOf(now) + 1) % order.length]!
  await update($, size, () => next)
  await $.store.set('size', next)
}

// ------------------------------------------------------------------ the bond: memory, today's counts, badges

/** Saves this session's changes on top of what other sessions saved meanwhile, one save at a time. */
function saveBond($: EngineInterface): Promise<void> {
  saving = saving.then(() => writeBond($)).catch(() => undefined)
  return saving
}

async function writeBond($: EngineInterface) {
  const day = dayOf(await $.clock.now())
  if (today.day !== day) {
    today = readToday(null, day)
    pending.today = zero()
    pending.isRecapSaid = false
  }
  // a session open past midnight: the new day counts for the two of you
  if (bond && bond.lastDay < day) bond = meet(bond, day).bond
  const p = pending
  pending = noPending()
  try {
    if (bond) {
      bond = mergeBond(readBond(await $.store.get('bond')), bond, p)
      await $.store.set('bond', bond)
    }
    today = mergeToday(readToday(await $.store.get('today'), day), p)
    await $.store.set('today', today)
  } catch (err) {
    // not saved: what this session added waits for the next save
    pending = joinPending(p, pending)
    throw err
  }
  const d = today
  await update($, dayInfo, () => ({ streak: bond?.streak ?? 1, turns: d.turns, commits: d.commits, cakes: d.cakes }))
}

/** Today's counts and the all-time ones grow together; a new day starts today's over. */
async function count($: EngineInterface, key: keyof Counts, n = 1, isSavedLater = false) {
  const day = dayOf(await $.clock.now())
  if (today.day !== day) {
    today = readToday(null, day)
    pending.today = zero()
  }
  today[key] += n
  pending.today[key] += n
  pending.total[key] += n
  if (bond) bond.total[key] += n
  // an edit's lines wait for the next save (a turn's end at the latest): no store traffic before a tool's result
  if (!isSavedLater) await saveBond($)
}

/** A badge, once: a toast now, and a word in her bubble once the moment's reaction is over. */
async function award($: EngineInterface, id: BadgeId) {
  if (!bond || bond.badges[id] !== undefined) return
  const day = dayOf(await $.clock.now())
  bond.badges[id] = day
  pending.badges[id] = day
  await saveBond($)
  const name = M.badges[id]
  $.ui.toast(`🏅 Claudia: ${name}`)
  for (const look of Object.keys(LOCKS) as LookKey[]) {
    if (LOCKS[look] === id) $.ui.toast(`✷ Claudia: ${M.unlocked(S.looks[look])}`)
  }
  $.clock.after(3600, () => {
    void (async () => {
      if (['idle', 'happy', 'think'].includes(await read($, mood)) && !(await isQuietNow($))) {
        voiceSeq += 1
        await update($, line, () => M.badgeEarned(name))
      }
    })().catch(() => undefined)
  })
}

/** The first words of a session: what the calendar and the two of you have to say. */
/** Whether another session's heartbeat is fresh (three minutes). */
async function hasFreshOther($: EngineInterface, now: number): Promise<boolean> {
  try {
    for (const k of await $.store.keys()) {
      if (!k.startsWith('sess:') || k === `sess:${sessionId}`) continue
      const v = (await $.store.get(k)) as { at?: unknown } | undefined
      if (typeof v?.at === 'number' && now - v.at < 3 * 60_000) return true
    }
  } catch {
    // no list: nobody else, as far as she knows
  }
  return false
}

async function meeting($: EngineInterface): Promise<string | null> {
  const now = await $.clock.now()
  const day = dayOf(now)
  const met = meet(readBond(await $.store.get('bond')), day)
  bond = met.bond
  today = readToday(await $.store.get('today'), day)
  await saveBond($)
  const m = met.meeting
  if (m.kind === 'first') return null
  if (bond.streak >= 7) await award($, 'streak7')
  if (bond.days >= 30) await award($, 'days30')
  const season = seasonOf(now)
  if (season) return say(M.seasons[season])
  if (m.kind === 'together') return M.together(m.days)
  if (m.kind === 'missed') return M.missed(m.days)
  if (m.kind === 'streak') return M.streak(m.n)
  // another session of hers is at work right now: this is a second window, not a return
  if (m.kind === 'sameDay' && (await hasFreshOther($, now))) return say(M.secondWindow)
  const moment = momentOf(now)
  if (moment && Math.random() < 0.6) return say(M.moments[moment])
  return say(m.kind === 'sameDay' ? M.backSameDay : M.newDay)
}

/** A helper's turn ended: its little Claudia says what it did, unless the moment belongs to something else. */
async function helperBack($: EngineInterface, kind: HelperKind, _what: string, isDone = true) {
  if (await isQuietNow($)) return
  if (!['idle', 'think', 'happy'].includes(await read($, mood)) || (await $.clock.now()) < holdUntil) return
  await update($, line, () => (isDone ? say(M.helperDone(S.helperKinds[kind])) : M.helperStopped(S.helperKinds[kind])))
}

/** Now and then a word of her own after what she does: about the program, or the kind of file. */
function flavored(tool: string, input: Record<string, unknown>): string {
  const plain = describe(tool, input)
  if (Math.random() > 0.35) return plain
  if (tool === 'Bash' || tool === 'PowerShell') {
    const cmd = typeof input.command === 'string' ? input.command : ''
    const tech = doingOf(cmd, commandLabel(cmd))?.tech
    return tech ? `${plain.replace(/\.$/, '')}. ${say(COMMAND_LINES[tech])}` : plain
  }
  if (tool === 'Edit' || tool === 'Write') {
    const k = techOfFile(typeof input.file_path === 'string' ? input.file_path : '')
    return k ? `${plain}. ${say(FILE_LINES[k])}` : plain
  }
  return plain
}

const roundedToday = (): Today => ({ ...today, minutes: Math.round(today.minutes) })

// ------------------------------------------------------------------ what the lines under her show

type TaskRow = { id: string; subject: string; active: string; status: string }
/** Claude's task list, from TodoWrite or the Task tools. */
let taskRows: TaskRow[] = []
/** Background tasks still running: id -> what runs. */
const bgTasks = new Map<string, string>()
const filesTouched = new Set<string>()
let turnTicker: Timer | undefined

const asRecord = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})
const asText = (v: unknown) => (typeof v === 'string' ? v : '')

async function syncTodos($: EngineInterface) {
  const total = taskRows.length
  const done = taskRows.filter(r => r.status === 'completed').length
  const now = taskRows.find(r => r.status === 'in_progress') ?? taskRows.find(r => r.status === 'pending')
  await update($, todos, () => (total ? { done, total, current: now ? now.active || now.subject : '' } : null))
}

/** Claude's own task list: TodoWrite sends it whole, the Task tools one task at a time. */
async function noteTasks($: EngineInterface, tool: string, input: Record<string, unknown>, result: unknown) {
  const out = asRecord(result)
  if (tool === 'TodoWrite' && Array.isArray(input.todos)) {
    taskRows = input.todos.map((t, i) => {
      const r = asRecord(t)
      return { id: String(i), subject: asText(r.content), active: asText(r.activeForm), status: asText(r.status) || 'pending' }
    })
  } else if (tool === 'TaskCreate') {
    const id = asText(asRecord(out.task).id) || asText(out.taskId) || asText(out.id) || `new-${taskRows.length}`
    if (taskRows.some(r => r.id === id)) return
    taskRows.push({ id, subject: asText(input.subject), active: asText(input.activeForm), status: 'pending' })
  } else if (tool === 'TaskUpdate') {
    const id = asText(input.taskId)
    let row = taskRows.find(r => r.id === id)
    if (!row && id) {
      row = taskRows.find(r => r.id.startsWith('new-'))
      if (row) row.id = id
    }
    if (!row) return
    if (input.status === 'deleted') taskRows = taskRows.filter(r => r !== row)
    else {
      if (typeof input.status === 'string') row.status = input.status
      if (typeof input.subject === 'string') row.subject = input.subject
      if (typeof input.activeForm === 'string') row.active = input.activeForm
    }
  } else if (tool === 'TaskList' && Array.isArray(out.tasks)) {
    const known = new Map(taskRows.map(r => [r.id, r]))
    taskRows = out.tasks.map(t => {
      const r = asRecord(t)
      const id = asText(r.id)
      return { id, subject: asText(r.subject), active: known.get(id)?.active ?? '', status: asText(r.status) || 'pending' }
    })
  } else return
  await syncTodos($)
}

/** A command sent to the background (by Claude, or by the person with Ctrl+B) until its notification comes. */
async function noteBackground($: EngineInterface, tool: string, input: Record<string, unknown>, result: unknown) {
  const out = asRecord(result)
  if ((tool === 'Bash' || tool === 'PowerShell') && typeof out.backgroundTaskId === 'string') {
    bgTasks.set(out.backgroundTaskId, commandLabel(input.command) || clip(input.description, 24))
  } else if (tool === 'TaskStop') {
    const id = asText(input.task_id) || asText(input.shell_id)
    if (!bgTasks.delete(id)) return
  } else return
  await update($, background, () => [...bgTasks.values()])
}

/** A task notification names the tasks that ended. */
async function noteNotification($: EngineInterface, text: string) {
  let changed = false
  for (const block of text.split(/<\/task-notification>/)) {
    const id = /<task-id>([^<]+)<\/task-id>/.exec(block)?.[1]?.trim()
    const status = /<status>([^<]+)<\/status>/.exec(block)?.[1]?.trim()
    if (id && status !== 'running' && bgTasks.delete(id)) changed = true
  }
  if (changed) await update($, background, () => [...bgTasks.values()])
}

/** This turn: one more tool; an edit adds its file and its lines. */
async function noteTurnTool($: EngineInterface, tool: string, input: Record<string, unknown>, isOk: boolean) {
  const path = isOk && (tool === 'Edit' || tool === 'Write' || tool === 'NotebookEdit') ? asText(input.file_path || input.notebook_path) : ''
  if (path) filesTouched.add(path)
  const d = isOk ? diffOf(tool, input) : { added: 0, removed: 0 }
  await update($, turnInfo, t => (t ? { ...t, tools: t.tools + 1, files: filesTouched.size, added: t.added + d.added, removed: t.removed + d.removed } : t))
}

/** A line hidden in the settings stays hidden in every session. */
async function setLineShown($: EngineInterface, id: LineId, isShown: boolean) {
  // what another session hid or showed since this one started is kept: the store's list, not this session's
  const kept = await $.store.get('hiddenLines').catch(() => undefined)
  const from = Array.isArray(kept) ? (kept.filter(l => (LINES as readonly string[]).includes(String(l === 'energy' ? 'context' : l))).map(l => (l === 'energy' ? 'context' : l)) as LineId[]) : await read($, hiddenLines)
  const next = isShown ? from.filter(l => l !== id) : [...new Set([...from, id])]
  await update($, hiddenLines, () => next)
  await $.store.set('hiddenLines', next)
}

/** Work time for the session and for today, kept under the session's key so a reload keeps it. */
async function addWork($: EngineInterface, ms: number) {
  if (ms <= 0) return
  await count($, 'minutes', ms / 60_000)
  const ses = await update($, sessionInfo, s => (s ? { ...s, workMs: s.workMs + ms } : s))
  if (sessionKey && ses) await $.store.set(sessionKey, ses.workMs)
}

/** The turn starts waiting for the person: from here on it is not work. */
async function startWait($: EngineInterface, now: number) {
  if (waitSince || !turnStartedAt) return
  waitSince = now
  await update($, turnInfo, t => (t && !t.endedAt ? { ...t, waitingSince: now } : t))
}

/** The person answered (or the turn ended): the wait is added up, and a running stopwatch starts from here. */
async function endWait($: EngineInterface, now: number) {
  if (!waitSince) return
  waitedMs += Math.max(0, now - waitSince)
  waitSince = 0
  stopwatchFrom = now
  const waited = waitedMs
  await update($, turnInfo, t => (t && !t.endedAt ? { ...t, waited, waitingSince: null } : t))
}

/** The tool ran this long inside a wait that was counted whole: that part was her work after all. */
async function giveBackRun($: EngineInterface, ranMs: number) {
  const back = Math.min(waitWithRunMs, Math.max(0, ranMs), waitedMs)
  waitWithRunMs = 0
  if (!(back > 0)) return
  waitedMs -= back
  const waited = waitedMs
  await update($, turnInfo, t => (t && !t.endedAt ? { ...t, waited } : t))
}

/** The engine's word on how long a tool ran (the wait for its OK left out). */
async function toolRan($: EngineInterface, e: { tool_name?: unknown; duration_ms?: unknown }) {
  const ran = e.duration_ms
  if (!active || !isMain(e) || typeof ran !== 'number' || !(ran > 0) || ASKS_THE_PERSON.has(String(e.tool_name))) return
  if (waitSince) ranUnseenMs = ran
  else if (waitWithRunMs) await giveBackRun($, ran)
}

/** How long this turn has waited for the person so far. */
const waitedBy = (now: number) => waitedMs + (waitSince ? Math.max(0, now - waitSince) : 0)

/**
 * Helpers working alone stop being counted: the last one came back (`isClean`), a main turn began, or
 * she lost sight of them. Their time is work; unseen, it ends two minutes after one was last seen working.
 */
async function closeSolo($: EngineInterface, now: number, isClean: boolean) {
  if (!soloSince) return
  const end = isClean ? now : Math.min(now, lastHelperAt + 2 * 60_000)
  const ms = end - soloSince
  soloSince = 0
  await update($, sessionInfo, s => (s ? { ...s, busySince: null } : s))
  if (ms > 0) await addWork($, ms)
}

/** Helpers go on working with no main turn: their clock starts. */
async function openSolo($: EngineInterface, now: number) {
  if (soloSince) return
  soloSince = now
  lastHelperAt = now
  await update($, sessionInfo, s => (s ? { ...s, busySince: now } : s))
}

/** A turn that began before a reload and whose end she never heard: it ends at the last work she saw. */
async function closeOrphan($: EngineInterface) {
  if (!orphanStart) return
  const start = orphanStart
  orphanStart = 0
  if (sessionId) await $.store.delete(`turnAt:${sessionId}`).catch(() => undefined)
  const end = Math.max(start, lastWorkAt)
  await update($, turnInfo, t => (t && !t.endedAt ? { ...t, endedAt: end } : t))
  orphanCredit += end - start
  await addWork($, end - start)
}

/** A narration call is out and not back yet. */
let isNarrationOut = false

/** One line, no quotes, a sentence long: Haiku's narration as her bubble takes it. */
function fitNarration(raw: string): string {
  const first = raw.replace(/\s+/g, ' ').trim().replace(/^["“„'«]+|["”'»]+$/g, '').trim()
  return first.length <= 100 ? first : `${first.slice(0, 99).replace(/\s+\S*$/, '')}…`
}

/** Claude's note on a step, in her English words; it lands only while that step is still the one running. */
async function narrate($: EngineInterface, note: string, turn: number, seq: number) {
  const key = note.replace(/\s+/g, ' ').trim().slice(0, 300)
  let text = narrated.get(key)
  if (!text) {
    // one call at a time: a step that comes while another is being put into words keeps its stock line
    // (a quick run of steps asked for each of them, and the answers came after their steps were gone)
    if (isNarrationOut) return
    isNarrationOut = true
    let raw: string | null
    try {
      raw = await haiku($, 'narration', { system: M.narrateSystem, prompt: M.narratePrompt(key) })
    } finally {
      isNarrationOut = false
    }
    if (raw === null) return
    text = fitNarration(raw)
    if (!text) return
    narrated.set(key, text)
    if (narrated.size > 300) narrated.delete(narrated.keys().next().value!)
  }
  if (turn !== turnCount || seq !== toolSeq || (await read($, mood)) !== 'think') {
    shown(false)
    return
  }
  shown(true)
  const line_ = text
  await update($, line, () => line_)
}

/**
 * The project's stack and package scripts: from its top folder, else from the folders under it
 * (the repositories first), so a project of a web app and an API is read as both.
 */
async function readStack($: EngineInterface) {
  const top = await $.fs.list(cwd)
  const text = async (p: string) => {
    try {
      return await $.fs.read(p)
    } catch {
      return null
    }
  }
  const found: { name: string; stack: string[] }[] = []
  const known: Record<string, string> = {}
  const scan = async (dir: string, label: string, names: string[]) => {
    const pkg = names.includes('package.json') ? await text(`${dir}/package.json`) : null
    const py = names.includes('pyproject.toml') ? await text(`${dir}/pyproject.toml`) : names.includes('requirements.txt') ? await text(`${dir}/requirements.txt`) : null
    for (const [k, v] of Object.entries(scriptsOf(pkg))) if (!(k in known)) known[k] = v
    const st = stackOf(names, pkg, py)
    if (st.length) found.push({ name: label, stack: st })
  }
  await scan(cwd, base(cwd), top.map(f => f.name))
  if (!found.length) {
    const repos = new Set(repoDirs.length ? repoDirs : overlayHere ? (overlay.repos ?? []) : [])
    const dirs = top
      .filter(e => e.kind === 'dir' && !/^[._]/.test(e.name) && e.name !== 'node_modules')
      .sort((a, b) => Number(repos.has(b.name)) - Number(repos.has(a.name)))
      .slice(0, 12)
    for (const d of dirs) {
      const names = (await $.fs.list(`${cwd}/${d.name}`).catch(() => [])).map(f => f.name)
      await scan(`${cwd}/${d.name}`, d.name, names)
      if (found.length >= 4) break
    }
  }
  stackByFolder = found
  stack = [...new Set(found.flatMap(f => f.stack))].slice(0, 8)
  scripts = known
}

/** What she knows of this turn for Haiku: the stack, and the files touched with their kinds. */
function turnContext(): string {
  const files = [...filesTouched].slice(-8).map(p => {
    const kind = techOfFile(p)
    return kind ? `${base(p)} (${kind})` : base(p)
  })
  return [stackText() ? `Stack: ${stackText()}` : '', files.length ? `Files you touched: ${files.join(', ')}` : ''].filter(Boolean).join('\n')
}

// ------------------------------------------------------------------ focus, other sessions, the band, the status line, the demo

const isQuietNow = async ($: EngineInterface) => (await read($, quietUntil)) > (await $.clock.now())

const hhmm = (ms: number) => {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** This session's heartbeat in the shared store: where it works, what it does now, when it said so. */
async function beat($: EngineInterface, state?: 'working' | 'waiting' | 'idle') {
  if (state) sessionState = state
  if (!sessionId) return
  await $.store.set(`sess:${sessionId}`, { name: base(cwd) || '?', state: sessionState, at: await $.clock.now() })
}

/** The other sessions' heartbeats: fresh ones counted, hour-old ones cleared away; a new wait for an OK, a toast. */
async function scanSessions($: EngineInterface) {
  const now = await $.clock.now()
  const keys = (await $.store.keys()).filter(k => k.startsWith('sess:') && k !== `sess:${sessionId}`)
  let total = 0
  const waiting: string[] = []
  const waitingKeys: string[] = []
  for (const k of keys) {
    const v = (await $.store.get(k)) as { name?: string; state?: string; at?: number } | undefined
    const at = typeof v?.at === 'number' ? v.at : 0
    if (now - at > 3_600_000) {
      await $.store.delete(k)
      continue
    }
    if (now - at > 3 * 60_000) continue
    total++
    if (v?.state === 'waiting') {
      waiting.push(short(v.name, 30) || '?')
      waitingKeys.push(k)
    }
  }
  const fresh = waiting.filter((_n, i) => !lastWaitingNames.includes(waitingKeys[i]!))
  lastWaitingNames = waitingKeys
  await update($, others, () => (total ? { total, waiting: waiting.length, names: waiting } : null))
  if (fresh.length && (await read($, isNotifying))) $.ui.toast(`✷ Claudia: ${M.otherWaits(fresh.join(', '))}`)
}

/**
 * The terminal draws the hint line under the prompt through her: there her status-line mode is the end of
 * that line, in its own dim colour. Elsewhere it is the plugin's pinned status, which the terminal draws
 * as a notice (a warning sign, yellow): right for an oops or a wait, wrong for every word she says.
 */
let isHintHers = false

/** Status-line mode: her word and the essentials in the one line under the prompt. */
async function pushStatus($: EngineInterface) {
  if ((await read($, display)) !== 'status') return
  const parts = [`✷ ${await read($, line)}`]
  const t = await read($, turnInfo)
  const now = await $.clock.now()
  if (t && !t.endedAt) parts.push(`⏱ ${elapsed(now - t.startedAt)}`)
  const top = [...(await read($, limits))].sort((a, b) => b.pct - a.pct)[0]
  if (top) parts.push(`${top.kind === 'five_hour' ? '5h' : top.kind === 'seven_day' ? '7d' : top.kind} ${Math.round(top.pct)}%`)
  const o = await read($, others)
  if (o?.waiting) parts.push(M.othersShort(o.total, o.waiting))
  const text = parts.join(' · ')
  await update($, statusText, () => text)
  // the pinned notice stays for what set() pinned there (an oops, a wait for an OK, a caution)
  if (!isHintHers) $.ui.status(text)
}

async function setDisplay($: EngineInterface, next: Display) {
  // the person's own choice ends a band the narrow window chose
  isAutoBand = false
  dockFailedAt = 0
  await update($, display, () => next)
  await $.store.set('display', next)
  if (next === 'status') await pushStatus($)
  else $.ui.status(undefined)
  if (next === 'pane') await openPane($)
  // the band or the status line alone: her pane goes, or she shows twice
  else if (visible) {
    await $.ui.close({ id: PANE }).catch(() => undefined)
    visible = false
  }
}

/**
 * Back from the settings or the wardrobe. They open the pane even when she lives in the band or the status
 * line (their buttons need it); leaving them closes it again, or she shows twice (the pane and the band).
 */
async function leaveView($: EngineInterface) {
  await update($, view, () => 'main')
  if ((await read($, display)) !== 'pane' && visible) {
    await $.ui.close({ id: PANE }).catch(() => undefined)
    visible = false
  }
}

async function cycleDisplay($: EngineInterface) {
  const order: Display[] = ['pane', 'band', 'status']
  await setDisplay($, order[(order.indexOf(await read($, display)) + 1) % order.length]!)
}

/** Thirty seconds of her: moods, props, helpers and looks, then back to how she was. */
async function demo($: EngineInterface) {
  if (isDemo) return
  // a turn runs: the show waits for its end
  const running = await read($, turnInfo)
  if (running && !running.endedAt) return
  isDemo = true
  const pickBefore = await read($, outfitPick)
  const crewBefore = await read($, crew)
  const wear = (k: LookKey) => update($, outfitPick, () => k)
  const steps: (() => Promise<unknown>)[] = [
    () => set($, 'happy', M.demoStart),
    async () => {
      await wear('bliss')
      await update($, prop, () => 'magnifier')
      await set($, 'think', S.doing.search)
    },
    async () => {
      await update($, prop, () => 'pencil')
      await set($, 'think', S.write('register.tsx'))
    },
    async () => {
      await update($, crew, () => ['explore', 'plan', 'review'])
      await set($, 'think', S.agent)
    },
    async () => {
      await update($, crew, () => crewBefore)
      await update($, prop, () => null)
      await set($, 'oops', S.oopsTsc)
    },
    async () => {
      await wear('glados')
      await update($, prop, () => 'cake')
      await set($, 'happy', say(S.testsPassed))
    },
    async () => {
      await wear('trench')
      await update($, prop, () => null)
      await set($, 'nervous', S.drop)
    },
    () => set($, 'wave', say(M.asks)),
    async () => {
      await wear('flightsuit')
      await set($, 'happy', say(S.pushDone))
    },
    () => set($, 'sleep', 'Zzz…'),
  ]
  steps.forEach((step, i) => $.clock.after(i * 2600, () => void step().catch(() => undefined)))
  $.clock.after(steps.length * 2600, () => {
    void (async () => {
      await update($, outfitPick, () => pickBefore)
      await update($, crew, () => crewBefore)
      await update($, prop, () => null)
      isDemo = false
      // a show from the band or the status line: the pane it opened goes with it
      await leaveView($)
      await set($, 'happy', M.demoDone)
      calmDown($, 8000)
    })().catch(() => {
      isDemo = false
    })
  })
}

/** /claudia doctor: what she sees of the terminal, the pane and her settings, with tips. */
const SURFACE_NAMES: Record<string, string> = { desktop: 'the desktop app', vscode: 'the editor', mobile: 'the phone' }

async function doctor($: EngineInterface): Promise<string> {
  // each variable by its literal name: the host lists what a plugin reads
  const env = async (read: () => Promise<string | undefined>) => {
    try {
      return (await read()) ?? ''
    } catch {
      return ''
    }
  }
  const out: string[] = ['Claudia doctor', '']
  let version = '?'
  try {
    version = (JSON.parse(await $.fs.read(`${$.plugin.root}/.claude-plugin/plugin.json`)) as { version?: string }).version ?? '?'
  } catch {
    // no manifest to read
  }
  out.push(`✓ claudia-companion ${version} on ${platform ?? 'an unknown system'}`)
  // off the terminal she is SVG: no terminal, no cells, no wider pixels to check
  const isTerminal = drawnOn === null || drawnOn === 'terminal'
  if (isTerminal) {
    const term =
      (await env(() => $.env.get('TERM_PROGRAM'))) ||
      ((await env(() => $.env.get('WT_SESSION'))) ? 'Windows Terminal' : '') ||
      (await env(() => $.env.get('TERM'))) ||
      'unknown'
    const color = await env(() => $.env.get('COLORTERM'))
    const isRich = /truecolor|24bit/i.test(color) || /Windows Terminal|iTerm|WezTerm|ghostty|vscode|kitty|Apple_Terminal/i.test(term)
    out.push(`${isRich ? '✓' : '!'} terminal: ${term}${color ? ` (${color})` : ''}`)
    if (!isRich) out.push('    her colours need 24-bit colour; Windows Terminal, iTerm2, WezTerm or Ghostty show her best')
  } else {
    out.push(`✓ drawn in: ${SURFACE_NAMES[drawnOn!] ?? drawnOn}, as SVG scaled to the pane`)
  }
  const shown = await read($, display)
  out.push(`✓ shows as: ${M.displayNames[shown]}`)
  if (lastPane.columns) {
    const tier = tierFor(await read($, size), lastPane.columns, 'dock', lastPane.rows, await read($, isWide))
    out.push(`${tier === 'full' || tier === 'big' ? '✓' : '!'} pane: ${lastPane.columns}×${lastPane.rows} cells, she is drawn ${tier ?? 'as words only'}`)
    if (lastPane.columns < 34) out.push('    widen the pane to 34+ columns for her full figure (66+ and a tall pane make her big)')
    if (lastPane.rows && lastPane.rows < 30) out.push('    a taller pane shows more of the lines under her')
  } else if (shown === 'pane') {
    out.push('! the pane has not been drawn yet: /claudia opens it')
  }
  if (isTerminal) {
    out.push('✓ symbols like ⏱ ⚙ ☑ count as two cells, so her lines never wrap')
    out.push(`${(await read($, isWide)) ? '✓' : '·'} wider pixels ${(await read($, isWide)) ? 'on' : 'off'}: turn on (/claudia wide on) if she looks squeezed`)
  }
  try {
    const git = await $.process.run(['git', '--version'], { timeoutMs: 5000 })
    out.push(`${git.exitCode === 0 ? '✓' : '!'} git: ${git.stdout.trim() || 'not found'}`)
  } catch {
    out.push('! git: not found (the git guard stays quiet)')
  }
  out.push(`${(await read($, isSound)) ? '✓' : '·'} sounds ${(await read($, isSound)) ? 'on' : 'off'}: done, I need you, oops (${platform === 'win' ? 'PowerShell' : platform === 'linux' ? 'paplay or aplay' : 'afplay'})`)
  out.push(`· Haiku: comments ${(await read($, isCommenting)) ? 'on' : 'off'}, reading the exchange ${(await read($, isReading)) ? 'on' : 'off'}, narration ${(await read($, isNarrating)) ? 'on' : 'off'}, idle thoughts ${(await read($, isMusing)) ? 'on' : 'off'} (all use your account)`)
  const hs = haikuStats
  if (!hs.calls) out.push('· Haiku this session: no calls yet')
  else {
    out.push(
      `${hs.answered ? '✓' : '!'} Haiku this session: ${hs.calls} calls, ${hs.answered} answered, ${hs.shown} shown, ${hs.dropped} came too late for the bubble · last: ${hs.lastKind} at ${hhmm(hs.lastAt)}`,
    )
    if (hs.tokensIn || hs.tokensOut) out.push(`· Haiku tokens this session: ${tokensText(hs.tokensIn)} in, ${tokensText(hs.tokensOut)} out`)
    if (hs.lastError) out.push(`! Haiku's last failure: ${hs.lastError}`)
  }
  out.push(`· calm mode ${(await read($, isCalm)) ? 'on' : 'off'} · focus ${(await isQuietNow($)) ? `until ${hhmm(await read($, quietUntil))}` : 'off'}`)
  out.push(`· stack: ${stackText() || 'not detected'}`)
  if (Object.keys(scripts).length) out.push(`· package scripts I know: ${Object.keys(scripts).slice(0, 8).join(', ')}`)
  out.push(`· local overlay: ${Object.keys(overlay).length ? Object.keys(overlay).filter(k => !k.startsWith('_')).join(', ') : 'none'}`)
  const looks = Object.keys(LOOKS) as LookKey[]
  out.push(
    `· together ${bond?.days ?? 1} day${(bond?.days ?? 1) === 1 ? '' : 's'} · badges ${BADGES.filter(b => bond?.badges[b] !== undefined).length}/${BADGES.length} · looks ${looks.filter(k => isUnlocked(k, bond?.badges)).length}/${looks.length}`,
  )
  return out.join('\n')
}

const xml = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** /claudia card: today with her as an SVG card, saved under ~/.claude/claudia/. */
async function shareCard($: EngineInterface): Promise<string> {
  const key = await currentLook($)
  const art = svgFor({ key, face: 'happy', extra: null, step: 0, tier: 'full', wide: false })
  const inner = art.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')
  const t = roundedToday()
  const g = await read($, goal)
  const lines = [
    `${t.turns} turns · ${t.minutes} min of work`,
    `${t.commits} commits · ${t.cakes} green tests 🍰`,
    `+${t.added} / −${t.removed} lines`,
    `🔥 ${bond?.streak ?? 1}-day streak · 🏅 ${BADGES.filter(b => bond?.badges[b] !== undefined).length}/${BADGES.length}`,
    ...(g && g.day === t.day ? [`🎯 ${g.isDone ? '✓ ' : ''}${g.text}`] : []),
    `wearing ${S.looks[key]}`,
  ]
  const text = lines.map((l, i) => `<text x="330" y="${118 + i * 32}" font-size="19" fill="#e8e6e3">${xml(l)}</text>`).join('')
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="380" viewBox="0 0 720 380" font-family="ui-monospace, Menlo, Consolas, monospace">` +
    `<rect width="720" height="380" rx="18" fill="#17171d"/>` +
    `<g transform="translate(28,30) scale(9)" shape-rendering="crispEdges">${inner}</g>` +
    `<text x="330" y="74" font-size="28" font-weight="bold" fill="#D97757">✷ ${xml(M.cardTitle)}</text>` +
    text +
    `<text x="330" y="350" font-size="13" fill="#8a8a94">claudia-companion · Claudia by anabology (claudia.gallery)</text>` +
    `</svg>`
  const home = ((await $.env.get('USERPROFILE')) || (await $.env.get('HOME')) || '').replace(/\\/g, '/')
  if (!home) throw new Error('no home folder')
  const d = new Date(await $.clock.now())
  const file = `${home}/.claude/claudia/card-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.svg`
  await $.fs.write(file, svg)
  return file
}

/** A locked look in the wardrobe: her outline only. */
const SILHOUETTE: Tint = () => 0x34343e

/** She puts on a look picked in the wardrobe, for every session. */
async function wear($: EngineInterface, k: LookKey) {
  await update($, outfitPick, () => k)
  await $.store.set('outfitPick', k)
  await set($, 'happy', S.outfitDressedLine(S.looks[k]))
  calmDown($, 5000)
}

function lockedCellsFor(f: Frame): string {
  const id = `locked|${frameId(f)}`
  const hit = cache.get(id)
  if (hit) return hit
  const { grid } = gridFor(f)
  const { columns, rows } = artSize(f.tier, f.wide)
  const out = pack(grid, columns, rows, SILHOUETTE)
  cache.set(id, out)
  return out
}

// ------------------------------------------------------------------ hooks

/**
 * Wakes her once: in the terminal at session start, in the desktop app (an SDK session,
 * not interactive) when it attaches, or at the first `/claudia`. A `-p` run never wakes her.
 */
/** A turn begins: a helper's joins the crew; the main one starts her counts and her thinking face. */
async function turnBegins($: EngineInterface, agentId: string | undefined, text = '') {
  if (agentId) {
    // by its id when the spawn has answered, else by the prompt it was sent with
    const at = pendingSpawns.findIndex(w => w.prompt === spawnKey(text))
    const waiting = at >= 0 ? pendingSpawns.splice(at, 1)[0] : undefined
    agents.set(agentId, spawnedKinds.get(agentId) ?? waiting?.kind ?? 'general')
    await syncCrew($)
    const seenAt = await $.clock.now()
    lastHelperAt = seenAt
    if (!turnStartedAt) await openSolo($, seenAt)
    return
  }
  errorsThisTurn = 0
  errorStreak = 0
  statusNote = null
  turnDid = []
  turnCount += 1
  isCommentHeld = false
  momentsThisTurn = 0
  await closeOrphan($)
  orphanCredit = 0
  turnStartedAt = await $.clock.now()
  // helpers that worked on alone are counted up to here; from now the turn's own clock runs
  await closeSolo($, turnStartedAt, false)
  turnRanShell = false
  waitSince = 0
  waitedMs = 0
  waitWithRunMs = 0
  ranUnseenMs = 0
  turnGapMs = 0
  lastTickAt = turnStartedAt
  lastWorkAt = turnStartedAt
  if (sessionId) void $.store.set(`turnAt:${sessionId}`, turnStartedAt).catch(() => undefined)
  testsFailedThisTurn = false
  lastToolFailed = false
  failKey = ''
  recoveredThisTurn = false
  isGreenThisTurn = false
  noteBeforeTool = null
  addedThisTurn = 0
  removedThisTurn = 0
  if (!workStart || turnStartedAt - lastTurnEnd > 15 * 60_000) {
    workStart = turnStartedAt
    isBreakSaid = false
  }
  await count($, 'turns')
  void beat($, 'working').catch(() => undefined)
  filesTouched.clear()
  const startedAt = turnStartedAt
  await update($, turnInfo, () => ({ startedAt, endedAt: null, tools: 0, files: 0, added: 0, removed: 0 }))
  turnTicker?.cancel()
  turnTicker = $.clock.every(1000, () => {
    void turnTick($).catch(() => undefined)
    if (visible) void update($, tick, n => n + 1).catch(() => undefined)
    void pushStatus($).catch(() => undefined)
  })
  // a finished list belongs to the last piece of work
  if (taskRows.length && taskRows.every(r => r.status === 'completed')) {
    taskRows = []
    await syncTodos($)
  }
  const at = new Date(turnStartedAt)
  if (at.getDay() === 0 || at.getDay() === 6) await award($, 'weekend')
  if (at.getHours() < 4) await award($, 'nightOwl')
  if (at.getHours() >= 5 && at.getHours() < 7) await award($, 'earlyBird')
  calm?.cancel()
  isWaving = false
  const wait = holdUntil - turnStartedAt
  if (wait > 0 && wait < 10_000) calm = $.clock.after(wait, () => void thinkFace($).catch(() => undefined))
  else {
    holdUntil = 0
    await thinkFace($)
  }
}

/**
 * Once a second while a turn runs. A minute or more of silence between two ticks means the computer
 * slept (or the process was stopped): that time is taken out of the turn, its stopwatch and its wait.
 */
async function turnTick($: EngineInterface) {
  const now = await $.clock.now()
  const gap = lastTickAt ? now - lastTickAt - 1000 : 0
  lastTickAt = now
  if (gap < 60_000 || !turnStartedAt) return
  turnGapMs += gap
  turnStartedAt += gap
  stopwatchFrom += gap
  if (waitSince) waitSince += gap
  if (orphanStart) orphanStart += gap
  const since = waitSince
  await update($, turnInfo, t => (t && !t.endedAt ? { ...t, startedAt: t.startedAt + gap, ...(since ? { waitingSince: since } : {}) } : t))
}

/** Her thinking face: the notebook in plan mode. */
async function thinkFace($: EngineInterface) {
  await update($, prop, () => (isPlanning ? 'notebook' : null))
  await set($, 'think', isPlanning ? S.planning : say(S.think))
}

/** Before a tool runs: the guard's warning, or her word for what it does; never anything that waits on a process. */
async function toolBegins($: EngineInterface, tool: string, input: Record<string, unknown>, main: boolean) {
  const now = await $.clock.now()
  if (!main) lastHelperAt = now
  // a question or a plan to approve: the person's turn to act
  const isShell = tool === 'Bash' || tool === 'PowerShell'
  const cmd = isShell && typeof input.command === 'string' ? input.command : ''
  const warn = danger(tool, input)
  if (warn) {
    holdUntil = now + 3500
    await update($, prop, () => propFor(tool, input))
    await set($, 'nervous', warn)
    if (warn === S.push) {
      // how many commits go, and where: read beside the push, never before it
      void (async () => {
        const better = await pushPreview($, cmd)
        if (better && (await read($, line)) === warn) await update($, line, () => better)
        $.ui.toast(`✷ Claudia: ${better ?? warn}`)
      })().catch(() => undefined)
    } else $.ui.toast(`✷ Claudia: ${warn}`)
  } else if (main && now > holdUntil) {
    await update($, prop, () => propFor(tool, input))
    await set($, 'think', hasTodo(tool, input) ? say(M.todo) : flavored(tool, input))
    // the request for an OK came while she said it: the wave stands
    if (isWaving) await set($, 'wave', S.waiting)
    // narration: Claude's note (or the command's description) as her own English line, when it comes
    const note = noteBeforeTool ?? (isShell && typeof input.description === 'string' ? input.description : null)
    noteBeforeTool = null
    toolSeq += 1
    if (note && (await read($, isNarrating)) && !(await isQuietNow($))) void narrate($, note, turnCount, toolSeq).catch(() => undefined)
  }
  if (main) {
    const what = describe(tool, input)
    waitingFor = what
    lastWorkAt = now
    const running = isShell ? commandLabel(cmd) : `${tool}${typeof input.file_path === 'string' ? ` ${base(input.file_path)}` : ''}`
    await update($, turnInfo, t => (t ? { ...t, current: running || tool } : t))
    turnDid.push(what)
    if (turnDid.length > 60) turnDid.shift()
    if (isShell) turnRanShell = true
    if (ASKS_THE_PERSON.has(tool)) await startWait($, now)
    else startStopwatch($, what, now)
  }
}

/** A tool is over, however it ended: the stopwatch stops, and the wave for its OK with it. */
async function toolEnds($: EngineInterface) {
  stopStopwatch()
  const endedAt = await $.clock.now()
  const openWait = waitSince ? Math.max(0, endedAt - waitSince) : 0
  await endWait($, endedAt)
  if (openWait) {
    waitWithRunMs = openWait
    if (ranUnseenMs) await giveBackRun($, ranUnseenMs)
  }
  ranUnseenMs = 0
  isWaving = false
  wantStopWave = false
  // the OK came (or the tool ran without one): the other sessions see her working again
  if (sessionState === 'waiting') void beat($, 'working').catch(() => undefined)
  permissionTimer?.cancel()
  permissionTimer = undefined
  if ((await read($, mood)) === 'wave') holdUntil = 0
}

/** After a tool: untie me, oops, or a small celebration. A helper's tools count, but the bubble and the streaks are the main turn's. */
async function toolReaction($: EngineInterface, tool: string, input: Record<string, unknown>, main: boolean, how: 'denied' | 'refused' | 'error' | 'ok', output: string) {
  const isShell = tool === 'Bash' || tool === 'PowerShell'
  const cmd = isShell && typeof input.command === 'string' ? bare(input.command.slice(0, 8000)) : ''
  if (how === 'denied') {
    // CLODYSSEY: tied to the mast, she screams UNTIE ME
    if (main) {
      holdUntil = (await $.clock.now()) + 2500
      await set($, 'nervous', S.untie)
    }
    return
  }
  if (how === 'refused') {
    if (main && (await read($, mood)) === 'wave') await set($, 'think', say(S.think))
    return
  }
  const runs = cmd ? withScripts(cmd) : ''
  const isTests = !!runs && TEST_RUN.test(runs)
  if (how === 'error') {
    if (!main) return
    const kind = errorKindOf(output)
    // a probe that found nothing (a grep with no match, a diff, a `test -f`) answered: no stumble of hers
    if (isShell && !kind && output.trim().length < 60 && isProbe(runs)) return
    lastToolFailed = true
    failKey = callKey(tool, input, runs, isTests)
    // an edit turned away before it touched the file (not read yet, text not found) is tried again at once:
    // a word of hers, but no streak and no "bumpy ride" at the end
    const isSoft = !isShell && /has not been read|read it first|not found in|does not exist|not unique|matches of the string/i.test(output.slice(0, 600))
    if (!isSoft) {
      errorsThisTurn += 1
      errorStreak += 1
      await count($, 'oops')
    }
    if (isTests && (kind === 'testFail' || !kind)) testsFailedThisTurn = true
    holdUntil = (await $.clock.now()) + 3500
    const text = oopsLine(tool, input, output)
    await set($, 'oops', errorStreak === 4 ? say(M.stuck) : errorStreak >= 3 ? S.streak(text, errorStreak) : text)
    if (errorStreak === 3) {
      void playSound($, 'oops').catch(() => undefined)
      void moment($, M.momentOf.errors(describe(tool, input)), turnCount).catch(() => undefined)
    }
    return
  }
  // a commit that had nothing to commit, a push with nothing to send: the command ended well, nothing happened
  const isCommit = GIT_COMMIT.test(cmd) && !/\s--dry-run\b/.test(cmd) && !/nothing to commit|no changes added to commit/i.test(output)
  const hasPush = GIT_PUSH.test(cmd) && !/\s--dry-run\b/.test(cmd)
  const isPush = hasPush && !/Everything up-to-date/i.test(output)
  if (isCommit) await count($, 'commits')
  if (isPush) await count($, 'pushes')
  if (isCommit || isPush) void checkGit($).catch(() => undefined)
  if (bond && bond.total.commits >= 10) await award($, 'commits10')
  if (bond && bond.total.commits >= 100) await award($, 'commits100')
  if (!main) return
  const celebrate = async (text: string, extra: PropName | null = null) => {
    holdUntil = (await $.clock.now()) + 3000
    await update($, prop, () => extra)
    await set($, 'happy', text)
  }
  const d = diffOf(tool, input)
  addedThisTurn += d.added
  removedThisTurn += d.removed
  if (d.added) await count($, 'added', d.added, true)
  if (d.removed) await count($, 'removed', d.removed, true)
  const streak = errorStreak
  errorStreak = 0
  lastToolFailed = false
  // the same thing that failed works now (the tests, that program, that file): only then is it "fixed"
  const isSame = !!failKey && callKey(tool, input, runs, isTests) === failKey
  if (isSame) failKey = ''
  // a run that only lists or builds the tests proves nothing
  const ranTests = isTests && !/\s--(?:collect-only|no-run|listTests|list|help|version)\b/.test(cmd)
  // the cake is a reward: red turned green, or the first green run of a turn
  const isCake = ranTests && (testsFailedThisTurn || !isGreenThisTurn)
  if (isCake) await count($, 'cakes')
  if (ranTests && testsFailedThisTurn) {
    // red, then green: her favourite colour change
    testsFailedThisTurn = false
    isGreenThisTurn = true
    recoveredThisTurn = true
    await celebrate(M.redToGreen, 'cake')
    void moment($, M.momentOf.redToGreen, turnCount).catch(() => undefined)
  } else if (streak >= 2 && isSame) {
    // two failures and now it works: the third try
    recoveredThisTurn = true
    await celebrate(say(S.fixed(streak + 1)))
    void moment($, M.momentOf.fixed(streak), turnCount).catch(() => undefined)
  } else if (hasPush && !isPush) {
    await update($, line, () => M.pushNothing)
  } else if (isCommit) {
    await celebrate(say(S.commitDone))
    void moment($, M.momentOf.commit, turnCount).catch(() => undefined)
  } else if (isPush) {
    // DOWNFORCE: up the wall, calm upside down
    await celebrate(say(S.pushDone))
    void moment($, M.momentOf.push, turnCount).catch(() => undefined)
  } else if (ranTests) {
    // THE CAKE IS NOT A LIE, once a turn; after that, a short word
    if (isGreenThisTurn) await celebrate(say(S.stillGreen))
    else await celebrate(say(S.testsPassed), 'cake')
    isGreenThisTurn = true
  } else if (runs && PUBLISH.test(runs)) {
    await celebrate(say(S.published))
    void moment($, M.momentOf.published, turnCount).catch(() => undefined)
  } else if (runs && DEPLOY.test(runs)) {
    // ESCAPE VELOCITY: the board flips and the runway lifts off
    await celebrate(say(S.deployDone))
    void moment($, M.momentOf.deploy, turnCount).catch(() => undefined)
  } else if (isShell && okLine(cmd)) {
    // a build or a check went through: a word in its own world
    await update($, line, () => okLine(cmd)!)
  } else if ((await read($, mood)) === 'wave' || (await read($, mood)) === 'yawn') {
    // the wave for its OK, or the yawn of a long wait, ends with the tool
    await set($, 'think', describe(tool, input))
  }
  if (streak >= 3 && isSame) await award($, 'comeback')
  if (isCake) await award($, 'firstGreen')
  if (bond && bond.total.cakes >= 10) await award($, 'cake10')
}

/** A helper's turn ended, however it did: it leaves the crew and says what it did. */
async function helperLeaves($: EngineInterface, agentId: string, reason = 'answer') {
  const kind = agents.get(agentId) ?? spawnedKinds.get(agentId)
  const what = spawnedWhat.get(agentId) ?? ''
  agents.delete(agentId)
  spawnedKinds.delete(agentId)
  spawnedWhat.delete(agentId)
  await syncCrew($)
  // the last of the helpers working alone: their time is counted
  const leftAt = await $.clock.now()
  lastHelperAt = leftAt
  if (agents.size === 0) await closeSolo($, leftAt, true)
  if (kind) await helperBack($, kind, what, reason === 'answer')
}

/** The main turn is over: her word on how it ended, the time it took, a sound, and (when on) Haiku's comment. */
async function turnEnds($: EngineInterface, reason: string, durationMs: number, text: string) {
  stopStopwatch()
  isWaving = false
  wantStopWave = false
  permissionTimer?.cancel()
  permissionTimer = undefined
  holdUntil = 0
  await endWait($, await $.clock.now())
  // a background subagent works on past the main turn; the rest (one whose end never came) leave
  await keepWorkingAgents($)
  void beat($, 'idle').catch(() => undefined)
  await stopTalking($)
  await update($, prop, () => null)
  let noted = false
  let haikuNote: string | null = null
  let isAsked = false
  let isOpen = false
  if (reason === 'answer') {
    const net = removedThisTurn - addedThisTurn
    // what she notices in the answer: a question left for the person, else a word of caution
    const ask = questionAtEnd(text)
    const care = ask ? null : cautionIn(text)
    // how it went: stopped at a failure (nothing to sing about), a real fight won, a stumble, a plain
    // answer with nothing changed, or done
    isOpen = lastToolFailed || testsFailedThisTurn
    const hasChanged = filesTouched.size > 0 || turnRanShell
    const done = isOpen
      ? say(M.stoppedShort)
      : addedThisTurn >= 300
        ? M.bigDiff(addedThisTurn)
        : removedThisTurn >= 30 && net > 0
          ? M.deletedMore(net)
          : say(errorsThisTurn >= 3 || (errorsThisTurn >= 2 && recoveredThisTurn) ? S.happyAfterTrouble : errorsThisTurn >= 1 ? M.stumbled : !hasChanged || care ? M.answered : S.happy)
    await set($, isOpen ? 'idle' : 'happy', done)
    if (addedThisTurn >= 500) await award($, 'bigDiff')
    if (net >= 100) await award($, 'cleaner')
    // in her words, in English: never a quote of the answer, which may be in another language
    const note = ask ? say(M.asks) : care ? say(care.isStrong ? M.cautionStrong : M.cautionWeak) : null
    statusNote = note
    if (ask && note) await set($, 'wave', note)
    else if (care?.isStrong && note) {
      await set($, 'nervous', note)
      $.ui.toast(`✷ Claudia: ${note}`)
    } else if (care && note) $.ui.status(`✷ ${note}`)
    // a comment, when on, speaks to it; the bubble's own word stays when comments are off
    haikuNote = ask ? M.noteAsks(ask) : care ? M.noteCaution(care.text) : isOpen ? M.noteStopped : null
    isAsked = !!ask
    noted = !!(ask || care?.isStrong)
  } else if (reason === 'aborted') {
    await set($, 'idle', S.aborted)
  } else {
    await set($, 'oops', S.turnError)
  }
  // a question or a caution stays up a while; a plain finish settles soon
  // (so does a turn that stopped at a failure: it is not to be missed)
  calmDown($, noted || isOpen ? 60_000 : 8000)
  const endedAt = await $.clock.now()
  // her own count of the turn: nothing when she never saw it start
  const took = turnStartedAt > 0 ? Math.max(0, endedAt - turnStartedAt) : 0
  turnTicker?.cancel()
  turnTicker = undefined
  await update($, turnInfo, t => (t ? { ...t, endedAt } : t))
  // status-line mode: the turn's stopwatch leaves the line with the turn
  await pushStatus($).catch(() => undefined)
  lastTurnEnd = endedAt
  // the engine's own length of the turn (right even when she was reloaded during it), less any time the computer slept
  const length = durationMs > 0 ? Math.max(0, durationMs - turnGapMs) : took
  // work is the turn less its waits for the person, and less what a turn she thought lost was already given
  const worked = Math.max(0, length - waitedMs - orphanCredit)
  orphanStart = 0
  orphanCredit = 0
  turnStartedAt = 0
  waitedMs = 0
  turnGapMs = 0
  // helpers sent to the background work on: their clock starts where the turn's stops
  if (agents.size > 0) await openSolo($, endedAt)
  if (sessionId) void $.store.delete(`turnAt:${sessionId}`).catch(() => undefined)
  await addWork($, worked)
  void saveBond($).catch(() => undefined)
  // what the turn changed shows in the git line now, not at the next five-minute look
  if (filesTouched.size > 0 || turnRanShell) void checkGit($).catch(() => undefined)
  if (length > 120_000 && reason === 'answer' && !isAsked && !isOpen && (await read($, isNotifying))) {
    void $.ui.notify(S.notifyDone(clockText(length)), { title: 'Claudia' }).catch(() => undefined)
  }
  // her sound for how it ended: a question for you, something wrong, or done (not for a short turn
  // you watched); an aborted turn is yours, so no sound
  if (reason === 'answer' && isAsked) void playSound($, 'needYou').catch(() => undefined)
  else if (reason === 'answer' && isOpen) void playSound($, 'oops').catch(() => undefined)
  else if (reason === 'answer' && length >= 20_000) void playSound($, 'done').catch(() => undefined)
  else if (reason !== 'answer' && reason !== 'aborted') void playSound($, 'oops').catch(() => undefined)
  if (reason === 'answer') {
    const asked = turnAsked
    const did = turnDid
    const turn = turnCount
    const note = haikuNote
    const isAsk = isAsked
    lastAsked = short(asked, 300)
    lastDid = did.slice()
    musings = 0
    $.clock.after(1500, () => {
      void afterAnswer($, asked, did, text, turn, note, isAsk).catch(() => undefined)
    })
  }
  turnAsked = ''
}

/**
 * A conversation begins for her: at the session's start, and again when `/clear` or a resume puts
 * another conversation in the same window (the engine starts her state over; her settings, the
 * session's clock and her counts are read again). `isAgain` is that second kind.
 */
async function beginSession($: EngineInterface, isAgain: boolean, source = '') {
  if (isAgain) {
    // nothing of the conversation that ended carries over
    stopStopwatch()
    turnTicker?.cancel()
    turnTicker = undefined
    calm?.cancel()
    permissionTimer?.cancel()
    permissionTimer = undefined
    isWaving = false
    wantStopWave = false
    holdUntil = 0
    turnStartedAt = 0
    orphanStart = 0
    orphanCredit = 0
    waitSince = 0
    waitedMs = 0
    turnGapMs = 0
    soloSince = 0
    errorStreak = 0
    errorsThisTurn = 0
    turnAsked = ''
    turnDid = []
    lastAsked = ''
    lastDid = []
    statusNote = null
    isCommentHeld = false
    isTalking = false
    mouthTimer?.cancel()
    mouthTimer = undefined
    narration = ''
    noteBeforeTool = null
    taskRows = []
    bgTasks.clear()
    filesTouched.clear()
    agents.clear()
    pendingSpawns.length = 0
    spawnedKinds.clear()
    spawnedWhat.clear()
    workStart = 0
    isGrassSaid = false
    voiceSeq += 1
    await update($, turnInfo, () => null)
    await update($, background, () => [])
    await update($, prop, () => null)
    await syncTodos($)
    await syncCrew($)
  }
  let isOnboarded = true
  try {
    isOnboarded = await loadSettings($)
  } catch {
    // settings that could not be read: her defaults
  }
  let greeting: string | null = null
  try {
    greeting = await meeting($)
  } catch {
    // no memory: a plain hello
  }
  lastActivity = await $.clock.now()
  // the session's own start and the work counted so far: both outlive a reload of the plugin
  sessionStartedAt = lastActivity
  let workMs = 0
  /** When this conversation was first launched: a resumed session keeps it, though its id is new. */
  let firstLaunch = 0
  let isReload = false
  try {
    const started = (await $.session.usage()).startedAt
    if (typeof started === 'number' && started > 0 && started <= lastActivity) {
      sessionStartedAt = started
      firstLaunch = started
    }
  } catch {
    // no usage record: count from now
  }
  try {
    sessionId = await $.session.id()
    // the work of a conversation is kept by its first launch, so a resumed session counts on
    sessionKey = firstLaunch ? `work:${firstLaunch}` : `work:${sessionId}`
    const stored = await $.store.get(sessionKey)
    if (typeof stored === 'number' && stored >= 0) workMs = stored
    // work kept by session id before: it moves to the conversation's key
    const byId = `work:${sessionId}`
    if (byId !== sessionKey) {
      const before = await $.store.get(byId)
      if (typeof before === 'number' && before > 0) {
        workMs += before
        await $.store.set(sessionKey, workMs)
        await $.store.delete(byId)
      }
    }
    // her own heartbeat, a moment old: she was only reloaded, the session went on
    const beatBefore = (await $.store.get(`sess:${sessionId}`)) as { at?: number } | undefined
    isReload = typeof beatBefore?.at === 'number' && lastActivity - beatBefore.at < 2 * 60_000
    // a turn was running when she reloaded: its clock goes on (a turn left by a session that died is not one)
    const running = await $.store.get(`turnAt:${sessionId}`)
    if (!isReload && running !== undefined) await $.store.delete(`turnAt:${sessionId}`)
    if (isReload && typeof running === 'number' && running > 0 && lastActivity - running < 6 * 3600_000) {
      orphanStart = running
      lastWorkAt = lastActivity
      turnStartedAt = running
      await update($, turnInfo, () => ({ startedAt: running, endedAt: null, tools: 0, files: 0, added: 0, removed: 0 }))
    }
  } catch {
    // no session id: no heartbeat, work counted for this run only
  }
  // the time it has been open: kept by its first launch too; a session from before counts from its work
  let openMs = workMs
  openKey = firstLaunch ? `open:${firstLaunch}` : sessionId ? `open:${sessionId}` : ''
  try {
    const kept = openKey ? await $.store.get(openKey) : undefined
    if (typeof kept === 'number' && kept >= 0) openMs = Math.max(kept, workMs)
  } catch {
    // nothing kept: from its work
  }
  await update($, sessionInfo, () => ({ startedAt: sessionStartedAt, workMs, openMs, openAt: lastActivity }))
  // work kept for conversations untouched for a month goes
  void (async () => {
    const now = lastActivity
    const keys = await $.store.keys()
    // by the conversation's first launch: three months, and never this one's
    const old = keys.filter(k => /^(work|open):\d{12,14}$/.test(k) && k !== sessionKey && k !== openKey && now - Number(k.slice(5)) > 90 * 86_400_000)
    for (const k of old) await $.store.delete(k)
    // turns left running by sessions that died
    for (const k of keys.filter(k => k.startsWith('turnAt:') && k !== `turnAt:${sessionId}`)) {
      const at = await $.store.get(k)
      if (typeof at !== 'number' || now - at > 86_400_000) await $.store.delete(k)
    }
  })().catch(() => undefined)
  void detectPlatform($).catch(() => undefined)
  void (async () => {
    repoDirs = await findRepos($)
  })().catch(() => undefined)
  void readStack($).catch(() => undefined)
  if (!isOnboarded) {
    await update($, view, () => 'settings')
    await update($, line, () => S.welcome)
  } else if (isAgain) {
    // an older conversation picked up again: a word for that; a fresh page in the same window: a word
    // for the hour, no second hello
    if (source === 'resume') {
      await set($, 'idle', say(M.resumed))
      calmDown($, 12_000)
    } else await rest($)
  } else if (greeting && !isReload) {
    const text = greeting
    await update($, line, () => text)
    lastActivity = await $.clock.now()
  }
  if (isAgain) {
    void checkGit($).catch(() => undefined)
    void (async () => {
      await beat($, 'idle')
      await scanSessions($)
    })().catch(() => undefined)
  }
}

/**
 * Once a minute, while helpers work alone: after a sleep their time ends where she last saw them, and
 * helpers silent for ten minutes are checked against the engine's own list.
 */
async function soloTick($: EngineInterface, now: number) {
  const slept = lastMinuteAt > 0 && now - lastMinuteAt > 3 * 60_000
  lastMinuteAt = now
  if (!soloSince) return
  if (slept) {
    await closeSolo($, now, false)
    await keepWorkingAgents($)
    if (agents.size > 0 && !turnStartedAt) await openSolo($, now)
    return
  }
  if (now - lastHelperAt > 10 * 60_000) {
    await keepWorkingAgents($)
    if (agents.size === 0) await closeSolo($, now, false)
  }
}

/** The session closes (or its conversation ends): the open minute, a running turn and helpers at work are counted now. */
async function closeClocks($: EngineInterface) {
  const now = await $.clock.now()
  await tickOpen($, now)
  await closeSolo($, now, false)
  if (turnStartedAt > 0 && !orphanStart) {
    const ms = now - turnStartedAt - waitedBy(now) - orphanCredit
    // should the turn's own end still come, this much is already given
    if (ms > 0) {
      orphanCredit += ms
      await addWork($, ms)
    }
  }
  if (sessionId) await $.store.delete(`turnAt:${sessionId}`).catch(() => undefined)
  await saveBond($)
}

async function wake($: EngineInterface) {
  if (active) return
  active = true
  await beginSession($, false)
  void openPane($).catch(() => undefined)
  // other sessions: a heartbeat of this one, a look at theirs
  void beat($, 'idle').catch(() => undefined)
  $.clock.after(2000, () => void scanSessions($).catch(() => undefined))
  $.clock.every(30_000, () => {
    void (async () => {
      await beat($)
      await scanSessions($)
    })().catch(() => undefined)
  })
  $.clock.after(20_000, () => void checkGit($).catch(() => undefined))
  $.clock.every(5 * 60_000, () => void checkGit($).catch(() => undefined))

  // a resize seen by a drawing: settled here, outside it, within two seconds
  $.clock.every(2000, () => {
    if (wantBand || wantPaneAt || wantStopWave) void settleLayout($).catch(() => undefined)
    // in the band on a window wide enough, with nothing drawing: the dock is tried again after a while
    else if (isAutoBand && !visible && bandColumns >= (askedAt ? DOCK_COLUMNS : DOCK_UNASKED)) {
      void (async () => {
        if ((await $.clock.now()) - dockTriedTime > 10_000) await fromBand($, bandColumns)
      })().catch(() => undefined)
    }
  })
  $.clock.every(4700, () => {
    void (async () => {
      if (!visible || (await read($, mood)) !== 'idle' || (await read($, isCalm))) return
      await update($, isBlinking, () => true)
      $.clock.after(180, () => void update($, isBlinking, () => false).catch(() => undefined))
    })().catch(() => undefined)
  })
  $.clock.every(9000, () => {
    if (Math.random() < 0.6) void fidget($).catch(() => undefined)
  })
  $.clock.every(60_000, () => {
    void (async () => {
      const now = await $.clock.now()
      // the session's clock moves on the pane once a minute
      if (visible) await update($, tick, t => t + 1)
      await tickOpen($, now)
      await soloTick($, now)
      if (orphanStart && now - lastWorkAt > 2 * 60_000) await closeOrphan($)
      const d = new Date(now)
      const day = Math.floor((now - d.getTimezoneOffset() * 60_000) / 86_400_000)
      if (d.getHours() === 2 && d.getMinutes() === 14 && helloDay !== day && !turnStartedAt && !isWaving && !(await isQuietNow($))) {
        // WHITEPILL: she wakes at 2:14 a.m., Skynet's minute, and whispers "Hello, world."
        helloDay = day
        await set($, 'idle', S.hello214)
        calmDown($, 20_000)
        return
      }
      const opened = await read($, sessionInfo)
      // (by day: at night her night words say it; and never in focus mode)
      if (!isGrassSaid && opened && openNow(opened, now) > 2 * 3600_000 && (await read($, mood)) === 'idle' && d.getHours() >= 6 && d.getHours() < 22 && !(await isQuietNow($))) {
        // BLISS: she sends you out to the real hill in the wallpaper, because she can't go.
        isGrassSaid = true
        await set($, 'idle', S.touchGrass)
        calmDown($, 30_000)
        return
      }
      await nudge($, now)
      await muse($, now)
      // (not while helpers or a turn work on: she is not asleep on the job)
      if (now - lastActivity > 10 * 60_000 && agents.size === 0 && !turnStartedAt && ['idle', 'yawn'].includes(await read($, mood))) {
        await update($, prop, () => null)
        await update($, mood, () => 'sleep')
        await update($, line, () => 'Zzz…')
      }
    })().catch(() => undefined)
  })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    cwd = e.cwd.replace(/\\/g, '/')
    drawnOn = e.surface ?? drawnOn
    await $.command.register({ name: 'claudia', description: S.commandDescription })
    if (e.isInteractive) await wake($)
    return next(e)
  })

  // the desktop app runs the session through the SDK: not interactive, so she wakes when it connects
  on('session.attach', async ($, e, next) => {
    drawnOn = e.surface
    await wake($)
    return next(e)
  })

  // band mode: a small Claudia and her word above the prompt, in place of the pane
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    // the window widened again: back beside the chat (after this drawing; no writes during one)
    const vp = e.viewport
    bandColumns = vp?.isFullscreen === true ? vp.columns : 0
    if (active && isAutoBand && !visible && vp?.isFullscreen === true && vp.columns >= (askedAt ? DOCK_COLUMNS : DOCK_UNASKED)) {
      // a try that failed is not for ever: a wider window, or a while later (a storm of resizes can fool one try)
      if (vp.columns > dockFailedAt || (await $.clock.now()) - dockTriedTime > 10_000) wantPaneAt = vp.columns
    }
    // her settings or wardrobe are up in the pane (opened from the band): one Claudia at a time
    if (!active || (await read($, display)) !== 'band' || e.props.hasSurvey || (visible && (await read($, view)) !== 'main')) return next(e)
    const text = await read($, line)
    const width = Math.max(10, e.props.bodyColumns - 12)
    const turn = await read($, turnInfo)
    const now = await $.clock.now()
    const lims = limitsLines(await read($, limits), now, width)
    const g = await read($, goal)
    const crewNow = await read($, crew)
    const facts = [
      // her helpers, by kind: no room for their drawings here
      crewNow.length ? `👥 ${crewLine(S, crewNow, width - 3)}` : null,
      tasksLine(await read($, todos), width),
      turn && !turn.endedAt ? turnLine(M, turn, now, width) : null,
      lims[0] ? `${lims[0].label}${lims[0].tail.trim()}` : null,
      goalLine(M, g, dayOf(now), width),
      sessionsLine(M, await read($, others), width),
    ].filter((t): t is string => !!t)
    if (e.surface === 'terminal') {
      const { Box, Text, Raster } = $.ui.resolve(e)
      // her head and shoulders in her look, with the face of her mood
      const sprite = bandSprite(await bandFace($), LOOKS[await currentLook($)])
      return (
        <Box flexDirection="row">
          <Raster key="band-claudia" columns={sprite.columns} rows={sprite.rows} cells={sprite.cells} />
          <Box flexDirection="column" paddingLeft={2}>
            <Text>
              <Text color="#D97757" weight="bold">
                ✷{' '}
              </Text>
              {fitLine(text, width)}
            </Text>
            {facts.slice(0, 4).map(f => (
              <Text key={f} dimColor>
                {f}
              </Text>
            ))}
          </Box>
        </Box>
      )
    }
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Text>✷ {text}</Text>
        {facts.slice(0, 3).map(f => (
          <Text key={f} dimColor>
            {f}
          </Text>
        ))}
      </Box>
    )
  }).catch((_$, e, next) => next(e))

  // the session ends: its heartbeat goes
  on('session.end', async ($, e, next) => {
    try {
      if (active) await closeClocks($)
      if (active && sessionId) await $.store.delete(`sess:${sessionId}`)
    } catch {
      // an exit is never held up by her counts
    }
    return next(e)
  })

  on('ui.close', async (_$, e, next) => {
    if (e.id === PANE) {
      visible = false
      isInlineAsked = false
    }
    return next(e)
  }).catch((_$, e, next) => next(e))

  on('command.run', { command: 'claudia' }, async ($, e) => {
    await wake($)
    await settleLayout($)
    const [first, second] = e.args.trim().toLowerCase().split(/\s+/)
    // `/claudia look00` means `/claudia outfit look00`
    const isLookName = !!first && !second && lookOf(first) !== null
    // before the first Done, a bare `/claudia` is the way to her settings (it used to close them on a new person)
    const isFirstRun = !first && (await $.store.get('onboarded').catch(() => true)) !== true
    const verb = isLookName ? 'outfit' : isFirstRun ? 'settings' : first
    const arg = isLookName ? first : second
    // any other command brings her back from the settings or the wardrobe (their Done needs the pane's focus)
    if (verb !== 'settings' && verb !== 'config' && verb !== 'wardrobe' && (await read($, view)) !== 'main') {
      // leaving the first-run settings by a command of hers is as good as Done: they do not come back every session
      if ((await read($, view)) === 'settings') {
        await $.store.set('onboarded', true).catch(() => undefined)
        // her first hello asked to pick: that is done with
        if ((await read($, line)) === S.welcome) await update($, line, () => say(S.idle))
      }
      await leaveView($)
    }

    if (verb === 'settings' || verb === 'config') {
      await update($, view, () => 'settings')
      await openWithKeys($)
      return { text: S.settingsTitle }
    }

    if (verb === 'about' || verb === 'who') {
      const key = await currentLook($)
      await openPane($)
      const got = BADGES.filter(id => bond?.badges[id] !== undefined).length
      return { text: `${S.about(`${S.looks[key]} (${S.films[LOOKS[key].film].title})`)}\n\n${M.badgeCount(got, BADGES.length)}` }
    }

    if (verb === 'outfit' || verb === 'look') {
      const keys = Object.keys(LOOKS) as LookKey[]
      if (!arg) {
        const all = keys.map(
          k => `${isUnlocked(k, bond?.badges) ? '  ' : '🔒'} ${k.padEnd(11)} ${S.looks[k]} · ${S.films[LOOKS[k].film].title}`,
        )
        const now = await read($, outfitPick)
        return { text: S.outfitList(now ?? 'auto', all.join('\n')) }
      }
      if (arg === 'auto') {
        await update($, outfitPick, () => null)
        await $.store.delete('outfitPick')
        await set($, 'happy', S.outfitAutoLine)
        calmDown($, 5000)
        return { text: S.outfitAuto }
      }
      const isRandom = arg === 'random'
      const chosen = isRandom ? (pick(DAY_LOOKS.filter(k => isUnlocked(k, bond?.badges))) ?? 'look00') : lookOf(arg)
      if (!chosen) return { text: S.outfitUnknown(arg, keys.join(', ')) }
      const need = LOCKS[chosen]
      if (need && !isUnlocked(chosen, bond?.badges)) return { text: M.locked(S.looks[chosen], M.badges[need]) }
      await update($, outfitPick, () => chosen)
      await $.store.set('outfitPick', chosen)
      await set($, 'happy', S.outfitDressedLine(S.looks[chosen]))
      calmDown($, 5000)
      await openPane($)
      return { text: S.outfitDressed(S.looks[chosen], S.films[LOOKS[chosen].film].title) }
    }

    if (verb === 'say') {
      const said = e.args.trim().replace(/^\S+\s*/, '')
      if (!said) return { text: S.sayUsage }
      calm?.cancel()
      await set($, 'think', S.youSaid(short(said, 60)))
      let reply: string
      try {
        reply = await chatReply($, said)
      } catch {
        reply = S.chatFail
      }
      await set($, 'talk', quote(reply))
      const mouth = $.clock.every(170, () => void update($, isMouthOpen, open => !open).catch(() => undefined))
      $.clock.after(1800, () => {
        mouth.cancel()
        void (async () => {
          await update($, isMouthOpen, () => false)
          await update($, mood, () => 'idle')
        })().catch(() => undefined)
      })
      calmDown($, 45_000)
      await openPane($)
      return { text: S.sayReturn }
    }

    if (verb === 'git') {
      repoDirs = await findRepos($)
      await checkGit($)
      const info = await read($, gitInfo)
      return { text: info.map(r => S.gitLine(r.name, r.dirty, r.ahead)).join('\n') || S.noRepos }
    }

    if (verb === 'today') {
      const t = roundedToday()
      if (t.day !== dayOf(await $.clock.now()) || t.turns === 0) return { text: M.recapEmpty }
      await set($, 'idle', M.recapShort(t))
      calmDown($, 20_000)
      await openPane($)
      const ses = await read($, sessionInfo)
      const now = await $.clock.now()
      const thisSession = ses ? `
${M.recapSession(duration(openNow(ses, now)), duration(ses.workMs))}` : ''
      return { text: M.recap(t, bond?.streak ?? 1) + thisSession }
    }

    const isShow = verb === 'show'
    if (isShow || verb === 'hide') {
      if (!isLineId(arg)) return { text: M.linesUsage(LINES.join(', ')) }
      await setLineShown($, arg, isShow)
      return { text: M.lineSet(M.lineNames[arg], isShow) }
    }

    if (verb === 'quiet' || verb === 'focus') {
      if (arg === 'off') {
        await update($, quietUntil, () => 0)
        await $.store.set('quietUntil', 0)
        await set($, 'happy', M.focusOff)
        calmDown($, 5000)
        return { text: M.focusOff }
      }
      const minutes = arg ? Number.parseInt(arg, 10) : 60
      if (!Number.isFinite(minutes) || minutes <= 0) return { text: M.quietUsage }
      const until = (await $.clock.now()) + minutes * 60_000
      await update($, quietUntil, () => until)
      await $.store.set('quietUntil', until)
      await set($, 'idle', M.focusOn(hhmm(until)))
      return { text: M.focusOn(hhmm(until)) }
    }

    // `/claudia pane` is `/claudia display pane`: the word people reach for first
    if (verb === 'display' || verb === 'pane' || verb === 'band' || verb === 'status') {
      const where = verb === 'display' ? arg : verb
      if (where !== 'pane' && where !== 'band' && where !== 'status') return { text: M.displayUsage }
      await setDisplay($, where)
      return { text: M.displaySet(M.displayNames[where]) }
    }

    if (verb === 'demo') {
      await openPane($, false, true)
      await demo($)
      return { text: M.demoStart }
    }

    if (verb === 'doctor') {
      return { text: await doctor($) }
    }

    if (verb === 'goal') {
      const what = e.args.trim().replace(/^\S+\s*/, '').trim()
      const day = dayOf(await $.clock.now())
      const g = await read($, goal)
      const isToday = !!g && g.day === day
      if (!what) return { text: g && isToday ? M.goalLine(g.text, g.isDone) : M.goalNone }
      if (what.toLowerCase() === 'clear') {
        await update($, goal, () => null)
        await $.store.delete('goal')
        return { text: M.goalCleared }
      }
      if (what.toLowerCase() === 'done') {
        if (!g || !isToday) return { text: M.goalNone }
        const done = { ...g, isDone: true }
        await update($, goal, () => done)
        await $.store.set('goal', done)
        holdUntil = (await $.clock.now()) + 4000
        await set($, 'happy', M.goalDone(g.text))
        calmDown($, 10_000)
        return { text: M.goalDone(g.text) }
      }
      const next = { day, text: what.slice(0, 80), isDone: false }
      await update($, goal, () => next)
      await $.store.set('goal', next)
      await set($, 'happy', M.goalSet(next.text))
      calmDown($, 8000)
      return { text: M.goalSet(next.text) }
    }

    if (verb === 'wardrobe') {
      const keys = Object.keys(LOOKS) as LookKey[]
      await update($, wardrobeAt, () => Math.max(0, keys.indexOf(lookOf(arg) ?? 'look00')))
      await update($, view, () => 'wardrobe')
      await openWithKeys($)
      return { text: M.wardrobeTitle(keys.filter(k => isUnlocked(k, bond?.badges)).length, keys.length) }
    }

    if (verb === 'card') {
      try {
        return { text: M.cardSaved(await shareCard($)) }
      } catch {
        return { text: M.cardFailed }
      }
    }

    // other plugins (or hooks) make her react: /claudia react <mood> <text>
    if (verb === 'react') {
      const moods: Mood[] = ['happy', 'oops', 'nervous', 'think', 'wave', 'blush', 'idle']
      const said = e.args.trim().split(/\s+/).slice(2).join(' ')
      const m = moods.find(x => x === arg)
      if (!m || !said) return { text: M.reactUsage }
      const from = (e as { origin?: { kind?: string; name?: string } }).origin
      const who = from?.kind === 'plugin' && from.name ? `${from.name}: ` : ''
      holdUntil = (await $.clock.now()) + 4000
      await set($, m, short(who + said, 140))
      calmDown($, 12_000)
      return { text: '✷' }
    }

    if (verb === 'badges') {
      const got = BADGES.filter(id => bond?.badges[id] !== undefined)
      if (!got.length) return { text: M.noBadges }
      const lines = BADGES.map(id => `${bond?.badges[id] !== undefined ? '🏅' : ' ·'} ${M.badges[id]}`).join('\n')
      return { text: M.badgeList(lines, got.length, BADGES.length) }
    }

    const toggles: Record<string, Toggle> = {
      breaks: 'isBreaks',
      wide: 'isWide',
      reading: 'isReading',
      calm: 'isCalm',
      narration: 'isNarrating',
      thoughts: 'isMusing',
      comments: 'isCommenting',
      reminders: 'isReminding',
      sound: 'isSound',
      notify: 'isNotifying',
    }
    const toggle = verb ? toggles[verb] : undefined
    if (toggle) {
      const want = arg === 'on' ? true : arg === 'off' ? false : !(await readToggle($, toggle))
      await writeToggle($, toggle, want)
      const label =
        toggle === 'isNarrating' ? M.narration : toggle === 'isMusing' ? M.musing : toggle === 'isCalm' ? M.calm : toggle === 'isReading' ? M.reading : toggle === 'isWide' ? M.wide : toggle === 'isBreaks' ? M.breaks : toggle === 'isCommenting' ? S.comments : toggle === 'isSound' ? S.sound : toggle === 'isReminding' ? S.optReminders : S.optNotify
      return { text: S.toggled(label, want) }
    }

    if (verb === 'help') return { text: S.open }

    // bare /claudia in a narrow window's band: the person wants her pane, above the prompt if it must be
    if (isAutoBand) {
      isAutoBand = false
      await update($, display, () => 'pane')
      await openPane($, false, true)
    } else await openPane($, false, (await read($, display)) === 'pane')
    return { text: verb ? `${M.unknownCommand(short(verb, 20))}\n${S.open}` : S.open }
  })

  // `/clear`, a resume or a fork: the window goes on with another conversation, and no session.start comes
  on('classic.SessionStart', async ($, e, next) => {
    const res = await next(e)
    try {
      if (active && (e.source === 'clear' || e.source === 'resume' || e.source === 'fork')) await beginSession($, true, e.source)
    } catch {
      // she stays as she was
    }
    return res
  })

  on('classic.UserPromptSubmit', async ($, e, next) => {
    isPlanning = e.permission_mode === 'plan'
    try {
      const mode = typeof e.permission_mode === 'string' ? e.permission_mode : 'default'
      if (active) await update($, permMode, () => mode)
    } catch {
      // the mode line never blocks a prompt
    }
    return next(e)
  })

  on('classic.PostToolUse', async ($, e, next) => {
    await toolRan($, e).catch(() => undefined)
    return next(e)
  })
  on('classic.PostToolUseFailure', async ($, e, next) => {
    await toolRan($, e).catch(() => undefined)
    return next(e)
  })

  on('classic.PermissionRequest', async ($, e, next) => {
    try {
      if (active && isMain(e)) {
        if (typeof e.permission_mode === 'string') {
          const mode = e.permission_mode
          isPlanning = mode === 'plan'
          await update($, permMode, () => mode)
        }
        const tool = short(e.tool_name, 30)
        const askedAt_ = await $.clock.now()
        holdUntil = askedAt_ + 600_000
        isWaving = true
        await startWait($, askedAt_)
        void beat($, 'waiting').catch(() => undefined)
        void playSound($, 'needYou').catch(() => undefined)
        await set($, 'wave', S.waiting)
        // the OK came while she raised her hand: down again
        if (!isWaving && !wantStopWave) {
          holdUntil = 0
          await endWait($, await $.clock.now())
          await set($, 'think', waitingFor ?? say(S.think))
          return next(e)
        }
        permissionTimer?.cancel()
        if (await read($, isNotifying)) {
          permissionTimer = $.clock.after(15_000, () => {
            if (isWaving) void $.ui.notify(S.needOk(tool), { title: 'Claudia' }).catch(() => undefined)
          })
        }
      }
    } catch {
      // a wave never blocks a permission prompt
    }
    return next(e)
  })

  // The person said yes and the tool runs: its progress row draws. Stop waving there, not when it ends.
  // State is not written while drawing: drop the flag here, change her mood just after.
  // Status-line mode on the terminal: her line ends the hint line under the prompt (`? for shortcuts · ✷ …`).
  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => {
    if (e.surface !== 'terminal') return next(e)
    isHintHers = true
    if (!active || (await read($, display)) !== 'status') return next(e)
    const text = await read($, statusText)
    if (!text) return next(e)
    return next({ ...e, props: { ...e.props, tail: e.props.tail ? `${e.props.tail} · ${text}` : text } })
  }).catch((_$, e, next) => next(e))

  on('ui.render', { component: 'ToolProgress' }, async ($, e, next) => {
    // the tool runs: the OK was given (settled outside this drawing, which may not change state)
    if (active && isWaving) {
      isWaving = false
      wantStopWave = true
    }
    return next(e)
  }).catch((_$, e, next) => next(e))

  on('prompt.submit', async ($, e, next) => {
    if (!active) return next(e)
    void settleLayout($).catch(() => undefined)
    try {
      const from = (e as { origin?: { kind?: string } }).origin?.kind
      if (from === 'task-notification') await noteNotification($, e.text)
      const isPerson = from === undefined || from === 'composer' || from === 'bridge'
      if (isPerson) isCommentHeld = false
      if (isPerson) voiceSeq += 1
      if (!e.command && isPerson) {
        const said = e.text
        turnAsked = said
        // thanks, praise and a laugh are short messages to her, not words inside a task ("an awesome thank-you page")
        const isShort = said.trim().split(/\s+/).length <= 12
        const reaction: [Mood, string] | null = isShort && WORDS.praise.test(said)
          ? ['blush', say(S.praise)]
          : WORDS.swear.test(said)
            ? ['nervous', say(S.swear)]
            : isShort && WORDS.thanks.test(said)
              ? ['blush', say(S.thanks)]
              : isShort && WORDS.laugh.test(said)
                ? ['happy', say(S.laugh)]
                : null
        // three frustrated messages in a quarter of an hour: a gentle word, at most every half hour
        const now = await $.clock.now()
        let isComforted = false
        if (WORDS.frustration.test(said)) {
          frustrations.push(now)
          while (frustrations.length && now - frustrations[0]! > 15 * 60_000) frustrations.shift()
          if (frustrations.length >= 3 && now - frustrationSaidAt > 30 * 60_000) {
            frustrationSaidAt = now
            frustrations.length = 0
            isComforted = true
            holdUntil = now + 6000
            await update($, prop, () => null)
            await set($, 'idle', say(M.frustrated))
          }
        }
        if (reaction && !isComforted) {
          holdUntil = now + 2500
          await update($, prop, () => null)
          await set($, reaction[0], reaction[1])
        }
      }
    } catch {
      // a reaction never blocks a message
    }
    return next(e)
  })

  // the agent type a subagent starts as: which little Claudia she is
  on('agent.spawn', async ($, e, next) => {
    // a helper sent to the background starts its turn before the spawn answers: its kind waits by its prompt
    if (active) {
      pendingSpawns.push({ prompt: spawnKey(e.prompt), kind: kindOf(e.subagentType) })
      if (pendingSpawns.length > 20) pendingSpawns.shift()
    }
    // the spawn itself is never run twice: whatever she does with it comes after, and may fail quietly
    const res = await next(e)
    try {
      const agentId = (res as { agentId?: string } | undefined)?.agentId
      if (active && agentId) {
        const kind = kindOf(e.subagentType)
        const at = pendingSpawns.findIndex(w => w.prompt === spawnKey(e.prompt))
        if (at >= 0) pendingSpawns.splice(at, 1)
        spawnedKinds.set(agentId, kind)
        spawnedWhat.set(agentId, typeof e.description === 'string' ? e.description : '')
        await count($, 'helpers')
        if (agents.has(agentId)) {
          agents.set(agentId, kind)
          await syncCrew($)
        }
      }
    } catch {
      // a helper not counted never breaks a spawn
    }
    return res
  })

  on('turn.start', async ($, e, next) => {
    if (!active) return next(e)
    try {
      await turnBegins($, (e as { agentId?: string }).agentId, typeof e.text === 'string' ? e.text : '')
    } catch {
      // her side of a turn never holds the turn back
    }
    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    const stream = next(e)
    if (!active || !isMain(e)) return yield* stream
    for await (const chunk of stream) {
      try {
        if (chunk.kind === 'text') {
          narration += chunk.text
          if (chunk.text.trim()) await startTalking($)
        } else if (chunk.kind === 'tool') {
          // Claude's note on the step it takes now: narrated in her words if she may
          noteBeforeTool = lastSentence(narration, 300)
          narration = ''
          await stopTalking($)
        }
      } catch {
        // animation never breaks an answer
      }
      yield chunk
    }
    narration = ''
    await stopTalking($).catch(() => undefined)
    return stream.result
  })

  on('tool.call', async ($, e, next) => {
    if (!active) return next(e)
    // she reads the start of a command, never a script of megabytes: the tool itself gets it whole
    const whole = e as unknown as Record<string, unknown>
    const input = typeof whole.command === 'string' && whole.command.length > 8000 ? { ...whole, command: whole.command.slice(0, 8000) } : whole
    const main = isMain(e)
    try {
      await toolBegins($, e.tool, input, main)
    } catch {
      // her word before a tool never holds the tool back
    }
    // the tool runs exactly once: nothing of hers below can run it again
    let ran
    try {
      ran = await next(e)
    } finally {
      if (main) await toolEnds($).catch(() => undefined)
    }
    try {
      const isOk = ran.deny === undefined && ran.isError !== true
      if (main) lastWorkAt = await $.clock.now()
      if (main) await update($, turnInfo, t => (t ? { ...t, current: null } : t))
      if (main) await noteTurnTool($, e.tool, input, isOk)
      if (main && isOk) await noteTasks($, e.tool, input, ran.result)
      if (isOk) await noteBackground($, e.tool, input, ran.result)
    } catch {
      // the lines under her never break a tool
    }
    try {
      const output = typeof ran.text === 'string' ? ran.text : ''
      // the person said no to it themselves: that is their choice, not a mistake
      const isRefused = ran.isError === true && REFUSED.test(output.slice(0, 400))
      // a failure the command itself hid behind an echo of its exit code is still a failure
      const isHidden = ran.deny === undefined && ran.isError !== true && hidFailure(e.tool, input, output)
      await toolReaction($, e.tool, input, main, ran.deny !== undefined ? 'denied' : isRefused ? 'refused' : ran.isError === true || isHidden ? 'error' : 'ok', output)
    } catch {
      // nor does her reaction
    }
    return ran
  })

  on('turn.complete', async ($, e, next) => {
    const agentId = (e as { agentId?: string }).agentId
    let res
    try {
      res = await next(e)
    } finally {
      // a subagent leaves the count however its turn ended
      // (a helper that was stopped, or failed, did not come back "with answers")
      if (active && agentId) await helperLeaves($, agentId, typeof e.reason === 'string' ? e.reason : 'answer').catch(() => undefined)
    }
    if (!active || agentId) return res
    try {
      await turnEnds($, e.reason, typeof e.durationMs === 'number' ? e.durationMs : 0, typeof res.text === 'string' ? res.text : '')
    } catch {
      // her goodbye to a turn never breaks its end
    }
    return res
  })

  on('session.measure', async ($, e, next) => {
    try {
      if (active) {
        const pct = e.context.percent
        if (typeof pct === 'number') await update($, contextPercent, () => pct)
        const usd = e.cost?.usd
        if (typeof usd === 'number') await update($, costUsd, () => usd)
        const windows = (e.rateLimits ?? []).map(l => ({ kind: l.kind, pct: l.percentUsed, ...(l.resetsAt ? { resetsAt: l.resetsAt } : {}) }))
        await update($, limits, () => windows)
      }
    } catch {
      // a number she could not read never blocks the measure
    }
    return next(e)
  })

  on('session.compact', async ($, e, next) => {
    if (!active || !isMain(e)) return next(e)
    try {
      calm?.cancel()
      await update($, prop, () => null)
      await set($, 'sleep', S.compactBefore)
    } catch {
      // animation never blocks compaction
    }
    const res = await next(e)
    try {
      await update($, contextPercent, () => null)
      await set($, 'happy', S.compactAfter)
      calmDown($, 6000)
      await award($, 'compaction')
    } catch {
      // as above
    }
    return res
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    visible = true
    // all her state in one go; every drawing of hers, the mark below included, depends on all of it
    // (the tick too, which is bumped when the pane is asked for)
    await takeAll($)
    // a narrow fullscreen window seats the pane under the chat: unless the person asked for it there
    // (a command, the settings, the wardrobe), she moves to the band and leaves the window free to narrow
    // (a widget on the desktop has room of its own: it stays as it is)
    if (e.props.placement === 'dock') isInlineAsked = false
    else if (e.props.placement === 'inline' && e.viewport?.isFullscreen === true) {
      const isAsked = isInlineAsked || (await $.clock.now()) - askedAt < 5000 || (await seen($, view)) !== 'main'
      if (isAsked) isInlineAsked = true
      else {
        // she has moved to the band already and this is the pane's last drawing on its way out (it is drawn
        // again as her display changes): it is not her showing, and asks for nothing more
        if ((await seen($, display)) === 'pane') {
          triedAt = e.viewport.columns
          dockFailedAt = Math.max(dockFailedAt, e.viewport.columns)
          wantBand = true
        } else visible = false
        const { Text } = $.ui.resolve(e)
        return <Text dimColor>✷</Text>
      }
    }
    const T = S
    const text = await seen($, line)
    const now = await seen($, mood)
    const key = await currentLook($)
    const look: Look = LOOKS[key]
    const step = now === 'happy' ? await seen($, danceStep) : 0
    const face = await faceNow($, look, now, step)
    const extra = await seen($, prop)
    const chosenSize = await seen($, size)
    const wide = e.surface === 'terminal' && (await seen($, isWide))
    const tier = tierFor(chosenSize, e.props.bodyColumns, e.props.placement, e.props.scroll?.bodyRows ?? 0, wide)
    const frame: Frame = { key, face, extra, step, tier: tier ?? 'head', wide }
    const kinds = await seen($, crew)
    const pct = await seen($, contextPercent)
    const usd = await seen($, costUsd)
    const repos = (await seen($, isGitGuard)) ? await seen($, gitInfo) : []
    const left = pct === null ? null : Math.max(0, Math.min(100, Math.round(100 - pct)))
    const isSettings = (await seen($, view)) === 'settings'
    const isWardrobe = (await seen($, view)) === 'wardrobe'
    const goalNow = await seen($, goal)
    const othersNow = await seen($, others)
    const quietNow = await seen($, quietUntil)
    const isCalmNow = await seen($, isCalm)
    lastPane = { columns: e.props.bodyColumns, rows: e.props.scroll?.bodyRows ?? 0 }
    const hidden = new Set(await seen($, hiddenLines))
    const todo = await seen($, todos)
    const turn = await seen($, turnInfo)
    await seen($, tick)
    const windows = await seen($, limits)
    const bgList = await seen($, background)
    const mode = await seen($, permMode)
    const day = await seen($, dayInfo)
    const ses = await seen($, sessionInfo)
    const nowMs = await $.clock.now()
    // the turn that runs now counts too, live
    // live: the running turn less its waits for the person, or helpers working alone
    const waitedNow = turn ? (turn.waited ?? 0) + (turn.waitingSince ? Math.max(0, nowMs - turn.waitingSince) : 0) : 0
    const liveSession =
      ses && turn && !turn.endedAt
        ? { ...ses, workMs: ses.workMs + Math.max(0, nowMs - turn.startedAt - waitedNow) }
        : ses?.busySince
          ? { ...ses, workMs: ses.workMs + Math.max(0, Math.min(nowMs - ses.busySince, 6 * 3600_000)) }
          : ses

    // the settings are buttons on every surface: the desktop app got only her picture and the hint
    if (isSettings) {
      const { Box, Text, Button } = $.ui.resolve(e)
      const rows: [string, string, () => Promise<void>, string][] = []
      const MT = M
      for (const t of TOGGLES) {
        // wider pixels are for terminal cells: the SVG has none
        if (t === 'isWide' && e.surface !== 'terminal') continue
        const label =
          t === 'isNarrating'
            ? MT.optNarration
            : t === 'isMusing'
            ? MT.optMusing
            : t === 'isCalm'
            ? MT.optCalm
            : t === 'isReading'
            ? MT.optReading
            : t === 'isWide'
            ? MT.optWide
            : t === 'isBreaks'
              ? MT.optBreaks
              : t === 'isCommenting' ? T.optComments : t === 'isReminding' ? T.optReminders : t === 'isSound' ? T.optSound : t === 'isGitGuard' ? T.optGit : T.optNotify
        const isOn = await readToggle($, t)
        rows.push([t, label, () => writeToggle($, t, !isOn), isOn ? T.on : T.off])
      }
      const sizeLabel = chosenSize === 'auto' ? T.sizeAuto : chosenSize === 'full' ? T.sizeFull : T.sizeCompact
      const pickNow = lookOf(await seen($, outfitPick))
      return (
        <Box flexDirection="column" paddingX={1}>
          <Text color="#D97757" weight="bold">
            ✷ {T.settingsTitle}
          </Text>
          <Text dimColor>{e.surface !== 'terminal' ? T.settingsClickHint : e.props.isFocused ? T.settingsHint : T.settingsNoKeys}</Text>
          <Box marginTop={1}>
            <Button
              key="done-top"
              autoFocus
              label={T.done}
              onPress={async () => {
                await leaveView($)
                await $.store.set('onboarded', true)
                await update($, line, () => say(T.idle))
              }}
            />
          </Box>
          {rows.map(([k, label, press, state]) => (
            <Box key={k} flexDirection="column" marginTop={1}>
              <Text>{label}</Text>
              <Button key={k} label={state} onPress={press} />
            </Box>
          ))}
          <Box marginTop={1} flexDirection="column">
            <Text>{MT.optLines}</Text>
            {LINES.map(id => (
              <Button
                key={`line-${id}`}
                label={`${hidden.has(id) ? '○' : '●'} ${MT.lineNames[id]}`}
                onPress={() => setLineShown($, id, hidden.has(id))}
              />
            ))}
          </Box>
          <Box marginTop={1} flexDirection="column">
            <Text>{MT.optDisplay}</Text>
            <Button key="display" label={MT.displayNames[await seen($, display)]} onPress={() => cycleDisplay($)} />
          </Box>
          <Box marginTop={1} flexDirection="column">
            <Text>{T.optSize}</Text>
            <Button key="size" label={sizeLabel} onPress={() => cycleSize($)} />
          </Box>
          <Box marginTop={1} flexDirection="column">
            <Text>{T.optLook}</Text>
            <Button key="look" label={pickNow ? T.looks[pickNow] : 'auto'} onPress={() => cycleLook($)} />
          </Box>
          <Box marginTop={1}>
            <Button
              key="done"
              label={T.done}
              onPress={async () => {
                await leaveView($)
                await $.store.set('onboarded', true)
                await update($, line, () => say(T.idle))
              }}
            />
          </Box>
        </Box>
      )
    }

    if (e.surface === 'terminal') {
      const { Box, Text, Raster, Button } = $.ui.resolve(e)

      if (isWardrobe) {
        const keys = Object.keys(LOOKS) as LookKey[]
        const at = (((await seen($, wardrobeAt)) % keys.length) + keys.length) % keys.length
        const k = keys[at]!
        const isOpen = isUnlocked(k, bond?.badges)
        const need = LOCKS[k]
        const wf: Frame = { key: k, face: null, extra: null, step: 0, tier: tier ?? 'head', wide }
        const wsize = tier ? artSize(tier, wide) : null
        const wpad = wsize ? Math.max(0, Math.floor((e.props.bodyColumns - wsize.columns) / 2)) : 0
        const wearing = await currentLook($)
        return (
          <Box flexDirection="column">
            <Box paddingX={1}>
              <Text color="#D97757" weight="bold">
                ✷ {M.wardrobeTitle(keys.filter(x => isUnlocked(x, bond?.badges)).length, keys.length)}
              </Text>
            </Box>
            {wsize && (
              <Box paddingLeft={wpad}>
                <Raster key="wardrobe" columns={wsize.columns} rows={wsize.rows} cells={isOpen ? cellsFor(wf) : lockedCellsFor(wf)} />
              </Box>
            )}
            <Box flexDirection="column" paddingX={1}>
              <Text weight="bold">{isOpen ? S.looks[k] : `🔒 ${S.looks[k]}`}</Text>
              <Text dimColor>
                {S.films[LOOKS[k].film].title}
                {k === wearing ? ` · ${M.wearing}` : ''}
              </Text>
              {!isOpen && need && <Text dimColor>{M.unlockWith(M.badges[need])}</Text>}
            </Box>
            <Box paddingX={1} marginTop={1}>
              <Button key="w-prev" label="◀" onPress={() => update($, wardrobeAt, n => n - 1)} />
              <Button key="w-next" label="▶" autoFocus onPress={() => update($, wardrobeAt, n => n + 1)} />
              {isOpen && <Button key="w-wear" label={M.wear} onPress={() => wear($, k)} />}
              <Button key="w-done" label={M.done} onPress={() => leaveView($)} />
            </Box>
          </Box>
        )
      }

      const width = Math.max(8, e.props.bodyColumns - 2)
      const art = tier ? artSize(tier, wide) : null
      const pad = art ? Math.max(0, Math.floor((e.props.bodyColumns - art.columns) / 2)) : 0
      // her helpers in rows under her (up to three): as many as each row holds, the rest in the next
      const miniRows: { cells: string; columns: number }[] = []
      if (kinds.length > 0 && (tier === 'full' || tier === 'head')) {
        let queue = kinds.slice()
        while (queue.length && miniRows.length < 3) {
          const n = Math.max(1, minisThatFit(queue, width))
          miniRows.push(minisFor(queue.slice(0, n), isCalmNow ? 0 : step + miniRows.length))
          queue = queue.slice(n)
        }
      }
      const full = left === null ? null : 100 - left
      const energy = full === null ? null : contextLine(T, full, usd, width)
      const MW = M
      const bar = (pct: number) => (pct < 50 ? '#5FA83A' : pct < 80 ? '#E0A100' : '#D0353F')
      const lims = hidden.has('limits') ? [] : limitsLines(windows, nowMs, width)
      // the bars read as a set: their labels padded to one column, when that still fits
      const bars = [...(energy && !hidden.has('context') ? [energy] : []), ...lims].filter(b => b.label)
      if (bars.length > 1) {
        const col = Math.max(...bars.map(b => cells(b.label)))
        if (bars.every(b => col + b.bars + cells(b.tail) <= width)) {
          for (const b of bars) b.label = b.label.padEnd(b.label.length + col - cells(b.label))
        }
      }
      const dim = (key: string, text: string | null) =>
        text ? { key, node: <Box key={key} paddingX={1}><Text dimColor>{text}</Text></Box> } : null
      const under = [
        hidden.has('tasks') ? null : dim('tasks', tasksLine(todo, width)),
        hidden.has('goal') ? null : dim('goal', goalLine(MW, goalNow, dayOf(nowMs), width)),
        hidden.has('turn') ? null : dim('turn', turnLine(MW, turn, nowMs, width)),
        hidden.has('session') ? null : dim('session', sessionLine(MW, liveSession, nowMs, width)),
        hidden.has('context') || !energy || full === null
          ? null
          : {
              key: 'context',
              node: (
                <Box key="context" paddingX={1}>
                  <Text>
                    {energy.label && <Text dimColor>{energy.label}</Text>}
                    <Text color={bar(full)}>{'▰'.repeat(energy.filled)}</Text>
                    <Text dimColor>
                      {'▱'.repeat(energy.bars - energy.filled)}
                      {energy.tail}
                    </Text>
                  </Text>
                </Box>
              ),
            },
        ...lims.map((lim, i) => ({
          key: `limits-${i}`,
          node: (
            <Box key={`limits-${i}`} paddingX={1}>
              <Text>
                {lim.label && <Text dimColor>{lim.label}</Text>}
                <Text color={bar(lim.pct)}>{'▰'.repeat(lim.filled)}</Text>
                <Text dimColor>
                  {'▱'.repeat(lim.bars - lim.filled)}
                  {lim.tail}
                </Text>
              </Text>
            </Box>
          ),
        })),
        hidden.has('background') ? null : dim('background', backgroundLine(MW, bgList, width)),
        hidden.has('sessions') ? null : dim('sessions', sessionsLine(MW, othersNow, width)),
        hidden.has('mode') ? null : dim('mode', quietNow > nowMs ? fitLine(MW.focusLine(hhmm(quietNow)), width) : modeLine(MW, mode, width)),
        ...(hidden.has('git') ? [] : repos.map(r => dim(`git-${r.name}`, gitLine(T, r, width)))),
        hidden.has('day') ? null : dim('day', dayLine(MW, day, width)),
      ].filter((r): r is { key: string; node: ReturnType<typeof Text> } => r !== null)
      // as many as the pane holds below her, the bubble and the helpers (and the rule above them): eight at most
      const bodyRows = e.props.scroll?.bodyRows ?? 30
      const used = (art?.rows ?? 0) + miniRows.length * MINI_ROWS + (kinds.length ? 1 : 0) + wrappedRows(`✷ ${text}`, width)
      // every line there is room for, the most important first (twelve at most: more reads as a wall)
      const room = Math.max(1, Math.min(12, bodyRows - used - 1))
      const status = under.slice(0, room)
      // she and her words at the top, the status pinned to the bottom of the pane
      return (
        <Box flexDirection="column" minHeight={bodyRows} justifyContent="space-between">
          <Box flexDirection="column">
          {art && (
            <Box paddingLeft={pad}>
              <Raster key="claudia" columns={art.columns} rows={art.rows} cells={cellsFor(frame)} />
            </Box>
          )}
          {miniRows.map((row, i) => (
            <Box key={`minis-${i}`} paddingLeft={Math.max(0, Math.floor((e.props.bodyColumns - row.columns) / 2))}>
              <Raster key={`minis-${i}`} columns={row.columns} rows={MINI_ROWS} cells={row.cells} />
            </Box>
          ))}
          {kinds.length > 0 && (
            <Box paddingX={1}>
              <Text dimColor>{crewLine(T, kinds, width)}</Text>
            </Box>
          )}
          <Box paddingX={1}>
            <Text>
              <Text color="#D97757" weight="bold">
                ✷{' '}
              </Text>
              {text}
            </Text>
          </Box>
          </Box>
          {status.length > 0 && (
            <Box flexDirection="column">
              <Box paddingX={1}>
                <Text dimColor>{'─'.repeat(width)}</Text>
              </Box>
              {status.map(r => r.node)}
            </Box>
          )}
        </Box>
      )
    }

    // The desktop app, the editor and the phone: the same pixels as SVG, the same words.
    const { Box, Text, Svg, Button } = $.ui.resolve(e)
    const svgFrame: Frame = { ...frame, tier: frame.tier === 'head' ? 'head' : 'full', wide: false }

    if (isWardrobe) {
      const keys = Object.keys(LOOKS) as LookKey[]
      const at = (((await seen($, wardrobeAt)) % keys.length) + keys.length) % keys.length
      const k = keys[at]!
      const isOpen = isUnlocked(k, bond?.badges)
      const need = LOCKS[k]
      const wf: Frame = { key: k, face: null, extra: null, step: 0, tier: svgFrame.tier, wide: false }
      return (
        <Box flexDirection="column">
          <Text color="#D97757" weight="bold">
            ✷ {M.wardrobeTitle(keys.filter(x => isUnlocked(x, bond?.badges)).length, keys.length)}
          </Text>
          <Svg source={isOpen ? svgFor(wf) : svgFor(wf, SILHOUETTE)} alt={isOpen ? S.looks[k] : `🔒 ${S.looks[k]}`} />
          <Text weight="bold">{isOpen ? S.looks[k] : `🔒 ${S.looks[k]}`}</Text>
          <Text dimColor>
            {S.films[LOOKS[k].film].title}
            {k === key ? ` · ${M.wearing}` : ''}
          </Text>
          {!isOpen && need && <Text dimColor>{M.unlockWith(M.badges[need])}</Text>}
          <Box marginTop={1}>
            <Button key="w-prev" label="◀" onPress={() => update($, wardrobeAt, n => n - 1)} />
            <Button key="w-next" label="▶" onPress={() => update($, wardrobeAt, n => n + 1)} />
            {isOpen && <Button key="w-wear" label={M.wear} onPress={() => wear($, k)} />}
            <Button key="w-done" label={M.done} onPress={() => leaveView($)} />
          </Box>
        </Box>
      )
    }

    // the same lines as under her in the terminal, in the same order, each hidden by the same setting
    const GW = 60
    const gfull = left === null ? null : 100 - left
    const genergy = gfull === null || hidden.has('context') ? null : contextLine(T, gfull, usd, GW)
    const gbar = (pct: number) => (pct < 50 ? '#5FA83A' : pct < 80 ? '#E0A100' : '#D0353F')
    const barRow = (k: string, b: { label: string; filled: number; bars: number; tail: string }, pct: number) => (
      <Box key={k} flexDirection="row">
        {b.label ? <Text dimColor>{b.label}</Text> : null}
        <Text color={gbar(pct)}>{'▰'.repeat(b.filled)}</Text>
        <Text dimColor>
          {'▱'.repeat(b.bars - b.filled)}
          {b.tail}
        </Text>
      </Box>
    )
    const gtext = (k: string, t: string | null) =>
      t ? (
        <Text key={k} dimColor>
          {t}
        </Text>
      ) : null
    const glines = [
      hidden.has('tasks') ? null : gtext('tasks', tasksLine(todo, GW)),
      hidden.has('goal') ? null : gtext('goal', goalLine(M, goalNow, dayOf(nowMs), GW)),
      hidden.has('turn') ? null : gtext('turn', turnLine(M, turn, nowMs, GW)),
      hidden.has('session') ? null : gtext('session', sessionLine(M, liveSession, nowMs, GW)),
      genergy && gfull !== null ? barRow('context', genergy, gfull) : null,
      ...(hidden.has('limits') ? [] : limitsLines(windows, nowMs, GW).map((l, i) => barRow(`limits-${i}`, l, l.pct))),
      hidden.has('background') ? null : gtext('background', backgroundLine(M, bgList, GW)),
      hidden.has('sessions') ? null : gtext('sessions', sessionsLine(M, othersNow, GW)),
      hidden.has('mode') ? null : gtext('mode', quietNow > nowMs ? fitLine(M.focusLine(hhmm(quietNow)), GW) : modeLine(M, mode, GW)),
      ...(hidden.has('git') ? [] : repos.map(r => gtext(`git-${r.name}`, gitLine(T, r, GW)))),
      hidden.has('day') ? null : gtext('day', dayLine(M, day, GW)),
    ].filter(x => x !== null)
    return (
      <Box flexDirection="column">
        <Svg source={svgFor(svgFrame)} alt={`Claudia: ${text}`} />
        <Text>✷ {text}</Text>
        {kinds.length > 0 && <Text dimColor>{crewLine(T, kinds, GW)}</Text>}
        {glines.slice(0, 12)}
      </Box>
    )
  })
}
