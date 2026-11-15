// Drawing Claudia: her layers put together for a look, a face and a size, then packed into the
// pane's half-block cells or into SVG. Pure functions over the pixel data in art.ts.
import type { HelperKind, PropName, Size } from '../types'
import { ACCESSORIES, ART_COLUMNS, ART_ROWS, BAND, BODIES, FACES, HANDS, HEAD, MICS, MINIS, PALETTE, PROPS, SLEEVES } from './art'
import type { BandFace, Face } from './art'
import { LOOKS } from './looks'
import type { Look, LookKey } from './looks'

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
export const cache = new Map<string, string>()

export type Tint = (char: string, rgb: number, y: number) => number

const rgbOf = (c: number) => [(c >> 16) & 255, (c >> 8) & 255, c & 255] as const
const toRgb = (r: number, g: number, b: number) =>
  (Math.max(0, Math.min(255, Math.round(r))) << 16) | (Math.max(0, Math.min(255, Math.round(g))) << 8) | Math.max(0, Math.min(255, Math.round(b)))

/** The clay accent stays clay whatever she is made of: the streak and the clip carry her. */
const isClay = (char: string) => char === 'C' || char === 'c'

/** The Ghost: glass and seawater, faintly lit at the edges. */
export const ghost: Tint = (char, c) => {
  if (isClay(char)) return c
  const [r, g, b] = rgbOf(c)
  return toRgb(r * 0.45 + 0x7f * 0.55, g * 0.45 + 0xc8 * 0.55, b * 0.45 + 0xc8 * 0.55)
}

/** The Holo: the phone's cold blue-white light, with scan lines. */
export const holo: Tint = (char, c, y) => {
  if (isClay(char)) return c
  const [r, g, b] = rgbOf(c)
  const lum = (0.3 * r + 0.59 * g + 0.11 * b) * (y % 4 === 0 ? 0.62 : 1)
  return toRgb(lum * 0.72 + 20, lum * 0.88 + 30, Math.min(255, lum + 70))
}

/** THE CAKE IS NOT A LIE: her face as porcelain, warm amber glass eyes with a soft glow. */
const PORCELAIN: Record<string, string> = { S: 'I', s: 'i', e: '1', W: '2', P: 'i' }

/** Dance: the whole figure shifts a pixel left / right. */
const DANCE_SHIFT = [0, 1, 0, -1]

/** Compact: her head only, cut clean at the bottom of the bob (no stub of a neck). */
const COMPACT = { x0: 2, x1: 30, y0: 0, y1: 26 }

function overlayRows(grid: string[][], rows: readonly string[] | null | undefined) {
  if (!rows) return
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x]!
      if (c !== '.') grid[y]![x] = c
    }
  })
}

/**
 * How big she is drawn: `big` (every pixel doubled, 64×36 cells) in a wide, tall pane, `full` (32×18),
 * `head` (28×13); narrower panes get words only.
 */
type Tier = 'big' | 'full' | 'head'

export type Frame = { key: LookKey; face: Face | null; extra: PropName | null; step: number; tier: Tier; wide: boolean }

/** GLaDOS-Claudia is porcelain all over: her face and her hands, when she raises them. */
function porcelainize(grid: string[][]) {
  for (const row of grid) {
    for (let x = 0; x < row.length; x++) row[x] = PORCELAIN[row[x]!] ?? row[x]!
  }
}

/** Reading glasses never go over sunglasses: a look that wears them keeps only the notebook. */
function heldProp(look: Look, extra: PropName | null): keyof typeof PROPS | null {
  const hasEyewear = look.acc.some(a => a === 'shield') || look.seeThroughLenses === true
  if (!extra || !hasEyewear) return extra
  if (extra === 'glasses') return null
  if (extra === 'notebook') return 'book'
  return extra
}

/** Rimless lenses: the eye whites and the skin round the eyes take the clay tint; the iris shows through. */
function tintLenses(grid: string[][]) {
  for (let y = 13; y <= 15; y++) {
    for (const x of [10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22]) {
      const c = grid[y]?.[x]
      if (c === 'W' || c === 'S' || c === 's') grid[y]![x] = '5'
    }
  }
  grid[13]![16] = '6'
}

/** The head size ends at her chin: what she holds at her shoulder moves up beside her face. */
function propNearFace(rows: readonly string[]): string[] {
  const out = rows.map(() => '.'.repeat(rows[0]?.length ?? ART_COLUMNS).split(''))
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x]!
      if (c === '.') continue
      // whatever sits below her chin moves up by 10 rows, the left-hand prop one column in, the right-hand two
      const ty = y >= 18 ? y - 10 : y
      const tx = y >= 18 ? (x < 16 ? x + 1 : x - 2) : x
      if (out[ty]) out[ty]![tx] = c
    }
  })
  return out.map(r => r.join(''))
}

const isLight = (c: string) => {
  const v = PALETTE[c]
  if (v === undefined) return false
  return (0.2126 * ((v >> 16) & 255) + 0.7152 * ((v >> 8) & 255) + 0.0722 * (v & 255)) / 255 > 0.6
}

/**
 * A dark rim where something light of hers (a white dress, a pale arm, a sparkle) meets the
 * terminal's own background: lost in a dark terminal, it draws her outline on a light one.
 */
export function outline(grid: string[][]) {
  const h = grid.length
  const marks: [number, number][] = []
  for (let y = 0; y < h; y++) {
    const row = grid[y]!
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== '.') continue
      const near = [grid[y]?.[x + 1], grid[y]?.[x - 1], grid[y + 1]?.[x], grid[y - 1]?.[x]]
      if (near.some(c => c !== undefined && c !== '.' && isLight(c))) marks.push([x, y])
    }
  }
  for (const [x, y] of marks) grid[y]![x] = 'K'
}

export function gridFor(f: Frame): { grid: string[][]; tint?: Tint } {
  const look: Look = LOOKS[f.key]
  const tint = look.effect === 'ghost' ? ghost : look.effect === 'holo' ? holo : undefined
  const grid = BODIES[look.body].map(row => row.split(''))
  overlayRows(grid, HEAD)
  if (look.mic) overlayRows(grid, MICS[look.mic])
  if (f.face) overlayRows(grid, FACES[f.face])
  const held = heldProp(look, f.extra)
  // a hat replaces the beret
  for (const a of look.acc) if (!((held === 'hardhat' || held === 'santa') && a === 'beret')) overlayRows(grid, ACCESSORIES[a])
  // a raised hand (a wave, a facepalm) goes over sunglasses and earrings, in the sleeve of the look
  const hand = f.face ? HANDS[f.face] : undefined
  if (hand) {
    const [fill, shade, up, upShade] = SLEEVES[look.body] ?? ['S', 's', 'S', 's']
    overlayRows(grid, hand.map(row => row.replace(/@/g, fill).replace(/&/g, shade).replace(/%/g, up).replace(/\$/g, upShade)))
  }
  if (look.seeThroughLenses) tintLenses(grid)
  if (look.isPorcelain) porcelainize(grid)
  // her hands are busy waving or on her face: what she holds is put down meanwhile
  if (held && !hand) overlayRows(grid, f.tier === 'head' ? propNearFace(PROPS[held]) : PROPS[held])
  outline(grid)
  const shift = DANCE_SHIFT[f.step % 4] ?? 0
  let out = shift === 0 ? grid : grid.map(row => row.map((_, x) => row[x - shift] ?? '.'))
  if (f.tier === 'head') out = out.slice(COMPACT.y0, COMPACT.y1).map(row => row.slice(COMPACT.x0, COMPACT.x1))
  // big: every pixel twice as wide and twice as tall
  if (f.tier === 'big') out = out.flatMap(row => {
    const twice = row.flatMap(c => [c, c])
    return [twice, [...twice]]
  })
  // wider pixels: every fourth column twice, for cells taller than two to one
  if (f.wide) out = out.map(row => row.flatMap((c, x) => (x % 4 === 3 ? [c, c] : [c])))
  return { grid: out, tint }
}

export const frameId = (f: Frame) => `${f.key}|${f.face}|${f.extra}|${DANCE_SHIFT[f.step % 4]}|${f.tier}|${f.wide}`

const TIER_SIZE: Record<Tier, { columns: number; rows: number }> = {
  big: { columns: ART_COLUMNS * 2, rows: ART_ROWS * 2 },
  full: { columns: ART_COLUMNS, rows: ART_ROWS },
  head: { columns: COMPACT.x1 - COMPACT.x0, rows: (COMPACT.y1 - COMPACT.y0) / 2 },
}

/** Her size in cells; wider pixels add a column for every four. */
export const artSize = (tier: Tier, wide = false) => {
  const t = TIER_SIZE[tier]
  return wide ? { columns: t.columns + Math.floor(t.columns / 4), rows: t.rows } : t
}

/** The biggest drawing that fits the pane; null where even the smallest does not. */
export function tierFor(chosen: Size, columns: number, placement: 'dock' | 'inline' | 'widget', rows = 0, wide = false): Tier | null {
  // each size only where it leaves room below it: her words always, and a few lines under them
  // (a short window gets her head, a shorter one her words alone, never her picture with nothing to say)
  const below: Record<Tier, number> = { big: 6, full: 5, head: 3 }
  const fits = (t: Tier) => columns >= artSize(t, wide).columns + 2 && (rows === 0 ? t !== 'big' : rows >= TIER_SIZE[t].rows + below[t])
  const order: Tier[] =
    chosen === 'full'
      ? ['big', 'full', 'head']
      : chosen === 'compact'
        ? ['head']
        : placement !== 'inline'
          ? ['big', 'full', 'head']
          : ['head']
  return order.find(fits) ?? null
}

/** Palette grid -> Raster cells (half blocks: two pixels per cell). */
export function pack(grid: string[][], columns: number, rows: number, tint?: Tint): string {
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

export function cellsFor(f: Frame): string {
  const id = `cells|${frameId(f)}`
  const hit = cache.get(id)
  if (hit) return hit
  const { grid, tint } = gridFor(f)
  const { columns, rows } = artSize(f.tier, f.wide)
  const out = pack(grid, columns, rows, tint)
  cache.set(id, out)
  return out
}

const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`

/** The same pixels as SVG rectangles, for the desktop app, the editor and the phone; `over` paints them all (a locked look's silhouette). */
export function svgFor(f: Frame, over?: Tint): string {
  const id = `svg|${over ? 'over|' : ''}${frameId(f)}`
  const hit = cache.get(id)
  if (hit) return hit
  const drawn = gridFor(f)
  const grid = drawn.grid
  const tint = over ?? drawn.tint
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
  const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 10}" height="${h * 10}" shape-rendering="crispEdges">${rects.join('')}</svg>`
  cache.set(id, out)
  return out
}

/** Room between two little Claudias, and her height in rows with one pixel to bounce. */
const MINI_GAP = 1
export const MINI_ROWS = Math.ceil((MINIS.general.length + 1) / 2)

function miniWidth(kind: HelperKind): number {
  return MINIS[kind][0]?.length ?? 8
}

/** A row of little Claudias, one per working subagent, each holding what her kind works with. */
export function minisFor(kinds: readonly HelperKind[], bounce: number): { cells: string; columns: number } {
  const columns = kinds.reduce((sum, k) => sum + miniWidth(k), 0) + MINI_GAP * Math.max(0, kinds.length - 1)
  const grid: string[][] = Array.from({ length: MINI_ROWS * 2 }, () => Array<string>(columns).fill('.'))
  let left = 0
  kinds.forEach((kind, k) => {
    const up = (k + bounce) % 2
    MINIS[kind].forEach((row: string, y: number) => {
      for (let x = 0; x < row.length; x++) {
        const c = row[x]!
        const ty = y + 1 - up
        if (c !== '.' && grid[ty]) grid[ty]![left + x] = c
      }
    })
    left += miniWidth(kind) + MINI_GAP
  })
  outline(grid)
  return { cells: pack(grid, columns, MINI_ROWS), columns }
}

/** The band's Claudia: 14 x 14 pixels in 7 rows, her dress coloured, outlined for a light terminal. */
/**
 * The band's Claudia: the helpers' chibi, 8 x 10 in 5 rows, with the face of her mood and the colour
 * of her look; porcelain for GLaDOS, ghost and holo tinted, outlined for a light terminal.
 */
export function bandSprite(face: BandFace, look: Look): { cells: string; columns: number; rows: number } {
  const art = BAND[face]
  const dress = BODIES[look.body][33]?.[8]
  const grid = art.map(row => row.split('').map(c => (c === 'T' && dress && dress !== '.' ? dress : c)))
  if (look.isPorcelain) porcelainize(grid)
  outline(grid)
  const columns = art[0]!.length
  const rows = Math.ceil(art.length / 2)
  return { cells: pack(grid, columns, rows, look.effect === 'ghost' ? ghost : look.effect === 'holo' ? holo : undefined), columns, rows }
}

/** How many little Claudias fit in `width`; the line under them counts them all. */
export function minisThatFit(kinds: readonly HelperKind[], width: number): number {
  let used = 0
  for (let k = 0; k < kinds.length; k++) {
    used += (k ? MINI_GAP : 0) + miniWidth(kinds[k]!)
    if (used > width) return k
  }
  return kinds.length
}
