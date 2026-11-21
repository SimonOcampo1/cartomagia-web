import type { Level, Tag } from '../data/types.ts'

export type FilterState = { q: string; levels: Level[]; tags: Tag[] }
export const emptyFilter: FilterState = { q: '', levels: [], tags: [] }

/** Niveles: cualquiera de los marcados. Etiquetas: todas las marcadas. */
export const matches = (f: FilterState, level: Level, tags: Tag[], text: string) =>
  (!f.levels.length || f.levels.includes(level)) && f.tags.every((t) => tags.includes(t)) && text.includes(f.q)

/** Texto comparable: sin tildes ni mayúsculas. */
export const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
