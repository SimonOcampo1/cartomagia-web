import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Pips } from '../components/Filters.tsx'
import { Icon } from '../components/Icons.tsx'
import { MiniCard, Stage, viewOf } from '../components/Stage.tsx'
import { VideoEmbed } from '../components/VideoEmbed.tsx'
import { runAuto } from '../engine/auto.ts'
import { veintiuna } from '../data/scripts.ts'
import { techniques, tricks } from '../data/lessons.ts'
import { LEVEL_NAME, yt, type Level } from '../data/types.ts'
import { videos } from '../data/videos.ts'
import { useLearned } from '../lib.ts'

const LEVELS: Level[] = ['P', 'I', 'A']
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

const prefersStill = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

function Hero() {
  const [seed, setSeed] = useState(7)
  const frames = useMemo(() => runAuto(veintiuna, seed), [seed])
  const [i, setI] = useState(1) // el primer cuadro ya con las cartas repartidas
  const [paused, setPaused] = useState(prefersStill) // el botón de pausa
  const [held, setHeld] = useState(false) // puntero o foco encima
  const [seen, setSeen] = useState(true) // fuera de pantalla no corre
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting))
    io.observe(ref.current!)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (paused || held || !seen) return
    const t = setTimeout(() => (i < frames.length - 1 ? setI(i + 1) : (setI(0), setSeed(seed + 1))), i === frames.length - 1 ? 4500 : 1700)
    return () => clearTimeout(t)
  }, [i, frames.length, seed, paused, held, seen])
  const view = useMemo(() => viewOf(frames), [frames])
  const f = frames[Math.min(i, frames.length - 1)]
  return (
    <section className="hero">
      <div className="pitch">
        <h1>De la primera carta al pase clásico.</h1>
        <p className="lead">
          {tricks.length} trucos y {techniques.length} técnicas, paso a paso, sobre un tapete animado.
        </p>
        <div className="cta">
          <a className="btn primary" href="#/truco/veintiuna">
            Empieza por las 21 cartas
          </a>
          <a className="btn quiet" href="#/trucos">
            Ver todos los trucos
          </a>
        </div>
      </div>
      <figure
        className="hero-table"
        ref={ref}
        onMouseEnter={() => setHeld(true)}
        onMouseLeave={() => setHeld(false)}
        onFocus={() => setHeld(true)}
        onBlur={() => setHeld(false)}
      >
        <div className={`table ${f.tone ?? ''}`}>
          <Stage frame={f} prev={frames[i - 1]} step={i} view={view} />
        </div>
        <figcaption>
          <button type="button" className="ibtn" onClick={() => setPaused(!paused)} aria-label={paused ? 'Seguir repartiendo' : 'Pausar el tapete'}>
            <Icon name={paused ? 'play' : 'pause'} />
          </button>
          <div className="hero-say">
            <small>
              Las 21 cartas, paso {i + 1} de {frames.length}
            </small>
            <span>{f.caption}</span>
          </div>
          {f.inset && (
            <span className="inset">
              {f.inset.label} <MiniCard id={f.inset.cards[0]} />
            </span>
          )}
        </figcaption>
      </figure>
    </section>
  )
}

function Route() {
  const { learned } = useLearned()
  const all = [...tricks, ...techniques]
  const [lv, setLv] = useState<Level>('P')
  const tabs = useRef<HTMLDivElement>(null)
  const onKey = (e: KeyboardEvent) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!d) return
    const next = LEVELS[(LEVELS.indexOf(lv) + d + 3) % 3]
    setLv(next)
    tabs.current?.querySelector<HTMLElement>(`#tab-${next}`)?.focus()
  }
  return (
    <section className="route">
      <div className="container">
        <header className="head">
          <h2>La ruta</h2>
          <p className="lead">
            Tres niveles. Cada uno combina trucos y las técnicas que necesitan.{' '}
            {learned.size > 0 && (
              <strong>
                Llevas {learned.size} de {all.length}.
              </strong>
            )}
          </p>
        </header>
        <div className="route-tabs" role="tablist" aria-label="Nivel" ref={tabs} onKeyDown={onKey}>
          {LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              id={`tab-${l}`}
              aria-selected={l === lv}
              aria-controls={`ruta-${l}`}
              tabIndex={l === lv ? 0 : -1}
              onClick={() => setLv(l)}
            >
              <Pips level={l} />
              {LEVEL_NAME[l]}
              <span className="num">{all.filter((x) => x.level === l).length}</span>
            </button>
          ))}
        </div>
        {LEVELS.map((l) => (
          <div key={l} className="route-panel" role="tabpanel" id={`ruta-${l}`} aria-labelledby={`tab-${l}`} hidden={l !== lv}>
            <p className="route-blurb">{LEVEL_BLURB[l]}</p>
            <ol className="route-list">
              {all
                .filter((x) => x.level === l)
                .map((x) => (
                  <li key={x.id}>
                    <a href={`#/${tricks.includes(x) ? 'truco' : 'tecnica'}/${x.id}`}>
                      <span className="name">{x.name}</span>
                      <span className="kind">
                        {tricks.includes(x) ? 'Truco' : 'Técnica'}
                        {x.minutes && <span className="num">, ~{x.minutes} min</span>}
                      </span>
                      {learned.has(x.id) && <span className="done">aprendido</span>}
                    </a>
                  </li>
                ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  )
}

export function Home() {
  return (
    <main>
      <Hero />
      <Route />
      <section className="promise">
        <div className="container">
          <p>En los automáticos el tapete reparte de verdad: tú eliges la carta y el truco tiene que funcionar.</p>
        </div>
      </section>
      <section className="reel">
        <div className="container head split">
          <h2>{videos.length} tutoriales en video</h2>
          <p className="lead">
            Filtrables por nivel, tipo de truco, canal e idioma. <a href="#/videos">Abrir la videoteca</a>
          </p>
        </div>
        <ul className="rail" tabIndex={0} aria-label="Tutoriales para empezar">
          {videos
            .filter((v) => v.level === 'P')
            .slice(0, 8)
            .map((v) => (
              <li key={v.id}>
                <VideoEmbed v={v} />
              </li>
            ))}
        </ul>
      </section>
      <section className="sources">
        <div className="container">
          <header className="head">
            <h2>Para seguir</h2>
            <p className="lead">Cuando el tapete se te quede chico: libros que todo cartomago tiene y canales de calidad.</p>
          </header>
          <div className="sources-cols">
            <ol className="books">
              {BOOKS.map(([t, a, d]) => (
                <li key={t}>
                  <cite>{t}</cite>
                  <span>{a}</span>
                  <p>{d}</p>
                </li>
              ))}
            </ol>
            <div className="channels">
              <h3>Canales</h3>
              <ul>
                {CHANNELS.map((c) => (
                  <li key={c}>
                    <a href={yt(c + ' card magic')} target="_blank" rel="noreferrer">
                      {c}
                      <Icon name="external" />
                    </a>
                  </li>
                ))}
                <li>
                  <a href="#/videos">Toda la videoteca</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
