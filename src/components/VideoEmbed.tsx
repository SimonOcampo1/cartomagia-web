import { useState } from 'react'
import type { Video } from '../data/types.ts'
import { Icon } from './Icons.tsx'

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

/** Miniatura que se convierte en reproductor al pulsarla: no carga YouTube hasta que hace falta. */
export function VideoEmbed({ v, priority = false }: { v: Video; priority?: boolean }) {
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
            <img
              src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}
              alt=""
              loading={priority ? undefined : 'lazy'}
              fetchPriority={priority ? 'high' : undefined}
              width={480}
              height={360}
            />
            <span className="play" aria-hidden>
              <Icon name="play" />
            </span>
            <span className="dur">{mmss(v.dur)}</span>
          </button>
        )}
      </div>
      <p className="vtitle">{v.title}</p>
      <p className="vmeta">
        <span>{v.channel}</span>
        <span>{v.lang === 'es' ? 'Español' : 'Inglés'}</span>
      </p>
    </div>
  )
}
