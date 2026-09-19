# Repository Guidelines

## Project Structure & Module Organization

This repository is a small Svelte 5 application bundled as a single HTML file.

- `src/` contains the application: `components/` holds reusable UI, `views/` holds Garage, Overview, Detail, and Settings screens, and `lib/` contains state, storage, formatting, and cost-calculation logic.
- `src/App.svelte`, `src/main.js`, and `src/app.css` are the application shell and global styles.
- `scripts/build-with-data.js` wraps Vite to preserve embedded `data-store` data during builds.
- `dist/` is generated output; `backups/` contains generated data backups and is ignored by Git.

## Build, Test, and Development Commands

Run `npm install` to install dependencies, then `npm run dev` to start the Vite development server. Use `npm run build` for the normal production build; it writes `dist/car_cost_compass.html` and carries forward data from the prior build when available. Use `npm run build:clean` to build without carrying existing data. `npm run preview` serves the production output locally.

There is no configured lint or test script. Do not edit generated files in `dist/` directly.

## Coding Style & Naming Conventions

Use two-space indentation, semicolons, and double-quoted JavaScript strings, matching the existing code. Keep Svelte component files in PascalCase (`CarEditor.svelte`) and JavaScript modules in lowercase camelCase (`state.svelte.js`). Use camelCase for functions and variables. Keep reusable calculations and persistence logic in `src/lib/`; keep view-specific markup in `src/views/` or `src/components/`. Follow Svelte 5 runes patterns already used in the project, such as `$state` and `$effect`.

## Testing Guidelines

Automated tests and coverage thresholds are not currently configured. For every change, run `npm run build` and manually smoke-test the affected flow in the generated HTML or dev server. For UI changes, check Garage editing, navigation, responsive behavior, and Open/Save behavior as applicable. Verify that existing `data-store` data survives a rebuild unless the change intentionally alters migration behavior.

## Commit & Pull Request Guidelines

Recent commits use the format `MZI <short change summary>` (for example, `MZI improve garage view`). Follow that convention with a concise, action-oriented summary. Pull requests should explain the user-visible change, list validation commands, call out data-format or migration effects, and include screenshots for meaningful UI changes. Keep generated build artifacts and local backups out of the change unless they are explicitly required.
