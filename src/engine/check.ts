/// <reference types="node" />
// Autoverificación de los guiones: `node src/engine/check.ts`. Responde bien a cada pregunta y exige final con éxito.
import { runAuto } from './auto.ts'
import type { ScriptFn } from './scene.ts'
import * as S from '../data/scripts.ts'

const play = (fn: ScriptFn, seed: number) => runAuto(fn, seed).at(-1)!

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
