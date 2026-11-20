import { useEffect, useMemo, useState } from 'react'
import { Stage } from '../components/Stage.tsx'
import { rng } from '../engine/cards.ts'
import { run } from '../engine/scene.ts'
import { corteCruzado } from '../data/scripts.ts'
import { techniques, tricks } from '../data/lessons.ts'
import { LEVEL_NAME, yt, type Level } from '../data/types.ts'
import { videos } from '../data/videos.ts'
import { useLearned } from '../lib.ts'
import { LessonRow } from './Library.tsx'

const LEVEL_BLURB: Record<Level, string> = {
  P: 'Trucos que funcionan solos. Sin preparación, con cualquier mazo prestado. Aquí aprendes a presentar.',
  I: 'Primeros juegos de manos, mazos ordenados y principios matemáticos que parecen imposibles.',
  A: 'Matemática fina, códigos con asistente y las técnicas que separan al aficionado del cartomago.',
}

const BOOKS = [
  ['Self-Working Card Tricks', 'Karl Fulves', 'El mejor punto de partida para trucos automáticos.'],
  ['Gran Escuela Cartomágica', 'Roberto Giobbi', 'El curso completo de técnica, en español.'],
  ['The Royal Road to Card Magic', 'Hugard y Braue', 'Clásico paso a paso, de la mezcla al pase.'],
  ['Magical Mathematics', 'Diaconis y Graham', 'Gilbreath, Si Stebbins y la matemática detrás.'],
  ['La magia de Ascanio', 'Arturo de Ascanio', 'Teoría y psicología de la escuela española.'],
]
const CHANNELS = ['Julio Ribera', 'Santi Marcilla', 'A Million Card Tricks', 'Matt McGurk', 'Steven Taputoro', '52Kards']

function Hero() {
  const [seed, setSeed] = useState(7)
  const frames = useMemo(() => run(corteCruzado, [], rng(seed)), [seed])
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => (i < frames.length - 1 ? setI(i + 1) : (setI(0), setSeed(seed + 1))), i === frames.length - 1 ? 4000 : 2000)
    return () => clearTimeout(t)
  }, [i, frames.length, seed])
  const f = frames[Math.min(i, frames.length - 1)]
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="kicker">Escuela de cartomagia</p>
        <h1>
          Aprende a hacer magia con un mazo, <em>de la primera carta al pase clásico.</em>
        </h1>
        <p className="lead">
          {tricks.length} trucos y {techniques.length} técnicas explicados paso a paso sobre un tapete animado. En los automáticos el tapete reparte de verdad: tú eliges la carta y el truco tiene que funcionar. Además, {videos.length} tutoriales en video, filtrables.
        </p>
        <div className="cta">
          <a className="btn primary" href="#/truco/veintiuna">
            Empieza por las 21 cartas
          </a>
          <a className="btn" href="#/trucos">
            Ver todos los trucos
          </a>
        </div>
      </div>
      <figure className="hero-table">
        <div className={`table ${f.tone ?? ''}`}>
          <Stage frame={f} />
        </div>
        <figcaption>
          <span>Ahora en el tapete · Predicción con corte cruzado</span>
          {f.caption}
        </figcaption>
      </figure>
    </section>
  )
}

export function Home() {
  const { learned } = useLearned()
  const all = [...tricks, ...techniques]
  return (
    <main>
      <Hero />
      <section className="route page">
        <header className="section-head">
          <h2>La ruta</h2>
          <p>
            Tres niveles. Cada uno combina trucos y las técnicas que necesitan.{' '}
            {learned.size > 0 && (
              <strong>
                Llevas {learned.size} de {all.length}.
              </strong>
            )}
          </p>
        </header>
        {(['P', 'I', 'A'] as Level[]).map((lv, n) => (
          <div key={lv} className={`level lv-${lv}`}>
            <div className="level-head">
              <span className="level-num">{['I', 'II', 'III'][n]}</span>
              <h3>{LEVEL_NAME[lv]}</h3>
              <p>{LEVEL_BLURB[lv]}</p>
            </div>
            <ul className="lessons">
              {all
                .filter((l) => l.level === lv)
                .map((l) => (
                  <LessonRow key={l.id} l={l} base={tricks.includes(l) ? 'truco' : 'tecnica'} learned={learned.has(l.id)} />
                ))}
            </ul>
          </div>
        ))}
      </section>
      <section className="sources page">
        <header className="section-head">
          <h2>Para seguir</h2>
          <p>Cuando el tapete se te quede chico: libros que todo cartomago tiene y canales de calidad.</p>
        </header>
        <div className="sources-cols">
          <ol className="books">
            {BOOKS.map(([t, a, d]) => (
              <li key={t}>
                <cite>{t}</cite> <span>{a}</span>
                <p>{d}</p>
              </li>
            ))}
          </ol>
          <ul className="channels">
            {CHANNELS.map((c) => (
              <li key={c}>
                <a href={yt(c + ' card magic')} target="_blank" rel="noreferrer">
                  {c} ↗
                </a>
              </li>
            ))}
            <li>
              <a href="#/videos">Toda la videoteca →</a>
            </li>
          </ul>
        </div>
      </section>
    </main>
  )
}
