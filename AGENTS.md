<!-- From: c:\xampp\htdocs\vinara\AGENTS.md -->
# Vinara — Agent Notes

> **Vinara** is a custom left-to-right script note-taking & transliteration web app. It replaces the traditional Thaana script with a custom glyph set rendered via the `Vinara` font, while preserving the familiar QWERTY keyboard layout used by Maldivians for Dhivehi typing.
> 
> This is an **open-source project** under SIL OFL 1.1. All source files, font files, SVG glyphs, and documentation are publicly available.

---

## 1. Project Overview

- **Name:** Vinara
- **Version:** 3.0
- **Description:** Vinara script — a writing system for Dhivehi and English
- **Language:** English (all comments, documentation, and UI text are in English)
- **Architecture:** Static multi-page website with a client-side note-taking app
- **Data Storage:** All user data (notes) is stored in `localStorage` — there is no server-side database or backend API
- **License:** SIL Open Font License 1.1

### Key Features
- Note-taking in Vinara script (direct font input) or via Latin transliteration
- Two Latin input sub-modes: Dhivehi romanization and English letter-by-letter
- Sidebar with note list, search, pinning, and tags
- Dark / light theme toggle (persisted across pages via localStorage)
- Export notes as plain text or as rendered PNG images (via `html2canvas`)
- Custom `.vnr` file format for save/load (Base64-encoded with `VNR1` magic header)
- Script reference drawer with consonants, vowels, sukun, and English letters
- Keyboard shortcuts for common actions
- Mobile-responsive layout (hamburger sidebar toggle, CSS media queries)
- Landing page with navigation to app, reference, about, origins, and guide pages

---

## 2. Technology Stack

| Layer | Technology |
|-------|------------|
| Client-side | Vanilla JavaScript (ES5-style IIFE modules, no build step, no frameworks) |
| Styling | Plain CSS (single file `style.css` shared across all pages, CSS variables for theming) |
| Fonts | Custom `vinara.ttf` (48 glyphs), system UI fonts (`Inter`, `Segoe UI`) |
| External CDN | `html2canvas` 1.4.1 (for image export) loaded from cdnjs |
| Data format | JSON (`docs/keyboard-map.json`) + `localStorage` |

**No build tools, no package managers, no bundlers.** This is a zero-dependency (except the CDN script) client-side application.

---

## 3. Directory Structure

```
.
├── index.html              # Landing page with cards grid
├── style.css               # Shared styles across all pages
├── README.md               # Project readme
├── LICENSE                 # SIL OFL 1.1 license text
├── vercel.json             # Vercel routing config
│
├── app/
│   ├── index.html          # Note-taking app entry point
│   ├── app.js              # App-specific JavaScript logic
│   └── app.css             # App-specific styles
│
├── about/
│   └── index.html          # Why Vinara — editorial page
│
├── origins/
│   └── index.html          # Character origins — editorial page
│
├── guide/
│   └── index.html          # Make Your Own — practical guide
│
├── reference/
│   └── index.html          # Script reference — character tables & keyboard map
│
├── js/
│   ├── mapping.js          # VINARA_MAP object: character mappings, compounds, collisions
│   ├── translit-engine.js  # VinaraTranslit: Dhivehi/English transliteration + reverse
│   └── vnr.js              # VNRHandler: custom .vnr file encode/decode
│
├── font/
│   ├── vinara.ttf          # Installable font file
│   └── vinara-old.ttf      # Previous version font (for reference)
│
└── docs/
    └── keyboard-map.json   # JSON mirror of character mapping data
```

---

## 4. Module Breakdown

### JavaScript Layer (`js/`)
- **`mapping.js`** — Exposes `VINARA_MAP`, a singleton object containing:
  - `CONSONANTS`, `ENGLISH_ONLY`, `VOWELS`, `EXTENDER`, `SUKUN`, `ALIFU`
  - `DHIVEHI_COMPOUNDS` (multi-letter sequences → single char)
  - `LONG_VOWEL_PAIRS` (aa→aX, ee→iX, etc.)
  - `SUKUN_CONSONANTS` and `COLLISION_MAP`
  - Input key sets for detection (`CONSONANT_KEYS`, `VOWEL_KEYS`, `ENGLISH_KEYS`)

- **`translit-engine.js`** — Exposes `VinaraTranslit` with methods:
  - `detectMode(text)` — heuristic to decide Dhivehi vs English
  - `englishMode(text)` — letter-by-letter mapping, adds alifu for standalone vowels
  - `dhivehiMode(text)` — full romanization with compounds, long vowels, sukun handling
  - `latinToVinara(text, forcedMode)` — main entry point
  - `vinaraToLatin(text)` — reverse conversion (for export/reference)

- **`vnr.js`** — Exposes `VNRHandler` for the custom `.vnr` file format:
  - `encode(plain)` → `VNR1` + Base64(UTF-8)
  - `decode(raw)` → verifies `VNR1` prefix, returns decoded string
  - Standalone file open/save helpers (legacy; current app uses `localStorage` + text export)

### App (`app/`)
- **`index.html`** — The note-taking app. Loads shared `../style.css` + `app.css`.
- **`app.js`** — Main application IIFE. Manages:
  - State: `notes` array, `activeId`, `searchQuery`, `inputMode`, `latinSubMode` (all persisted to `localStorage`)
  - CRUD: `newNote()`, `openNote()`, `deleteNote()`, `togglePin()`
  - UI: sidebar rendering, theme toggle, drawer, modal, stats bar, font load check
  - Input modes: Vinara direct vs Latin (with Dhivehi/English sub-modes)
  - Export: plain text download, PNG image export via `html2canvas` offscreen capture
  - Keyboard shortcuts: `Ctrl+S` (save), `Ctrl+E` (export), `Ctrl+N` (new), `Ctrl+B` (sidebar), `Alt+1` (Write tab), `Ctrl+K` (reference drawer)
- **`app.css`** — App-specific styles for the editor, sidebar, panels, drawer, modal, etc.

### Pages
- **`index.html`** (root) — Landing page with hero section, Vinara glyph display, and 6-card navigation grid.
- **`about/index.html`** — Editorial page explaining why Vinara was created. Long-form content with pull quotes.
- **`origins/index.html`** — Character-by-character design history. Large glyph displays with descriptions.
- **`guide/index.html`** — Practical guide for forking Vinara. Step-by-step instructions for design, font building, and deployment.
- **`reference/index.html`** — Functional reference page with character tables, keyboard map, and 34th character explanation.

### Font (`font/`)
- **`vinara.ttf`** — The current version 3 font file (48 glyphs).
- **`vinara-old.ttf`** — Previous version for reference/comparison.

### Data (`docs/`)
- **`keyboard-map.json`** — Machine-readable JSON equivalent of `VINARA_MAP`. Used for external reference or potential future tooling. Not loaded by the app at runtime.

---

## 5. Build & Runtime

### How to Run
1. Place the project directory inside a web server document root (e.g., `c:\xampp\htdocs\vinara` or similar).
2. Open `http://localhost/vinara/` (or the appropriate base URL) in a browser.
3. The app runs entirely client-side after the initial page load.

### No Build Step
There is no `package.json`, `composer.json`, `Makefile`, or any build configuration. Files are served as-is. Changes to JS/CSS/HTML take effect immediately on refresh.

### Deployment
- Copy all files to the target web server directory.
- Ensure `font/vinara.ttf` is served with correct MIME type (`font/ttf` or `application/octet-stream`).
- No environment variables, no secrets, no database setup required.
- Vercel config in `vercel.json` handles SPA-style routing for subdirectories.

---

## 6. Code Style Guidelines

- **JavaScript:** ES5-compatible IIFE modules, `'use strict'`, `var` only (no `let`/`const`), no arrow functions, no classes. This is intentional for maximum browser compatibility without transpilation.
- **CSS:** Single shared file `style.css` for base styles, plus `app.css` for app-specific styles. Custom properties (`--*`) for theming, mobile-first with `@media (max-width: 600px)` for responsive adjustments.
- **Comments:** Use `/* ─── Title ───────────────────────────── */` banner style at the top of each file and `// ── Section ──` for internal divisions.
- **Naming:** `camelCase` for JS variables/functions, `UPPER_SNAKE_CASE` for constants/map objects, `kebab-case` for CSS classes.
- **File headers:** Every file starts with a banner comment containing the file name, one-line description, and attribution.

---

## 7. Testing

There is **no automated test suite** (no Jest, PHPUnit, or similar). Testing is manual:

1. Open the app in a browser.
2. Create, edit, pin, search, and delete notes.
3. Toggle between Vinara and Latin input modes; test Dhivehi and English sub-modes.
4. Export a note as text and as image.
5. Switch themes and refresh to confirm `localStorage` persistence.
6. Resize to mobile width to verify sidebar hamburger and layout.
7. Check the script reference drawer for correct glyph rendering.
8. Navigate between all pages (landing, about, origins, guide, reference, app) and verify links.

If adding new transliteration rules, verify against `docs/keyboard-map.json` and the reference drawer in `app.js` to keep them in sync.

---

## 8. Security Considerations

- **No authentication or authorization.** The app is entirely client-side; anyone with access to the URL can use it.
- **No server-side data storage.** Notes live in the user's browser `localStorage`. There is no server database to secure.
- **XSS surface:** `innerHTML` is used in `renderSidebar()` and `buildDrawer()`. The data source is `localStorage` (user-controlled), but there is no sanitization. If notes contain HTML/JS, it will be injected. This is acceptable for a local single-user tool, but be cautious if extending.
- **No HTTPS enforcement** — ensure the production server forces HTTPS to prevent mixed-content issues with the CDN script.
- **`.vnr` file format:** The `decodeVnr` function uses `escape()` and `atob()`, which are well-understood but legacy APIs. The `VNR1` magic header provides basic corruption detection, not cryptographic integrity.

---

## 9. Notes for Agents

- **Do not introduce a build step or framework** unless explicitly requested. The project is intentionally zero-build.
- **Keep ES5 compatibility** when editing JS. Avoid modern syntax (`const`, `let`, arrow functions, template literals, `async/await`).
- **Keep `mapping.js` and `docs/keyboard-map.json` in sync** if you modify character mappings.
- **The `translit-engine.js` and `mapping.js` are the source of truth** for the script logic; `docs/keyboard-map.json` is a secondary export.
- **Theme variables** are defined in `:root` and `.light` in `style.css`. Add new UI colors there.
- **If adding new keyboard shortcuts**, update the shortcuts modal in `app/index.html` and the global `keydown` listener in `app/app.js`.
- **The Transliterate tab** is currently commented out in `app/index.html` and `app/app.js`. It can be re-enabled by uncommenting the relevant HTML and shortcut bindings.
- **When creating new pages**, use the shared `style.css` and follow the existing page structure (header with wordmark + GitHub link, back-nav, editorial content, site-footer).
- **Font path** in CSS is `font/vinara.ttf` from the root. The `@font-face` rule is in `style.css`.
