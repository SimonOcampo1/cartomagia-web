import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useDismiss } from '../lib/hooks.ts'
import { Icon } from './Icons.tsx'

export type Option = { value: string; label: string }

/** Lista desplegable con la UI del sitio: un botón y un listbox que se maneja con flechas, Inicio/Fin, Enter y Esc. */
export function Select({ label, value, options, onChange }: { label: string; value: string; options: Option[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const id = useId()
  const at = Math.max(0, options.findIndex((o) => o.value === value))
  const close = (refocus = false) => {
    setOpen(false)
    if (refocus) box.current?.querySelector('button')?.focus()
  }
  useDismiss(open, close, box)
  useEffect(() => {
    if (open) list.current?.focus()
  }, [open])
  const show = () => (setActive(at), setOpen(true))

  const pick = (n: number) => (onChange(options[n].value), close(true))
  const onKey = (e: KeyboardEvent) => {
    const last = options.length - 1
    if (e.key === 'ArrowDown') setActive(Math.min(active + 1, last))
    else if (e.key === 'ArrowUp') setActive(Math.max(active - 1, 0))
    else if (e.key === 'Home') setActive(0)
    else if (e.key === 'End') setActive(last)
    else if (e.key === 'Enter' || e.key === ' ') pick(active)
    else if (e.key === 'Escape') close(true)
    else if (e.key === 'Tab') return close()
    else return
    e.preventDefault()
  }

  return (
    <div className="select" ref={box}>
      <button
        type="button"
        className="select-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${options[at].label}`}
        onClick={() => (open ? close() : show())}
        onKeyDown={(e) => (e.key === 'ArrowDown' || e.key === 'ArrowUp') && (e.preventDefault(), show())}
      >
        <span>{options[at].label}</span>
        <Icon name="chevron-down" />
      </button>
      {open && (
        <ul className="select-list" role="listbox" aria-label={label} tabIndex={-1} ref={list} aria-activedescendant={`${id}-${active}`} onKeyDown={onKey}>
          {options.map((o, n) => (
            <li
              key={o.value}
              id={`${id}-${n}`}
              role="option"
              aria-selected={n === at}
              className={n === active ? 'active' : undefined}
              onClick={() => pick(n)}
              onPointerEnter={() => setActive(n)}
            >
              {o.label}
              {n === at && <Icon name="check" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
