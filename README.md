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
- `npm run bundle-data` — convert JSON content into generated TypeScript constants (image `src` paths under `assets/images/`, no base64)
- `npm run bundle-data:external` — alias for `npm run bundle-data`
- `npm run build` — `bundle-data`, production `ng build`, then inline JS/CSS into `sop-viewer-standalone.html` (see [Build and distribution](#build-and-distribution))
- `npm run build:external` — **alias for `npm run build`** (same script)
- `npm run build:local` — production build with relative base paths (`--base-href ./`) without `bundle-data` or file-static post-processing
- `npm run build:portable` — `bundle-data`, `ng build --base-href ./`, then same inline HTML step as `build` (artifact: standalone HTML + `assets/` folder)
- `npm run build:portable:external` — `bundle-data` and `build:local` only (no inline HTML step; keeps hashed `main-*.js` / chunks)
- `npm run build:file-static` — run the inline HTML step on an existing `dist/sop-viewer/browser` output (after `ng build`)
- `npm run check:external-bundle` — verify generated SOP data has no `base64Data` and print file size stats
- `npm run verify:bundle-paths` — static check that bundled asset paths stay within expected roots
- `npm run preview:dist` — serve built app from `dist/sop-viewer/browser` on port `8080`
- `npm test` — run unit tests
- `npm run lint` — run ESLint checks

## Build and distribution

Detailed layout and `file://` usage are described in [Portable release (zip)](#portable-release-zip) below.

For a full production artifact (inlined app script/styles + external assets):

```bash
npm run build
```

or equivalently for the same inline step with explicit base href:

```bash
npm run build:portable
```

Artifacts are written under `dist/sop-viewer/browser/` (`sop-viewer-standalone.html`, `index.html`, and `assets/`).

To re-run only the inline HTML step after a manual `ng build`:

```bash
npm run build:file-static
```

Validate from a local static server:

```bash
npm run preview:dist
```

Before sharing a build, run the checks in [Validation checklist](#validation-checklist) (including `verify:bundle-paths` and `check:external-bundle`).

## Portable release (zip)

After `npm run build` or `npm run build:portable`, ship a folder or zip such as:

```text
SOP-Release/
├── sop-viewer-standalone.html   # HTML + inlined app JS/CSS + bundled SOP data
├── index.html                   # same document as standalone (optional; useful for static servers)
└── assets/                      # images, icons, content JSON copies from the build
    ├── images/                  # SOP images (when present)
    ├── icons/
    └── content/
```

Users extract the archive, keep **`sop-viewer-standalone.html`** and **`assets/`** in the same directory, and open the standalone file (double-click or `file://`). Inlined JavaScript and CSS reduce issues with policies that block external local scripts; images load via `<img src="assets/images/...">` relative to the HTML file without fetch/CORS on `file://`.

## Validation checklist

- JSON is valid.
- SOP module `id` values are unique.
- Glossary `id` values are unique.
- Every SOP `termId` exists in `glossary.json`.
- Preset `moduleIds` in `workspace-config-presets.json` reference existing SOP modules.
- App loads without SOP/glossary format errors.
- Before distributing a build: `npm run verify:bundle-paths` and `npm run check:external-bundle`.
