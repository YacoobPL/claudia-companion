// Claudia's looks, as claudia.gallery/claudia.md lists them: "Her clothes change with every world;
// her head never does." Each look names its body, its mic, what she wears on her head, and what the
// film did with her mouth.
import type { Accessory, Body, Mic } from './art'

import type { BadgeId } from './bond'

export type Film = 'ev' | 'clo' | 'bliss' | 'am' | 'df' | 'dlms' | 'wp' | 'cake'

/** What she is made of in the look: glass and seawater (the Ghost) or the phone's light (the Holo). */
export type Effect = 'ghost' | 'holo'

/**
 * How her mouth moves while the assistant writes: `sing` lip-syncs; `closed` keeps her lips shut while
 * the lettering carries her words (DOWNFORCE); `phone` lets the phone sing (DON'T LET ME SCROLL).
 */
export type Lips = 'sing' | 'closed' | 'phone'

export type Look = {
  body: Body
  mic: Mic | null
  acc: Accessory[]
  film: Film
  lips: Lips
  effect?: Effect
  /** THE CAKE IS NOT A LIE: her face as glossy porcelain with amber glass eyes. */
  isPorcelain?: boolean
  /** AIRPLANE MODE: she winks at the lens, because she thinks she can get out. */
  winks?: boolean
  /** Holo dancer: small clay-tinted rimless lenses her eyes show through. */
  seeThroughLenses?: boolean
}

export const LOOKS = {
  look00: { body: 'look00', mic: 'headset', acc: [], film: 'ev', lips: 'sing' },
  siren: { body: 'siren', mic: 'headset', acc: [], film: 'clo', lips: 'sing' },
  ghost: { body: 'siren', mic: 'headset', acc: [], film: 'clo', lips: 'sing', effect: 'ghost' },
  chrome: { body: 'chrome', mic: 'headset', acc: [], film: 'clo', lips: 'sing' },
  holo: { body: 'pyjamas', mic: 'headset', acc: [], film: 'clo', lips: 'sing', effect: 'holo' },
  bliss: { body: 'bliss', mic: 'boom', acc: ['shield'], film: 'bliss', lips: 'sing' },
  trench: { body: 'trench', mic: 'boom', acc: ['shield', 'hoops'], film: 'bliss', lips: 'sing' },
  holodancer: { body: 'holodancer', mic: 'boom', acc: [], film: 'bliss', lips: 'sing', seeThroughLenses: true },
  start: { body: 'start', mic: 'boom', acc: ['pushedUp'], film: 'bliss', lips: 'sing' },
  silver: { body: 'silver', mic: 'boom', acc: ['choker'], film: 'bliss', lips: 'sing' },
  window: { body: 'window', mic: 'boom', acc: [], film: 'bliss', lips: 'sing' },
  flightsuit: { body: 'flightsuit', mic: 'boom', acc: [], film: 'am', lips: 'sing', winks: true },
  racing: { body: 'racing', mic: 'headset', acc: [], film: 'df', lips: 'closed' },
  pyjamas: { body: 'pyjamas', mic: 'headset', acc: [], film: 'dlms', lips: 'phone' },
  shirt: { body: 'shirt', mic: 'headset', acc: [], film: 'dlms', lips: 'phone' },
  mohair: { body: 'mohair', mic: 'headset', acc: [], film: 'dlms', lips: 'phone' },
  locked: { body: 'locked', mic: 'headset', acc: [], film: 'dlms', lips: 'phone' },
  coat: { body: 'coat', mic: 'headset', acc: ['beret'], film: 'dlms', lips: 'phone' },
  milkmaid: { body: 'milkmaid', mic: 'headset', acc: [], film: 'wp', lips: 'sing' },
  glados: { body: 'glados', mic: null, acc: ['porcelain'], film: 'cake', lips: 'sing', isPorcelain: true },
} as const satisfies Record<string, Look>

export type LookKey = keyof typeof LOOKS

/** Looks she picks for the day herself; at night it is the pyjamas. */
export const DAY_LOOKS = (Object.keys(LOOKS) as LookKey[]).filter(k => k !== 'pyjamas')

/** Old outfit names that a stored choice may still carry. */
export const LOOK_ALIASES: Record<string, LookKey> = {
  flight: 'flightsuit',
  pajamas: 'pyjamas',
  porcelain: 'glados',
}

export const isLook = (v: unknown): v is LookKey => typeof v === 'string' && Object.hasOwn(LOOKS, v)

/** Looks she earns with badges: the rest are hers from the start. */
export const LOCKS: Partial<Record<LookKey, BadgeId>> = {
  glados: 'cake10',
  flightsuit: 'streak7',
  racing: 'commits10',
  holo: 'nightOwl',
  ghost: 'compaction',
  coat: 'weekend',
}

/** Whether a look is open: no badge needed, or the badge earned. */
export const isUnlocked = (key: LookKey, badges: Partial<Record<BadgeId, number>> | undefined) => {
  const need = LOCKS[key]
  return !need || badges?.[need] !== undefined
}

export function lookOf(v: string | null | undefined): LookKey | null {
  if (!v) return null
  if (isLook(v)) return v
  return Object.hasOwn(LOOK_ALIASES, v) ? (LOOK_ALIASES[v] ?? null) : null
}
