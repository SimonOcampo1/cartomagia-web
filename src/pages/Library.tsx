import { useState } from 'react'
import { Filters, emptyFilter, matches } from '../components/Filters.tsx'
import { LEVEL_NAME, TAG_NAME, type Lesson, type Tag } from '../data/types.ts'
import { norm, useLearned } from '../lib.ts'

export function LessonRow({ l, base, learned }: { l: Lesson; base: string; learned: boolean }) {
  return (
    <li>
      <a href={`#/${base}/${l.id}`} className={`lesson-row lv-${l.level}`}>
        <span className="lv">{LEVEL_NAME[l.level]}</span>
        <span className="name">
          {l.name}
          {learned && <span className="done">aprendido</span>}
        </span>
        <span className="effect">{l.effect}</span>
        <span className="tags">
          {l.tags
            .filter((t) => t !== 'tecnica')
            .map((t) => TAG_NAME[t])
            .join(' · ')}
          {!l.script && ' · solo video'}
        </span>
      </a>
    </li>
  )
}

export function Library({ title, intro, items, base }: { title: string; intro: string; items: Lesson[]; base: string }) {
  const [f, setF] = useState(emptyFilter)
  const [pending, setPending] = useState(false)
  const { learned } = useLearned()
  const tags = [...new Set(items.flatMap((l) => l.tags))].filter((t) => t !== 'tecnica' && t !== 'short') as Tag[]
  const shown = items.filter(
    (l) => matches({ ...f, q: norm(f.q) }, l.level, l.tags, norm(`${l.name} ${l.effect} ${l.method}`)) && (!pending || !learned.has(l.id)),
  )
  return (
    <main className="page">
      <header className="page-head">
        <h1>{title}</h1>
        <p>{intro}</p>
      </header>
      <Filters f={f} set={setF} tags={tags} count={shown.length}>
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
