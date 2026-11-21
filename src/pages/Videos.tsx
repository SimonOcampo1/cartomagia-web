import { useState } from 'react'
import { Filters } from '../components/Filters.tsx'
import { Pips } from '../components/Pips.tsx'
import { emptyFilter, matches, norm } from '../lib/filter.ts'
import { VideoEmbed } from '../components/VideoEmbed.tsx'
import { lessonById } from '../data/lessons.ts'
import { LEVEL_NAME, type Tag } from '../data/types.ts'
import { PLAYLIST_ID, videos } from '../data/videos.ts'

const TAGS: Tag[] = ['sin-setup', 'automatico', 'impromptu', 'matematico', 'juego-de-manos', 'prediccion', 'mentalismo', 'acaan', 'ases', 'cambio', 'control', 'pocas-cartas', 'visual', 'tecnica']
const channels = [...new Set(videos.map((v) => v.channel))].sort()

export function Videos() {
  const [f, setF] = useState(emptyFilter)
  const [lang, setLang] = useState('')
  const [channel, setChannel] = useState('')
  const [length, setLength] = useState('')
  const [origin, setOrigin] = useState('')
  const [sort, setSort] = useState('ruta')
  const shown = videos.filter(
    (v) =>
      matches({ ...f, q: norm(f.q) }, v.level, v.tags, norm(`${v.title} ${v.channel}`)) &&
      (!lang || v.lang === lang) &&
      (!channel || v.channel === channel) &&
      (!length || (length === 'short' ? v.dur <= 180 : v.dur > 180)) &&
      (!origin || (origin === 'ext' ? v.source === 'ext' : !v.source)),
  ).sort((a, b) => (sort === 'corto' ? a.dur - b.dur : sort === 'ruta' ? 'PIA'.indexOf(a.level) - 'PIA'.indexOf(b.level) : 0))
  return (
    <main className="page">
      <header className="page-head">
        <h1>Videoteca</h1>
        <p>
          {videos.length} tutoriales clasificados por nivel y tipo de truco: los de{' '}
          <a href={`https://www.youtube.com/playlist?list=${PLAYLIST_ID}`} target="_blank" rel="noreferrer">
            tu lista de YouTube
          </a>{' '}
          más {videos.filter((v) => v.source === 'ext').length} elegidos de otros canales de referencia (52Kards, Numberphile, CardMechanic, Chris Ramsay, Italo Castillo…) para cada ficha. El nivel es orientativo.
        </p>
      </header>
      <Filters
        f={f}
        set={setF}
        tags={TAGS}
        count={shown.length}
        sort={
          <select className="sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar">
            <option value="ruta">Ruta: de fácil a difícil</option>
            <option value="corto">Más cortos primero</option>
            <option value="lista">Orden de la lista</option>
          </select>
        }
      >
        <div className="selects">
          <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Idioma">
            <option value="">Idioma: todos</option>
            <option value="es">Español</option>
            <option value="en">Inglés</option>
          </select>
          <select value={channel} onChange={(e) => setChannel(e.target.value)} aria-label="Canal">
            <option value="">Canal: todos</option>
            {channels.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select value={origin} onChange={(e) => setOrigin(e.target.value)} aria-label="Origen">
            <option value="">Fuente: todas</option>
            <option value="playlist">Tu lista</option>
            <option value="ext">Otros canales</option>
          </select>
          <select value={length} onChange={(e) => setLength(e.target.value)} aria-label="Duración">
            <option value="">Duración: todas</option>
            <option value="short">Cortos (≤ 3 min)</option>
            <option value="long">Tutoriales largos</option>
          </select>
        </div>
      </Filters>
      {shown.length ? (
        <div className="video-grid">
          {shown.map((v, n) => (
            <div key={v.id} className="video-card">
              <VideoEmbed v={v} priority={n === 0} />
              <p className="vtags">
                <span className="lvtag">
                  <Pips level={v.level} />
                  {LEVEL_NAME[v.level]}
                </span>
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
