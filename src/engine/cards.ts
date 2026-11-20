// Cartas como strings: "AS", "10H", "QD". Palo al final: S picas, H corazones, D diamantes, C tréboles.
export type CardId = string
export type Suit = 'S' | 'H' | 'D' | 'C'

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
export const SUITS: Suit[] = ['S', 'H', 'C', 'D']
export const SUIT_GLYPH: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' }
const SUIT_NAME: Record<Suit, string> = { S: 'picas', H: 'corazones', D: 'diamantes', C: 'tréboles' }
const RANK_NAME: Record<string, string> = { A: 'As', J: 'J', Q: 'Q', K: 'K' }

export const suitOf = (c: CardId) => c.slice(-1) as Suit
export const rankOf = (c: CardId) => c.slice(0, -1)
export const valueOf = (c: CardId) => RANKS.indexOf(rankOf(c)) + 1
export const isRed = (c: CardId) => suitOf(c) === 'H' || suitOf(c) === 'D'
export const card = (value: number, suit: Suit): CardId => RANKS[value - 1] + suit
export const short = (c: CardId) => rankOf(c) + SUIT_GLYPH[suitOf(c)]
export const longName = (c: CardId) => `${RANK_NAME[rankOf(c)] ?? rankOf(c)} de ${SUIT_NAME[suitOf(c)]}`

export const newDeck = (): CardId[] => SUITS.flatMap((s) => RANKS.map((r) => r + s))

// mulberry32: rápido y suficiente para mezclar con semilla reproducible
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export type Rand = () => number

export function shuffled<T>(arr: T[], r: Rand): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
export const between = (r: Rand, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1))
