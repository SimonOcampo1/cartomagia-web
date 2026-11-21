import { useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { autoAnswer } from '../engine/auto.ts'
import { rng, short } from '../engine/cards.ts'
import { run, type Frame, type ScriptFn } from '../engine/scene.ts'
import { viewOf } from '../engine/view.ts'
import { Icon } from './Icons.tsx'
import { MiniCard, Stage } from './Stage.tsx'

const newSeed = () => Math.floor(Math.random() * 1e9)
const SPEEDS = [0.5, 1, 1.5, 2]
/** Lo que dura un paso en pantalla: más texto, más tiempo para leerlo. */
const dwell = (f: Frame, speed: number) => Math.max(1900, 1000 + f.caption.length * 26) / speed

const answerLabel = (f: Frame) => {
  const a = f.ask!
  return a.kind === 'card' ? short(a.answer!) : a.options.find((o) => o.value === a.answer)?.label
}

export function Player({ script, sim, tilt3d = false }: { script: ScriptFn; sim?: boolean; tilt3d?: boolean }) {
  const [seed, setSeed] = useState(newSeed)
  const [answers, setAnswers] = useState<string[]>([])
  const [auto, setAuto] = useState<number[]>([]) // índices de respuestas elegidas por el tapete
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [instant, setInstant] = useState(false)
  const [xray, setXray] = useState(true)
  const [tilt, setTilt] = useState(tilt3d)
  const [speed, setSpeed] = useState(1)
  const frames = useMemo(() => run(script, answers, rng(seed)), [script, answers, seed])
  const view = useMemo(() => viewOf(frames), [frames])
  const i = Math.min(idx, frames.length - 1)
  const f = frames[i]
  const waiting = f.ask && f.ask.answer === undefined
  const atEnd = i === frames.length - 1 && !waiting
  const open = !!(frames.at(-1)!.ask && frames.at(-1)!.ask!.answer === undefined) // guion cortado en una pregunta
  const r = useRef(rng(seed))
  const listRef = useRef<HTMLOListElement>(null)
  const playerRef = useRef<HTMLElement>(null)
  const [theater, setTheater] = useState(false)
  const reduce = useReducedMotion()

  const answer = (v: string, byTable = false) => {
    if (byTable) setAuto([...auto, answers.length])
    setAnswers([...answers, v])
    setIdx(i + 1)
  }

  // reproducción continua: si el tapete espera una respuesta, la da él tras una pausa
  useEffect(() => {
    if (!playing) return
    if (atEnd) return setPlaying(false)
    const t = setTimeout(() => (waiting ? answer(autoAnswer(f, r.current), true) : setIdx(i + 1)), waiting ? 2600 / speed : dwell(f, speed))
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- answer() cambia en cada render; el paso lo fijan i y frames
  }, [playing, i, frames, waiting, atEnd, speed])

  /** Ver un paso con su animación: se coloca el anterior sin animar y se anima hasta este. */
  const goTo = (n: number) => {
    setPlaying(false)
    if (n === 0) return setIdx(0)
    setInstant(true)
    setIdx(n - 1)
    requestAnimationFrame(() => requestAnimationFrame(() => (setInstant(false), setIdx(n))))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select, button, a')) return
      if (e.key === 'ArrowRight' && !waiting && !atEnd) goTo(i + 1)
      else if (e.key === 'ArrowLeft') setIdx(Math.max(i - 1, 0))
      else if (e.key === ' ') setPlaying(!playing)
      else if (e.key.toLowerCase() === 'r') goTo(i)
      else if (e.key.toLowerCase() === 'f') void toggleTheater()
      else if (e.key === 'Escape' && theater) void toggleTheater()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // centra el paso actual moviendo solo la lista: scrollIntoView arrastraba la página entera
  useEffect(() => {
    const list = listRef.current
    const el = list?.querySelector<HTMLElement>('[aria-current="step"]')
    if (list && el) list.scrollTo({ top: el.offsetTop - (list.clientHeight - el.offsetHeight) / 2, behavior: reduce ? 'auto' : 'smooth' })
  }, [i, reduce, theater])

  // pantalla completa: el reproductor ocupa toda la pantalla; donde la API no existe (iPhone), igual se superpone
  const toggleTheater = async () => {
    const el = playerRef.current!
    if (theater) {
      setTheater(false)
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {})
      return
    }
    setTheater(true)
    if (!el.requestFullscreen) return
    try {
      await el.requestFullscreen({ navigationUI: 'hide' })
      await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape')
    } catch {
      /* sin pantalla completa o sin bloqueo de orientación: queda la superposición */
    }
  }
  // al dar play, la página se acomoda para que tapete y paso se vean juntos
  useEffect(() => {
    const el = playerRef.current
    if (!playing || theater || !el) return
    const r = el.getBoundingClientRect()
    const nav = document.querySelector('.topbar')?.getBoundingClientRect().bottom ?? 0
    if (r.top < nav || r.bottom > innerHeight) el.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al arrancar la reproducción
  }, [playing])

  useEffect(() => {
    const onChange = () => !document.fullscreenElement && setTheater(false)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const restart = (reshuffle: boolean) => {
    if (reshuffle) {
      const s = newSeed()
      setSeed(s)
      r.current = rng(s)
    }
    setAnswers([])
    setAuto([])
    setIdx(0)
    setPlaying(false)
  }

  const askIndex = (n: number) => frames.slice(0, n).filter((x) => x.ask).length
  const steps = (
    <ol className="steps" ref={listRef}>
      {frames.map((fr, n) => (
        <li key={n}>
          <button type="button" aria-current={n === i ? 'step' : undefined} className={n < i ? 'past' : ''} onClick={() => goTo(n)}>
            <span className="n">{n + 1}</span>
            <span className="t">
              {fr.caption}
              {fr.ask?.answer !== undefined && (
                <em>
                  {answerLabel(fr)}
                  {auto.includes(askIndex(n)) && ', al azar'}
                </em>
              )}
            </span>
          </button>
        </li>
      ))}
      {open && <li className="more">Responde para ver el resto del truco.</li>}
    </ol>
  )

  return (
    <section className={`player ${theater ? 'theater' : ''}`} ref={playerRef} aria-label="Demostración paso a paso">
      <div className="player-main">
        <div className={`table ${f.tone ?? ''}`}>
          <Stage
            frame={f}
            prev={frames[i - 1]}
            step={i}
            view={view}
            xray={xray}
            tilt={tilt}
            speed={speed}
            instant={instant}
            clickable={waiting && f.ask?.kind === 'card' ? f.ask.among : undefined}
            onPick={(c) => answer(c)}
          />
        </div>

        <div className="transport">
          <div className="timeline" role="group" aria-label="Pasos">
            {frames.map((fr, n) => (
              <button
                key={n}
                type="button"
                className={`seg ${n < i ? 'past' : ''} ${n === i ? 'now' : ''} ${n === i && playing && !waiting ? 'playing' : ''} ${fr.ask ? 'ask' : ''}`}
                aria-label={`Paso ${n + 1}`}
                onClick={() => goTo(n)}
              >
                {n === i && playing && !waiting && <span key={`${i}-${speed}`} className="fill" style={{ animationDuration: `${dwell(f, speed)}ms` }} />}
              </button>
            ))}
            {open && <span className="seg rest" aria-hidden />}
          </div>
          <div className="buttons">
            <div className="tools left">
              <button type="button" className="ibtn" onClick={() => goTo(i)} aria-label="Repetir este paso" title="Repetir este paso (R)">
                <Icon name="replay" />
              </button>
              <button type="button" className="tbtn" onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])} aria-label={`Velocidad ${speed}×`} title="Velocidad">
                {speed}×
              </button>
              <div className="dim" role="group" aria-label="Vista del tapete">
                <button type="button" aria-pressed={!tilt} onClick={() => setTilt(false)}>
                  2D
                </button>
                <button type="button" aria-pressed={tilt} onClick={() => setTilt(true)}>
                  <Icon name="cube" />
                  3D
                </button>
              </div>
            </div>
            <button
              type="button"
              className="play-all"
              onClick={() => (atEnd ? (restart(false), setPlaying(true)) : setPlaying(!playing))}
              title="Reproducir o pausar (espacio)"
            >
              <Icon name={atEnd ? 'replay' : playing ? 'pause' : 'play'} />
              <span className="play-label">{atEnd ? 'Ver de nuevo' : playing ? 'Pausa' : 'Reproducir todo'}</span>
            </button>
            <div className="tools right">
              <button type="button" className="ibtn" aria-pressed={xray} onClick={() => setXray(!xray)} aria-label="Visión de mago: marcar las cartas clave" title="Visión de mago">
                <Icon name="eye" />
              </button>
              {sim && (
                <button type="button" className="ibtn" onClick={() => restart(true)} aria-label="Nueva mezcla" title="Nueva mezcla">
                  <Icon name="shuffle" />
                </button>
              )}
              <button
                type="button"
                className="ibtn"
                aria-pressed={theater}
                onClick={() => void toggleTheater()}
                aria-label={theater ? 'Salir de pantalla completa' : 'Pantalla completa'}
                title="Pantalla completa (F)"
              >
                <Icon name={theater ? 'collapse' : 'expand'} />
              </button>
            </div>
          </div>
        </div>

        <div className="stepper">
          <div className="caption" aria-live="polite">
            <div className="caption-body" key={i}>
              {f.inset && xray && (
                <div className="inset">
                  <span>{f.inset.label}</span>
                  {f.inset.cards.map((c) => (
                    <MiniCard key={c} id={c} />
                  ))}
                </div>
              )}
              <p className={`say ${f.tone ?? ''}`}>{f.caption}</p>
              {i === 0 && !playing && <p className="hint">Avanza a tu ritmo con Siguiente, o mira el truco de corrido con el botón de reproducir.</p>}
              {f.note && <p className="note">{f.note}</p>}
              {f.ask?.answer !== undefined && (
                <p className="note">
                  Respuesta: {answerLabel(f)}
                  {auto.includes(askIndex(i)) && ', elegida al azar por el tapete'}
                </p>
              )}
              {waiting && f.ask?.kind === 'choice' && (
                <div className={`choices ${f.ask.options.length > 12 ? 'dense' : ''}`}>
                  {f.ask.options.map((o) => (
                    <button key={o.value} type="button" onClick={() => answer(o.value)}>
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
              {waiting && f.ask?.kind === 'card' && <p className="hint">Toca una carta en el tapete{playing ? ', o espera y elige el tapete.' : '.'}</p>}
              {waiting && f.ask?.kind === 'choice' && playing && <p className="hint">Si no eliges, el tapete elige por ti.</p>}
            </div>
          </div>
          <div className="step-row">
            <button type="button" className="arrow" onClick={() => setIdx(Math.max(i - 1, 0))} disabled={i === 0} title="Paso anterior (←)">
              <Icon name="chevron-left" />
              <span className="arrow-label">Anterior</span>
            </button>
            <span className="step-n">
              {open ? (
                <>
                  Paso <b>{i + 1}</b>
                </>
              ) : (
                <>
                  <b>{i + 1}</b> de {frames.length}
                </>
              )}
            </span>
            <button type="button" className="arrow next" onClick={() => goTo(i + 1)} disabled={waiting || atEnd} title="Paso siguiente (→)">
              <span className="arrow-label">Siguiente</span>
              <Icon name="chevron-right" />
            </button>
          </div>
        </div>
      </div>

      <aside className="steps-panel" aria-label="Todos los pasos">
        <h2>Pasos</h2>
        {steps}
      </aside>
    </section>
  )
}
