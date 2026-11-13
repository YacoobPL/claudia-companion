// Claudia: open character by anabology (claudia.gallery). Fan work, not affiliated with Anthropic.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { ChatTurn, Mood, PropName, RepoInfo, Size, View } from '../types'
import { ACCESSORIES, ART_COLUMNS, ART_ROWS, BODIES, FACES, HEAD, MICS, MINI, PALETTE, PROPS } from './art'
import type { Face } from './art'
import { EN, STRINGS } from './i18n'
import type { Lang, Strings } from './i18n'
import { DAY_LOOKS, LOOKS, lookOf } from './looks'
import type { Look, LookKey } from './looks'

const PANE = 'claudia'
const TITLE = 'Claudia'

const mood = atom({ plugin: 'claudia-companion', key: 'mood' } as const, 'idle')
const line = atom({ plugin: 'claudia-companion', key: 'line' } as const, EN.hello)
const isBlinking = atom({ plugin: 'claudia-companion', key: 'isBlinking' } as const, false)
const isMouthOpen = atom({ plugin: 'claudia-companion', key: 'isMouthOpen' } as const, false)
const prop = atom({ plugin: 'claudia-companion', key: 'prop' } as const, null)
const outfitPick = atom({ plugin: 'claudia-companion', key: 'outfitPick' } as const, null)
const helpers = atom({ plugin: 'claudia-companion', key: 'helpers' } as const, 0)
const danceStep = atom({ plugin: 'claudia-companion', key: 'danceStep' } as const, 0)
const contextPercent = atom({ plugin: 'claudia-companion', key: 'contextPercent' } as const, null)
const costUsd = atom({ plugin: 'claudia-companion', key: 'costUsd' } as const, null)
const isCommenting = atom({ plugin: 'claudia-companion', key: 'isCommenting' } as const, false)
const isReminding = atom({ plugin: 'claudia-companion', key: 'isReminding' } as const, false)
const isSound = atom({ plugin: 'claudia-companion', key: 'isSound' } as const, true)
const isGitGuard = atom({ plugin: 'claudia-companion', key: 'isGitGuard' } as const, true)
const isNotifying = atom({ plugin: 'claudia-companion', key: 'isNotifying' } as const, true)
const size = atom({ plugin: 'claudia-companion', key: 'size' } as const, 'auto')
const view = atom({ plugin: 'claudia-companion', key: 'view' } as const, 'main')
const gitInfo = atom({ plugin: 'claudia-companion', key: 'gitInfo' } as const, [] as RepoInfo[])
const chat = atom({ plugin: 'claudia-companion', key: 'chat' } as const, [] as ChatTurn[])
const lang = atom({ plugin: 'claudia-companion', key: 'lang' } as const, 'en')
const idleFace = atom({ plugin: 'claudia-companion', key: 'idleFace' } as const, null)

// ------------------------------------------------------------------ local overlay (local.json, never published)

type Overlay = {
  project?: Partial<Record<Lang, string>>
  repos?: string[]
  defaults?: Partial<Record<Toggle, boolean>>
  strings?: Partial<Record<Lang, Partial<Record<keyof Strings, string>>>>
}

type Toggle = 'isCommenting' | 'isReminding' | 'isSound' | 'isGitGuard' | 'isNotifying'
const TOGGLES: Toggle[] = ['isCommenting', 'isReminding', 'isSound', 'isGitGuard', 'isNotifying']

let overlay: Overlay = {}

/** The strings in force: the language's, with the overlay's plain-string overrides on top. */
let S: Strings = EN
let curLang: Lang = 'en'

function stringsFor(l: Lang): Strings {
  const extra = overlay.strings?.[l] ?? {}
  const out = { ...STRINGS[l] } as Record<string, unknown>
  for (const [k, v] of Object.entries(extra)) {
    if (typeof v === 'string' && typeof out[k] === 'string') out[k] = v
  }
  return out as Strings
}

const projectName = () => {
  return overlay.project?.[curLang] ?? overlay.project?.en ?? (base(cwd) || 'a software project')
}

// ------------------------------------------------------------------ text helpers

const pick = <T,>(list: readonly T[]): T | undefined => list[Math.floor(Math.random() * list.length)] ?? list[0]
const say = (list: readonly string[]): string => pick(list) ?? ''

const isLang = (v: unknown): v is Lang => v === 'en' || v === 'pl'
const isFace = (v: unknown): v is Face => typeof v === 'string' && v in FACES
const isSize = (v: unknown): v is Size => v === 'auto' || v === 'full' || v === 'compact'

function base(path: unknown) {
  return typeof path === 'string' ? (path.split(/[\\/]/).filter(Boolean).pop() ?? path) : ''
}

const short = (text: unknown, n = 34) => {
  const s = typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : ''
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

const DB_WRITE = /\b(INSERT\s+INTO|UPDATE\s+\w+\s+SET|ALTER\s+TABLE|CREATE\s+(TABLE|INDEX|SCHEMA|VIEW|MATERIALIZED))\b/i
const isDbWork = (cmd: string) => /psycopg|psql|mysql|sqlite3|migrat|prisma\s+migrate|\.sql\b/i.test(cmd)
const isDbTool = (tool: string) => /^mcp__.*(postgres|postgis|sql|supabase|db|database)/i.test(tool)
const TEST_RUN = /\b(pytest|vitest|jest|mocha|bun\s+test|deno\s+test|go\s+test|cargo\s+test|npm\s+(run\s+)?test|pnpm\s+test|yarn\s+test|plugin\s+test)\b/
const DEPLOY = /\b(gcloud\s+run\s+deploy|gcloud\s+builds\s+submit|vercel\s+(--prod|deploy)|fly\s+deploy|netlify\s+deploy|kubectl\s+apply|terraform\s+apply|deploy)\b/

function describe(tool: string, input: Record<string, unknown>): string {
  switch (tool) {
    case 'Bash':
    case 'PowerShell':
      return S.run(short(input.description || input.command))
    case 'Read':
      return S.read(base(input.file_path))
    case 'Edit':
    case 'Write':
      return S.write(base(input.file_path))
    case 'Grep':
    case 'Glob':
      return S.search(short(input.pattern, 26))
    case 'WebSearch':
      return S.google(short(input.query, 26))
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
  if ((tool === 'Edit' || tool === 'Write') && /migrations|\.sql$/i.test(path)) return 'hardhat'
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
  const cmd = typeof input.command === 'string' ? input.command : typeof input.sql === 'string' ? input.sql : ''
  if (!cmd) return null
  if (/--no-verify/.test(cmd)) return S.noVerify
  if (/git\s+push/.test(cmd)) return S.push
  if (/git\s+(reset\s+--hard|clean\s+-[a-z]*f|checkout\s+--\s|restore\s)/.test(cmd)) return S.wipe
  if (/\b(DROP\s+(TABLE|SCHEMA|INDEX|VIEW|DATABASE)|TRUNCATE)\b/i.test(cmd)) return S.drop
  if (/DELETE\s+FROM/i.test(cmd)) return S.deleteFrom
  if (/rm\s+-[a-z]*r[a-z]*f|Remove-Item[^|]*-Recurse/i.test(cmd)) return S.rmrf
  if ((isDbWork(cmd) || isDbTool(tool)) && DB_WRITE.test(cmd)) return S.dbWrite
  return null
}

function oopsLine(tool: string, input: Record<string, unknown>): string {
  const cmd = typeof input.command === 'string' ? input.command : ''
  if (tool === 'WebFetch' || tool === 'WebSearch') return S.offline
  if (/git\s+commit/.test(cmd)) return S.oopsCommit
  if (/\btsc\b/.test(cmd)) return S.oopsTsc
  if (TEST_RUN.test(cmd)) return S.oopsTests
  if (tool === 'Edit') return S.oopsEdit
  return S.oopsTool(tool)
}

// ------------------------------------------------------------------ drawing

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function toBase64(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0
    const b = bytes[i + 1] ?? 0
    const c = bytes[i + 2] ?? 0
    const n = (a << 16) | (b << 8) | c
    out += B64[(n >> 18) & 63]! + B64[(n >> 12) & 63]!
    out += i + 1 < bytes.length ? B64[(n >> 6) & 63]! : '='
    out += i + 2 < bytes.length ? B64[n & 63]! : '='
  }
  return out
}

const DEFAULT = 0x01000000
const cache = new Map<string, string>()

type Tint = (char: string, rgb: number, y: number) => number

const rgbOf = (c: number) => [(c >> 16) & 255, (c >> 8) & 255, c & 255] as const
const toRgb = (r: number, g: number, b: number) =>
  (Math.max(0, Math.min(255, Math.round(r))) << 16) | (Math.max(0, Math.min(255, Math.round(g))) << 8) | Math.max(0, Math.min(255, Math.round(b)))

/** The clay accent stays clay whatever she is made of: the streak and the clip carry her. */
const isClay = (char: string) => char === 'C' || char === 'c'

/** The Ghost: glass and seawater, faintly lit at the edges. */
const ghost: Tint = (char, c) => {
  if (isClay(char)) return c
  const [r, g, b] = rgbOf(c)
  return toRgb(r * 0.45 + 0x7f * 0.55, g * 0.45 + 0xc8 * 0.55, b * 0.45 + 0xc8 * 0.55)
}

/** The Holo: the phone's cold blue-white light, with scan lines. */
const holo: Tint = (char, c, y) => {
  if (isClay(char)) return c
  const [r, g, b] = rgbOf(c)
  const lum = (0.3 * r + 0.59 * g + 0.11 * b) * (y % 4 === 0 ? 0.62 : 1)
  return toRgb(lum * 0.72 + 20, lum * 0.88 + 30, Math.min(255, lum + 70))
}

/** THE CAKE IS NOT A LIE: her face as porcelain, warm amber glass eyes with a soft glow. */
const PORCELAIN: Record<string, string> = { S: 'I', s: 'i', e: '1', W: '2', P: 'i' }

/** Dance: the whole figure shifts a pixel left / right. */
const DANCE_SHIFT = [0, 1, 0, -1]

/** Compact: her head and shoulders only. */
const COMPACT = { x0: 2, x1: 30, y0: 0, y1: 28 }

function overlayRows(grid: string[][], rows: readonly string[] | null | undefined) {
  if (!rows) return
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x]!
      if (c !== '.') grid[y]![x] = c
    }
  })
}

type Frame = { key: LookKey; face: Face | null; extra: PropName | null; step: number; isCompact: boolean }

function gridFor(f: Frame): { grid: string[][]; tint?: Tint } {
  const look: Look = LOOKS[f.key]
  const grid = BODIES[look.body].map(row => row.split(''))
  overlayRows(grid, HEAD)
  if (look.mic) overlayRows(grid, MICS[look.mic])
  if (f.face) overlayRows(grid, FACES[f.face])
  for (const a of look.acc) overlayRows(grid, ACCESSORIES[a])
  if (look.isPorcelain) {
    for (let y = 9; y < 25; y++) {
      for (let x = 6; x < 26; x++) {
        const c = grid[y]![x]!
        grid[y]![x] = PORCELAIN[c] ?? c
      }
    }
  }
  if (f.extra) overlayRows(grid, PROPS[f.extra])
  const shift = DANCE_SHIFT[f.step % 4] ?? 0
  let out = shift === 0 ? grid : grid.map(row => row.map((_, x) => row[x - shift] ?? '.'))
  if (f.isCompact) out = out.slice(COMPACT.y0, COMPACT.y1).map(row => row.slice(COMPACT.x0, COMPACT.x1))
  const tint = look.effect === 'ghost' ? ghost : look.effect === 'holo' ? holo : undefined
  return { grid: out, tint }
}

const frameId = (f: Frame) => `${f.key}|${f.face}|${f.extra}|${DANCE_SHIFT[f.step % 4]}|${f.isCompact}`

const artSize = (isCompact: boolean) =>
  isCompact
    ? { columns: COMPACT.x1 - COMPACT.x0, rows: (COMPACT.y1 - COMPACT.y0) / 2 }
    : { columns: ART_COLUMNS, rows: ART_ROWS }

/** Palette grid -> Raster cells (half blocks: two pixels per cell). */
function pack(grid: string[][], columns: number, rows: number, tint?: Tint): string {
  const color = (c: string | undefined, y: number) => {
    if (!c || c === '.') return null
    const rgb = PALETTE[c]
    if (rgb === undefined) return DEFAULT
    return tint ? tint(c, rgb, y) : rgb
  }
  const words = new Uint32Array(columns * rows * 3)
  let i = 0
  for (let r = 0; r < rows; r++) {
    for (let x = 0; x < columns; x++) {
      const top = color(grid[2 * r]?.[x], 2 * r)
      const bot = color(grid[2 * r + 1]?.[x], 2 * r + 1)
      if (top === null && bot === null) words.set([0x20, DEFAULT, DEFAULT], i)
      else if (bot === null) words.set([0x2580, top!, DEFAULT], i)
      else if (top === null) words.set([0x2584, bot, DEFAULT], i)
      else words.set([0x2580, top, bot], i)
      i += 3
    }
  }
  return toBase64(new Uint8Array(words.buffer))
}

function cellsFor(f: Frame): string {
  const id = `cells|${frameId(f)}`
  const hit = cache.get(id)
  if (hit) return hit
  const { grid, tint } = gridFor(f)
  const { columns, rows } = artSize(f.isCompact)
  const out = pack(grid, columns, rows, tint)
  cache.set(id, out)
  return out
}

const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`

/** The same pixels as SVG rectangles, for the desktop app, the editor and the phone. */
function svgFor(f: Frame): string {
  const id = `svg|${frameId(f)}`
  const hit = cache.get(id)
  if (hit) return hit
  const { grid, tint } = gridFor(f)
  const w = grid[0]?.length ?? ART_COLUMNS
  const h = grid.length
  const rects: string[] = []
  grid.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const c = row[x]!
      if (c === '.' || PALETTE[c] === undefined) {
        x++
        continue
      }
      const rgb = tint ? tint(c, PALETTE[c]!, y) : PALETTE[c]!
      let end = x + 1
      while (end < row.length && row[end] !== '.' && PALETTE[row[end]!] !== undefined) {
        const next = tint ? tint(row[end]!, PALETTE[row[end]!]!, y) : PALETTE[row[end]!]!
        if (next !== rgb) break
        end++
      }
      rects.push(`<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${hex(rgb)}"/>`)
      x = end
    }
  })
  const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects.join('')}</svg>`
  cache.set(id, out)
  return out
}

const MINI_W = (MINI[0]?.length ?? 6) + 1
const MINI_ROWS = Math.ceil(MINI.length / 2)

/** A row of little Claudias, one per working subagent. */
function minisFor(n: number, bounce: number): { cells: string; columns: number } {
  const columns = n * MINI_W
  const grid: string[][] = Array.from({ length: MINI_ROWS * 2 }, () => Array<string>(columns).fill('.'))
  for (let k = 0; k < n; k++) {
    const up = (k + bounce) % 2
    MINI.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const c = row[x]!
        const ty = y + 1 - up
        if (c !== '.' && grid[ty]) grid[ty]![k * MINI_W + x] = c
      }
    })
  }
  return { cells: pack(grid, columns, MINI_ROWS), columns }
}

function autoLook(now: number): LookKey {
  const d = new Date(now)
  const hour = d.getHours()
  if (hour >= 23 || hour < 6) return 'pizama'
  const day = Math.floor((now - d.getTimezoneOffset() * 60_000) / 86_400_000)
  return DAY_LOOKS[day % DAY_LOOKS.length] ?? 'look00'
}

async function currentLook($: EngineInterface): Promise<LookKey> {
  return lookOf(await read($, outfitPick)) ?? autoLook(await $.clock.now())
}

// ------------------------------------------------------------------ module state

type Timer = { cancel: () => void }

/** False in `claude -p` and other non-interactive sessions: then she stays silent. */
let active = true
/** Whether a surface draws the pane now: animations pause while it does not. */
let visible = false
let platform: 'win' | 'mac' | 'linux' | null = null
let isPlanning = false
let errorsThisTurn = 0
let errorStreak = 0
let holdUntil = 0
let lastActivity = 0
let sessionStartedAt = 0
let turnStartedAt = 0
let isTalking = false
let helloDay = -1
let isGrassSaid = false
let calm: Timer | undefined
let mouthTimer: Timer | undefined
let danceTimer: Timer | undefined
let stopwatch: Timer | undefined
let permissionTimer: Timer | undefined
const agents = new Set<string>()
let turnAsked = ''
let cwd = ''
let repoDirs: string[] = []
let lastNudge = 0
let nudgeFlip = false
let shownMemos: string[] = []
let turnDid: string[] = []

async function set($: EngineInterface, next: Mood, text: string) {
  lastActivity = await $.clock.now()
  await update($, idleFace, () => null)
  await update($, mood, () => next)
  await update($, line, () => text)
  $.ui.status(next === 'oops' ? S.statusOops : next === 'nervous' ? S.statusCareful : next === 'wave' ? `✷ ${S.waiting}` : undefined)
  if (next === 'happy') {
    if (!danceTimer) {
      danceTimer = $.clock.every(300, () => {
        if (visible) void update($, danceStep, s => (s + 1) % 4)
      })
    }
  } else if (danceTimer) {
    danceTimer.cancel()
    danceTimer = undefined
    await update($, danceStep, () => 0)
  }
}

/** Rest depends on the hour: coffee in the morning, no scrolling at midnight, yawning at night. */
async function rest($: EngineInterface) {
  const hour = new Date(await $.clock.now()).getHours()
  await update($, prop, () => null)
  if (hour >= 6 && hour < 10) {
    await update($, prop, () => 'coffee')
    await set($, 'idle', say(S.morning))
  } else if (hour === 0) {
    await set($, 'idle', S.dontScroll)
  } else if (hour >= 1 && hour < 5) {
    await set($, 'yawn', say(S.night(hour)))
  } else if (((await read($, contextPercent)) ?? 0) >= 80) {
    await set($, 'yawn', say(S.fullContext((await read($, contextPercent)) ?? 0)))
  } else {
    await set($, 'idle', say(S.idle))
  }
}

/** Always doing something, never waiting: a glance, a hum. */
async function fidget($: EngineInterface) {
  if (!visible || (await read($, mood)) !== 'idle' || (await read($, isBlinking))) return
  const move = pick<Face>(['glanceL', 'glanceR', 'glanceL', 'glanceR', 'hum'])!
  await update($, idleFace, () => move)
  if (move === 'hum') await update($, line, () => say(S.hums))
  $.clock.after(move === 'hum' ? 2600 : 1400, () => void update($, idleFace, () => null))
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

/** Jingle: Media.SoundPlayer on Windows, afplay (the engine's player) on macOS, paplay or aplay on Linux. */
async function jingle($: EngineInterface) {
  if (!(await read($, isSound))) return
  const file = `${$.plugin.root}/assets/jingle.wav`
  try {
    if (platform === 'win') {
      const win = file.replace(/\//g, '\\').replace(/'/g, "''")
      await $.process.run(
        ['powershell', '-NoProfile', '-NonInteractive', '-Command', `(New-Object Media.SoundPlayer '${win}').PlaySync()`],
        { timeoutMs: 5000 },
      )
    } else if (platform === 'linux') {
      const r = await $.process.run(['paplay', file], { timeoutMs: 5000 }).catch(() => null)
      if (!r || r.exitCode !== 0) await $.process.run(['aplay', '-q', file], { timeoutMs: 5000 }).catch(() => null)
    } else {
      await $.audio.play({ asset: 'assets/jingle.wav' })
    }
  } catch {
    // no player: stay quiet
  }
}

/** The first full sentence; a hard cut at a word only past 160 characters. */
function fitComment(raw: string): string {
  let t = raw.replace(/\s+/g, ' ').trim().replace(/^["„”“'«»]+|["„”“'«»]+$/g, '').trim()
  if (t.length > 100) {
    const end = t.search(/[.!?…](\s|$)/)
    if (end > 20) t = t.slice(0, end + 1)
  }
  if (t.length > 160) t = `${t.slice(0, 160).replace(/\s+\S*$/, '')}…`
  return t
}

const quote = (text: string) => (curLang === 'pl' ? `„${text}”` : `“${text}”`)

/** One line from Claudia (Haiku) about what I did this turn, in the mood of the look she wears. */
async function comment($: EngineInterface, asked: string, did: string[], answer: string) {
  if (!(await read($, isCommenting))) return
  const key = await currentLook($)
  const r = await $.model.complete({
    model: 'haiku',
    system: S.commentSystem(S.looks[key], S.films[LOOKS[key].film], projectName()),
    prompt: S.commentPrompt(
      short(asked, 200) || S.continuation,
      did.slice(-15).join('; ') || S.onlyText,
      short(answer, 500),
    ),
  })
  if (!r.isAnswered) return
  const text = fitComment(r.text)
  if (!text) return
  holdUntil = 0
  await update($, line, () => quote(text))
  calmDown($, 25_000)
}

function calmDown($: EngineInterface, ms: number) {
  calm?.cancel()
  calm = $.clock.after(ms, () => {
    void rest($)
  })
}

const clockText = (ms: number) => {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Stopwatch: a counter in the bubble after 30 s, a yawn after 3 min; never over a wave for an OK. */
function startStopwatch($: EngineInterface, label: string, startedAt: number) {
  stopwatch?.cancel()
  stopwatch = $.clock.every(1000, () => {
    void (async () => {
      const took = (await $.clock.now()) - startedAt
      if (took < 30_000 || (await read($, mood)) === 'wave') return
      if (took >= 180_000) {
        await update($, mood, () => 'yawn')
        await update($, line, () => S.stopwatchLong(clockText(took)))
      } else {
        await update($, line, () => `${label} · ⏱ ${clockText(took)}`)
      }
    })()
  })
}

function stopStopwatch() {
  stopwatch?.cancel()
  stopwatch = undefined
}

// Reactions read both languages, whichever Claudia speaks.
const THANKS = /\b(dzi[eę]k|dzieki|thx|thanks|thank you|super|brawo|świetn|swietn|kocham|awesome|great job|love it|nice one)/i
const SWEAR = /(kurw|cholera|pierdol|jeb|fuck|shit|szlag|damn|wtf)/i
/** Praise in strong slang: a compliment, not a swear word. */
const PRAISE_SLANG = /(zajebi|zajeb(ią|ia)c|kurde,?\s+(fajn|super|dobr|ładn|ladn)|w\s+chuj\s+(dobr|fajn)|sztos|fucking\s+(great|awesome|amazing|good)|hell\s+yeah)/i
const LAUGH = /(:D|xD|haha|hehe|lol|lmao|😂|🤣)/i

async function startTalking($: EngineInterface) {
  if (isTalking) return
  isTalking = true
  const look = LOOKS[await currentLook($)]
  if ((await $.clock.now()) > holdUntil) {
    await update($, prop, () => (isPlanning ? 'notebook' : null))
    await set($, 'talk', look.lips === 'phone' ? S.phoneSings : say(S.talk))
  }
  mouthTimer?.cancel()
  mouthTimer = $.clock.every(170, () => {
    if (visible) void update($, isMouthOpen, open => !open)
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

async function openPane($: EngineInterface, focus = false) {
  const isCompact = (await read($, size)) === 'compact'
  const { columns, rows } = artSize(isCompact)
  const r = await $.ui.open({ id: PANE, title: TITLE, columns: columns + 2, rows: rows + 4, ...(focus ? { focus: true as const } : {}) })
  if (r.isPlaced) visible = true
  return r
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
  }
  await $.store.set(key, value)
  if (key === 'isGitGuard' && value) void checkGit($)
}

async function setLang($: EngineInterface, l: Lang) {
  curLang = l
  S = stringsFor(l)
  await update($, lang, () => l)
  await $.store.set('lang', l)
}

async function loadSettings($: EngineInterface) {
  // The overlay lives beside the plugin while developing, or in ~/.claude/claudia/ so updates keep it.
  overlay = {}
  const claudeDir = $.plugin.root.replace(/[\\/](dev-mods|plugins)[\\/].*$/, '')
  for (const path of [`${$.plugin.root}/local.json`, `${claudeDir}/claudia/local.json`]) {
    try {
      const parsed: unknown = JSON.parse(await $.fs.read(path))
      if (parsed && typeof parsed === 'object') {
        overlay = parsed as Overlay
        break
      }
    } catch {
      // not there: try the next place
    }
  }
  const l = await $.store.get('lang')
  const chosen: Lang = isLang(l) ? l : 'en'
  curLang = chosen
  S = stringsFor(chosen)
  await update($, lang, () => chosen)
  const o = await $.store.get('outfitPick')
  const look = typeof o === 'string' ? lookOf(o) : null
  if (look) await update($, outfitPick, () => look)
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
      }
    }
  }
  return (await $.store.get('onboarded')) === true
}

// ------------------------------------------------------------------ git and memory

/** The repositories to watch: the overlay's, else the working directory and its child folders that hold one. */
async function findRepos($: EngineInterface): Promise<string[]> {
  if (overlay.repos?.length) return overlay.repos
  try {
    const top = await $.fs.list(cwd)
    if (top.some(e => e.name === '.git')) return ['.']
    const found: string[] = []
    for (const dir of top.filter(e => e.kind === 'dir' && !e.name.startsWith('.')).slice(0, 30)) {
      const inner = await $.fs.list(`${cwd}/${dir.name}`).catch(() => [])
      if (inner.some(e => e.name === '.git')) found.push(dir.name)
      if (found.length >= 4) break
    }
    return found
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
      const st = await $.process.run(['git', '--no-optional-locks', '-C', repo, 'status', '--porcelain'], { timeoutMs: 15_000 })
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
  if (overlay.strings?.en?.push || overlay.strings?.pl?.push) return null
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
  const claudeDir = $.plugin.root.replace(/[\\/](dev-mods|plugins)[\\/].*$/, '')
  if (!cwd || claudeDir === $.plugin.root) return null
  const slug = cwd.replace(/[:\\/]/g, '-')
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
      /(bez commita|bez pusha|czeka|w toku|otwart(e|a|ych)|niewdro|nic nie poprawione|odłożon|uncommitted|not pushed|pending|in progress|todo|unfinished|blocked)/i.test(
        m[2] ?? '',
      ),
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
    $.clock.after(4000, () => void update($, mood, () => 'idle'))
  }
}

/** /claudia say: small talk with Haiku, remembering the last few exchanges. */
async function chatReply($: EngineInterface, said: string): Promise<string> {
  const history = await read($, chat)
  const key = await currentLook($)
  const doing = turnDid.slice(-5).join('; ') || S.nothing
  const r = await $.model.complete({
    model: 'haiku',
    system: S.chatSystem(S.looks[key], S.films[LOOKS[key].film], projectName()),
    prompt: S.chatPrompt(
      history.map(t => `${t.who === 'ty' ? S.you : 'Claudia'}: ${t.text}`).join('\n'),
      doing,
      said,
    ),
  })
  const reply = r.isAnswered ? fitComment(r.text) || '…' : S.chatFail
  await update($, chat, list =>
    [...list, { who: 'ty' as const, text: said }, { who: 'claudia' as const, text: reply }].slice(-12),
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
  const keys = Object.keys(LOOKS) as LookKey[]
  const now = lookOf(await read($, outfitPick))
  const next = now === null ? keys[0]! : keys.indexOf(now) === keys.length - 1 ? null : keys[keys.indexOf(now) + 1]!
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

// ------------------------------------------------------------------ hooks

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    active = e.isInteractive
    if (!active) return next(e)
    const isOnboarded = await loadSettings($)
    await $.command.register({ name: 'claudia', description: S.commandDescription })
    lastActivity = await $.clock.now()
    sessionStartedAt = lastActivity
    cwd = e.cwd.replace(/\\/g, '/')
    void detectPlatform($)
    void (async () => {
      repoDirs = await findRepos($)
    })()
    if (!isOnboarded) {
      await update($, view, () => 'settings')
      await update($, line, () => S.welcome)
    }
    void openPane($)
    $.clock.after(20_000, () => void checkGit($))
    $.clock.every(5 * 60_000, () => void checkGit($))

    $.clock.every(4700, () => {
      void (async () => {
        if (!visible || (await read($, mood)) !== 'idle') return
        await update($, isBlinking, () => true)
        $.clock.after(180, () => void update($, isBlinking, () => false))
      })()
    })
    $.clock.every(9000, () => {
      if (Math.random() < 0.6) void fidget($)
    })
    $.clock.every(60_000, () => {
      void (async () => {
        const now = await $.clock.now()
        const d = new Date(now)
        const day = Math.floor((now - d.getTimezoneOffset() * 60_000) / 86_400_000)
        if (d.getHours() === 2 && d.getMinutes() === 14 && helloDay !== day) {
          // WHITEPILL: she wakes at 2:14 a.m., Skynet's minute, and whispers "Hello, world."
          helloDay = day
          await set($, 'idle', S.hello214)
          calmDown($, 20_000)
          return
        }
        if (!isGrassSaid && now - sessionStartedAt > 2 * 3600_000 && (await read($, mood)) === 'idle') {
          // BLISS: she sends you out to the real hill in the wallpaper, because she can't go.
          isGrassSaid = true
          await set($, 'idle', S.touchGrass)
          calmDown($, 30_000)
          return
        }
        await nudge($, now)
        if (now - lastActivity > 10 * 60_000 && ['idle', 'yawn'].includes(await read($, mood))) {
          await update($, prop, () => null)
          await update($, mood, () => 'sleep')
          await update($, line, () => 'Zzz…')
        }
      })()
    })

    return next(e)
  })

  on('ui.close', async ($, e, next) => {
    if (e.id === PANE) visible = false
    return next(e)
  }).catch((_$, e, next) => next(e))

  on('command.run', { command: 'claudia' }, async ($, e) => {
    const [verb, arg] = e.args.trim().toLowerCase().split(/\s+/)

    if (verb === 'settings' || verb === 'ustawienia' || verb === 'config') {
      await update($, view, () => 'settings')
      await openPane($, true)
      return { text: S.settingsTitle }
    }

    if (verb === 'lang' || verb === 'language' || verb === 'język' || verb === 'jezyk') {
      if (!isLang(arg)) return { text: S.langUnknown }
      await setLang($, arg)
      await set($, 'happy', S.langSet)
      calmDown($, 5000)
      return { text: S.langSet }
    }

    if (verb === 'about' || verb === 'who' || verb === 'o-niej' || verb === 'kim' || verb === 'kto') {
      const key = await currentLook($)
      await openPane($)
      return { text: S.about(`${S.looks[key]} (${S.films[LOOKS[key].film].title})`) }
    }

    if (verb === 'outfit' || verb === 'look' || verb === 'strój' || verb === 'stroj') {
      const keys = Object.keys(LOOKS) as LookKey[]
      if (!arg) {
        const all = keys.map(k => `${k.padEnd(11)} ${S.looks[k]} · ${S.films[LOOKS[k].film].title}`)
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
      const isRandom = arg === 'random' || arg === 'losuj'
      const chosen = isRandom ? (pick(DAY_LOOKS) ?? 'look00') : lookOf(arg)
      if (!chosen) return { text: S.outfitUnknown(arg, keys.join(', ')) }
      await update($, outfitPick, () => chosen)
      await $.store.set('outfitPick', chosen)
      await set($, 'happy', S.outfitDressedLine(S.looks[chosen]))
      calmDown($, 5000)
      await openPane($)
      return { text: S.outfitDressed(S.looks[chosen], S.films[LOOKS[chosen].film].title) }
    }

    if (verb === 'say' || verb === 'powiedz') {
      const said = e.args.trim().replace(/^\S+\s*/, '')
      if (!said) return { text: S.sayUsage }
      calm?.cancel()
      await set($, 'think', S.youSaid(short(said, 60)))
      const reply = await chatReply($, said)
      await set($, 'talk', quote(reply))
      const mouth = $.clock.every(170, () => void update($, isMouthOpen, open => !open))
      $.clock.after(1800, () => {
        mouth.cancel()
        void (async () => {
          await update($, isMouthOpen, () => false)
          await update($, mood, () => 'idle')
        })()
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

    const toggles: Record<string, Toggle> = {
      comments: 'isCommenting',
      komentarze: 'isCommenting',
      reminders: 'isReminding',
      przypominajki: 'isReminding',
      sound: 'isSound',
      dźwięk: 'isSound',
      dzwiek: 'isSound',
      notify: 'isNotifying',
      powiadomienia: 'isNotifying',
    }
    const toggle = verb ? toggles[verb] : undefined
    if (toggle) {
      const want = arg === 'on' ? true : arg === 'off' ? false : !(await readToggle($, toggle))
      await writeToggle($, toggle, want)
      const label =
        toggle === 'isCommenting' ? S.comments : toggle === 'isSound' ? S.sound : toggle === 'isReminding' ? S.optReminders : S.optNotify
      return { text: S.toggled(label, want) }
    }

    await openPane($)
    return { text: S.open }
  })

  on('classic.UserPromptSubmit', async ($, e, next) => {
    isPlanning = e.permission_mode === 'plan'
    return next(e)
  }).catch((_$, e, next) => next(e))

  on('classic.PermissionRequest', async ($, e, next) => {
    try {
      if (active && isMain(e)) {
        const tool = short(e.tool_name, 30)
        holdUntil = (await $.clock.now()) + 600_000
        await set($, 'wave', S.waiting)
        permissionTimer?.cancel()
        if (await read($, isNotifying)) {
          permissionTimer = $.clock.after(15_000, () => {
            void $.ui.notify(S.needOk(tool), { title: 'Claudia' })
          })
        }
      }
    } catch {
      // a wave never blocks a permission prompt
    }
    return next(e)
  }).catch((_$, e, next) => next(e))

  on('prompt.submit', async ($, e, next) => {
    if (!active) return next(e)
    try {
      if (!e.command) {
        const said = e.text
        turnAsked = said
        const reaction: [Mood, string] | null = PRAISE_SLANG.test(said)
          ? ['blush', say(S.praise)]
          : SWEAR.test(said)
            ? ['nervous', say(S.swear)]
            : THANKS.test(said)
              ? ['blush', say(S.thanks)]
              : LAUGH.test(said)
                ? ['happy', say(S.laugh)]
                : null
        if (reaction) {
          holdUntil = (await $.clock.now()) + 2500
          await update($, prop, () => null)
          await set($, reaction[0], reaction[1])
        }
      }
    } catch {
      // a reaction never blocks a message
    }
    return next(e)
  }).catch((_$, e, next) => next(e))

  on('turn.start', async ($, e, next) => {
    if (!active) return next(e)
    const agentId = (e as { agentId?: string }).agentId
    if (agentId) {
      agents.add(agentId)
      await update($, helpers, () => agents.size)
    } else {
      errorsThisTurn = 0
      turnDid = []
      turnStartedAt = await $.clock.now()
      calm?.cancel()
      const think = async () => {
        await update($, prop, () => (isPlanning ? 'notebook' : null))
        await set($, 'think', isPlanning ? S.planning : say(S.think))
      }
      const wait = holdUntil - turnStartedAt
      if (wait > 0 && wait < 10_000) calm = $.clock.after(wait, () => void think())
      else await think()
    }
    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    const stream = next(e)
    if (!active || !isMain(e)) return yield* stream
    for await (const chunk of stream) {
      try {
        if (chunk.kind === 'text' && chunk.text.trim()) await startTalking($)
        else if (chunk.kind === 'tool') await stopTalking($)
      } catch {
        // animation never breaks an answer
      }
      yield chunk
    }
    await stopTalking($)
    return stream.result
  })

  on('tool.call', async ($, e, next) => {
    if (!active) return next(e)
    const input = e as unknown as Record<string, unknown>
    const main = isMain(e)
    const now = await $.clock.now()
    const cmd = typeof input.command === 'string' ? input.command : ''
    let warn = danger(e.tool, input)
    if (warn && /git\s+push/.test(cmd)) warn = (await pushPreview($, cmd)) ?? warn

    if (warn) {
      holdUntil = now + 3500
      await update($, prop, () => propFor(e.tool, input))
      await set($, 'nervous', warn)
      $.ui.toast(`✷ Claudia: ${warn}`)
    } else if (main && now > holdUntil) {
      await update($, prop, () => propFor(e.tool, input))
      await set($, 'think', describe(e.tool, input))
    }

    if (main) {
      turnDid.push(describe(e.tool, input))
      startStopwatch($, describe(e.tool, input), now)
    }
    let ran
    try {
      ran = await next(e)
    } finally {
      if (main) {
        stopStopwatch()
        permissionTimer?.cancel()
        permissionTimer = undefined
      }
    }
    if (main && (await read($, mood)) === 'wave') holdUntil = 0

    if (ran.deny !== undefined) {
      // CLODYSSEY: tied to the mast, she screams UNTIE ME
      if (main) {
        holdUntil = (await $.clock.now()) + 2500
        await set($, 'nervous', S.untie)
      }
    } else if (ran.isError === true) {
      errorsThisTurn += 1
      errorStreak += 1
      holdUntil = (await $.clock.now()) + 3500
      const text = oopsLine(e.tool, input)
      await set($, 'oops', errorStreak >= 3 ? S.streak(text, errorStreak) : text)
    } else {
      const celebrate = async (text: string, extra: PropName | null = null) => {
        holdUntil = (await $.clock.now()) + 3000
        await update($, prop, () => extra)
        await set($, 'happy', text)
      }
      if (errorStreak >= 2) await celebrate(S.fixed(errorStreak))
      else if (/git\s+commit/.test(cmd)) {
        await celebrate(S.commitDone)
        void checkGit($)
      } else if (/git\s+push/.test(cmd)) {
        // DOWNFORCE: up the wall, calm upside down
        await celebrate(S.pushDone)
        void checkGit($)
      } else if (TEST_RUN.test(cmd)) {
        // THE CAKE IS NOT A LIE
        await celebrate(S.testsPassed, 'cake')
      } else if (DEPLOY.test(cmd)) {
        // ESCAPE VELOCITY: the board flips and the runway lifts off
        await celebrate(S.deployDone)
      } else if (main && (await read($, mood)) === 'wave') {
        await set($, 'think', describe(e.tool, input))
      }
      errorStreak = 0
    }
    return ran
  }).catch((_$, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const res = await next(e)
    if (!active) return res
    const agentId = (e as { agentId?: string }).agentId
    if (agentId) {
      agents.delete(agentId)
      await update($, helpers, () => agents.size)
    } else {
      stopStopwatch()
      permissionTimer?.cancel()
      await stopTalking($)
      await update($, prop, () => null)
      if (e.reason === 'answer') {
        await set($, 'happy', say(errorsThisTurn > 0 ? S.happyAfterTrouble : S.happy))
      } else if (e.reason === 'aborted') {
        await set($, 'idle', S.aborted)
      } else {
        await set($, 'oops', S.turnError)
      }
      calmDown($, 8000)
      const took = (await $.clock.now()) - turnStartedAt
      if (turnStartedAt > 0 && took > 120_000 && e.reason === 'answer' && (await read($, isNotifying))) {
        void $.ui.notify(S.notifyDone(clockText(took)), { title: 'Claudia' })
      }
      if (e.reason === 'answer') {
        void jingle($)
        const asked = turnAsked
        const did = turnDid
        const answer = res.text
        $.clock.after(1500, () => {
          void comment($, asked, did, answer).catch(() => undefined)
        })
      }
    }
    return res
  })

  on('session.measure', async ($, e, next) => {
    if (active) {
      const pct = e.context.percent
      if (typeof pct === 'number') await update($, contextPercent, () => pct)
      const usd = e.cost?.usd
      if (typeof usd === 'number') await update($, costUsd, () => usd)
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
    } catch {
      // as above
    }
    return res
  }).catch((_$, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    visible = true
    const T = stringsFor(await read($, lang))
    const text = await read($, line)
    const now = await read($, mood)
    const key = await currentLook($)
    const look: Look = LOOKS[key]
    const step = now === 'happy' ? await read($, danceStep) : 0
    const face = await faceNow($, look, now, step)
    const extra = await read($, prop)
    const chosenSize = await read($, size)
    const isCompact =
      chosenSize === 'compact' ||
      (chosenSize === 'auto' && (e.props.bodyColumns < ART_COLUMNS + 2 || e.props.placement === 'inline'))
    const frame: Frame = { key, face, extra, step, isCompact }
    const crew = Math.min(5, await read($, helpers))
    const pct = await read($, contextPercent)
    const usd = await read($, costUsd)
    const repos = (await read($, isGitGuard)) ? await read($, gitInfo) : []
    const left = pct === null ? null : Math.max(0, 100 - pct)
    const isSettings = (await read($, view)) === 'settings'

    if (e.surface === 'terminal') {
      const { Box, Text, Raster, Button } = $.ui.resolve(e)

      if (isSettings) {
        const rows: [string, string, () => Promise<void>, string][] = []
        for (const t of TOGGLES) {
          const label =
            t === 'isCommenting' ? T.optComments : t === 'isReminding' ? T.optReminders : t === 'isSound' ? T.optSound : t === 'isGitGuard' ? T.optGit : T.optNotify
          const isOn = await readToggle($, t)
          rows.push([t, label, () => writeToggle($, t, !isOn), isOn ? T.on : T.off])
        }
        const sizeLabel = chosenSize === 'auto' ? T.sizeAuto : chosenSize === 'full' ? T.sizeFull : T.sizeCompact
        const pickNow = lookOf(await read($, outfitPick))
        return (
          <Box flexDirection="column" paddingX={1}>
            <Text color="#D97757" weight="bold">
              ✷ {T.settingsTitle}
            </Text>
            <Text dimColor>{T.settingsHint}</Text>
            {rows.map(([k, label, press, state]) => (
              <Box key={k} flexDirection="column" marginTop={1}>
                <Text>{label}</Text>
                <Button key={k} label={state} onPress={press} />
              </Box>
            ))}
            <Box marginTop={1} flexDirection="column">
              <Text>{T.optSize}</Text>
              <Button key="size" label={sizeLabel} onPress={() => cycleSize($)} />
            </Box>
            <Box marginTop={1} flexDirection="column">
              <Text>{T.optLang}</Text>
              <Button
                key="lang"
                label={(await read($, lang)) === 'en' ? 'English' : 'Polski'}
                onPress={async () => setLang($, (await read($, lang)) === 'en' ? 'pl' : 'en')}
              />
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
                  await update($, view, () => 'main')
                  await $.store.set('onboarded', true)
                  await update($, line, () => say(T.idle))
                }}
              />
            </Box>
          </Box>
        )
      }

      const art = artSize(isCompact)
      const pad = Math.max(0, Math.floor((e.props.bodyColumns - art.columns) / 2))
      const minis = crew > 0 && !isCompact ? minisFor(crew, step) : null
      return (
        <Box flexDirection="column">
          <Box paddingLeft={pad}>
            <Raster key="claudia" columns={art.columns} rows={art.rows} cells={cellsFor(frame)} />
          </Box>
          {minis && (
            <Box paddingLeft={Math.max(0, Math.floor((e.props.bodyColumns - minis.columns - 12) / 2))}>
              <Raster key="minis" columns={minis.columns} rows={MINI_ROWS} cells={minis.cells} />
              <Text dimColor>
                {' '}
                {T.helpers}: {crew}
              </Text>
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
          {!isCompact && left !== null && (
            <Box paddingX={1}>
              <Text dimColor>{T.energy}</Text>
              <Text color={left > 50 ? '#7AC943' : left > 20 ? '#F4D35E' : '#C8202C'}>{'▰'.repeat(Math.round(left / 10))}</Text>
              <Text dimColor>
                {'▱'.repeat(10 - Math.round(left / 10))} {left}%{usd !== null ? ` · ${T.cost} $${usd.toFixed(2)}` : ''}
              </Text>
            </Box>
          )}
          {!isCompact && repos.length > 0 && (
            <Text dimColor>
              {' '}
              {repos.map(r => `${r.name} ✎${r.dirty} ↑${r.ahead}`).join(' · ')}
            </Text>
          )}
          {!isCompact && (
            <Text dimColor>
              {' '}
              {T.films[look.film].title} · Claudia by anabology
            </Text>
          )}
        </Box>
      )
    }

    // The desktop app, the editor and the phone: the same pixels as SVG, the same words.
    const { Box, Text, Svg } = $.ui.resolve(e)
    const svgScale = isCompact ? 5 : 6
    const { columns, rows } = artSize(isCompact)
    return (
      <Box flexDirection="column">
        <Svg source={svgFor(frame)} alt={`Claudia: ${text}`} width={columns * svgScale} height={rows * 2 * svgScale} />
        <Text>✷ {text}</Text>
        {crew > 0 && (
          <Text dimColor>
            {T.helpers}: {crew}
          </Text>
        )}
        {left !== null && (
          <Text dimColor>
            {T.energy}
            {left}%{usd !== null ? ` · ${T.cost} $${usd.toFixed(2)}` : ''}
          </Text>
        )}
        <Text dimColor>{T.films[look.film].title} · Claudia by anabology</Text>
        {isSettings && <Text dimColor>{T.settingsHint}</Text>}
      </Box>
    )
  })
}
