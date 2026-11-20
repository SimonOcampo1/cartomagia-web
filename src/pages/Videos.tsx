import { useState } from 'react'
import { Filters, emptyFilter, matches } from '../components/Filters.tsx'
import { VideoEmbed } from '../components/VideoEmbed.tsx'
import { lessonById } from '../data/lessons.ts'
import { LEVEL_NAME, type Tag } from '../data/types.ts'
import { PLAYLIST_ID, videos } from '../data/videos.ts'
import { norm } from '../lib.ts'

const TAGS: Tag[] = ['sin-setup', 'automatico', 'impromptu', 'matematico', 'juego-de-manos', 'prediccion', 'mentalismo', 'acaan', 'ases', 'cambio', 'control', 'pocas-cartas', 'visual', 'tecnica']
const channels = [...new Set(videos.map((v) => v.channel))].sort()

export function Videos() {
  const [f, setF] = useState(emptyFilter)
  const [lang, setLang] = useState('')
  const [channel, setChannel] = useState('')
  const [length, setLength] = useState('')
  const shown = videos.filter(
    (v) =>
      matches({ ...f, q: norm(f.q) }, v.level, v.tags, norm(`${v.title} ${v.channel}`)) &&
      (!lang || v.lang === lang) &&
      (!channel || v.channel === channel) &&
      (!length || (length === 'short' ? v.dur <= 180 : v.dur > 180)),
  )
  return (
    <main className="page">
      <header className="page-head">
        <h1>Videoteca</h1>
        <p>
          {videos.length} tutoriales de Julio Ribera, Santi Marcilla, Matt McGurk, A Million Card Tricks, Steven Taputoro y más, clasificados por nivel y tipo de truco. Vienen de{' '}
          <a href={`https://www.youtube.com/playlist?list=${PLAYLIST_ID}`} target="_blank" rel="noreferrer">
            esta lista de YouTube ↗
          </a>
          . El nivel es orientativo: lo asignamos por título y canal.
        </p>
      </header>
      <Filters f={f} set={setF} tags={TAGS} count={shown.length}>
        <div className="selects">
          <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Idioma">
            <option value="">Todos los idiomas</option>
            <option value="es">Español</option>
            <option value="en">Inglés</option>
          </select>
          <select value={channel} onChange={(e) => setChannel(e.target.value)} aria-label="Canal">
            <option value="">Todos los canales</option>
            {channels.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select value={length} onChange={(e) => setLength(e.target.value)} aria-label="Duración">
            <option value="">Cualquier duración</option>
            <option value="short">Cortos (≤ 3 min)</option>
            <option value="long">Tutoriales largos</option>
          </select>
        </div>
      </Filters>
      {shown.length ? (
        <div className="video-grid">
          {shown.map((v) => (
            <div key={v.id} className="video-card">
              <VideoEmbed v={v} />
              <p className="vtags">
                <span className={`lvtag lv-${v.level}`}>{LEVEL_NAME[v.level]}</span>
                {v.links
                  .map((id) => lessonById[id])
                  .filter(Boolean)
                  .map((l) => (
                    <a key={l.id} href={`#/${l.tags.includes('tecnica') ? 'tecnica' : 'truco'}/${l.id}`}>
                      Ficha: {l.name}
                    </a>
                  ))}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty">Ningún video cumple todo. Prueba quitando el canal o alguna etiqueta.</p>
      )}
    </main>
  )
}
