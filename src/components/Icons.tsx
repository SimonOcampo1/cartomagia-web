const P: Record<string, string> = {
  play: 'M8 5.5v13l10.5-6.5z',
  pause: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
  prev: 'M6 5h2v14H6zM19 5.5v13L9.5 12z',
  next: 'M16 5h2v14h-2zM5 5.5v13L14.5 12z',
  replay: 'M12 5a7 7 0 1 1-6.6 4.7l1.9.6A5 5 0 1 0 12 7v3L7.5 6 12 2z',
  shuffle: 'M16 4l4 3.5-4 3.5V8.5h-1.6c-1.5 0-2.4.8-3.4 2.3l-3 4.6C6.8 17.4 5.6 18.5 3.4 18.5H2v-2h1.4c1.4 0 2.1-.6 3-2l3-4.6c1.3-2 2.8-3.4 5-3.4H16zM2 6.5h1.4c1.7 0 2.8.7 3.7 1.8l-1.2 1.8C5.2 9 4.6 8.5 3.4 8.5H2zm14 7.5 4 3.5-4 3.5v-2.5h-1.6c-1.8 0-3-.8-4-2l1.2-1.8c.8 1.2 1.5 1.8 2.8 1.8H16z',
  eye: 'M12 6c4.5 0 8 3.2 9.5 6-1.5 2.8-5 6-9.5 6s-8-3.2-9.5-6C4 9.2 7.5 6 12 6zm0 2.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  cube: 'M12 2.5 20.5 7v10L12 21.5 3.5 17V7zM6 8.2v7.6l5 2.7v-7.6zm12 0-5 2.7v7.6l5-2.7zM12 4.8 7.2 7.3 12 9.8l4.8-2.5z',
  check: 'M9.5 15.6 5.4 11.5 4 12.9l5.5 5.5L20 7.9l-1.4-1.4z',
  search: 'M10.5 4a6.5 6.5 0 0 1 5.2 10.4l4.3 4.3-1.4 1.4-4.3-4.3A6.5 6.5 0 1 1 10.5 4zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z',
  external: 'M14 4h6v6h-2V7.4l-7.3 7.3-1.4-1.4L16.6 6H14zM5 6h6v2H6v10h10v-5h2v7H4z',
  expand: 'M4 4h6v2H6v4H4zm10 0h6v6h-2V6h-4zM4 14h2v4h4v2H4zm14 0h2v6h-6v-2h4z',
  collapse: 'M8 4h2v6H4V8h4zm6 0h2v4h4v2h-6zM4 14h6v6H8v-4H4zm10 0h6v2h-4v4h-2z',
  close: 'M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6 10.6 12 5 6.4z',
}

export function Icon({ name }: { name: keyof typeof P }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path d={P[name]} fill="currentColor" fillRule="evenodd" />
    </svg>
  )
}
