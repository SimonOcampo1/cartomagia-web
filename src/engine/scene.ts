import type { CardId, Rand } from './cards.ts'

// Escenario de 100 x 60 unidades; la carta mide 8 x 11.2.
export const W = 100
export const H = 60
export const CW = 8
export const CH = 11.2

/** Geometría de una zona. Las cartas se apilan con desplazamiento dx/dy; `cols` la convierte en cuadrícula. */
export type Geo = {
  x: number
  y: number
  dx?: number
  dy?: number
  rot?: number
  fan?: number // grados totales del abanico
  cols?: number
  rowDy?: number
  label?: string
}

export type Mark = 'chosen' | 'key' | 'force' | 'path' | 'dim'
export type HandPose = { x: number; y: number; rot?: number; grip?: 'below' | 'above' }
export type Ask =
  | { kind: 'choice'; prompt: string; options: { label: string; value: string }[]; answer?: string }
  | { kind: 'card'; prompt: string; among: string[]; answer?: string }

export type Frame = {
  zones: Record<string, CardId[]> // abajo → arriba
  geo: Record<string, Geo>
  up: Record<CardId, boolean>
  marks: Record<CardId, Mark>
  order: Record<CardId, number> // orden de movimiento desde el paso anterior (para escalonar)
  caption: string
  note?: string
  inset?: { label: string; cards: CardId[] }
  hands?: { l?: HandPose; r?: HandPose }
  ask?: Ask
  tone?: 'win' | 'fail'
}

class Stop {}

type MoveOpts = { flip?: boolean; up?: boolean; block?: boolean; fromBottom?: boolean; toBottom?: boolean; at?: number }

/**
 * Guion de un truco. Se muta el estado y `snap()` congela un paso.
 * Las preguntas (`ask`) consumen `answers`; si falta la respuesta, el guion se corta ahí.
 */
export class Script {
  zones: Record<string, CardId[]> = {}
  geo: Record<string, Geo> = {}
  up: Record<CardId, boolean> = {}
  marks: Record<CardId, Mark> = {}
  frames: Frame[] = []
  hands: Frame['hands']
  inset: Frame['inset']
  answers: string[]
  r: Rand
  private ai = 0
  private moved: CardId[] = []

  constructor(answers: string[], r: Rand) {
    this.answers = answers
    this.r = r
  }

  zone(name: string, geo: Geo, cards: CardId[] = [], up = false) {
    this.geo[name] = geo
    this.zones[name] = [...cards]
    cards.forEach((c) => (this.up[c] = up))
    return this
  }
  place(name: string, geo: Partial<Geo>) {
    this.geo[name] = { ...this.geo[name], ...geo }
    return this
  }
  pile(name: string) {
    return (this.zones[name] ??= [])
  }
  top(name: string, n = 1) {
    return this.pile(name).slice(-n).reverse() // arriba primero
  }
  bottom(name: string) {
    return this.pile(name)[0]
  }
  /** posición desde arriba, 1 = carta de arriba */
  posFromTop(name: string, c: CardId) {
    const p = this.pile(name)
    return p.length - p.indexOf(c)
  }
  where(c: CardId) {
    return Object.keys(this.zones).find((z) => this.zones[z].includes(c))
  }

  /** Mueve n cartas. Por defecto una a una (como repartir: invierte el orden). `block` conserva el orden. */
  move(from: string, to: string, n = 1, o: MoveOpts = {}) {
    const src = this.pile(from)
    const dst = this.pile(to)
    n = Math.min(n, src.length)
    const taken = o.fromBottom ? src.splice(0, n) : src.splice(src.length - n, n)
    if (o.flip) {
      // dar vuelta el paquete entero
      taken.reverse()
      taken.forEach((c) => (this.up[c] = !this.up[c]))
    } else if (!o.block && !o.fromBottom) taken.reverse() // repartir de a una: la de arriba cae primero
    if (o.up !== undefined) taken.forEach((c) => (this.up[c] = o.up!))
    if (o.at !== undefined) dst.splice(o.at, 0, ...taken)
    else if (o.toBottom) dst.unshift(...(o.block ? taken : [...taken].reverse()))
    else dst.push(...taken)
    this.moved.push(...(o.block ? [...taken].reverse() : taken))
    return taken
  }
  /** Mueve una carta concreta, esté donde esté. */
  take(c: CardId, to: string, o: { up?: boolean; at?: number } = {}) {
    const from = this.where(c)
    if (from) this.zones[from].splice(this.zones[from].indexOf(c), 1)
    const dst = this.pile(to)
    if (o.at !== undefined) dst.splice(o.at, 0, c)
    else dst.push(c)
    if (o.up !== undefined) this.up[c] = o.up
    this.moved.push(c)
  }
  /** Reparte en ronda, de arriba, sobre varias zonas. */
  deal(from: string, to: string[], count: number, o: { up?: boolean } = {}) {
    for (let i = 0; i < count; i++) this.move(from, to[i % to.length], 1, o)
  }
  /** Dar vuelta un montón entero: invierte el orden y la cara. */
  turnOver(name: string) {
    const p = this.pile(name)
    p.reverse()
    p.forEach((c) => (this.up[c] = !this.up[c]))
    this.moved.push(...p)
  }
  flipCard(c: CardId, up = !this.up[c]) {
    this.up[c] = up
    this.moved.push(c)
  }
  /** Corte completo: las n de arriba pasan abajo. */
  cut(name: string, n: number) {
    const p = this.pile(name)
    const t = p.splice(p.length - n, n)
    p.unshift(...t)
    this.moved.push(...t)
  }
  /** Mezcla americana real: las cartas caen desde abajo de cada mitad. */
  riffle(a: string, b: string, to: string) {
    const A = this.pile(a)
    const B = this.pile(b)
    const out = this.pile(to)
    while (A.length || B.length) {
      const fromA = B.length === 0 || (A.length > 0 && this.r() < A.length / (A.length + B.length))
      const c = (fromA ? A : B).shift()!
      out.push(c)
      this.moved.push(c)
    }
  }
  mark(c: CardId | CardId[], m: Mark | null) {
    for (const x of Array.isArray(c) ? c : [c]) {
      if (m) this.marks[x] = m
      else delete this.marks[x]
    }
  }

  snap(caption: string, extra: Partial<Frame> = {}) {
    const order: Record<CardId, number> = {}
    this.moved.forEach((c, i) => (order[c] ??= i))
    this.moved = []
    this.frames.push({
      zones: Object.fromEntries(Object.entries(this.zones).map(([k, v]) => [k, [...v]])),
      geo: { ...this.geo },
      up: { ...this.up },
      marks: { ...this.marks },
      order,
      caption,
      hands: this.hands,
      inset: this.inset,
      ...extra,
    })
  }

  /** Pregunta al usuario. Siempre deja un paso con la pregunta; sin respuesta, corta el guion. */
  ask(a: Ask, caption = a.prompt): string {
    const answer = this.answers[this.ai]
    this.snap(caption, { ask: { ...a, answer } })
    if (answer === undefined) throw new Stop()
    this.ai++
    return answer
  }
}

export type ScriptFn = (s: Script) => void

export function run(fn: ScriptFn, answers: string[], r: Rand): Frame[] {
  const s = new Script(answers, r)
  try {
    fn(s)
  } catch (e) {
    if (!(e instanceof Stop)) throw e
  }
  return s.frames
}

// Geometrías frecuentes
export const stack = (x: number, y: number, label?: string): Geo => ({ x, y, dx: 0.035, dy: -0.035, label })
export const row = (x: number, y: number, dx: number, label?: string): Geo => ({ x, y, dx, dy: 0, label })
export const CENTER = stack(46, 24)
