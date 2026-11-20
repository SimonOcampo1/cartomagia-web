import { motion, useReducedMotion } from 'motion/react'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { isRed, rankOf, SUIT_GLYPH, suitOf, type CardId } from '../engine/cards.ts'
import { CH, CW, H, W, type Frame, type Geo, type HandPose, type Mark } from '../engine/scene.ts'

const EASE = [0.16, 1, 0.3, 1] as const // ease-out-expo

function pos(g: Geo, i: number) {
  if (g.cols) return { x: g.x + (i % g.cols) * (g.dx ?? 0), y: g.y + Math.floor(i / g.cols) * (g.rowDy ?? CH + 2), rot: g.rot ?? 0 }
  return { x: g.x + i * (g.dx ?? 0), y: g.y + i * (g.dy ?? 0), rot: g.rot ?? 0 }
}

export function CardFace({ id }: { id: CardId }) {
  const r = rankOf(id)
  const g = SUIT_GLYPH[suitOf(id)]
  const court = r === 'J' || r === 'Q' || r === 'K'
  return (
    <div className={`face front ${isRed(id) ? 'red' : 'black'}`}>
      <span className="idx tl">
        {r}
        <i>{g}</i>
      </span>
      <span className={`pip ${court ? 'court' : ''}`}>{court ? r : g}</span>
      <span className="idx br">
        {r}
        <i>{g}</i>
      </span>
    </div>
  )
}

export function MiniCard({ id }: { id: CardId }) {
  return (
    <span className="mini-card" aria-label={id}>
      <CardFace id={id} />
    </span>
  )
}

function Hand({ pose, side, u }: { pose: HandPose; side: 'l' | 'r'; u: number }) {
  const above = pose.grip === 'above'
  return (
    <motion.svg
      className={`hand ${above ? 'above' : 'below'}`}
      viewBox="0 0 100 120"
      width={u * 17}
      height={u * 20.4}
      initial={false}
      animate={{ x: (pose.x - 8.5) * u, y: (pose.y - 6) * u, rotate: (pose.rot ?? 0) + (above ? 180 : 0), scaleX: side === 'l' ? 1 : -1 }}
      transition={{ duration: 0.6, ease: EASE }}
      aria-hidden
    >
      <path d="M30 118 C22 96 18 80 20 62 L22 40 C22 34 30 34 31 40 L33 58 L35 18 C35 11 44 11 45 18 L46 54 L49 10 C49 3 59 3 59 10 L59 54 L63 16 C63 9 72 9 72 16 L71 60 L78 44 C81 37 90 40 87 48 L76 82 C72 96 70 106 70 118 Z" />
    </motion.svg>
  )
}

export type View = { x: number; y: number; w: number; h: number }

/** Encuadre que contiene todo lo que pasa en el truco: el tapete se ajusta en vez de dejar paño vacío. */
export function viewOf(frames: Frame[]): View {
  let [x0, y0, x1, y1] = [W, H, 0, 0]
  const add = (x: number, y: number, w: number, h: number) => {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + w); y1 = Math.max(y1, y + h)
  }
  for (const f of frames) {
    for (const [z, cards] of Object.entries(f.zones)) {
      const g = f.geo[z]
      add(g.x, g.y, CW, CH) // la zona cuenta aunque esté vacía: el encuadre no salta
      if (g.label) add(g.x, g.y - 3, 10, 3)
      cards.forEach((_, i) => {
        const p = pos(g, i)
        const r = p.rot ? CH : 0 // girada: reservar el lado largo
        add(p.x - r / 4, p.y - r / 4, CW + r / 2, CH)
      })
    }
    for (const h of [f.hands?.l, f.hands?.r]) if (h) add(h.x - 8.5, h.y - 6, 17, 20.4)
  }
  const pad = 3
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W, x1 + pad); y1 = Math.min(H, y1 + pad)
  // no más apaisado que 2:1 ni más alto que 4:3
  let w = x1 - x0, h = y1 - y0
  if (w / h > 2) { const nh = w / 2; y0 = Math.max(0, y0 - (nh - h) / 2); h = Math.min(nh, H - y0) }
  if (h / w > 0.75) { const nw = h / 0.75; x0 = Math.max(0, x0 - (nw - w) / 2); w = Math.min(nw, W - x0) }
  return { x: x0, y: y0, w, h }
}

type Props = {
  frame: Frame
  clickable?: string[] // zonas cuyas cartas se pueden tocar
  onPick?: (c: CardId) => void
  xray?: boolean
  view?: View
}

export function Stage({ frame, clickable, onPick, xray = true, view = { x: 0, y: 0, w: W, h: H } }: Props) {
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
    const out: { id: CardId; x: number; y: number; rot: number; z: number; zone: string }[] = []
    Object.entries(frame.zones).forEach(([zone, cards], zi) => {
      const g = frame.geo[zone]
      cards.forEach((id, i) => out.push({ id, ...pos(g, i), z: zi * 100 + i, zone }))
    })
    return out.sort((a, b) => (a.id < b.id ? -1 : 1)) // claves estables entre pasos
  }, [frame])

  const movedCount = Object.keys(frame.order).length
  const stagger = movedCount > 1 ? Math.min(0.045, 1.4 / movedCount) : 0

  return (
    <div className="stage" ref={ref} style={{ aspectRatio: `${view.w} / ${view.h}`, maxWidth: `calc((100svh - 300px) * ${view.w / view.h})` }}>
      {u > 0 && (
        <div className="camera" style={{ transform: `translate(${-view.x * u}px, ${-view.y * u}px)` }}>
          {Object.entries(frame.geo).map(([z, g]) =>
            g.label ? (
              <span key={z} className="zone-label" style={{ left: g.x * u, top: (g.y - 2.6) * u, fontSize: Math.max(10, u * 1.5) }}>
                {g.label}
              </span>
            ) : null,
          )}
          {frame.hands?.l && <Hand pose={frame.hands.l} side="l" u={u} />}
          {frame.hands?.r && <Hand pose={frame.hands.r} side="r" u={u} />}
          {placed.map((p) => {
            const mark: Mark | undefined = frame.marks[p.id]
            const canPick = clickable?.includes(p.zone)
            const order = frame.order[p.id]
            return (
              <motion.button
                key={p.id}
                type="button"
                tabIndex={canPick ? 0 : -1}
                disabled={!canPick}
                aria-label={canPick ? `Elegir ${p.id}` : undefined}
                onClick={() => canPick && onPick?.(p.id)}
                className={`card ${xray && mark ? `m-${mark}` : ''} ${canPick ? 'pickable' : ''}`}
                style={{ width: CW * u, height: CH * u, zIndex: p.z + 10, fontSize: u * 1.9 }}
                initial={false}
                animate={{ x: p.x * u, y: p.y * u, rotate: p.rot }}
                transition={reduce ? { duration: 0 } : { duration: 0.6, ease: EASE, delay: order !== undefined ? order * stagger : 0 }}
              >
                <motion.span
                  className="flipper"
                  initial={false}
                  animate={{ rotateY: frame.up[p.id] ? 0 : 180 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE, delay: order !== undefined ? order * stagger : 0 }}
                >
                  <CardFace id={p.id} />
                  <span className="face back" />
                </motion.span>
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}
