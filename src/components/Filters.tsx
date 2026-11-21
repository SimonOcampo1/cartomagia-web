import { useRef, useState, type ReactNode } from 'react'
import { LEVEL_NAME, TAG_NAME, type Level, type Tag } from '../data/types.ts'
import { emptyFilter, type FilterState } from '../lib/filter.ts'
import { useDismiss } from '../lib/hooks.ts'
import { Check } from './Check.tsx'
import { Icon } from './Icons.tsx'
import { Pips } from './Pips.tsx'

const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x])

type Props = {
  f: FilterState
  set: (f: FilterState) => void
  tags: Tag[]
  count: number
  sort: ReactNode
  /** filtros propios de la página (van dentro del panel) y los activos, para mostrarlos y quitarlos */
  extra?: ReactNode
  extraOn?: { label: string; clear: () => void }[]
}

/** Barra de búsqueda: buscador, panel de filtros y orden en una fila; niveles y resultados debajo. */
export function Filters({ f, set, tags, count, sort, extra, extraOn = [] }: Props) {
  const [open, setOpen] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  useDismiss(open, () => setOpen(false), panel)
  const dirty = f.q || f.levels.length || f.tags.length
  const lv = f.levels.length === 1 ? f.levels[0] : undefined
  const on = f.tags.length + extraOn.length
  return (
    <div className="filters">
      <div className="filter-bar">
        <div className="search">
          <Icon name="search" />
          <input type="search" placeholder="Buscar por nombre, efecto, canal…" value={f.q} onChange={(e) => set({ ...f, q: e.target.value })} aria-label="Buscar" />
        </div>
        <div className="more" ref={panel}>
          <button type="button" className="filter-btn" aria-expanded={open} aria-controls="panel-filtros" onClick={() => setOpen(!open)}>
            <Icon name="sliders" />
            Filtros
            {on > 0 && <span className="badge num">{on}</span>}
          </button>
          {open && (
            <div className="filter-panel" id="panel-filtros" role="group" aria-label="Filtros">
              <fieldset className="tag-grid">
                <legend>Características</legend>
                {tags.map((t) => (
                  <Check key={t} checked={f.tags.includes(t)} onChange={() => set({ ...f, tags: toggle(f.tags, t) })}>
                    {TAG_NAME[t]}
                  </Check>
                ))}
              </fieldset>
              {extra && <div className="panel-extra">{extra}</div>}
            </div>
          )}
        </div>
        {sort}
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
        <p className="count" aria-live="polite">
          <b className="num">{count}</b> {count === 1 ? 'resultado' : 'resultados'}
          {dirty ? (
            <button type="button" className="link" onClick={() => set(emptyFilter)}>
              Limpiar
            </button>
          ) : null}
        </p>
      </div>
      {on > 0 && (
        <div className="active-tags" aria-label="Filtros activos">
          {[...f.tags.map((t) => ({ label: TAG_NAME[t], clear: () => set({ ...f, tags: toggle(f.tags, t) }) })), ...extraOn].map((c) => (
            <button key={c.label} type="button" className="chip on" onClick={c.clear} aria-label={`Quitar ${c.label}`}>
              {c.label}
              <Icon name="close" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
