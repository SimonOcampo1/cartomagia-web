import { useState } from 'react'
import { Filters } from '../components/Filters.tsx'
import { Pips } from '../components/Pips.tsx'
import { emptyFilter, matches, norm } from '../lib/filter.ts'
import { useLearned } from '../lib/hooks.ts'
import { LEVEL_NAME, TAG_NAME, type Lesson, type Tag } from '../data/types.ts'

// las etiquetas que más se buscan, primero
const TAG_ORDER = Object.keys(TAG_NAME) as Tag[]
const SORTS = {
  ruta: { label: 'Ruta: de fácil a difícil', fn: (a: Lesson, b: Lesson) => 'PIA'.indexOf(a.level) - 'PIA'.indexOf(b.level) },
  rapido: { label: 'Más rápidos de aprender', fn: (a: Lesson, b: Lesson) => (a.minutes ?? 99) - (b.minutes ?? 99) },
  az: { label: 'Alfabético', fn: (a: Lesson, b: Lesson) => a.name.localeCompare(b.name, 'es') },
}

export function LessonRow({ l, base, learned }: { l: Lesson; base: string; learned: boolean }) {
  return (
    <li>
      <a href={`#/${base}/${l.id}`} className="lesson-row">
        <span className="lv">
          <Pips level={l.level} />
          {LEVEL_NAME[l.level]}
        </span>
        <span className="name">
          {l.name}
          {learned && <span className="done">aprendido</span>}
        </span>
        <span className="effect">{l.effect}</span>
        <span className="tags">
          {l.tags
            .filter((t) => t !== 'tecnica')
            .map((t) => TAG_NAME[t])
            .join(', ')}
        </span>
        <span className="go" aria-hidden>
          {l.script ? 'Ver paso a paso' : 'Ver videos'}
        </span>
      </a>
    </li>
  )
}

export function Library({ title, intro, items, base }: { title: string; intro: string; items: Lesson[]; base: string }) {
  const [f, setF] = useState(emptyFilter)
  const [pending, setPending] = useState(false)
  const [sort, setSort] = useState<keyof typeof SORTS>('ruta')
  const { learned } = useLearned()
  const tags = TAG_ORDER.filter((t) => t !== 'tecnica' && t !== 'short' && items.some((l) => l.tags.includes(t)))
  const shown = items.filter(
    (l) => matches({ ...f, q: norm(f.q) }, l.level, l.tags, norm(`${l.name} ${l.effect} ${l.method}`)) && (!pending || !learned.has(l.id)),
  ).sort(SORTS[sort].fn)
  return (
    <main className="page">
      <header className="page-head">
        <h1>{title}</h1>
        <p>{intro}</p>
      </header>
      <Filters
        f={f}
        set={setF}
        tags={tags}
        count={shown.length}
        sort={
          <select className="sort" value={sort} onChange={(e) => setSort(e.target.value as keyof typeof SORTS)} aria-label="Ordenar">
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        }
      >
        <label className="toggle">
          <input type="checkbox" checked={pending} onChange={(e) => setPending(e.target.checked)} />
          Solo lo que me falta aprender
        </label>
      </Filters>
      {shown.length ? (
        <ul className="lessons">
          {shown.map((l) => (
            <LessonRow key={l.id} l={l} base={base} learned={learned.has(l.id)} />
          ))}
        </ul>
      ) : (
        <p className="empty">Nada cumple todos esos filtros. Quita alguna etiqueta: las etiquetas se combinan con «y».</p>
      )}
    </main>
  )
}
