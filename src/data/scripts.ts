import { between, card, isRed, longName, newDeck, short, shuffled, valueOf, type CardId, type Suit } from '../engine/cards.ts'
import { CENTER, row, stack, type Geo, type Script } from '../engine/scene.ts'

const deck = (s: Script) => shuffled(newDeck(), s.r)
const opts = (xs: (string | number)[]) => xs.map((x) => ({ label: String(x), value: String(x) }))
const COLS = ['c0', 'c1', 'c2']
const colGeo = (i: number, dy: number): Geo => ({ x: 30 + i * 16, y: 3, dx: 0, dy, label: `Columna ${i + 1}` })
const colOptions = COLS.map((c, i) => ({ label: `Columna ${i + 1}`, value: c }))
const LEFT = { x: 37, y: 31, grip: 'below' as const }
const RIGHT = { x: 57, y: 15, grip: 'above' as const }

function verdict(s: Script, got: CardId, want: CardId, ok: string, ko: string) {
  s.mark(got, 'chosen')
  s.snap(got === want ? ok : ko, { tone: got === want ? 'win' : 'fail' })
}

/* ───────────── Trucos ───────────── */

export function veintiuna(s: Script) {
  s.zone('paquete', stack(6, 44, 'Paquete'), deck(s).slice(0, 21))
  COLS.forEach((c, i) => s.zone(c, colGeo(i, 3.4)))
  s.zone('contadas', stack(30, 44))
  s.zone('final', stack(62, 44))
  s.snap('Separa 21 cartas cualesquiera, boca abajo.')
  s.deal('paquete', COLS, 21, { up: true })
  s.snap('Reparte boca arriba en tres columnas, fila por fila, de izquierda a derecha.')
  const chosen = s.ask({ kind: 'card', prompt: 'Piensa una carta y tócala. Solo la app la recuerda.', among: COLS })
  s.mark(chosen, 'chosen')
  for (let round = 1; round <= 3; round++) {
    if (round > 1) {
      s.deal('paquete', COLS, 21, { up: true })
      s.snap(`Vuelve a repartir en tres columnas (${round}ª vez).`)
    }
    const col = s.ask({ kind: 'choice', prompt: '¿En qué columna está tu carta?', options: colOptions })
    const [a, b] = COLS.filter((c) => c !== col)
    for (const c of [a, col, b]) s.move(c, 'paquete', 7, { block: true })
    s.turnOver('paquete')
    s.snap('Junta las columnas con la suya en medio y da vuelta el paquete.', {
      note: 'Cada ronda empuja la carta hacia el centro exacto del paquete: la posición 11.',
    })
  }
  s.move('paquete', 'contadas', 10)
  s.snap('Cuenta diez cartas sin mirarlas.')
  const got = s.move('paquete', 'final', 1, { up: true })[0]
  verdict(s, got, chosen, `La undécima: ${longName(got)}. ¡Es su carta!`, 'No coincide: revisa que indicaras bien la columna.')
}

export function detector(s: Script) {
  s.zone('mazo', stack(46, 40), deck(s))
  s.snap('Mezcla el mazo. Ninguna preparación.')
  const key = s.bottom('mazo')
  s.mark(key, 'key')
  s.inset = { label: 'Tu carta clave', cards: [key] }
  s.snap('Al cuadrar, mira de reojo la carta de abajo: es tu carta clave.')
  const n = +s.ask({
    kind: 'choice',
    prompt: 'Extiendes el mazo. ¿De dónde saca su carta el espectador?',
    options: [
      { label: 'Arriba', value: '8' },
      { label: 'Del medio', value: '26' },
      { label: 'De abajo', value: '44' },
    ],
  })
  const chosen = s.pile('mazo')[52 - n]
  s.zone('espectador', stack(22, 40, 'Su carta'))
  s.take(chosen, 'espectador', { up: true })
  s.mark(chosen, 'chosen')
  s.snap(`Saca una carta y la memoriza: ${longName(chosen)}.`)
  s.take(chosen, 'mazo', { up: false })
  s.snap('La deja boca abajo arriba del mazo.')
  s.cut('mazo', between(s.r, 8, 44))
  s.snap('Corta y completa el corte: tu clave cae justo encima de su carta.')
  s.cut('mazo', between(s.r, 8, 44))
  if (s.posFromTop('mazo', chosen) === 1) s.cut('mazo', 5) // la clave quedó abajo: un corte más
  s.snap('Más cortes completos, los que quiera: no separan la pareja.')
  s.zone('mesa', { x: 3, y: 2, dx: 5.4, cols: 17, rowDy: 12.4 })
  const until = s.posFromTop('mazo', key)
  s.deal('mazo', ['mesa'], until, { up: true })
  s.snap('Da vuelta cartas de una en una diciendo «no es la mía». Tú esperas la clave.')
  const got = s.move('mazo', 'mesa', 1, { up: true })[0]
  verdict(s, got, chosen, '«Tampoco es esta»… ¡Mentira! La carta tras tu clave es la suya.', 'Algo se desordenó.')
}

/** Forzaje «corta más profundo»: lo usan el truco y la técnica. */
export function cortaMasProfundo(s: Script) {
  s.zone('mazo', stack(46, 6), deck(s))
  const force = s.top('mazo')[0]
  s.mark(force, 'force')
  s.inset = { label: 'Tu predicción', cards: [force] }
  s.snap('Mira en secreto la carta de arriba y escríbela como predicción.')
  const a = +s.ask({ kind: 'choice', prompt: 'El espectador corta un paquete pequeño', options: opts([5, 8, 11]) })
  s.zone('corte', stack(70, 6))
  s.move('mazo', 'corte', a, { block: true })
  s.snap(`Corta ${a} cartas…`)
  s.turnOver('corte')
  s.snap('…las da vuelta…')
  s.move('corte', 'mazo', a, { block: true })
  s.snap('…y las deja encima, boca arriba.')
  const b = +s.ask({ kind: 'choice', prompt: 'Ahora corta más profundo', options: opts([a + 7, a + 12, a + 17]) })
  s.move('mazo', 'corte', b, { block: true })
  s.turnOver('corte')
  s.move('corte', 'mazo', b, { block: true })
  s.snap(`Corta ${b} cartas, las da vuelta y las devuelve encima.`)
  s.zone('extendidas', row(3, 30, 4.2))
  while (s.up[s.top('mazo')[0]]) s.move('mazo', 'extendidas', 1)
  s.snap('Extiende las cartas boca arriba hasta la primera boca abajo.')
  const got = s.move('mazo', 'extendidas', 1, { up: true })[0]
  verdict(s, got, force, `La primera boca abajo: ${longName(got)}. Tu predicción.`, 'No coincide.')
}

export function corteCruzado(s: Script) {
  s.zone('mazo', stack(24, 22), deck(s))
  const force = s.top('mazo')[0]
  s.mark(force, 'force')
  s.inset = { label: 'Tu predicción', cards: [force] }
  s.snap('Mira la carta de arriba y escribe tu predicción.')
  s.zone('abajo', stack(56, 22, 'Mitad de arriba'))
  s.move('mazo', 'abajo', between(s.r, 18, 32), { block: true })
  s.snap('El espectador corta y deja la mitad de arriba en la mesa.')
  s.zone('cruz', { ...stack(56, 22), rot: 90 })
  s.move('mazo', 'cruz', 52, { block: true })
  s.snap('Coloca la otra mitad encima, cruzada, «para marcar el corte».')
  s.snap('Habla de la predicción unos segundos: el tiempo borra quién cortó qué.')
  s.zone('aparte', { ...stack(84, 22), rot: 90 })
  s.move('cruz', 'aparte', 52, { block: true })
  s.snap('Levanta el paquete cruzado: «la carta donde cortaste».')
  s.zone('revela', stack(56, 44))
  const got = s.move('abajo', 'revela', 1, { up: true })[0]
  verdict(s, got, force, 'Es la carta que estaba arriba desde el principio: tu predicción.', 'No coincide.')
}

export function asesCortes(s: Script) {
  const aces = ['AS', 'AH', 'AC', 'AD']
  const rest = shuffled(newDeck().filter((c) => !aces.includes(c)), s.r)
  s.zone('mazo', stack(46, 4), [...rest, ...aces])
  s.mark(aces, 'force')
  s.snap('Preparación: los cuatro ases arriba del mazo. El brillo dorado es tu «visión de mago».')
  const P = ['p0', 'p1', 'p2', 'p3']
  P.forEach((p, i) => s.zone(p, stack(12 + i * 22, 30, `Montón ${i + 1}`)))
  s.move('mazo', 'p2', between(s.r, 22, 30), { block: true })
  s.move('mazo', 'p1', between(s.r, 10, 15), { block: true })
  s.move('mazo', 'p0', 52, { block: true })
  s.move('p2', 'p3', between(s.r, 9, 13), { block: true })
  s.snap('El espectador corta el mazo en cuatro montones. Los ases quedan arriba del último.')
  P.forEach((p, i) => {
    s.move(p, p, 3, { toBottom: true })
    for (const q of P) if (q !== p) s.move(p, q, 1)
    s.snap(`Montón ${i + 1}: pasa tres cartas de arriba abajo y reparte una sobre cada uno de los otros.`, {
      note: i === 3 ? 'Las tres de basura que recibió este montón se van abajo y reparte los ases.' : undefined,
    })
  })
  P.forEach((p) => s.flipCard(s.top(p)[0], true))
  const ok = P.every((p) => aces.includes(s.top(p)[0]))
  s.snap(ok ? 'Da vuelta la carta de arriba de cada montón: los cuatro ases.' : 'Algo salió mal.', { tone: ok ? 'win' : 'fail' })
}

export function principio9(s: Script) {
  s.zone('mazo', stack(30, 22), deck(s))
  const target = s.pile('mazo')[52 - 9]
  s.mark(target, 'force')
  s.inset = { label: 'La novena desde arriba', cards: [target] }
  s.snap('Conoce la novena carta desde arriba (puedes verla al contar o al cuadrar).')
  const n = +s.ask({ kind: 'choice', prompt: 'El espectador elige un número del 10 al 19', options: opts([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]) })
  s.zone('monton', stack(56, 22, 'Montón'))
  s.deal('mazo', ['monton'], n)
  s.snap(`Reparte ${n} cartas de una en una.`)
  const sum = Math.floor(n / 10) + (n % 10)
  s.zone('fuera', stack(80, 22))
  s.deal('monton', ['fuera'], sum)
  s.snap(`Suma sus cifras: 1 + ${n % 10} = ${sum}. Quita ${sum} cartas del montón.`, {
    note: 'Un número menos la suma de sus cifras siempre es múltiplo de 9.',
  })
  s.zone('revela', stack(56, 44))
  const got = s.move('monton', 'revela', 1, { up: true })[0]
  verdict(s, got, target, `La de arriba: ${longName(got)}. Justo la que conocías.`, 'No coincide.')
}

export function ascensor(s: Script) {
  s.zone('mazo', CENTER, deck(s))
  s.hands = { l: { x: 50, y: 31, grip: 'below' } }
  const chosen = s.pile('mazo')[20]
  s.zone('mesa', stack(76, 24, 'Elegida'))
  s.take(chosen, 'mesa', { up: true })
  s.mark(chosen, 'chosen')
  s.snap('El espectador elige una carta y la firma.')
  s.take(chosen, 'mazo', { up: false, at: 25 })
  s.snap('La pierde en el centro del mazo.')
  s.take(chosen, 'mazo', { up: false, at: s.pile('mazo').length - 1 })
  s.snap('Con un control la llevas a segunda posición desde arriba.', { note: 'Mira «Control con mezcla» en Técnicas.' })
  s.hands = { l: { x: 50, y: 31, grip: 'below' }, r: { x: 54, y: 13, grip: 'above' } }
  s.zone('lift', stack(46, 16))
  s.move('mazo', 'lift', 2, { block: true })
  s.snap('Doble lift: levantas dos cartas perfectamente cuadradas, como si fueran una.')
  s.turnOver('lift')
  s.snap('Al darlas vuelta se ve su carta. «Tu carta está arriba».')
  s.turnOver('lift')
  s.move('lift', 'mazo', 2, { block: true })
  const other = s.top('mazo')[0]
  s.mark(other, 'dim')
  s.snap('Las bajas de nuevo sobre el mazo.')
  s.take(other, 'mazo', { at: 24 })
  s.snap('Tomas la carta de arriba (todos creen que es la suya) y la metes en el centro.')
  s.flipCard(chosen, true)
  s.snap('Chasquido. Das vuelta la de arriba: ¡ha subido sola!', { tone: 'win' })
}

export function gilbreath(s: Script) {
  const reds = shuffled(newDeck().filter(isRed), s.r)
  const blacks = shuffled(newDeck().filter((c) => !isRed(c)), s.r)
  const alt = reds.flatMap((r, i) => [r, blacks[i]])
  s.zone('mazo', stack(30, 6), alt)
  s.inset = { label: 'Arriba del mazo', cards: alt.slice(-6).reverse() }
  s.snap('Preparación: alterna rojo y negro en todo el mazo.')
  s.inset = undefined
  s.cut('mazo', between(s.r, 6, 46))
  s.snap('El espectador corta las veces que quiera.')
  const k = +s.ask({ kind: 'choice', prompt: '¿Cuántas cartas reparte en un montón?', options: opts([18, 22, 26, 30]) })
  s.zone('monton', stack(62, 6, 'Montón'))
  s.deal('mazo', ['monton'], k)
  s.snap(`Reparte ${k} cartas una a una: esto invierte su orden.`)
  s.zone('mezcla', stack(46, 6))
  s.riffle('mazo', 'monton', 'mezcla')
  s.snap('Mezcla los dos montones con una mezcla americana. Una mezcla de verdad.')
  for (let i = 0; i < 8; i++) s.zone(`pr${i}`, { x: 4 + (i % 4) * 24, y: i < 4 ? 26 : 43, dx: 9.5 })
  for (let i = 0; i < 4; i++) s.move('mezcla', `pr${i}`, 2, { up: true })
  s.snap('Ahora reparte las cartas de dos en dos.')
  for (let i = 4; i < 8; i++) s.move('mezcla', `pr${i}`, 2, { up: true })
  let ok = true
  const all = [...s.pile('mezcla')]
  for (let i = 0; i + 1 < all.length; i += 2) ok &&= isRed(all[i]) !== isRed(all[i + 1])
  for (let i = 0; i < 8; i++) ok &&= isRed(s.pile(`pr${i}`)[0]) !== isRed(s.pile(`pr${i}`)[1])
  s.snap(ok ? 'Cada pareja: una roja y una negra. Siempre. Las 26.' : 'Falló.', {
    tone: ok ? 'win' : 'fail',
    note: 'Principio de Gilbreath (1958): una mezcla americana no destruye ciertos patrones.',
  })
}

const kruskalValue = (c: CardId) => (valueOf(c) > 10 ? 5 : valueOf(c))

export function kruskal(s: Script) {
  s.zone('mazo', stack(46, 24), deck(s))
  s.zone('tablero', { x: 3, y: 2, dx: 7.2, cols: 13, rowDy: 14.2 })
  s.snap('Mezcla un mazo completo.')
  s.deal('mazo', ['tablero'], 52, { up: true })
  s.snap('Reparte las 52 boca arriba, en filas. As = 1, figuras = 5.')
  const n = +s.ask({ kind: 'choice', prompt: 'Piensa un número del 1 al 10', options: opts([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) })
  const t = s.pile('tablero')
  const chain = (start: number) => {
    const path = [start]
    for (let i = start; i + kruskalValue(t[i]) < 52; ) path.push((i += kruskalValue(t[i])))
    return path
  }
  const mine = chain(0)
  const theirs = chain(n - 1)
  s.mark(theirs.map((i) => t[i]), 'path')
  s.snap(`Cuenta ${n} cartas y avanza tantas como valga cada una, hasta no poder seguir.`)
  s.mark(mine.filter((i) => !theirs.includes(i)).map((i) => t[i]), 'key')
  s.snap('Tú haces lo mismo en secreto desde la primera carta.', { note: 'Dorado: su cadena. Azul: la tuya.' })
  const end = t[theirs.at(-1)!]
  const ok = mine.at(-1) === theirs.at(-1)
  s.mark(end, 'chosen')
  s.snap(ok ? `Las dos cadenas acaban en ${longName(end)}. Las cadenas se cruzaron y desde ahí van juntas.` : 'Esta vez las cadenas no se cruzaron (pasa ~1 de cada 6). Vuelve a mezclar.', {
    tone: ok ? 'win' : 'fail',
  })
}

export function siStebbins(s: Script) {
  const suits: Suit[] = ['C', 'H', 'S', 'D']
  const order = Array.from({ length: 52 }, (_, i) => card(((i * 3) % 13) + 1, suits[i % 4]))
  s.zone('mazo', CENTER, [...order].reverse())
  s.inset = { label: 'Arriba del mazo', cards: order.slice(0, 5) }
  s.snap('Preparación Si Stebbins: cada carta vale 3 más que la anterior y los palos rotan ♣ ♥ ♠ ♦.')
  s.inset = undefined
  s.cut('mazo', between(s.r, 6, 46))
  s.snap('Corte completo.')
  s.cut('mazo', between(s.r, 6, 46))
  s.snap('Otro corte. El ciclo sigue intacto.')
  const chosen = s.top('mazo')[0]
  s.zone('espectador', stack(76, 24, 'Su carta'))
  s.take(chosen, 'espectador', { up: true })
  s.mark(chosen, 'chosen')
  s.snap('El espectador se lleva la carta de arriba.')
  const key = s.bottom('mazo')
  s.mark(key, 'key')
  s.inset = { label: 'Espías la de abajo', cards: [key] }
  s.snap(`Al cuadrar, espías la carta de abajo: ${short(key)}.`)
  const next = card(((valueOf(key) + 2) % 13) + 1, suits[(suits.indexOf(key.slice(-1) as Suit) + 1) % 4])
  s.inset = { label: 'Tu deducción', cards: [next] }
  s.snap(`Suma 3 y pasa al siguiente palo: ${short(key)} → ${short(next)}. Es su carta.`, { tone: next === chosen ? 'win' : 'fail' })
}

export function veintisiete(s: Script) {
  s.zone('paquete', stack(6, 44, 'Paquete'), deck(s).slice(0, 27))
  COLS.forEach((c, i) => s.zone(c, colGeo(i, 2.6)))
  s.zone('contadas', stack(30, 44))
  s.zone('final', stack(62, 44))
  s.deal('paquete', COLS, 27, { up: true })
  s.snap('Reparte 27 cartas boca arriba en tres columnas.')
  const chosen = s.ask({ kind: 'card', prompt: 'Piensa una carta y tócala.', among: COLS })
  s.mark(chosen, 'chosen')
  const n = +s.ask({ kind: 'choice', prompt: '¿En qué posición quieres que aparezca? (1–27)', options: opts(Array.from({ length: 27 }, (_, i) => i + 1)) })
  const digits = [(n - 1) % 3, Math.floor((n - 1) / 3) % 3, Math.floor((n - 1) / 9)]
  const where = ['arriba', 'en medio', 'abajo']
  for (let round = 0; round < 3; round++) {
    if (round > 0) {
      s.deal('paquete', COLS, 27, { up: true })
      s.snap('Vuelve a repartir en tres columnas.')
    }
    const col = s.ask({ kind: 'choice', prompt: '¿En qué columna está tu carta?', options: colOptions })
    const order = COLS.filter((c) => c !== col)
    order.splice(digits[round], 0, col)
    for (const c of order) s.move(c, 'paquete', 9, { block: true })
    s.turnOver('paquete')
    s.snap(`Junta las columnas con la suya ${where[digits[round]]}.`, {
      note: `${n} − 1 = ${n - 1} en base 3 es ${digits[2]}${digits[1]}${digits[0]}. Cifra ${round + 1} (de derecha a izquierda): ${digits[round]} → ${where[digits[round]]}.`,
    })
  }
  s.move('paquete', 'contadas', n - 1)
  s.snap(`Cuenta ${n - 1} cartas.`)
  const got = s.move('paquete', 'final', 1, { up: true })[0]
  verdict(s, got, chosen, `La número ${n}: ${longName(got)}.`, 'No coincide: revisa las columnas.')
}

const WORDS = ['MUTUS', 'NOMEN', 'DEDIT', 'COCIS']
const LETTERS = [...new Set(WORDS.join(''))] // M U T S N O E D I C

export function mutus(s: Script) {
  s.zone('mazo', stack(4, 24), deck(s).slice(0, 20))
  for (let i = 0; i < 10; i++) s.zone(`pa${i}`, { x: 4 + (i % 5) * 19, y: i < 5 ? 4 : 22, dx: 8.6 })
  for (let i = 0; i < 10; i++) s.move('mazo', `pa${i}`, 2, { up: true })
  s.snap('Reparte diez parejas boca arriba. Cada espectador memoriza una pareja.')
  const chosen = s.ask({ kind: 'card', prompt: 'Toca una carta: su pareja será la tuya.', among: Array.from({ length: 10 }, (_, i) => `pa${i}`) })
  const pair = [...s.pile(s.where(chosen)!)]
  s.mark(pair, 'chosen')
  s.zone('paquete', stack(4, 24))
  for (let i = 0; i < 10; i++) s.move(`pa${i}`, 'paquete', 2, { block: true })
  s.turnOver('paquete')
  s.snap('Junta las parejas en orden, sin mezclar.')
  WORDS.forEach((w, r) => [...w].forEach((ch, c) => s.zone(`g${r}${c}`, { x: 26 + c * 13, y: 2.5 + r * 14.5, label: ch })))
  for (const L of LETTERS)
    WORDS.forEach((w, r) => [...w].forEach((ch, c) => ch === L && s.move('paquete', `g${r}${c}`, 1, { up: true })))
  s.snap('Reparte en una cuadrícula de 4 × 5 siguiendo MUTUS · NOMEN · DEDIT · COCIS: la 1ª pareja a las dos M, la 2ª a las dos U…')
  const rowsOpts = []
  for (let a = 0; a < 4; a++) for (let b = a; b < 4; b++) rowsOpts.push({ label: a === b ? `Las dos en fila ${a + 1}` : `Filas ${a + 1} y ${b + 1}`, value: `${a}${b}` })
  const ans = s.ask({ kind: 'choice', prompt: '¿En qué fila(s) están tus dos cartas?', options: rowsOpts })
  const [ra, rb] = [+ans[0], +ans[1]]
  const letter = ra === rb ? [...WORDS[ra]].find((ch, i) => WORDS[ra].indexOf(ch) !== i)! : [...WORDS[ra]].find((ch) => WORDS[rb].includes(ch))!
  const found = WORDS.flatMap((w, r) => [...w].map((ch, c) => (ch === letter ? s.pile(`g${r}${c}`)[0] : null))).filter(Boolean) as CardId[]
  const ok = found.every((c) => pair.includes(c))
  s.mark(found, 'chosen')
  s.snap(ok ? `La letra común es la ${letter}: ${found.map(short).join(' y ')}. Su pareja.` : 'No coincide: revisa las filas.', { tone: ok ? 'win' : 'fail' })
}

const SUIT_RANK: Record<string, number> = { C: 0, D: 1, H: 2, S: 3 }
const cardOrder = (c: CardId) => valueOf(c) * 4 + SUIT_RANK[c.slice(-1)]
const PERMS = ['012', '021', '102', '120', '201', '210'] // bajo-medio-alto = 1 … alto-medio-bajo = 6

export function fitchCheney(s: Script) {
  const five = deck(s).slice(0, 5)
  s.zone('mano', row(26, 4, 10), five, true)
  s.snap('Un espectador elige cinco cartas cualesquiera y se las da a tu asistente.')
  let base = '', hidden = '', d = 0
  for (const a of five)
    for (const b of five) {
      const diff = (valueOf(b) - valueOf(a) + 13) % 13
      if (!base && a !== b && a.slice(-1) === b.slice(-1) && diff >= 1 && diff <= 6) [base, hidden, d] = [a, b, diff]
    }
  const rest = five.filter((c) => c !== base && c !== hidden).sort((x, y) => cardOrder(x) - cardOrder(y))
  const coded = [...PERMS[d - 1]].map((i) => rest[+i])
  s.zone('oculta', stack(84, 30, 'Oculta'))
  s.take(hidden, 'oculta', { up: false })
  s.mark(hidden, 'chosen')
  s.zone('fila', row(14, 30, 12))
  for (const c of [base, ...coded]) s.take(c, 'fila', { up: true })
  s.snap('El asistente esconde una y deja las otras cuatro en fila, en un orden concreto.')
  s.mark(base, 'key')
  s.snap(`Entras tú. La 1ª carta da el palo y el punto de partida: ${short(base)}.`, {
    note: 'De cinco cartas, dos comparten palo. La oculta está a 6 o menos pasos (contando en círculo) de la otra.',
  })
  s.mark(coded, 'path')
  s.snap(`Las otras tres, por su orden de menor a mayor, codifican cuánto sumar: ${['bajo-medio-alto', 'bajo-alto-medio', 'medio-bajo-alto', 'medio-alto-bajo', 'alto-bajo-medio', 'alto-medio-bajo'][d - 1]} = ${d}.`, {
    note: 'Desempate entre iguales: ♣ < ♦ < ♥ < ♠.',
  })
  s.flipCard(hidden, true)
  s.snap(`${short(base)} + ${d} = ${short(hidden)}. La oculta.`, { tone: 'win' })
}

export function countdown(s: Script) {
  s.zone('mazo', stack(84, 4), deck(s))
  const target = s.pile('mazo')[7]
  s.mark(target, 'force')
  s.inset = { label: 'La octava desde abajo', cards: [target] }
  s.snap('Conoce la octava carta desde abajo (la ves al mostrar el mazo) y anúnciala como predicción.')
  let sum = 0
  for (let p = 0; p < 4; p++) {
    s.zone(`p${p}`, { x: 6 + p * 18, y: 18, dx: 0, dy: 0.9, label: `Montón ${p + 1}` })
    let stop = 0
    for (let count = 10; count >= 1; count--) {
      const c = s.move('mazo', `p${p}`, 1, { up: true })[0]
      if (valueOf(c) === count) {
        stop = count
        break
      }
    }
    if (!stop) s.move('mazo', `p${p}`, 1, { up: false })
    sum += stop
    s.snap(stop ? `Montón ${p + 1}: cuenta «10, 9, 8…» al repartir y para en ${stop}: salió un ${stop}.` : `Montón ${p + 1}: nunca coincidió. Se tapa con una carta: vale 0.`)
  }
  s.zone('cuenta', stack(84, 44, `Cuenta ${sum}`))
  s.deal('mazo', ['cuenta'], sum)
  s.snap(`Suma los valores donde paró: ${sum}. Reparte ${sum} cartas más.`, { note: 'Cada montón gasta 11 − valor cartas: el total siempre deja la predicción en el mismo sitio.' })
  s.zone('revela', stack(66, 44))
  const got = s.move('mazo', 'revela', 1, { up: true })[0]
  verdict(s, got, target, `La siguiente: ${longName(got)}. La predicción.`, 'No coincide.')
}

export function inversion(s: Script) {
  s.zone('mazo', stack(30, 24), deck(s))
  s.zone('espectador', stack(70, 24, 'Su carta'))
  const chosen = s.pile('mazo')[30]
  s.take(chosen, 'espectador', { up: true })
  s.mark(chosen, 'chosen')
  s.snap('El espectador toma una carta y la memoriza.')
  const b = s.bottom('mazo')
  s.flipCard(b, true)
  s.mark(b, 'key')
  s.snap('Mientras la mira, das vuelta en secreto la carta de abajo.')
  s.turnOver('mazo')
  s.snap('Y das vuelta todo el mazo. Parece boca abajo: solo se ve el dorso de la carta girada.')
  s.take(chosen, 'mazo', { up: false, at: between(s.r, 15, 35) })
  s.snap('El espectador mete su carta boca abajo, donde quiera.')
  s.flipCard(b, true)
  s.snap('Bajo la mesa (o al girarte), endereza la carta de arriba.')
  s.turnOver('mazo')
  s.snap('Das vuelta el mazo otra vez.')
  s.place('mazo', { x: 4, y: 24, dx: 1.65, dy: 0 })
  s.snap('Extiende: su carta es la única boca arriba.', { tone: 'win' })
}

/* ───────────── Técnicas ───────────── */

export function overhand(s: Script) {
  s.zone('izq', stack(34, 28, 'Mano izquierda'))
  s.zone('der', stack(50, 18), deck(s))
  s.hands = { r: { x: 54, y: 12, grip: 'above' }, l: LEFT }
  s.snap('La derecha sostiene el mazo de canto; la izquierda espera debajo.')
  for (let i = 0; i < 5; i++) {
    s.move('der', 'izq', between(s.r, 4, 9), { block: true })
    s.snap(i === 0 ? 'El pulgar izquierdo arrastra un paquetito de arriba.' : 'Y otro. Cada paquete cae encima del anterior.')
  }
  s.move('der', 'izq', 52, { block: true })
  s.snap('Lo que queda se tira encima. El orden de los paquetes se invirtió.')
}

export function riffleTec(s: Script) {
  s.zone('mazo', CENTER, deck(s))
  s.snap('Mazo cuadrado sobre la mesa.')
  s.zone('a', { ...stack(24, 24), rot: -6 })
  s.zone('b', { ...stack(68, 24), rot: 6 })
  s.move('mazo', 'a', 26, { block: true })
  s.move('mazo', 'b', 26, { block: true })
  s.hands = { l: { x: 28, y: 16, grip: 'above' }, r: { x: 72, y: 16, grip: 'above' } }
  s.snap('Corta por la mitad. Los pulgares levantan las esquinas interiores.')
  s.riffle('a', 'b', 'mazo')
  s.snap('Suelta las cartas desde abajo, alternando sin pensar. Se entrelazan.')
  s.hands = undefined
  s.snap('Empuja las mitades para cuadrar.')
}

export function cartaClave(s: Script) {
  s.zone('mazo', CENTER, deck(s))
  const key = s.bottom('mazo')
  s.mark(key, 'key')
  s.inset = { label: 'Clave', cards: [key] }
  s.snap('Espía la carta de abajo: tu clave.')
  const chosen = s.pile('mazo')[25]
  s.zone('espectador', stack(76, 24, 'Su carta'))
  s.take(chosen, 'espectador', { up: true })
  s.mark(chosen, 'chosen')
  s.snap('El espectador saca una carta del medio y la memoriza.')
  s.take(chosen, 'mazo', { up: false })
  s.snap('La deja arriba del mazo.')
  s.cut('mazo', 30)
  s.snap('Corta y completa: la clave, que estaba abajo, cae justo encima de su carta.')
  s.cut('mazo', 17)
  s.snap('Más cortes completos no rompen la pareja.')
  s.place('mazo', { x: 4, y: 24, dx: 1.65, dy: 0 })
  for (const c of s.pile('mazo')) s.up[c] = true
  const p = s.pile('mazo')
  const ok = p[p.indexOf(key) - 1] === chosen
  s.snap('Extiende boca arriba: la carta pegada a la clave es la suya.', { tone: ok ? 'win' : 'fail' })
}

export function hindu(s: Script) {
  const d = deck(s)
  const force = d[0]
  s.zone('izq', stack(36, 30, 'Mano izquierda'))
  s.zone('der', stack(52, 16), d)
  s.mark(force, 'force')
  s.inset = { label: 'A forzar (abajo)', cards: [force] }
  s.hands = { r: { x: 56, y: 10, grip: 'above' }, l: { x: 40, y: 36, grip: 'below' } }
  s.snap('Preparación: la carta a forzar queda abajo del mazo.')
  for (let i = 0; i < 3; i++) {
    s.move('der', 'izq', between(s.r, 5, 9), { block: true })
    s.snap('La izquierda arrastra paquetitos de arriba mientras la derecha se retira.')
  }
  s.ask({ kind: 'choice', prompt: 'El espectador dice «stop» cuando quiera', options: [{ label: '¡Stop!', value: 'stop' }] })
  s.zone('muestra', stack(70, 16, 'Lo que ve'))
  s.take(force, 'muestra', { up: true })
  s.snap('La derecha levanta su paquete y muestra la carta de abajo: siempre la forzada.', { tone: 'win' })
}

export function equivoque(s: Script) {
  const three = deck(s).slice(0, 3)
  const force = three[1]
  s.zone('mesa', row(28, 24, 18), three)
  s.mark(force, 'force')
  s.inset = { label: 'Quieres que acabe en', cards: [force] }
  s.snap('Tres cartas boca abajo. Tú sabes cuál es la que quieres.')
  const a = s.ask({ kind: 'card', prompt: 'Señala una carta', among: ['mesa'] })
  s.zone('fuera', stack(84, 44, 'Descartes'))
  if (a === force) {
    for (const c of three) if (c !== force) s.take(c, 'fuera')
    s.snap('Señaló la buena: «Nos quedamos con esa». Descartas las otras.', { tone: 'win' })
    return
  }
  s.take(a, 'fuera')
  s.snap('Señaló otra: «Eliminamos esa». Quedan dos.')
  const b = s.ask({ kind: 'card', prompt: 'Toma una de las dos', among: ['mesa'] })
  if (b === force) {
    for (const c of three) if (c !== force && s.where(c) === 'mesa') s.take(c, 'fuera')
    s.snap('«Esa es la tuya». La otra al descarte.', { tone: 'win' })
  } else {
    s.take(b, 'fuera')
    s.snap('«Esa la descartas tú». Queda la que tú querías.', { tone: 'win' })
  }
}

export function dobleLift(s: Script) {
  s.zone('mazo', CENTER, deck(s))
  s.hands = { l: { x: 50, y: 31, grip: 'below' }, r: RIGHT }
  const [a, b] = s.top('mazo', 2)
  s.mark(b, 'chosen')
  s.snap('Agarre de repartidor: el mazo en la izquierda, la derecha encima, de punta a punta.')
  s.zone('lift', stack(46, 20))
  s.move('mazo', 'lift', 2, { block: true })
  s.snap('El pulgar derecho levanta la esquina de las dos de arriba: una separación mínima.')
  s.turnOver('lift')
  s.snap(`Dalas vuelta como una sola, cuadradas. Se ve ${short(b)}: todos creen que es la de arriba.`)
  s.turnOver('lift')
  s.move('lift', 'mazo', 2, { block: true })
  s.snap('Bájalas de nuevo como una.')
  s.zone('mesa', stack(76, 24))
  s.move('mazo', 'mesa', 1)
  s.flipCard(a, true)
  s.snap(`La que repartes es ${short(a)}, no la que vieron.`, { tone: 'win' })
}

export function glide(s: Script) {
  const d = deck(s)
  s.zone('atras', stack(46, 28))
  s.zone('mazo', stack(46, 24), d)
  s.zone('mesa', stack(76, 24, 'Mesa'))
  const shown = s.bottom('mazo')
  s.mark(shown, 'key')
  s.inset = { label: 'Muestras la de abajo', cards: [shown] }
  s.hands = { l: { x: 50, y: 31, grip: 'below' } }
  s.snap('Mazo boca abajo en la izquierda, agarrado desde arriba. Muestras la carta de abajo.')
  s.move('mazo', 'atras', 1, { fromBottom: true })
  s.snap('Los dedos izquierdos retiran esa carta un centímetro hacia atrás: el glide.')
  s.hands = { l: { x: 50, y: 31, grip: 'below' }, r: { x: 54, y: 22, grip: 'above' } }
  const real = s.move('mazo', 'mesa', 1, { fromBottom: true })[0]
  s.snap('La derecha saca «la de abajo»… pero toma la siguiente.')
  s.move('atras', 'mazo', 1, { toBottom: true })
  s.flipCard(real, true)
  s.snap(`En la mesa hay ${short(real)}; la que mostraste sigue abajo.`, { tone: 'win' })
}

export function controlOverhand(s: Script) {
  s.zone('izq', stack(34, 28, 'Mano izquierda'))
  s.zone('jog', { x: 34, y: 31, dx: 0, dy: 0 })
  s.zone('resto', stack(34, 28))
  s.zone('der', stack(50, 18), deck(s))
  s.zone('final', stack(34, 28))
  const chosen = s.top('der')[0]
  s.mark(chosen, 'chosen')
  s.hands = { r: { x: 54, y: 12, grip: 'above' }, l: LEFT }
  s.snap('La carta elegida está arriba. Empieza una mezcla por arriba.')
  s.move('der', 'izq', 1)
  s.snap('Arrastra solo la carta de arriba: la elegida.')
  const jog = s.move('der', 'jog', 1)[0]
  s.mark(jog, 'key')
  s.snap('La siguiente cae un poco salida hacia ti: el injog.')
  s.move('der', 'resto', 52, { block: true })
  s.snap('Mezcla el resto encima con normalidad.')
  s.move('jog', 'final', 1, { block: true })
  s.move('resto', 'final', 52, { block: true })
  s.move('izq', 'final', 52, { block: true })
  s.mark(jog, null)
  s.snap('Corta por debajo del injog y tira esas cartas arriba: la elegida vuelve arriba.', { tone: 'win' })
}

export function elmsley(s: Script) {
  const [A, B, C, D] = deck(s).slice(0, 4)
  s.zone('izq', stack(32, 26, 'Izquierda'), [D, C, B, A])
  s.up[C] = true
  s.mark(C, 'chosen')
  s.zone('der', stack(58, 26, 'Derecha'))
  s.hands = { l: { x: 36, y: 33, grip: 'below' }, r: { x: 62, y: 33, grip: 'below' } }
  s.snap('Cuatro cartas boca abajo; la tercera está girada (boca arriba).')
  s.move('izq', 'der', 1)
  s.snap('«Una»: la derecha toma la primera.')
  s.move('der', 'izq', 1, { toBottom: true })
  s.move('izq', 'der', 2, { block: true })
  s.snap('«Dos»: al tomar la segunda, dejas la primera debajo de la izquierda y te llevas dos como una.', {
    note: 'Es el momento clave: la carta girada viaja escondida bajo la segunda.',
  })
  s.move('izq', 'der', 1)
  s.snap('«Tres».')
  s.move('izq', 'der', 1)
  s.snap('«Cuatro». Parecieron cuatro dorsos.')
  s.place('der', { dx: 10, dy: 0, x: 40 })
  s.snap('El orden real: la girada nunca se vio.', { tone: 'win' })
}

export function bottomDeal(s: Script) {
  const d = deck(s)
  s.zone('mazo', CENTER, d)
  s.zone('empuje', { x: 50, y: 22, dx: 0, dy: 0 })
  s.zone('mesa', stack(78, 24, 'Mesa'))
  const bottom = d[0]
  s.mark(bottom, 'key')
  s.inset = { label: 'Abajo (la que quieres dar)', cards: [bottom] }
  s.hands = { l: { x: 50, y: 31, grip: 'below' } }
  s.snap('Agarre de repartidor. Quieres dar la carta de abajo.')
  s.move('mazo', 'empuje', 1)
  s.snap('El pulgar empuja la de arriba como siempre…')
  s.hands = { l: { x: 50, y: 31, grip: 'below' }, r: { x: 74, y: 30, grip: 'below' } }
  s.move('mazo', 'mesa', 1, { fromBottom: true })
  s.snap('…pero los dedos derechos sacan la de abajo, por la esquina inferior.')
  s.move('empuje', 'mazo', 1, { block: true })
  s.flipCard(bottom, true)
  s.snap('El pulgar retira la de arriba. Ritmo idéntico al reparto normal.', { tone: 'win' })
}

export function downUnder(s: Script) {
  s.zone('paquete', stack(20, 24, 'Paquete'), deck(s).slice(0, 10))
  s.zone('mesa', row(40, 6, 5.6))
  const n = s.pile('paquete').length
  const pos = 2 * (n - 2 ** Math.floor(Math.log2(n))) || n // posición superviviente (Josephus)
  const survivor = s.pile('paquete')[n - pos]
  s.mark(survivor, 'force')
  s.inset = { label: `Sobrevive la nº ${pos}`, cards: [survivor] }
  s.snap('Diez cartas. Una a la mesa, la siguiente abajo del paquete, y así.')
  while (s.pile('paquete').length > 1) {
    s.move('paquete', 'mesa', 1, { up: true })
    if (s.pile('paquete').length > 1) s.move('paquete', 'paquete', 1, { toBottom: true })
    if (s.pile('paquete').length % 3 === 0 || s.pile('paquete').length === 1) s.snap('«Abajo, debajo…»')
  }
  s.flipCard(survivor, true)
  s.snap(`Queda la que estaba en la posición ${pos}: con ${n} cartas siempre es esa.`, { tone: 'win' })
}
