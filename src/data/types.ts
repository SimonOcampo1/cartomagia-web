import type { ScriptFn } from '../engine/scene.ts'

export type Level = 'P' | 'I' | 'A'
export const LEVEL_NAME: Record<Level, string> = { P: 'Principiante', I: 'Intermedio', A: 'Avanzado' }

export type Tag =
  | 'sin-setup'
  | 'setup'
  | 'automatico'
  | 'impromptu'
  | 'matematico'
  | 'juego-de-manos'
  | 'prediccion'
  | 'mentalismo'
  | 'localizacion'
  | 'acaan'
  | 'ases'
  | 'cambio'
  | 'transposicion'
  | 'control'
  | 'forzaje'
  | 'visual'
  | 'pocas-cartas'
  | 'tecnica'
  | 'interactivo'
  | 'short'

export const TAG_NAME: Record<Tag, string> = {
  'sin-setup': 'Sin preparación',
  setup: 'Con preparación',
  automatico: 'Automático',
  impromptu: 'Impromptu',
  matematico: 'Matemático',
  'juego-de-manos': 'Juego de manos',
  prediccion: 'Predicción',
  mentalismo: 'Mentalismo',
  localizacion: 'Localización',
  acaan: 'ACAAN',
  ases: 'Ases',
  cambio: 'Cambio',
  transposicion: 'Transposición',
  control: 'Control',
  forzaje: 'Forzaje',
  visual: 'Visual',
  'pocas-cartas': 'Pocas cartas',
  tecnica: 'Técnica',
  interactivo: 'Simulación interactiva',
  short: 'Short',
}

export type Variant = { name: string; level: Level; text: string }

export type Link = { label: string; url: string; lang?: 'es' | 'en' }

export type Lesson = {
  id: string
  name: string
  level: Level
  tags: Tag[]
  effect: string // lo que ve el público
  method: string // la idea del secreto, en una o dos frases
  minutes?: number
  techniques?: string[] // ids de técnicas
  tips?: string[]
  variants?: Variant[] // otras versiones del mismo efecto, cada una con su nivel
  origin?: string
  script?: ScriptFn
  sim?: boolean // usa mezcla aleatoria: muestra "nueva mezcla"
  videos?: string[] // ids de la playlist
  links?: Link[]
}

export type Video = {
  id: string
  title: string
  channel: string
  dur: number
  lang: string
  level: Level
  tags: Tag[]
  links: string[]
  source?: 'ext'
}

export const yt = (q: string): string => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
