// What Claudia notices in Claude's answer, locally and for free: a question left for the person at the
// end, and a word of caution inside (not tested, not verified, skipped, failed).

/** The prose of an answer: code blocks out, inline code unwrapped, markdown marks dropped. */
function prose(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*|__|^#+\s*|^>\s*/gm, '')
    // a link's own ? is not a question
    .replace(/\bhttps?:\/\/\S+/g, 'a link')
}

/** Cuts at a word, with an ellipsis when it cuts. */
function clipped(text: string, n: number): string {
  const s = text.replace(/\s+/g, ' ').trim()
  if (s.length <= n) return s
  const cut = s.slice(0, n - 1).replace(/\s+\S*$/, '')
  return `${cut || s.slice(0, n - 1)}…`
}

/**
 * The question the answer ends with, if it ends with one: the last sentence of its last line that asks
 * something (`Which do we ship first?`). Null when the answer ends with a statement, a list or code.
 */
export function questionAtEnd(answer: string, n = 80): string | null {
  const lines = prose(answer)
    .split('\n')
    .map(l => l.replace(/^\s*([-*+]|\d+[.)])\s+/, '').trim())
    .filter(Boolean)
  // it ends with a question only when its last line does: the mark last, but for a closing quote, bracket or emoji
  const last = (lines[lines.length - 1] ?? '').replace(/[？؟]/g, '?')
  if (!/\?[\s"'”’»)\]*_\p{Extended_Pictographic}\uFE0F]*$/u.test(last)) return null
  const asks = last.match(/[^.!?]*\?/g)
  const q = asks?.[asks.length - 1]?.trim()
  return q && q.length > 2 ? clipped(q, n) : null
}

/** Something went wrong or was left out: worth a nervous face and a toast. */
const STRONG = [
  /\bfailed to\b/i,
  /\b(I|we|was|were|been|got|is|are) skipped\b|\bskipped (the|it|that|this|them|step|running|a |an )/i,
  /\btests? (are |is )?(still )?failing\b/i,
]

/** A sentence that says the trouble is gone, or never was: no alarm for it. */
const CALM = /\b(no|nothing|none|not|never|no longer|isn't|aren't|wasn't|weren't|without|previously|used to|earlier|before|fixed|resolved|now (works|passes|pass))\b/i

/** Something could not be checked here: worth a word in the status bar, not an alarm. */
const WEAK = [
  /\b(not|never) (been |yet )?(tested|verified|checked|run)\b/i,
  /\b(didn't|did not|couldn't|could not|haven't|have not|can't|cannot) (test|verify|run|check|confirm)\b/i,
]

/**
 * The last sentence of what Claude wrote before a tool (`Checking what the session line shows.`): its
 * own word for what it is about to do. Null when it wrote nothing worth showing.
 */
export function lastSentence(text: string, n = 100): string | null {
  const sentences = prose(text)
    .split(/(?<=[.!?…])\s+|\n+/)
    .map(s => s.replace(/^\s*([-*+]|\d+[.)])\s+/, '').trim())
    .filter(Boolean)
  const last = sentences[sentences.length - 1]?.replace(/:$/, '.')
  return last && last.length >= 6 ? clipped(last, n) : null
}

export type Caution = { text: string; isStrong: boolean }

/** The sentence of the answer that carries a caution, a strong one first. */
export function cautionIn(answer: string, n = 90): Caution | null {
  const sentences = prose(answer)
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.replace(/^\s*([-*+]|\d+[.)])\s+/, '').trim())
    .filter(Boolean)
  const strong = sentences.find(s => STRONG.some(re => re.test(s)) && !CALM.test(s) && !/\d+\s+(passed|skipped)/i.test(s))
  if (strong) return { text: clipped(strong, n), isStrong: true }
  const weak = sentences.find(s => WEAK.some(re => re.test(s)) && !/never (run|ran) into/i.test(s))
  return weak ? { text: clipped(weak, n), isStrong: false } : null
}
