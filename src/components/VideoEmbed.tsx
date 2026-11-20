import { useState } from 'react'
import { mmss } from '../lib.ts'
import type { Video } from '../data/types.ts'

/** Miniatura que se convierte en reproductor al pulsarla: no carga YouTube hasta que hace falta. */
export function VideoEmbed({ v }: { v: Video }) {
  const [on, setOn] = useState(false)
  return (
    <div className="video">
      <div className="frame">
        {on ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`}
            title={v.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <button type="button" onClick={() => setOn(true)} aria-label={`Reproducir: ${v.title}`}>
            <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" loading="lazy" width={480} height={360} />
            <span className="play" aria-hidden>
              ▶
            </span>
            <span className="dur">{mmss(v.dur)}</span>
          </button>
        )}
      </div>
      <p className="vtitle">{v.title}</p>
      <p className="vmeta">
        {v.channel} · {v.lang === 'es' ? 'Español' : 'Inglés'}
      </p>
    </div>
  )
}
