# Tapete · escuela de cartomagia

Trucos y técnicas de cartomagia paso a paso sobre un tapete animado, de principiante a avanzado, más una videoteca filtrable.

```bash
npm install
npm run dev     # http://localhost:5173
npm run check   # simula cada truco 200 veces y verifica que funcione
npm run build
```

- `src/engine/scene.ts`: motor de guiones. Un truco muta zonas de cartas y congela pasos con `snap()`; `motion` anima entre pasos. Las preguntas (`ask`) cortan el guion hasta que el usuario responde.
- `src/data/scripts.ts`: guiones de trucos y técnicas.
- `src/data/lessons.ts`: fichas (nivel, etiquetas, efecto, método, videos).
- `src/data/videos.ts`: generado con yt-dlp desde la playlist `PLBaAwoiYmUUs`.
