import type { Level } from '../data/types.ts'

/** Nivel como medidor de una, dos o tres barras; el nombre del nivel va siempre al lado. */
export function Pips({ level }: { level: Level }) {
  return (
    <span className={`pips lv-${level}`} aria-hidden>
      <i />
      <i />
      <i />
    </span>
  )
}
