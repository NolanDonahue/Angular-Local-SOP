# SopViewer

This project is a portable SOP website template for organizing and reviewing county/municipal operating procedures. Users select SOP titles from a sidebar tree, add them to a workspace, and export to Word when needed.

## Content file locations

All SOP content is maintained as JSON files (no TypeScript edits required):

- `src/assets/content/sop.json`
- `src/assets/content/glossary.json`

## How to add SOP content

1. Open `src/assets/content/sop.json`.
2. Add a new module object to the root array (or inside a module's `children`).
3. Use a unique `id` and set `category` to one of:
   - `routine`
   - `pitfall`
   - `one-off`
4. Add `content` segments:
   - plain text: `{ "type": "text", "value": "..." }`
   - glossary term reference: `{ "type": "term", "termId": "encumbrance", "display": "encumbrance" }`
5. Add nested items under `children` for sub-procedures.
6. Optionally add metadata fields: `tags`, `version`, `updatedAt`, `owner`.

### SOP JSON example

```json
{
  "id": "monthly-reconciliation",
  "title": "Monthly Reconciliation",
  "category": "routine",
  "version": "1.0",
  "updatedAt": "2026-03-30",
  "owner": "County Finance",
  "tags": ["month-end", "reconciliation"],
  "content": [
    { "type": "text", "value": "Reconcile all posted expenses against approved " },
    { "type": "term", "termId": "appropriation", "display": "appropriations" },
    { "type": "text", "value": " before the 5th business day." }
  ],
  "children": []
}
```

## How to add glossary terms

1. Open `src/assets/content/glossary.json`.
2. Add a term with a unique `id`.
3. Use that same `id` in SOP content segments via `termId`.

### Glossary JSON example

```json
{
  "id": "appropriation",
  "term": "Appropriation",
  "definition": "Legislative authorization to spend public funds for a specified purpose."
}
```

## Authoring workflow

1. Edit `sop.json` and/or `glossary.json`.
2. Run the app locally and verify content renders:

```bash
ng serve
```

3. Confirm:
   - sidebar tree shows the new title
   - selecting title adds it to workspace
   - glossary references show expected tooltip text
4. Test Word export from the UI.

## Validation checklist

- JSON format is valid (no trailing commas, valid quotes).
- Every module `id` is unique.
- Every glossary `id` is unique.
- Every `termId` in SOP content exists in `glossary.json`.
- App loads without "Invalid SOP module content format" or glossary format errors.

## Build and distribution notes

Use this production build command for portable output:

```bash
ng build --base-href ./
```

Build output is in `dist/sop-viewer/`. Share that folder as a static site package.

The app is designed for static hosting and can also be opened via `file://` in many environments, but some locked-down browser policies may restrict local file behavior.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
