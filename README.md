# FluxenWeb

Frontend-only site for the FluxenWeb digital studio. React 18 + Vite, plain CSS Modules, Three.js for the hero artifact (lazy-loaded), Lucide icons.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # serve the production build
npm run lint
```

## Configure

- **Email, social links, availability line:** `src/config/site.js`
- **Concept projects:** `src/data/projects.js`
- **Services / process stages:** `src/data/services.js`, `src/data/process.js`

## Notes

- There is no backend. The contact form validates on the client, then gives the visitor a pre-filled `mailto:` link to send the brief themselves. The page says so.
- All four case studies are labelled as self-initiated concept projects.
- `prefers-reduced-motion` turns off the loader, scroll-lit text, WebGL animation and the other motion effects.
- Press **G** anywhere to toggle the 12-column layout grid.
