import { Pips } from '../components/Pips.tsx'
import { Icon } from '../components/Icons.tsx'
import { Player } from '../components/Player.tsx'
import { VideoEmbed } from '../components/VideoEmbed.tsx'
import { lessonById } from '../data/lessons.ts'
import { LEVEL_NAME, TAG_NAME } from '../data/types.ts'
import { videos } from '../data/videos.ts'
import { useLearned } from '../lib/hooks.ts'

export function LessonPage({ id, kind }: { id: string; kind: 'truco' | 'tecnica' }) {
  const l = lessonById[id]
  const { learned, toggle } = useLearned()
  if (!l) return <NotFound />
  const vids = [...new Set([...(l.videos ?? []), ...videos.filter((v) => v.links.includes(l.id)).map((v) => v.id)])]
    .map((vid) => videos.find((v) => v.id === vid))
    .filter((v) => v !== undefined)
  // el tutorial que va junto al tapete: el primero en español, si hay
  const lead = vids.find((v) => v.lang === 'es') ?? vids[0]
  const rest = vids.filter((v) => v !== lead)
  const techs = (l.techniques ?? []).map((t) => lessonById[t]).filter(Boolean)
  const usedBy = Object.values(lessonById).filter((x) => x.techniques?.includes(l.id))

  return (
    <main className="page lesson">
      <nav className="crumbs" aria-label="Migas">
        <a href={kind === 'truco' ? '#/trucos' : '#/tecnicas'}>{kind === 'truco' ? 'Trucos' : 'Técnicas'}</a>
        <span aria-hidden>/</span>
        <span>{LEVEL_NAME[l.level]}</span>
      </nav>
      <header className="lesson-head">
        <h1>{l.name}</h1>
        <p className="lead">{l.effect}</p>
        <ul className="taglist">
          <li className="lvtag">
            <Pips level={l.level} />
            {LEVEL_NAME[l.level]}
          </li>
          {l.tags
            .filter((t) => t !== 'tecnica')
            .map((t) => (
              <li key={t}>{TAG_NAME[t]}</li>
            ))}
          {l.minutes && <li className="num">~{l.minutes} min</li>}
        </ul>
      </header>

      {l.script ? (
        <Player key={l.id} script={l.script} sim={l.sim} tilt3d={kind === 'tecnica'} />
      ) : (
        <p className="no-anim">Aquí lo importante es el ángulo y el ritmo de las manos, no el orden de las cartas: apréndelo con los videos de abajo.</p>
      )}

      {lead && (
        <section className="hands">
          <VideoEmbed v={lead} />
          <div>
            <h2>Con manos reales</h2>
            <p>{l.script ? 'El tapete enseña el orden de las cartas; el video, el ritmo y el ángulo de las manos.' : 'Mira primero cómo se ve en manos de alguien que ya lo domina.'}</p>
          </div>
        </section>
      )}

      <div className="lesson-body">
        <section>
          <h2>El secreto</h2>
          <p>{l.method}</p>
          {l.tips && (
            <>
              <h3>Consejos</h3>
              <ul className="tips">
                {l.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </>
          )}
          {l.origin && <p className="origin">{l.origin}</p>}
          <button type="button" className={`learned ${learned.has(l.id) ? 'on' : ''}`} aria-pressed={learned.has(l.id)} onClick={() => toggle(l.id)}>
            {learned.has(l.id) ? (
              <>
                <Icon name="check" />
                Aprendido
              </>
            ) : (
              'Marcar como aprendido'
            )}
          </button>
        </section>
        <aside>
          {techs.length > 0 && (
            <>
              <h2>Técnicas que usa</h2>
              <ul className="xlinks">
                {techs.map((t) => (
                  <li key={t.id}>
                    <a href={`#/tecnica/${t.id}`}>{t.name}</a> <span>{LEVEL_NAME[t.level]}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {usedBy.length > 0 && (
            <>
              <h2>Trucos que la usan</h2>
              <ul className="xlinks">
                {usedBy.map((t) => (
                  <li key={t.id}>
                    <a href={`#/truco/${t.id}`}>{t.name}</a> <span>{LEVEL_NAME[t.level]}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {l.links && (
            <>
              <h2>Más fuentes</h2>
              <ul className="xlinks">
                {l.links.map((k) => (
                  <li key={k.url}>
                    <a href={k.url} target="_blank" rel="noreferrer">
                      {k.label}
                      <Icon name="external" />
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>

      {rest.length > 0 && (
        <section className="lesson-videos">
          <h2>Videos</h2>
          <div className="video-grid">
            {rest.map((v) => (
              <VideoEmbed key={v.id} v={v} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

export function NotFound() {
  return (
    <main className="page">
      <h1>Esta carta no está en el mazo</h1>
      <p>
        La página no existe. <a href="#/">Volver al inicio</a>
      </p>
    </main>
  )
}
