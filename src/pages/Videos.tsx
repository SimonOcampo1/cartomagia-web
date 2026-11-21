import { useState } from 'react'
import { Filters } from '../components/Filters.tsx'
import { Select, type Option } from '../components/Select.tsx'
import { Pips } from '../components/Pips.tsx'
import { emptyFilter, matches, norm } from '../lib/filter.ts'
import { VideoEmbed } from '../components/VideoEmbed.tsx'
import { lessonById } from '../data/lessons.ts'
import { LEVEL_NAME, type Tag } from '../data/types.ts'
import { PLAYLIST_ID, videos } from '../data/videos.ts'

const TAGS: Tag[] = ['sin-setup', 'automatico', 'impromptu', 'matematico', 'juego-de-manos', 'prediccion', 'mentalismo', 'acaan', 'ases', 'cambio', 'control', 'pocas-cartas', 'visual', 'tecnica']
const channels = [...new Set(videos.map((v) => v.channel))].sort()
const SORTS = [
  { value: 'ruta', label: 'De fácil a difícil' },
  { value: 'corto', label: 'Más cortos primero' },
  { value: 'lista', label: 'Orden de la lista' },
]
const LANGS = [
  { value: '', label: 'Todos' },
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
]
const ORIGINS = [
  { value: '', label: 'Todas' },
  { value: 'playlist', label: 'Tu lista' },
  { value: 'ext', label: 'Otros canales' },
]
const LENGTHS = [
  { value: '', label: 'Todas' },
  { value: 'short', label: 'Cortos (≤ 3 min)' },
  { value: 'long', label: 'Tutoriales largos' },
]

/** Un filtro activo como etiqueta que se puede quitar. */
const on = (name: string, value: string, options: Option[], clear: (v: string) => void) =>
  value ? [{ label: `${name}: ${options.find((o) => o.value === value)?.label ?? value}`, clear: () => clear('') }] : []

function Field({ label, ...rest }: { label: string } & Omit<Parameters<typeof Select>[0], 'label'>) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <Select label={label} {...rest} />
    </div>
  )
}

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
        sort={<Select label="Ordenar" value={sort} options={SORTS} onChange={setSort} />}
        extraOn={[...on('Idioma', lang, LANGS, setLang), ...on('Canal', channel, [], setChannel), ...on('Fuente', origin, ORIGINS, setOrigin), ...on('Duración', length, LENGTHS, setLength)]}
        extra={
          <div className="fields">
            <Field label="Idioma" value={lang} options={LANGS} onChange={setLang} />
            <Field label="Canal" value={channel} options={[{ value: '', label: 'Todos' }, ...channels.map((c) => ({ value: c, label: c }))]} onChange={setChannel} />
            <Field label="Fuente" value={origin} options={ORIGINS} onChange={setOrigin} />
            <Field label="Duración" value={length} options={LENGTHS} onChange={setLength} />
          </div>
        }
      />
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
