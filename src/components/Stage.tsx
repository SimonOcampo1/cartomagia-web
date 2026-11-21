import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { longName, type CardId } from '../engine/cards.ts'
import { FACES } from '../engine/faces.ts'
import { CH, CW, H, W, type Frame, type HandPose, type Mark } from '../engine/scene.ts'
import { pos, type View } from '../engine/view.ts'

const EASE = [0.16, 1, 0.3, 1] as const // ease-out-expo
const TRAVEL = [0.65, 0, 0.35, 1] as const // ida y vuelta de un paquete que se abre
const THICK = 0.042 // grosor de una carta en unidades de tapete (52 cartas ≈ 1,7 cm sobre 6,3 cm de ancho)

const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
const faceUrl: Record<string, string> = Object.fromEntries(Object.entries(FACES).map(([id, svg]) => [id, svgUrl(svg)]))
const BACK = svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 334'>
<defs><pattern id='p' width='14' height='14' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'>
<rect width='14' height='14' fill='#a8291f'/><path d='M0 7h14M7 0v14' stroke='#d9584a' stroke-width='1.4'/><circle cx='7' cy='7' r='2' fill='#f1e3cf'/></pattern></defs>
<rect width='240' height='334' rx='12' fill='#f8f4ea'/><rect x='12' y='12' width='216' height='310' rx='6' fill='url(#p)'/>
<rect x='12' y='12' width='216' height='310' rx='6' fill='none' stroke='#7d1d16' stroke-width='2'/>
<rect x='18' y='18' width='204' height='298' rx='3' fill='none' stroke='#f1e3cf' stroke-width='1.5'/>
<ellipse cx='120' cy='167' rx='34' ry='46' fill='#a8291f' stroke='#f1e3cf' stroke-width='2'/>
<path d='M120 138l14 29-14 29-14-29z' fill='#f1e3cf'/></svg>`)

function CardFace({ id }: { id: CardId }) {
  return <span className="face front" style={{ backgroundImage: faceUrl[id] }} />
}

export function MiniCard({ id }: { id: CardId }) {
  return <span className="mini-card" role="img" aria-label={longName(id)} style={{ backgroundImage: faceUrl[id] }} />
}

function Hand({ pose, side, u, dur }: { pose: HandPose; side: 'l' | 'r'; u: number; dur: number }) {
  const above = pose.grip === 'above'
  return (
    <motion.svg
      className={`hand ${above ? 'above' : 'below'}`}
      viewBox="0 0 100 120"
      width={u * 17}
      height={u * 20.4}
      initial={false}
      animate={{ x: (pose.x - 8.5) * u, y: (pose.y - 6) * u, z: above ? u * 4 : -1, rotate: (pose.rot ?? 0) + (above ? 180 : 0), scaleX: side === 'l' ? 1 : -1 }}
      transition={{ duration: dur, ease: EASE }}
      aria-hidden
    >
      <path d="M30 118 C22 96 18 80 20 62 L22 40 C22 34 30 34 31 40 L33 58 L35 18 C35 11 44 11 45 18 L46 54 L49 10 C49 3 59 3 59 10 L59 54 L63 16 C63 9 72 9 72 16 L71 60 L78 44 C81 37 90 40 87 48 L76 82 C72 96 70 106 70 118 Z" />
    </motion.svg>
  )
}

type Gap = { delay: number; insert: boolean }
type Slot = { zone: string; at: number; fromTop: number }

/**
 * Inserciones y extracciones en medio de un paquete: las cartas de encima se levantan un momento
 * para que se vea el punto exacto. Solo con 1 o 2 cartas movidas; en mezclas y repartos sería ruido.
 */
function gapsOf(frame: Frame, prev: Frame | undefined, stagger: number) {
  const gaps: Record<CardId, Gap> = {}
  let slot: Slot | undefined
  const moved = Object.keys(frame.order)
  if (!prev || moved.length === 0 || moved.length > 2) return { gaps, slot }
  for (const c of moved) {
    const z = Object.keys(frame.zones).find((k) => frame.zones[k].includes(c))
    const pz = Object.keys(prev.zones).find((k) => prev.zones[k].includes(c))
    if (z) {
      const pile = frame.zones[z]
      const k = pile.indexOf(c)
      const above = pile.slice(k + 1).filter((x) => !(x in frame.order))
      if (above.length && pile.length >= 4 && !frame.geo[z].cols) {
        above.forEach((x) => (gaps[x] = { delay: frame.order[c] * stagger, insert: true }))
        slot = { zone: z, at: k, fromTop: pile.length - k }
      }
    }
    if (pz && pz !== z) {
      const pile = prev.zones[pz]
      const above = pile.slice(pile.indexOf(c) + 1).filter((x) => frame.zones[pz]?.includes(x) && !(x in frame.order))
      if (above.length && pile.length >= 4 && !prev.geo[pz].cols) above.forEach((x) => (gaps[x] ??= { delay: 0, insert: false }))
    }
  }
  return { gaps, slot }
}

type Props = {
  frame: Frame
  prev?: Frame
  step?: number
  clickable?: string[] // zonas cuyas cartas se pueden tocar
  onPick?: (c: CardId) => void
  xray?: boolean
  view?: View
  tilt?: boolean
  speed?: number
  instant?: boolean
}

export function Stage({ frame, prev, step = 0, clickable, onPick, xray = true, view = { x: 0, y: 0, w: W, h: H }, tilt = false, speed = 1, instant = false }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [u, setU] = useState(0)
  const reduce = useReducedMotion()
  useLayoutEffect(() => {
    const el = ref.current!
    const ro = new ResizeObserver(() => setU(el.clientWidth / view.w))
    ro.observe(el)
    return () => ro.disconnect()
  }, [view.w])

  const placed = useMemo(() => {
    const out: { id: CardId; x: number; y: number; rot: number; i: number; zone: string }[] = []
    for (const [zone, cards] of Object.entries(frame.zones)) {
      const g = frame.geo[zone]
      cards.forEach((id, i) => out.push({ id, ...pos(g, i), i, zone }))
    }
    return out.sort((a, b) => (a.id < b.id ? -1 : 1)) // claves estables entre pasos
  }, [frame])

  const still = reduce || instant
  const dur = still ? 0 : 0.75 / speed
  const movedCount = Object.keys(frame.order).length
  const stagger = still || movedCount < 2 ? 0 : Math.min(0.06, 1.6 / movedCount) / speed
  const { gaps, slot } = useMemo(() => gapsOf(frame, prev, stagger), [frame, prev, stagger])
  const wobble = (step % 2) * 0.001 // ponytail: cambia los keyframes en cada paso para que motion los vuelva a correr
  const cx = (view.x + view.w / 2) * u
  const cy = (view.y + view.h / 2) * u
  const slotGeo = slot && pos(frame.geo[slot.zone], slot.at)

  return (
    <div className={`stage ${tilt ? 'tilted' : ''}`} ref={ref} style={{ aspectRatio: `${view.w} / ${view.h}`, maxWidth: `calc((100svh - var(--stage-chrome, 300px)) * ${view.w / view.h})` }}>
      {u > 0 && (
        <div
          className="camera"
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            transform: `translate(${-view.x * u}px, ${-view.y * u}px)${tilt ? ' rotateX(40deg) scale(0.9)' : ''}`,
          }}
        >
          {Object.entries(frame.geo).map(([z, g]) =>
            g.label ? (
              <span key={z} className={`zone-label ${frame.zones[z].length ? '' : 'empty'}`} style={{ left: g.x * u, top: (g.y + Math.min(0, (frame.zones[z].length - 1) * (g.dy ?? 0))) * u, fontSize: Math.max(11, u * 1.5) }}>
                {g.label}
              </span>
            ) : null,
          )}
          <AnimatePresence>
            {slot && slotGeo && !still && (
              <motion.span
                key={`${step}-${slot.zone}`}
                className="slot"
                style={{ left: (slotGeo.x + CW + 0.8) * u, top: (slotGeo.y + CH / 2) * u, fontSize: Math.max(11, u * 1.4) }}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0, transition: { delay: dur * 0.5, duration: 0.3 } }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
              >
                ← entra {slot.fromTop}ª desde arriba
              </motion.span>
            )}
          </AnimatePresence>
          {frame.hands?.l && <Hand pose={frame.hands.l} side="l" u={u} dur={dur || 0.01} />}
          {frame.hands?.r && <Hand pose={frame.hands.r} side="r" u={u} dur={dur || 0.01} />}
          {placed.map((p) => {
            const mark: Mark | undefined = frame.marks[p.id]
            const canPick = clickable?.includes(p.zone)
            const order = frame.order[p.id]
            const gap = gaps[p.id]
            const x = p.x * u
            const y = p.y * u
            const z = p.i * THICK * u
            const delay = order !== undefined ? order * stagger : (gap?.delay ?? 0)
            let animate: Record<string, number | (number | null)[]> = { x, y, z, rotate: p.rot, scale: 1 }
            let transition: object = { duration: dur, ease: EASE, delay }
            if (!still && order !== undefined) {
              // la carta se levanta, viaja por encima de todo y se posa
              animate = { x, y, rotate: p.rot, z: [null, z + u * (4 + wobble), z], scale: [null, 1.07, 1] }
              transition = { duration: dur, delay, ease: EASE, z: { duration: dur, delay, times: [0, 0.4, 1] }, scale: { duration: dur, delay, times: [0, 0.4, 1] } }
            } else if (!still && gap) {
              // el paquete de encima se abre como un libro y vuelve a cerrar
              const t = { duration: dur * 1.25, delay: gap.insert ? Math.max(0, delay - dur * 0.15) : 0, times: [0, 0.45, 1], ease: TRAVEL }
              animate = { x: [null, x + CW * 0.18 * u, x], y: [null, y - CH * (0.22 + wobble) * u, y], z: [null, z + u * 2.2, z], rotate: [null, p.rot - 4, p.rot], scale: 1 }
              transition = t
            }
            return (
              <motion.button
                key={p.id}
                type="button"
                tabIndex={canPick ? 0 : -1}
                disabled={!canPick}
                aria-label={canPick ? `Elegir ${longName(p.id)}` : undefined}
                onClick={() => canPick && onPick?.(p.id)}
                className={`card ${xray && mark ? `m-${mark}` : ''} ${canPick ? 'pickable' : ''}`}
                style={{ width: CW * u, height: CH * u, fontSize: u * 1.9 }}
                initial={false}
                animate={animate}
                transition={transition}
              >
                <motion.span
                  className="flipper"
                  initial={false}
                  animate={{ rotateY: frame.up[p.id] ? 0 : 180 }}
                  transition={{ duration: dur * 0.9, ease: EASE, delay: delay + dur * 0.1 }}
                >
                  <CardFace id={p.id} />
                  <span className="face back" style={{ backgroundImage: BACK }} />
                </motion.span>
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}
