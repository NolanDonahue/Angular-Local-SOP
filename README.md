# SopViewer

SopViewer is a portable Angular SOP workspace for organizing procedures, searching content, and exporting selected modules to Word.

## Prerequisites

- **Node.js** — use an LTS release that satisfies [Angular 21’s version requirements](https://angular.dev/reference/versions).
- **npm** — the repo pins **`npm@11.11.0`** in `package.json` via the `packageManager` field. With [Corepack](https://nodejs.org/api/corepack.html) enabled, `npm install` will align with that version.

## Workspace and presets

A **workspace** is the set of SOP modules you have selected in the app (for example, to scope search or to export a subset to Word). You add and remove modules from the workspace through the table of contents UI.

**Presets** are named shortcuts: each preset lists specific module IDs so you can load a common bundle of procedures in one action. Preset definitions live in `workspace-config-presets.json` (see [Content source files](#content-source-files)).

## Content source files

All editable business content stays in JSON:

- `src/assets/content/sop.json`
- `src/assets/content/glossary.json`
- `src/assets/content/workspace-config-presets.json` — preset `id`, `label`, and `moduleIds` arrays (must reference real SOP module `id` values)

Generated data files (do not edit manually; run `npm run bundle-data` after changing the JSON sources):

- `src/app/core/data/sop.data.ts`
- `src/app/core/data/glossary.data.ts`
- `src/app/core/data/workspace-config-presets.data.ts`

## Project structure

- **`src/app/core/`** — shared services, models, utilities, and generated `*.data.ts` bundles produced from JSON.
- **`src/app/features/`** — route-level UI: table of contents, viewer, glossary, sidebar tree, and the dev-only editor.
- **`scripts/`** — Node tooling: `bundle-data.mjs`, local CMS for the editor, portable build helpers, and bundle verification.

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

### Image authoring

Inline images use placeholder syntax inside **text** segment `value` strings:

- `[[img:filename.jpg|alt text]]` — filename relative to `src/assets/images/` (optional alt after `|`)
- `[[img:filename.jpg]]` — alt may be omitted

In **development**, open the [in-app editor](#in-app-editor-development-only) (`/editor`), edit a module, and use the image upload control: it saves files under `src/assets/images/` and inserts `[[img:...|...]]` at the cursor. After uploading or editing paths by hand, run `npm run bundle-data` so the generated SOP data picks up new files.

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

## In-app editor (development only)

With `npm start`, the app runs the Angular dev server together with a small local CMS API. In that mode, the header shows an **Editor** link to **`/editor`**, where you can browse the SOP tree, edit modules in a dialog, upload images (see [Image authoring](#image-authoring)), and persist changes back to the JSON sources.

**Production builds** hide the Editor link and do not configure a CMS API URL (`environment.production` is true). The viewer, workspace, and export features are what you ship; treat the editor as a local authoring aid, not part of the distributed viewer.

## Authoring workflow

**1. Edit content** — Change `sop.json`, `glossary.json`, and/or `workspace-config-presets.json` (or use the dev editor, which updates those files via the API).

**2. Regenerate bundled data**

```bash
npm run bundle-data
```

**3. Run locally**

```bash
npm start
```

**4. Verify**

- Tree includes your new or updated content.
- Workspace interactions still work.
- Glossary references render correctly.
- Word export produces expected output.

## Commands

- `npm start` — local dev server (`ng serve`) plus `scripts/local-cms.mjs` for the editor API
- `npm run bundle-data` — convert JSON content into generated TypeScript constants (external image mode by default)
- `npm run bundle-data:inline` — generate SOP data with inlined image base64 payloads for offline/single-file use
- `npm run build` — standard Angular production build (bundles external images, then `ng build`, then file-static post-processing)
- `npm run build:external` — **alias for `npm run build`** (same script)
- `npm run build:local` — production build with relative base paths (`--base-href ./`) without the full `build` pipeline
- `npm run build:portable` — bundle data (inline images), then portable local build
- `npm run build:file-static` — rewrite build output into a single file-static JS entry
- `npm run check:external-bundle` — verify generated SOP data has no `base64Data` and print file size stats
- `npm run verify:bundle-paths` — static check that bundled asset paths stay within expected roots
- `npm run preview:dist` — serve built app from `dist/sop-viewer/browser` on port `8080`
- `npm test` — run unit tests
- `npm run lint` — run ESLint checks

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

Before sharing a build, run the checks in [Validation checklist](#validation-checklist) (including `verify:bundle-paths` and, when using external image mode, `check:external-bundle`).

## Validation checklist

- JSON is valid.
- SOP module `id` values are unique.
- Glossary `id` values are unique.
- Every SOP `termId` exists in `glossary.json`.
- Preset `moduleIds` in `workspace-config-presets.json` reference existing SOP modules.
- App loads without SOP/glossary format errors.
- Before distributing a build: `npm run verify:bundle-paths`; if you rely on external (non-inlined) images in the bundle, also run `npm run check:external-bundle`.
