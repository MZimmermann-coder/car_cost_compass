# Car Cost Compass: Build Plan (Vite + Svelte 5 + Singlefile)

This plan is written for a new, separate project. It assumes no prior knowledge.

## Summary

Tool capabilities (must-have):
- Add/edit/remove cars with all input fields.
- View an overview comparison with ranking and min/max highlighting.
- View a detailed per-car 10-year cost breakdown (yearly + cumulative).
- Adjust global settings (prices, cost growth, planning horizon, depreciation ranges).
- Open/save data inside the HTML file using the File System Access API with a download fallback.

Goal: Build a maintainable project that bundles to one HTML file with all JS/CSS inlined. The full source code must be delivered, not just the built HTML.

Toolchain: Vite + `@sveltejs/vite-plugin-svelte` + `vite-plugin-singlefile`, Svelte 5 (runes mode), plain JavaScript (no TypeScript).

## Conventions

- **Language split**: All UI labels, headings, units, and user-facing text are in **German**.
  All code (variable names, function names, comments, file names) is in **English**.
  Exception: domain-specific data field keys (e.g., `kaufpreis`, `marke`) stay in German
  because they map 1:1 to the German UI labels and the stored JSON schema.
- **Number formatting**: All displayed numbers use **German locale** (`de-DE`).
  Use `Intl.NumberFormat('de-DE', ...)` for output formatting.
  Examples: `1.234,56 Ã¢â€šÂ¬`, `12.500 km`, `3,5 %`.
  Input parsing must accept both comma and dot as decimal separators.

## UI/UX Concept

- Layout: left sidebar navigation + top bar actions (open/save + file status).
- Views:
  - **Garage**: list of cars as cards with key KPIs and quick actions.
  - **Overview**: comparison table with ranking and min/max highlighting.
  - **Detail**: per-car deep analysis with summary strip and 10-year cost table.
  - **Settings**: grouped cards with inline hints (fuel prices, depreciation brackets).
- Add/Edit car: slide-over panel with sections (Basics, Ownership, Costs, EV, Notes).
- Visual style: warm neutral palette, single accent, soft card shadows, clear typography.
- Responsive: sidebar collapses into a hamburger menu on screens < 768px.
  Tables scroll horizontally on small screens. Slide-over panel goes full-width on mobile.

## Step-by-Step Implementation Plan (with checkboxes)

- [x] Step 1: Create project with Vite + Svelte.
  - `npm create vite@latest car_cost_compass -- --template svelte`
  - `cd car_cost_compass`
  - `npm install`
  - `npm install -D vite-plugin-singlefile`
  - Verify that `@sveltejs/vite-plugin-svelte` is already in `devDependencies`
    (the svelte template includes it automatically).
  - Delete the template boilerplate files (`src/assets/`, `src/lib/Counter.svelte`,
    default `src/App.svelte` contents, `src/app.css`) Ã¢â‚¬â€ they will be replaced.

- [x] Step 2: Project structure.
  ```
  car_cost_compass/
  Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ index.html                  # app shell + embedded JSON data-store
  Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ vite.config.js              # Vite config with svelte + singlefile plugins
  Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ package.json
  Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ src/
  Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ main.js                 # mount App.svelte to #app
  Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ App.svelte              # layout shell (sidebar + topbar + view router)
  Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ app.css                 # global styles (palette, typography, resets)
  Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ lib/
  Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ state.svelte.js     # reactive state with Svelte 5 runes ($state)
  Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ compute.js          # pure cost calculation logic (no Svelte imports)
  Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ storage.js          # File System Access API open/save logic
  Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ views/
  Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Garage.svelte       # car card list with KPIs
  Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Overview.svelte     # comparison table with ranking
  Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Detail.svelte       # per-car 10-year cost breakdown
  Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ Settings.svelte     # grouped settings cards
  Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ components/
  Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Sidebar.svelte      # left navigation between views
  Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ TopBar.svelte       # open/save buttons + file status indicator
  Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ CarCard.svelte      # individual car card (used in Garage)
  Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ CarEditor.svelte    # slide-over panel for add/edit car
  Ã¢â€â€š       Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ CostTable.svelte    # reusable 10-year breakdown table (used in Detail)
  ```
  Notes on Svelte 5 file naming:
  - Files containing runes (`$state`, `$derived`, `$effect`) at the module top level
    must use the `.svelte.js` extension (e.g., `state.svelte.js`).
  - Pure logic files without runes use plain `.js` (e.g., `compute.js`, `storage.js`).

- [x] Step 3: Add `data-store` to `index.html`.
  - Inside `index.html`, add before the `<script type="module" src="/src/main.js">`:
    ```html
    <script id="data-store" type="application/json">{
      "version": 1,
      "settings": { /* defaults from Step 4 */ },
      "cars": []
    }</script>
    ```
  - This JSON block is read on app init and updated on save.

- [x] Step 4: Define data model and defaults (explicit fields).
  - `Car` fields (all strings in storage; convert to numbers for math):
    - `id` (auto-generated UUID string for keying)
    - `marke`, `modell`, `modellvariante`, `baujahr`
    - `kilometerstand` (informational only, not used in calculations)
    - `neu` (values: `Neu` or `Gebraucht`)
    - `beschaffungsart` (values: `Kauf` or `Leasing`)
    - `kaufpreis`, `rabatt`, `steuerMehr`, `leasingrate`
    - `versicherungsart` (values: `Vollkasko`, `Teilkasko`, `Haftpflicht`)
    - `sfklasse` (informational only, not used in calculations)
    - `versicherung`, `steuerMonat`, `wartung`, `reparatur`
    - `kraftstoffart` (values: `Benzin`, `Diesel`, `Elektro`)
    - `verbrauch`, `winterreichweite`, `batterie`, `ladeleistung`
    - `thg`, `kommentar`
  - `Settings` fields:
    - `kmPerYear`, `benzinpreis`, `dieselpreis`, `strompreis`
    - `opportunitaet`, `kostensteigerung`, `planungshorizont`
    - `depr`: `{ age1, age2_3, age4_5, age6_8, age9_12, age13p }`
  - Default settings values:
    - `kmPerYear: 10000`
    - `benzinpreis: 1.85`, `dieselpreis: 1.75`, `strompreis: 0.35`
    - `opportunitaet: 4`, `kostensteigerung: 3`, `planungshorizont: 5`
    - `depr: { age1: 30, age2_3: 15, age4_5: 10, age6_8: 7, age9_12: 5, age13p: 4 }`
  - Default car template:
    - Empty strings for numeric/text fields.
    - Defaults for selects: `neu="Neu"`, `beschaffungsart="Kauf"`,
      `versicherungsart="Vollkasko"`, `kraftstoffart="Benzin"`.
  - `State`: `{ version, settings, cars }`.
  - **Svelte 5 state implementation** (`state.svelte.js`):
    - Export a single reactive state object using `$state`:
      ```js
      export const appState = $state({
        version: 1,
        settings: { /* defaults */ },
        cars: []
      });
      ```
    - Export a `currentView` rune: `export let currentView = $state('garage');`
    - Export a `fileHandle` rune: `export let fileHandle = $state(null);`
    - Export a `dirty` rune: `export let dirty = $state(false);`
      Set `dirty = true` whenever `appState` is modified; reset on save.
    - Export `loadState(newState)` function to replace `appState` contents
      (used by file open). Must call `normalizeState` first.
    - Export `normalizeState(raw)` to fill missing fields with defaults
      (handles opening files saved with older versions).

- [x] Step 5: Implement calculation logic (match the rules defined here).
  - This is a **pure JS module** (`compute.js`) with no Svelte imports.
  - All functions take plain objects (car, settings) as arguments and return results.
  - Parse numbers with comma or dot (e.g., `"15,2"` => `15.2`). Export a `num(val)` helper.
  - `listPrice = kaufpreis + rabatt` (rabatt only if Kauf + Neu; otherwise 0).
    For used cars (Gebraucht): same depreciation formula applies, but rabatt is always 0,
    so listPrice equals kaufpreis.
  - Age per year: `age = currentYear - baujahr + year`.
    `currentYear` is `new Date().getFullYear()` (determined at runtime, not stored).
  - Depreciation rate from settings by age brackets (age1, age2_3, age4_5, age6_8, age9_12, age13p).
  - Depreciation base: year 1 uses listPrice, later years use previous rest value.
  - Yearly cost categories:
    - Kaufpreis: only year 1, only Kauf.
    - Steuerliche Mehrbelastung: only year 1, only Kauf + Neu.
    - Leasingkosten: leasingrate * 12, only Leasing.
    - Versicherung/Steuer: monthly * 12. No yearly escalation.
    - Wartung/Reparatur: monthly * 12 * (1 + kostensteigerung/100)^(year-1).
      Only this category grows with kostensteigerung.
    - Kraftstoff: (kmPerYear / 100) * verbrauch * fuelPrice. No yearly escalation.
    - THG-Quote: negative value only for Elektro.
    - Wertverlust: depreciation base * rate/100, only Kauf.
    - Opportunitaetskosten: kaufpreis * (1 + oppRate/100)^(year-1) * (oppRate/100), only Kauf.
      This models compound interest on the full purchase price: if the money had been
      invested instead, it would compound year over year. No Restwert offset.
      Running costs are excluded from the opportunity cost base.
  - Total per year = sum of categories; cumulative = running sum.
  - Restwert: listPrice * (1 - rate/100) for year 1, then prior rest * (1 - rate/100); 0 for leasing.
  - TCO: cumulative minus Kaufpreis (exclude the one-time capital outlay).
  - Overview metrics (based on planungshorizont):
    - TCO/Monat = TCO / (hz * 12)
    - TCO/Jahr = TCO / hz
    - TCO/km = TCO / (kmPerYear * hz)
  - Export functions:
    - `computeYearlyBreakdown(car, settings)` Ã¢â€ â€™ array of `planungshorizont` yearly row objects.
    - `computeOverviewMetrics(car, settings)` Ã¢â€ â€™ `{ tcoMonat, tcoJahr, tcoKm, tcoTotal, restwert }`.
    - `computeRankings(cars, settings)` Ã¢â€ â€™ array of `{ carId, rank }`.

- [x] Step 6: Implement Svelte views.
  - **Garage** (`Garage.svelte`):
    - Import `appState` from `state.svelte.js`.
    - Use `{#each appState.cars as car (car.id)}` to render `<CarCard>` components.
    - Each card shows: Marke + Modell as title, Modellvariante as subtitle,
      KPIs (TCO/Monat, TCO/Jahr) computed via `$derived`.
    - Quick actions on each card: Edit (opens CarEditor),
      Duplicate (copies all fields into a new car with a new id),
      Delete (shows a confirmation dialog: "Fahrzeug wirklich lÃ¶schen?" with Ja/Abbrechen),
      View Detail (navigates to Detail view for this car).
    - "Add car" button opens CarEditor with a blank template.
    - Empty state: if `appState.cars` is empty, show a centered placeholder message
      (e.g., "Noch keine Fahrzeuge vorhanden") with a prominent "Fahrzeug hinzufÃ¼gen" button.
  - **Overview** (`Overview.svelte`):
    - Render an HTML `<table>` with columns (left to right):
      Marke, Modell, Modellvariante, Baujahr, Beschaffungsart,
      Kaufpreis, Leasingrate, Nettobatterie, Winterreichweite,
      TCO/Monat, TCO/Jahr, TCO/km, TCO nach N Jahren, Rang, Kommentar.
    - Use `$derived` to compute metrics and rankings for all cars.
    - Ranking: lower TCO = better rank; ties share the same rank number.
    - Min/max highlighting: for numeric cost columns, highlight the lowest value
      in green and the highest in red. For columns where higher is better
      (Winterreichweite, Nettobatterie), reverse the colors.
    - Sortable columns: clicking a column header sorts the table by that column.
      Clicking again toggles ascending/descending. Show a sort direction indicator
      (arrow) on the active column header. Default sort: by Rang ascending.
    - Click on a row navigates to the Detail view for that car.
    - Empty state: if no cars exist, show a placeholder message
      (e.g., "Keine Fahrzeuge zum Vergleichen. FÃ¼ge zuerst ein Fahrzeug hinzu.")
      with a link/button to navigate to Garage.
  - **Detail** (`Detail.svelte`):
    - Accept a `carId` prop: `let { carId } = $props();`
    - Look up the car from `appState.cars` by id.
    - If car not found (e.g., deleted), show a message and link back to Garage.
    - Summary strip at top: TCO, TCO/Monat, Restwert (after planungshorizont years).
    - Render `<CostTable>` component with a breakdown over `planungshorizont` years
      (e.g., 5 rows if planungshorizont is 5). The table length follows the setting.
    - `<CostTable>` columns: Jahr, each cost category from Step 5,
      Gesamt (yearly total), Kumuliert (cumulative total), Restwert.
  - **Settings** (`Settings.svelte`):
    - Bind inputs directly to `appState.settings` fields using `bind:value`.
    - Group into cards: Kraftstoffpreise, Kostenparameter, Planungshorizont, Wertverlust.
    - Each input shows a label, the field, and a unit hint (e.g., "Ã¢â€šÂ¬/L", "%", "Jahre").
    - Depreciation is shown as a sub-card with one row per age bracket.

- [x] Step 7: Implement add/edit car workflow (`CarEditor.svelte`).
  - Slide-over panel (slides in from the right, overlays content).
  - Accept props: `let { car, onClose } = $props();`
    - If `car` is null, create a new car from the default template.
    - If `car` is provided, edit a deep copy; apply changes on save.
      Use `$state.snapshot(car)` or `structuredClone()` to create the copy,
      so edits don't mutate the original reactive object before the user saves.
  - Sections within the panel:
    - **Basics**: Marke, Modell, Modellvariante, Baujahr, Kilometerstand.
    - **Ownership**: Neu/Gebraucht select, Beschaffungsart select (Kauf/Leasing).
    - **Costs**: Kaufpreis, Rabatt, Steuerliche Mehrbelastung, Leasingrate,
      Versicherungsart select, SF-Klasse, Versicherung, Steuer (monatlich),
      Wartung, Reparatur.
    - **EV**: Kraftstoffart select, Verbrauch (show unit dynamically:
      "L/100km" for Benzin/Diesel, "kWh/100km" for Elektro),
      Winterreichweite, Nettobatterie, Ladeleistung, THG-Quote.
    - **Notes**: Kommentar (textarea).
  - Conditional disabling rules (use `$derived` for the disabled states):
    - If Leasing: disable Kaufpreis, Rabatt, Steuerliche Mehrbelastung.
    - If Kauf: disable Leasingrate.
    - If not Neu: disable Rabatt, Steuerliche Mehrbelastung.
    - If not Elektro: disable Batterie, Ladeleistung, THG-Quote, Winterreichweite.
  - When a field is disabled, show it greyed out and treat its value as 0 in calculations.
  - Save button: push new car to `appState.cars` or update existing; set `dirty = true`; close panel.
  - Cancel button: discard changes; close panel.

- [x] Step 8: Implement file open/save (`storage.js`).
  - **Open**:
    - Use `window.showOpenFilePicker` to get a file handle.
    - Read the file as text.
    - Extract JSON from between `<script id="data-store" type="application/json">` and `</script>`.
    - Parse JSON, run `normalizeState`, call `loadState` to update `appState`.
    - Store the file handle in `fileHandle` rune for subsequent saves.
  - **Save**:
    - Read `fileHandle` rune. If null, do Save-as instead.
    - Serialize current `appState` to JSON.
    - Get the full current HTML via `document.documentElement.outerHTML`.
    - In that HTML string, replace the `data-store` script content with the new JSON.
    - Write the resulting HTML string back to the file handle.
    - Set `dirty = false`.
  - **Save-as**:
    - Use `window.showSaveFilePicker` to get a new file handle.
    - Store it in `fileHandle`, then perform Save.
  - **Fallback** (if `showOpenFilePicker` / `showSaveFilePicker` are unavailable):
    - Open: use `<input type="file" accept=".html">` and `FileReader`.
    - Save: create a Blob from the HTML string and trigger a download via `<a download>`.
  - **Unsaved changes warning**:
    - Listen to the `beforeunload` event. If `dirty` is true, call
      `event.preventDefault()` to trigger the browser's native
      "Changes you made may not be saved" dialog.
    - Use `$effect` in `App.svelte` to register/unregister the listener
      based on the `dirty` rune.
  - **TopBar** integration:
    - Display the file name from `fileHandle` (or "Unbenannt" if null).
    - Show a dirty indicator (e.g., dot or asterisk) when `dirty` is true.
    - Buttons: Ã–ffnen, Speichern, Speichern unter.

- [x] Step 9: Routing.
  - Use a simple reactive variable approach (no router library).
  - `currentView` rune in `state.svelte.js` holds one of: `'garage'`, `'overview'`, `'detail'`, `'settings'`.
  - `selectedCarId` rune for the Detail view target.
  - `App.svelte` switches views using `{#if}` blocks:
    ```svelte
    {#if currentView === 'garage'}
      <Garage />
    {:else if currentView === 'overview'}
      <Overview />
    {:else if currentView === 'detail'}
      <Detail carId={selectedCarId} />
    {:else if currentView === 'settings'}
      <Settings />
    {/if}
    ```
  - `Sidebar.svelte` sets `currentView` on click.
    The active view gets a visual highlight (accent background or left border indicator).
  - Navigation helpers exported from `state.svelte.js`:
    - `navigateTo(view)` Ã¢â‚¬â€ sets `currentView`.
    - `viewCarDetail(carId)` Ã¢â‚¬â€ sets `selectedCarId` and `currentView = 'detail'`.

- [x] Step 10: Global styles (`app.css`).
  - Warm neutral palette: background `#f5f3f0`, cards `#ffffff`,
    text `#2d2a26`, muted text `#8a8580`.
  - Single accent color: `#4a7c6f` (muted teal).
  - Card style: `border-radius: 8px`, `box-shadow: 0 1px 3px rgba(0,0,0,0.08)`.
  - Typography: system font stack, base size 14px, headings 600 weight.
  - Sidebar: fixed left, 220px wide, dark background.
  - Slide-over panel: fixed right, 400px wide, white background, overlay backdrop.
  - Table styles: striped rows, sticky header, horizontal scroll on overflow.
  - Min/max highlighting classes: `.cell-best { background: #e8f5e9; }`,
    `.cell-worst { background: #fce4ec; }`.
  - **Responsive breakpoints** (`@media (max-width: 768px)`):
    - Sidebar: hidden by default, toggled via hamburger button in TopBar.
      When open, overlays content as a full-height drawer with a backdrop.
    - TopBar: hamburger icon added at the left. File name may truncate with ellipsis.
    - Garage cards: single column stack instead of grid.
    - Overview table: wrapped in a horizontally scrollable container.
    - Detail CostTable: same horizontal scroll treatment.
    - Slide-over panel (CarEditor): full-width instead of 400px.
    - Settings cards: single column stack.

- [x] Step 11: Configure build to a single HTML file.
  - `vite.config.js`:
    ```js
    import { defineConfig } from "vite";
    import { svelte } from "@sveltejs/vite-plugin-svelte";
    import singleFile from "vite-plugin-singlefile";

    export default defineConfig({
      plugins: [svelte(), singleFile()]
    });
    ```
  - Build command: `npm run build` produces `dist/index.html`.
  - Post-build: rename `dist/index.html` to `car_cost_compass.html`.
  - Important: never build over a file that contains user data.
    The build output always contains default/empty `data-store`.

- [ ] Step 12: Testing checklist.
  - Add one Kauf and one Leasing example car.
  - Verify Overview ranking and TCO numbers match manual calculation.
  - Verify Detail table yearly sums and cumulative totals.
  - Verify Restwert decreases correctly per depreciation brackets.
  - Verify conditional disabling in CarEditor works (Leasing hides Kaufpreis, etc.).
  - Verify save writes JSON into `data-store` and open restores it.
  - Verify fallback download works when File System Access API is unavailable.
  - Verify dirty indicator appears on changes and clears on save.
  - Verify empty state (no cars) shows a prompt instead of blank screen.

- [x] Step 13: Documentation.
  - `README.md`: dev setup (`npm install`, `npm run dev`), build (`npm run build`), usage notes.
  - Explain: "Do not build over your working file Ã¢â‚¬â€ the build output resets data to defaults."

## Critical Review (Risks / Gaps / Decisions)

- **Single-file build vs user data**: The build output will overwrite `data-store` with defaults. Must keep the working file separate from the build artifact.
- **File System Access API support**: Works in Chromium; Safari/Firefox need fallback download. The plan includes a fallback.
- **Depreciation and list price**: list price = kaufpreis + rabatt (rabatt only for Kauf + Neu). For used cars (Gebraucht), rabatt is always 0 so listPrice = kaufpreis. Same depreciation formula applies to both.
- **Rank ties**: Ranking should assign the same rank to equal TCO values.
- **Numeric parsing**: Inputs may include comma decimals; parsing must accept both comma and dot.
- **Number output formatting**: All displayed numbers use German locale (`de-DE`) via `Intl.NumberFormat`.
- **Localization**: All UI labels in German, all code in English. Domain field keys (kaufpreis, marke, etc.) stay in German as they are part of the data schema.
- **Cost escalation**: Only Wartung/Reparatur grows with `kostensteigerung`. Fuel, insurance, and tax stay flat.
- **Opportunity cost**: Compound interest on full Kaufpreis with no Restwert offset, no running cost inclusion. Formula: `kaufpreis * (1 + r)^(y-1) * r`.
- **No server constraint**: All storage must be in the file; do not add any backend or local storage dependency.
- **Svelte 5 `.svelte.js` extension**: Files using runes at the module level must use the `.svelte.js` extension, or the compiler will not process them. This is easy to miss.
- **`document.documentElement.outerHTML` for save**: After Svelte renders, the DOM contains the full app. The save logic must replace only the `data-store` content in the HTML string, not attempt to serialize the Svelte component tree.
- **Mobile**: Sidebar collapses to hamburger menu on < 768px. Tables scroll horizontally. Slide-over goes full-width.

## Deliverables

- Full source code for the app (not just a built HTML file).
- Required files: `package.json`, `vite.config.js`, `index.html`, `src/main.js`,
  `src/App.svelte`, `src/app.css`, `src/lib/state.svelte.js`, `src/lib/compute.js`,
  `src/lib/storage.js`, `src/views/*.svelte`, `src/components/*.svelte`, and `README.md`.
- Build output: `dist/index.html` renamed to `car_cost_compass.html` (optional to commit,
  but the build steps must produce it).



