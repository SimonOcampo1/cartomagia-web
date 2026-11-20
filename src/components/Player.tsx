import { useEffect, useMemo, useState } from 'react'
import { rng, short } from '../engine/cards.ts'
import { run, type ScriptFn } from '../engine/scene.ts'
import { Stage } from './Stage.tsx'

const newSeed = () => Math.floor(Math.random() * 1e9)

export function Player({ script, sim }: { script: ScriptFn; sim?: boolean }) {
  const [seed, setSeed] = useState(newSeed)
  const [answers, setAnswers] = useState<string[]>([])
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [xray, setXray] = useState(true)
  const frames = useMemo(() => run(script, answers, rng(seed)), [script, answers, seed])
  const i = Math.min(idx, frames.length - 1)
  const f = frames[i]
  const waiting = f.ask && f.ask.answer === undefined
  const atEnd = i === frames.length - 1 && !waiting

  useEffect(() => {
    if (!playing) return
    if (waiting || atEnd) return setPlaying(false)
    const t = setTimeout(() => setIdx(i + 1), 2300)
    return () => clearTimeout(t)
  }, [playing, i, waiting, atEnd])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select, button')) return
      if (e.key === 'ArrowRight' && !waiting) setIdx(Math.min(i + 1, frames.length - 1))
      if (e.key === 'ArrowLeft') setIdx(Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [i, frames.length, waiting])

  const answer = (v: string) => {
    setAnswers([...answers, v])
    setIdx(i + 1)
  }
  const restart = (reshuffle: boolean) => {
    if (reshuffle) setSeed(newSeed())
    setAnswers([])
    setIdx(0)
    setPlaying(false)
  }

  return (
    <section className="player" aria-label="Demostración paso a paso">
      <div className={`table ${f.tone ?? ''}`}>
        <Stage frame={f} xray={xray} clickable={waiting && f.ask?.kind === 'card' ? f.ask.among : undefined} onPick={answer} />
      </div>
      <div className="caption" aria-live="polite">
        <span className="step">
          Paso {i + 1}
          {!(frames.at(-1)!.ask && frames.at(-1)!.ask!.answer === undefined) && <small> de {frames.length}</small>}
        </span>
        <div>
          <p className={`say ${f.tone ?? ''}`}>{f.caption}</p>
          {f.note && <p className="note">{f.note}</p>}
          {f.ask?.answer !== undefined && (
            <p className="note">Respuesta: {f.ask.kind === 'card' ? short(f.ask.answer) : (f.ask.kind === 'choice' && f.ask.options.find((o) => o.value === f.ask!.answer)?.label)}</p>
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
          {waiting && f.ask?.kind === 'card' && <p className="hint">Toca una carta en el tapete.</p>}
        </div>
      </div>
      <div className="controls">
        <button type="button" onClick={() => setIdx(Math.max(i - 1, 0))} disabled={i === 0} aria-label="Paso anterior">
          ←
        </button>
        <button type="button" className="primary" onClick={() => (atEnd ? restart(false) : setPlaying(!playing))} disabled={waiting}>
          {atEnd ? 'Repetir' : playing ? 'Pausa' : 'Reproducir'}
        </button>
        <button type="button" onClick={() => setIdx(i + 1)} disabled={waiting || atEnd} aria-label="Paso siguiente">
          →
        </button>
        <input
          type="range"
          min={0}
          max={frames.length - 1}
          value={i}
          onChange={(e) => setIdx(+e.target.value)}
          aria-label="Ir al paso"
        />
        {sim && (
          <button type="button" onClick={() => restart(true)}>
            Nueva mezcla
          </button>
        )}
        <label className="xray">
          <input type="checkbox" checked={xray} onChange={(e) => setXray(e.target.checked)} />
          Visión de mago
        </label>
      </div>
    </section>
  )
}
