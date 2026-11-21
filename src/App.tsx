import { techniques, tricks } from './data/lessons.ts'
import { useHash } from './lib/hooks.ts'
import { Home } from './pages/Home.tsx'
import { LessonPage, NotFound } from './pages/LessonPage.tsx'
import { Library } from './pages/Library.tsx'
import { Videos } from './pages/Videos.tsx'

const NAV = [
  ['#/trucos', 'Trucos'],
  ['#/tecnicas', 'Técnicas'],
  ['#/videos', 'Videoteca'],
]

function route(hash: string) {
  const [, a, b] = hash.split('/')
  if (!a) return <Home />
  if (a === 'trucos') return <Library title="Trucos" intro="De los automáticos que hace cualquiera a la matemática que engaña a magos. Filtra por lo que necesitas: sin preparación, impromptu, matemáticos…" items={tricks} base="truco" />
  if (a === 'tecnicas') return <Library title="Técnicas" intro="Mezclas, forzajes, controles y juegos de manos. Cada técnica enlaza a los trucos que la usan." items={techniques} base="tecnica" />
  if (a === 'videos') return <Videos />
  if ((a === 'truco' || a === 'tecnica') && b) return <LessonPage key={b} id={b} kind={a} />
  return <NotFound />
}

export default function App() {
  const hash = useHash()
  const section = hash.split('/')[1]
  const current = (href: string) =>
    (section && href.startsWith(`#/${section}`)) || (section === 'truco' && href === '#/trucos') || (section === 'tecnica' && href === '#/tecnicas') ? 'page' : undefined
  return (
    <>
      <a className="skip" href="#/" onClick={(e) => (e.preventDefault(), document.getElementById('contenido')?.focus())}>
        Saltar al contenido
      </a>
      <header className="topbar">
        <div className="topbar-pill">
          <a href="#/" className="brand" aria-label="Tapete, inicio">
            Tapete
            <span>escuela de cartomagia</span>
          </a>
          <nav aria-label="Principal">
            {NAV.map(([href, label]) => (
              <a key={href} href={href} aria-current={current(href)}>
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <div id="contenido" tabIndex={-1} key={hash} className="view">
        {route(hash)}
      </div>
      <footer className="foot">
        <div className="container">
          <a href="#/" className="foot-mark" aria-label="Tapete, inicio">
            Tapete
          </a>
          <div className="foot-row">
            <p>Los métodos clásicos se explican aquí; las rutinas de cada autor, en sus videos. Apoya a los canales que te enseñan.</p>
            <nav aria-label="Pie">
              {NAV.map(([href, label]) => (
                <a key={href} href={href}>
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </footer>
    </>
  )
}
