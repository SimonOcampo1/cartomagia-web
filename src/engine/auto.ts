import { rng, type Rand } from './cards.ts'
import { run, type Frame, type ScriptFn } from './scene.ts'

/** Respuesta de un espectador honesto: sigue a su carta elegida; si no hay pista, elige al azar. */
export function autoAnswer(last: Frame, r: Rand): string {
  const a = last.ask!
  if (a.kind === 'card') {
    const pool = a.among.flatMap((z) => last.zones[z])
    return pool[Math.floor(r() * pool.length)]
  }
  const chosen = Object.keys(last.marks).find((c) => last.marks[c] === 'chosen')
  const col = a.options.find((o) => chosen && last.zones[o.value]?.includes(chosen))
  if (col) return col.value
  if (a.prompt.includes('fila')) {
    const rows = Object.keys(last.zones)
      .filter((z) => /^g\d\d$/.test(z) && last.marks[last.zones[z][0]] === 'chosen')
      .map((z) => +z[1])
      .sort()
    return `${rows[0]}${rows[1]}`
  }
  return a.options[Math.floor(r() * a.options.length)].value
}

/** Guion completo, respondiendo solo cada pregunta. */
export function runAuto(fn: ScriptFn, seed: number): Frame[] {
  const r = rng(seed * 7919)
  const answers: string[] = []
  for (let guard = 0; guard < 20; guard++) {
    const frames = run(fn, answers, rng(seed))
    const a = frames.at(-1)!.ask
    if (!a || a.answer !== undefined) return frames
    answers.push(autoAnswer(frames.at(-1)!, r))
  }
  throw new Error('demasiadas preguntas')
}
