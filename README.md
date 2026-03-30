# SopViewer

SopViewer is a portable Angular SOP workspace for organizing procedures, searching content, and exporting selected modules to Word.

## Content source files

All editable business content stays in JSON:

- `src/assets/content/sop.json`
- `src/assets/content/glossary.json`

Generated data files (do not edit manually):

- `src/app/core/data/sop.data.ts`
- `src/app/core/data/glossary.data.ts`

## Editing SOP content

1. Open `src/assets/content/sop.json`.
2. Add or update modules in the root list or nested `children`.
3. Use a unique `id` and one of these categories:
   - `routine`
   - `pitfall`
   - `one-off`
4. Build `content` with segment objects:
   - Text segment: `{ "type": "text", "value": "..." }`
   - Glossary reference: `{ "type": "term", "termId": "appropriation", "display": "appropriation" }`

Example:

```json
{
  "id": "monthly-reconciliation",
  "title": "Monthly Reconciliation",
  "category": "routine",
  "content": [
    { "type": "text", "value": "Reconcile all posted expenses against approved " },
    { "type": "term", "termId": "appropriation", "display": "appropriations" },
    { "type": "text", "value": " before the 5th business day." }
  ],
  "children": []
}
```

## Editing glossary terms

1. Open `src/assets/content/glossary.json`.
2. Add a unique `id`, `term`, and `definition`.
3. Reference that term in SOP content via `termId`.

Example:

```json
{
  "id": "appropriation",
  "term": "Appropriation",
  "definition": "Legislative authorization to spend public funds for a specified purpose."
}
```

## Authoring workflow

1. Edit `sop.json` and/or `glossary.json`.
2. Regenerate bundled data:

```bash
npm run bundle-data
```

1. Start local development:

```bash
npm start
```

1. Verify:
   - tree includes your new or updated content
   - workspace interactions still work
   - glossary references render correctly
   - Word export produces expected output

## Commands

- `npm start` - run local dev server (`ng serve`)
- `npm run bundle-data` - convert JSON content into generated TypeScript constants (external image mode by default)
- `npm run bundle-data:inline` - generate SOP data with inlined image base64 payloads for offline/single-file use
- `npm run build` - standard Angular production build
- `npm run build:local` - production build with relative base paths (`--base-href ./`)
- `npm run build:portable` - bundle data, then run portable local build
- `npm run build:file-static` - build and rewrite output into a single file-static JS entry
- `npm run check:external-bundle` - verify generated SOP data has no `base64Data` and print file size stats
- `npm run preview:dist` - serve built app from `dist/sop-viewer/browser` on port `8080`
- `npm test` - run unit tests
- `npm run lint` - run ESLint checks

## Build and distribution

For most offline/static distribution use:

```bash
npm run build:portable
```

Artifacts are written under `dist/sop-viewer/`.

If your host cannot reliably run module-based entry scripts, use:

```bash
npm run build:file-static
```

Then validate from a local static server:

```bash
npm run preview:dist
```

## Validation checklist

- JSON is valid.
- SOP module `id` values are unique.
- Glossary `id` values are unique.
- Every SOP `termId` exists in `glossary.json`.
- App loads without SOP/glossary format errors.
