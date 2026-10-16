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

- **Email, Telegram and social links:** `src/config/site.js`
- **Prices:** `src/data/pricing.js` (amounts in sum); titles and descriptions are in the i18n files
- **All text, in English and Russian:** `src/i18n/en.js` and `src/i18n/ru.js` (same keys in both)
- **Services list:** `src/data/services.js`

## Languages

English and Russian, switched with the EN / RU control in the header. The first visit follows the browser language; the choice is then remembered. `?lang=ru` or `?lang=en` in the URL forces a language (handy for sharing links).
Space Grotesk has no Cyrillic, so Russian text renders in Geist (`src/styles/fonts.css`).

## Notes

- There is no backend. The contact form validates on the client, then gives the visitor a pre-filled `mailto:` link to send the brief themselves. The page says so.
- Choosing a price row scrolls to the contact form and pre-selects that project type.
- `prefers-reduced-motion` turns off the loader, scroll-lit text, WebGL animation and the other motion effects.
- Press **G** anywhere to toggle the 12-column layout grid.
