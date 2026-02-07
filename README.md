# Car Cost Compass

Single-file Svelte app for comparing vehicle costs. All data is stored inside the HTML file itself.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The build generates `dist/car_cost_compass.html` (the default `dist/index.html` from Vite is removed).

By default, the build script reads the previous `dist/car_cost_compass.html` (or `dist/index.html` if present)
and carries its `data-store` forward into the new build output. You can point it at a different source file by passing a path:

```bash
npm run build -- docs/index.html
```

You can also pass a `data-store` JSON backup:

```bash
npm run build -- backups/data-store-YYYY-MM-DDTHH-MM-SS.json
```

A backup of the carried data is written to `backups/` on each build.

If you want a clean build without carrying data, run:

```bash
npm run build:clean
```

## Working With Data

- Use the in-app **Open** and **Save/Save as** buttons to load and persist data.
- If you add features and rebuild, open your existing data file in the new build and then **Save as** a new file.
- If you want to migrate manually, copy the `<script id="data-store">...</script>` block from your old file into
  the new build output.

## Usage

- Add or edit vehicles in the Garage.
- Compare in the Overview and sort as needed.
- Review the yearly breakdown in Detail.
- Use the top bar for opening and saving files.

If the File System Access API is unavailable, the app falls back to upload/download.



