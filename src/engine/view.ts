import { CH, CW, H, W, type Frame, type Geo } from './scene.ts'

/** Dónde cae la carta i de una zona, en unidades de tapete. */
export function pos(g: Geo, i: number) {
  if (g.cols) return { x: g.x + (i % g.cols) * (g.dx ?? 0), y: g.y + Math.floor(i / g.cols) * (g.rowDy ?? CH + 2), rot: g.rot ?? 0 }
  return { x: g.x + i * (g.dx ?? 0), y: g.y + i * (g.dy ?? 0), rot: g.rot ?? 0 }
}

export type View = { x: number; y: number; w: number; h: number }

/**
 * Encuadre que contiene todo lo que pasa en el truco: el tapete se ajusta en vez de dejar paño vacío.
 * `cardsOnly` encuadra solo las zonas con cartas (para un fragmento del truco, como en el hero).
 */
export function viewOf(frames: Frame[], cardsOnly = false): View {
  let [x0, y0, x1, y1] = [W, H, 0, 0]
  const add = (x: number, y: number, w: number, h: number) => {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + w); y1 = Math.max(y1, y + h)
  }
  for (const f of frames) {
    for (const [z, cards] of Object.entries(f.zones)) {
      const g = f.geo[z]
      if (cardsOnly && !cards.length) continue
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
