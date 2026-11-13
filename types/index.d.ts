export type Mood = 'idle' | 'think' | 'talk' | 'happy' | 'oops' | 'nervous' | 'sleep' | 'blush' | 'yawn' | 'wave'
export type RepoInfo = { name: string; dirty: number; ahead: number }
export type ChatTurn = { who: 'ty' | 'claudia'; text: string }
export type PropName = 'glasses' | 'magnifier' | 'hardhat' | 'globe' | 'pencil' | 'coffee' | 'cake' | 'notebook'
export type Size = 'auto' | 'full' | 'compact'
export type View = 'main' | 'settings'

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
      size: Size
      view: View
      /** The last git reading of the project's repositories. */
      gitInfo: RepoInfo[]
      /** The last exchanges of /claudia say. */
      chat: ChatTurn[]
      /** Her language: en (default) or pl. */
      lang: 'en' | 'pl'
      /** A small idle move (a glance, a hum); null = her resting face. */
      idleFace: string | null
    }
  }
}
