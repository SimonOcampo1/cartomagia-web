/// <reference types="node" />
// Autoverificación de los guiones: `node src/engine/check.ts`. Responde bien a cada pregunta y exige final con éxito.
import { rng } from './cards.ts'
import { run, type ScriptFn } from './scene.ts'
import * as S from '../data/scripts.ts'

function play(fn: ScriptFn, seed: number) {
  const r = rng(seed * 7919)
  const answers: string[] = []
  for (let guard = 0; guard < 20; guard++) {
    const frames = run(fn, answers, rng(seed))
    const last = frames.at(-1)!
    const a = last.ask
    if (!a || a.answer !== undefined) return last
    if (a.kind === 'card') {
      const pool = a.among.flatMap((z) => last.zones[z])
      answers.push(pool[Math.floor(r() * pool.length)])
    } else {
      const chosen = Object.keys(last.marks).find((c) => last.marks[c] === 'chosen')
      const col = a.options.find((o) => chosen && last.zones[o.value]?.includes(chosen))
      if (col) answers.push(col.value)
      else if (a.prompt.includes('fila')) {
        const rows = Object.keys(last.zones).filter((z) => /^g\d\d$/.test(z) && last.marks[last.zones[z][0]] === 'chosen').map((z) => +z[1]).sort()
        answers.push(`${rows[0]}${rows[1]}`)
      } else answers.push(a.options[Math.floor(r() * a.options.length)].value)
    }
  }
  throw new Error('demasiadas preguntas')
}

const flaky = new Set(['kruskal']) // probabilístico por diseño
const demos = new Set(['overhand', 'riffleTec']) // sin desenlace
let fails = 0
for (const [name, fn] of Object.entries(S)) {
  let wins = 0
  const N = 200
  for (let seed = 1; seed <= N; seed++) if (play(fn as ScriptFn, seed).tone === 'win') wins++
  const ok = demos.has(name) || (flaky.has(name) ? wins > N * 0.6 : wins === N)
  if (!ok) fails++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(18)} ${wins}/${N}`)
}
process.exit(fails ? 1 : 0)
