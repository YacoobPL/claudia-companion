export type Mood = 'idle' | 'think' | 'talk' | 'happy' | 'oops' | 'nervous' | 'sleep' | 'blush' | 'yawn' | 'wave'
export type RepoInfo = { name: string; dirty: number; ahead: number }
export type ChatTurn = { who: 'you' | 'claudia'; text: string }
export type PropName = 'glasses' | 'magnifier' | 'hardhat' | 'globe' | 'pencil' | 'coffee' | 'cake' | 'notebook' | 'book' | 'candle' | 'santa'
export type Size = 'auto' | 'full' | 'compact'
export type View = 'main' | 'settings' | 'wardrobe'
/** What a helper is, by its agent type: Explore, Plan, a reviewer, any other. */
export type HelperKind = 'general' | 'explore' | 'plan' | 'review'
/** Claude's task list: how many are done, of how many, and what is being done now. */
export type TodoInfo = { done: number; total: number; current: string }
/** The current (or last) main turn: when it started and ended, the tools it ran, the files it changed. */
export type TurnInfo = {
  startedAt: number
  endedAt: number | null
  tools: number
  files: number
  added: number
  removed: number
  /** What runs right now (`python`, `Edit a.ts`), while a tool runs. */
  current?: string | null
  /** How long this turn has waited for the person (an OK, a question): not work. */
  waited?: number
  /** Since when it waits now; null or absent when it does not. */
  waitingSince?: number | null
}
/** One window of the plan's limits: `five_hour`, `seven_day`… */
export type LimitInfo = { kind: string; pct: number; resetsAt?: string }
export type DayInfo = { streak: number; turns: number; commits: number; cakes: number }
/** The lines under her, each of which can be hidden. */
export type LineId = 'tasks' | 'goal' | 'turn' | 'session' | 'context' | 'limits' | 'background' | 'sessions' | 'mode' | 'git' | 'day'
/** Where she shows: the pane beside the chat, a band above the prompt, or the status line alone. */
export type Display = 'pane' | 'band' | 'status'
/** The other Claude Code sessions with her, from their heartbeats: how many, how many wait for an OK, and where. */
export type OthersInfo = { total: number; waiting: number; names: string[] }
/** Today's goal, set with /claudia goal. */
export type GoalInfo = { day: number; text: string; isDone: boolean }
/** This session: when it started, and how long Claude's turns took in it. */
/** `openMs`: the time the session has been open, counted to `openAt` (a computer off or asleep adds nothing). */
/** `busySince`: helpers at work with no main turn running, since then. */
export type SessionInfo = { startedAt: number; workMs: number; openMs: number; openAt: number; busySince?: number | null }

declare module 'claude-code' {
  interface PluginState {
    'claudia-companion': {
      mood: Mood
      line: string
      isBlinking: boolean
      isMouthOpen: boolean
      prop: PropName | null
      /** The look picked by command or settings; null = she picks (pyjamas at night). */
      outfitPick: string | null
      /** Subagents working now (little Claudias beside her). */
      helpers: number
      /** The working subagents' kinds, in the order they started. */
      crew: HelperKind[]
      /** Dance step while she is happy: 0..3. */
      danceStep: number
      /** How full the context window is, in percent; null before the first reading. */
      contextPercent: number | null
      /** What the session has cost, in US dollars; null where the host keeps no ledger. */
      costUsd: number | null
      /** A Haiku comment after each turn (opt-in: it uses the person's account). */
      isCommenting: boolean
      /** Reminders from Claude's project memory (opt-in: it reads local files). */
      isReminding: boolean
      /** A jingle when a turn ends. */
      isSound: boolean
      /** The git guard: a lock-free git status every few minutes. */
      isGitGuard: boolean
      /** System notifications: waiting for an OK, a long turn done. */
      isNotifying: boolean
      /** A word about a break after 90 minutes of work (opt-in). */
      isBreaks: boolean
      /** Wider pixels, for a font whose cells are taller than two to one. */
      isWide: boolean
      /** Haiku reads the whole exchange: checks the request was all done, comments on what was said (opt-in). */
      isReading: boolean
      /** Reduced motion: no dancing, bouncing, blinking or lip flaps. */
      isCalm: boolean
      /** Haiku turns Claude's notes on each step into her short English line (opt-in). */
      isNarrating: boolean
      isMusing: boolean
      /** Focus mode until this time (ms); 0 when off. */
      quietUntil: number
      display: Display
      others: OthersInfo | null
      goal: GoalInfo | null
      /** Which look the wardrobe shows. */
      wardrobeAt: number
      todos: TodoInfo | null
      turnInfo: TurnInfo | null
      /** Ticks every second while a main turn runs, so its stopwatch redraws. */
      tick: number
      /** Status-line mode: her word and the essentials, as drawn at the end of the hint line under the prompt. */
      statusText: string
      limits: LimitInfo[]
      /** Background tasks still running, by what they run. */
      background: string[]
      /** The permission mode of the last prompt. */
      permMode: string
      dayInfo: DayInfo | null
      sessionInfo: SessionInfo | null
      hiddenLines: LineId[]
      size: Size
      view: View
      /** The last git reading of the project's repositories. */
      gitInfo: RepoInfo[]
      /** The last exchanges of /claudia say. */
      chat: ChatTurn[]
      /** A small idle move (a glance, a hum); null = her resting face. */
      idleFace: string | null
    }
  }
}
