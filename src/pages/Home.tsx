import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { Pips } from '../components/Pips.tsx'
import { BACK, faceUrl } from '../components/cardArt.ts'
import { Icon } from '../components/Icons.tsx'
import { VideoEmbed } from '../components/VideoEmbed.tsx'
import { newDeck } from '../engine/cards.ts'
import { techniques, tricks } from '../data/lessons.ts'
import { LEVEL_NAME, yt, type Level } from '../data/types.ts'
import { videos } from '../data/videos.ts'
import { useLearned } from '../lib/hooks.ts'

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

// la baraja en orden de fábrica: el abanico se lee como un mazo nuevo
const DECK = newDeck()
const SPAN = 180 // grados del abanico, de un costado al otro por debajo del título

/** Las 52 cartas se abren en abanico y se dan vuelta en cascada; tocarlo repite la vuelta. */
function Fan() {
  const [still] = useState(prefersStill)
  const [up, setUp] = useState(still)
  useEffect(() => {
    if (still) return
    const t = setTimeout(() => setUp(true), 1200)
    return () => clearTimeout(t)
  }, [still])
  return (
    <button type="button" className={`fan ${up ? 'up' : ''}`} onClick={() => setUp(!up)} aria-label={up ? 'Dar vuelta la baraja boca abajo' : 'Dar vuelta la baraja boca arriba'}>
      {DECK.map((c, i) => (
        <span key={c} className="fc" style={{ '--a': `${SPAN / 2 - (SPAN * i) / (DECK.length - 1)}deg`, '--i': i } as CSSProperties}>
          <span className="lift">
            <span className="flip">
              <span className="face front" style={{ backgroundImage: faceUrl[c] }} />
              <span className="face back" style={{ backgroundImage: BACK }} />
            </span>
          </span>
        </span>
      ))}
    </button>
  )
}

function Hero() {
  return (
    <section className="hero">
      <h1>De la primera carta al pase clásico.</h1>
      <p className="lead">
        {tricks.length} trucos y {techniques.length} técnicas, paso a paso, sobre un tapete animado.
      </p>
      <div className="bowl">
        <Fan />
        <button type="button" className="cue" aria-label="Bajar a la ruta" onClick={() => document.getElementById('ruta')?.scrollIntoView({ behavior: prefersStill() ? 'auto' : 'smooth' })}>
          <svg viewBox="0 0 64 22" width="64" height="22" aria-hidden>
            <path d="M3 4l29 14L61 4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="cta">
        <a className="btn primary" href="#/truco/veintiuna">
          Empieza por las 21 cartas
        </a>
        <a className="btn quiet" href="#/trucos">
          Ver todos los trucos
        </a>
      </div>
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
    <section className="route" id="ruta">
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
