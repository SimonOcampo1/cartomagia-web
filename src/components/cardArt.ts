import { FACES } from '../engine/faces.ts'

// Caras y dorso de naipe como fondos CSS, compartidos por el tapete y el abanico del inicio.
const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
export const faceUrl: Record<string, string> = Object.fromEntries(Object.entries(FACES).map(([id, svg]) => [id, svgUrl(svg)]))
export const BACK = svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 334'>
<defs><pattern id='p' width='14' height='14' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'>
<rect width='14' height='14' fill='#a8291f'/><path d='M0 7h14M7 0v14' stroke='#d9584a' stroke-width='1.4'/><circle cx='7' cy='7' r='2' fill='#f1e3cf'/></pattern></defs>
<rect width='240' height='334' rx='12' fill='#f8f4ea'/><rect x='12' y='12' width='216' height='310' rx='6' fill='url(#p)'/>
<rect x='12' y='12' width='216' height='310' rx='6' fill='none' stroke='#7d1d16' stroke-width='2'/>
<rect x='18' y='18' width='204' height='298' rx='3' fill='none' stroke='#f1e3cf' stroke-width='1.5'/>
<ellipse cx='120' cy='167' rx='34' ry='46' fill='#a8291f' stroke='#f1e3cf' stroke-width='2'/>
<path d='M120 138l14 29-14 29-14-29z' fill='#f1e3cf'/></svg>`)
