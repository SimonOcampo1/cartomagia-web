import { LEVEL_NAME, TAG_NAME, type Level, type Tag } from '../data/types.ts'

export type FilterState = { q: string; levels: Level[]; tags: Tag[] }
export const emptyFilter: FilterState = { q: '', levels: [], tags: [] }

const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x])

/** Niveles: cualquiera de los marcados. Etiquetas: todas las marcadas. */
export const matches = (f: FilterState, level: Level, tags: Tag[], text: string) =>
  (!f.levels.length || f.levels.includes(level)) && f.tags.every((t) => tags.includes(t)) && text.includes(f.q)

export function Filters({ f, set, tags, count, children }: { f: FilterState; set: (f: FilterState) => void; tags: Tag[]; count: number; children?: React.ReactNode }) {
  const dirty = f.q || f.levels.length || f.tags.length
  return (
    <div className="filters">
      <input type="search" placeholder="Buscar por nombre, efecto, canal…" value={f.q} onChange={(e) => set({ ...f, q: e.target.value })} aria-label="Buscar" />
      <div className="chips" role="group" aria-label="Nivel">
        {(Object.keys(LEVEL_NAME) as Level[]).map((l) => (
          <button key={l} type="button" aria-pressed={f.levels.includes(l)} className={`chip lv-${l}`} onClick={() => set({ ...f, levels: toggle(f.levels, l) })}>
            {LEVEL_NAME[l]}
          </button>
        ))}
      </div>
      <div className="chips" role="group" aria-label="Características">
        {tags.map((t) => (
          <button key={t} type="button" aria-pressed={f.tags.includes(t)} className="chip" onClick={() => set({ ...f, tags: toggle(f.tags, t) })}>
            {TAG_NAME[t]}
          </button>
        ))}
      </div>
      {children}
      <p className="count">
        {count} {count === 1 ? 'resultado' : 'resultados'}
        {dirty ? (
          <button type="button" className="link" onClick={() => set(emptyFilter)}>
            Limpiar filtros
          </button>
        ) : null}
      </p>
    </div>
  )
}
