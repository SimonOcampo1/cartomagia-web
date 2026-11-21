import { useState } from 'react'
import { LEVEL_NAME, TAG_NAME, type Level, type Tag } from '../data/types.ts'
import { Icon } from './Icons.tsx'

export type FilterState = { q: string; levels: Level[]; tags: Tag[] }
export const emptyFilter: FilterState = { q: '', levels: [], tags: [] }

const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x])
const FIRST = 6 // etiquetas a la vista; el resto tras «Más filtros»

/** Niveles: cualquiera de los marcados. Etiquetas: todas las marcadas. */
export const matches = (f: FilterState, level: Level, tags: Tag[], text: string) =>
  (!f.levels.length || f.levels.includes(level)) && f.tags.every((t) => tags.includes(t)) && text.includes(f.q)

/** Nivel como medidor de una, dos o tres barras; el nombre del nivel va siempre al lado. */
export function Pips({ level }: { level: Level }) {
  return (
    <span className={`pips lv-${level}`} aria-hidden>
      <i />
      <i />
      <i />
    </span>
  )
}

type Props = { f: FilterState; set: (f: FilterState) => void; tags: Tag[]; count: number; sort?: React.ReactNode; children?: React.ReactNode }

export function Filters({ f, set, tags, count, sort, children }: Props) {
  const [more, setMore] = useState(false)
  const dirty = f.q || f.levels.length || f.tags.length
  const expanded = more || tags.slice(FIRST).some((t) => f.tags.includes(t))
  const shown = expanded ? tags : tags.slice(0, FIRST)
  const lv = f.levels.length === 1 ? f.levels[0] : undefined
  return (
    <div className="filters">
      <div className="search">
        <Icon name="search" />
        <input type="search" placeholder="Buscar por nombre, efecto, canal…" value={f.q} onChange={(e) => set({ ...f, q: e.target.value })} aria-label="Buscar" />
      </div>
      <div className="filter-row">
        <div className="segmented" role="group" aria-label="Nivel">
          <button type="button" aria-pressed={!lv} onClick={() => set({ ...f, levels: [] })}>
            Todos
          </button>
          {(Object.keys(LEVEL_NAME) as Level[]).map((l) => (
            <button key={l} type="button" aria-pressed={lv === l} onClick={() => set({ ...f, levels: lv === l ? [] : [l] })}>
              <Pips level={l} />
              {LEVEL_NAME[l]}
            </button>
          ))}
        </div>
        {children}
      </div>
      <div className="chips" role="group" aria-label="Características">
        {shown.map((t) => (
          <button key={t} type="button" aria-pressed={f.tags.includes(t)} className="chip" onClick={() => set({ ...f, tags: toggle(f.tags, t) })}>
            {TAG_NAME[t]}
          </button>
        ))}
        {tags.length > FIRST && (
          <button type="button" className="chip ghost" aria-expanded={expanded} onClick={() => setMore(!expanded)}>
            {expanded ? 'Menos' : `${tags.length - FIRST} filtros más`}
          </button>
        )}
      </div>
      <div className="count-row">
        <p className="count" aria-live="polite">
          <b className="num">{count}</b> {count === 1 ? 'resultado' : 'resultados'}
          {dirty ? (
            <button type="button" className="link" onClick={() => set(emptyFilter)}>
              Limpiar
            </button>
          ) : null}
        </p>
        {sort}
      </div>
    </div>
  )
}
