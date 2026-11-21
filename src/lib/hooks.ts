import { useEffect, useState } from 'react'

export function useHash() {
  const [hash, setHash] = useState(() => location.hash.slice(1) || '/')
  useEffect(() => {
    const on = () => {
      setHash(location.hash.slice(1) || '/')
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return hash
}

const KEY = 'tapete:aprendidos'
const read = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

// Progreso por navegador; si el storage falla, vive en memoria.
export function useLearned() {
  const [learned, setLearned] = useState(() => new Set(read()))
  const toggle = (id: string) => {
    const next = new Set(learned)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setLearned(next)
    try {
      localStorage.setItem(KEY, JSON.stringify([...next]))
    } catch {
      /* sin storage: no persiste */
    }
  }
  return { learned, toggle }
}
