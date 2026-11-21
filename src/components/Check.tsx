import type { ReactNode } from 'react'
import { Icon } from './Icons.tsx'

/** Casilla (o interruptor) con la UI del sitio; el input nativo queda debajo para teclado y lectores de pantalla. */
export function Check({ checked, onChange, toggle = false, children }: { checked: boolean; onChange: (v: boolean) => void; toggle?: boolean; children: ReactNode }) {
  return (
    <label className={toggle ? 'check toggle' : 'check'}>
      <input type="checkbox" role={toggle ? 'switch' : undefined} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="box" aria-hidden>
        {!toggle && <Icon name="check" />}
      </span>
      {children}
    </label>
  )
}
