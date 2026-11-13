// The lines under Claudia: Claude's task list, this turn, the plan's limits, background tasks, the
// permission mode, today. Pure functions: each takes what is known and the pane's width, and returns
// a line that fits it, or null when there is nothing to show.
import type { DayInfo, GoalInfo, LimitInfo, LineId, OthersInfo, SessionInfo, TodoInfo, TurnInfo } from '../types'
import type { More } from './bond'

/** In order of importance: when the pane is short, the last ones give way. */
export const LINES: readonly LineId[] = ['tasks', 'goal', 'turn', 'session', 'context', 'limits', 'background', 'sessions', 'mode', 'git', 'day']

export const isLineId = (v: unknown): v is LineId => typeof v === 'string' && (LINES as readonly string[]).includes(v)

/**
 * Symbols a terminal may draw two cells wide: everything past the basic plane, the wide BMP emoji, and
 * those an emoji font can widen (the stopwatch, the gear, the box, the warning). Counted as two, so a
 * line never wraps on a terminal that widens them.
 */
const WIDE = /[\u231A\u231B\u23E9-\u23F3\u23F8-\u23FA\u2614\u2615\u2611\u2699\u26A0\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26D4\u26EA\u26F2-\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B50\u2B55]/

/** How many terminal cells a line takes, counting every symbol that might be wide as two. */
export function cells(text: string): number {
  let n = 0
  for (const ch of text) n += ch.codePointAt(0)! > 0xffff || WIDE.test(ch) ? 2 : 1
  return n
}

/** Cuts a line to the width at a word, never in the middle of one. */
export function fitLine(text: string, width: number): string {
  if (cells(text) <= width) return text
  let cut = ''
  for (const ch of text) {
    if (cells(cut + ch) > width - 1) break
    cut += ch
  }
  const atWord = cut.replace(/\s+\S*$/, '')
  return `${atWord || cut}…`
}

/** A count as stored or reported: a real number, never below zero; anything else is zero. */
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0)

/** Words on one line: a task's name or a goal may come with line breaks of its own. */
/** Text from outside (a task's name, a command, a folder) on one line, with nothing a terminal would act on. */
const oneLine = (text: unknown): string => (typeof text === 'string' ? text.replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '').replace(/\s+/g, ' ').trim() : '')

const firstFitting = (width: number, ...candidates: string[]) => candidates.find(c => cells(c) <= width) ?? fitLine(candidates[candidates.length - 1] ?? '', width)

export function stopwatch(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

/** `☑ 3/7 · Writing tests`, or `☑ 7/7 ✓` once all are done. */
export function tasksLine(t: TodoInfo | null, width: number): string | null {
  const total = Math.round(num(t?.total))
  if (!t || total === 0) return null
  const done = Math.min(total, Math.round(num(t.done)))
  const head = `☑ ${done}/${total}`
  if (done === total) return firstFitting(width, `${head} ✓`, head)
  const current = oneLine(t.current)
  return current ? firstFitting(width, fitLine(`${head} · ${current}`, width), head) : fitLine(head, width)
}

/** `⏱ 2:14 · 9 tools · ✎ 3 files +120 −40`; after the turn, the same as its summary. */
export function turnLine(M: More, t: TurnInfo | null, now: number, width: number): string | null {
  if (!t || !num(t.startedAt)) return null
  const time = `⏱ ${stopwatch(num((t.endedAt ?? now) - t.startedAt))}`
  const [toolCount, fileCount, added, removed] = [num(t.tools), num(t.files), num(t.added), num(t.removed)].map(Math.round) as [number, number, number, number]
  const tools = M.tools(toolCount)
  const files = fileCount ? `✎ ${M.fileCount(fileCount)} +${added} −${removed}` : ''
  const all = [time, tools, files].filter(Boolean).join(' · ')
  const short = [time, fileCount ? `✎ ${fileCount} +${added} −${removed}` : '', `🔧 ${toolCount}`].filter(Boolean).join(' · ')
  const done = t.endedAt ? `${M.lastTurn} ` : ''
  // while a tool runs, what it is (`▶ python`) comes first among what gives way
  const current = oneLine(t.current)
  const running = !t.endedAt && current ? ` · ▶ ${current}` : ''
  // a turn that is over always says so: its short form before the long one without the word
  if (t.endedAt) return firstFitting(width, done + all, done + short, done + time, time)
  return firstFitting(width, ...(running ? [all + running, short + running] : []), all, short, time)
}

const WINDOW: Record<string, string> = { five_hour: '5h', seven_day: '7d', seven_day_opus: '7d Opus', spend_limit: '$' }

const windowName = (kind: string) => WINDOW[kind] ?? kind.replace(/_/g, ' ')

/** When a window resets: the hour today, else the day and the hour. */
export function resetText(iso: string | undefined, now: number): string {
  if (!iso) return ''
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return ''
  const hh = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`
  if (at.getTime() - now < 20 * 3600_000) return hh
  return `${String(at.getDate()).padStart(2, '0')}.${String(at.getMonth() + 1).padStart(2, '0')} ${hh}`
}

export type BarLine = { label: string; bars: number; filled: number; tail: string; pct: number }

const WINDOW_ORDER = ['five_hour', 'seven_day']

/** One bar per window of the plan's limits, the five-hour one first: `5h ▰▰▱▱▱▱▱▱▱▱ 20% · ↻16:40`. */
export function limitsLines(limits: readonly LimitInfo[], now: number, width: number): BarLine[] {
  const rank = (k: string) => (WINDOW_ORDER.includes(k) ? WINDOW_ORDER.indexOf(k) : WINDOW_ORDER.length)
  const out: BarLine[] = []
  for (const l of [...limits].sort((a, b) => rank(a.kind) - rank(b.kind))) {
    // no reading, no bar; a window whose reset has passed shows a usage that is no longer true
    if (typeof l.pct !== 'number' || !Number.isFinite(l.pct)) continue
    const resetAt = l.resetsAt ? new Date(l.resetsAt).getTime() : NaN
    if (Number.isFinite(resetAt) && now - resetAt > 2 * 60_000) continue
    const pct = Math.max(0, Math.round(l.pct))
    const label = `${windowName(l.kind)} `
    const reset = resetText(l.resetsAt, now)
    const tails = [reset ? ` ${pct}% · ↻${reset}` : ` ${pct}%`, ` ${pct}%`]
    let line: BarLine | null = null
    for (const [bars, tail] of [
      [10, tails[0]!],
      [10, tails[1]!],
      [6, tails[1]!],
      [4, tails[1]!],
    ] as const) {
      if (cells(label) + bars + cells(tail) <= width) {
        line = { label, bars, filled: Math.min(bars, Math.round((Math.min(100, pct) / 100) * bars)), tail, pct }
        break
      }
    }
    const bare = `${label.trim()} ${pct}%`
    if (!line && cells(bare) <= width) line = { label: '', bars: 0, filled: 0, tail: bare, pct }
    if (line) out.push(line)
  }
  return out
}

/** `⚙ 2 in background: npm run dev, bun test`. */
export function backgroundLine(M: More, tasks: readonly string[], width: number): string | null {
  if (!tasks.length) return null
  // a task with no name of its own still counts
  const names = tasks.map(oneLine).filter(Boolean)
  return firstFitting(width, ...(names.length ? [M.background(tasks.length, names.join(', '))] : []), `⚙ ${tasks.length}`)
}

/** The permission mode, only when it is not the usual one. */
export function modeLine(M: More, mode: string, width: number): string | null {
  const text = M.modes[mode]
  return text ? fitLine(text, width) : null
}

/** A length of time in hours and minutes: `2 h 41 min`, `41 min`. */
export function duration(ms: number): string {
  const min = Math.floor(num(ms) / 60_000)
  const h = Math.floor(min / 60)
  return h ? `${h} h ${min % 60} min` : `${min} min`
}

/** `🕐 session 2 h 41 min · Claude worked 1 h 12 min`, shorter when narrow. */
/** The time a session has been open, now: what was counted, and the last minute when it is still going. */
export function openNow(s: SessionInfo, now: number): number {
  const since = now - num(s.openAt)
  return num(s.openMs) + (since >= 0 && since <= OPEN_GAP ? since : 0)
}

/** A longer silence than this (a computer asleep or off, a closed session) is not time spent. */
export const OPEN_GAP = 3 * 60_000

export function sessionLine(M: More, s: SessionInfo | null, now: number, width: number): string | null {
  if (!s || !s.startedAt) return null
  const all = duration(openNow(s, now))
  const work = duration(s.workMs)
  return firstFitting(width, M.session(all, work), `🕐 ${all} · 🤖 ${work}`, `🕐 ${all}`)
}

/** `🎯 finish the tests`, ticked once done; only today's. */
export function goalLine(M: More, g: GoalInfo | null, day: number, width: number): string | null {
  const text = oneLine(g?.text)
  if (!g || g.day !== day || !text) return null
  return fitLine(M.goalLine(text, g.isDone), width)
}

/** `⧉ 3 other sessions · 1 waiting for OK (api)`. */
export function sessionsLine(M: More, o: OthersInfo | null, width: number): string | null {
  const total = Math.round(num(o?.total))
  if (!o || total === 0) return null
  // never more waiting than there are
  const waiting = Math.min(total, Math.round(num(o.waiting)))
  const names = (o.names ?? []).map(oneLine).filter(Boolean)
  return firstFitting(width, M.others(total, waiting, [...new Set(names)].join(', ')), M.othersShort(total, waiting))
}

/** `🔥 5 · 14 turns · 3 commits · 🍰 2`. */
export function dayLine(M: More, d: DayInfo | null, width: number): string | null {
  if (!d || !num(d.turns)) return null
  const clean = { streak: Math.max(1, Math.round(num(d.streak))), turns: Math.round(num(d.turns)), commits: Math.round(num(d.commits)), cakes: Math.round(num(d.cakes)) }
  return firstFitting(width, M.day(clean), M.dayShort(clean), `🔥 ${clean.streak}`)
}
