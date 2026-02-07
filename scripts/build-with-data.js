import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const cleanBuild = args.includes("--clean");
const sourceArg = args.find((arg) => !arg.startsWith("-"));
const defaultSource = existsSync(resolve("dist/car_cost_compass.html"))
  ? resolve("dist/car_cost_compass.html")
  : resolve("dist/index.html");
const sourcePath = sourceArg ? resolve(sourceArg) : defaultSource;
const outputPath = resolve("dist/index.html");
const finalOutputPath = resolve("dist/car_cost_compass.html");
const backupDir = resolve("backups");

function findDataStoreBlock(html) {
  const pattern = /<script[^>]*id=["']data-store["'][^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let lastMatch = null;

  while ((match = pattern.exec(html))) {
    lastMatch = {
      start: match.index,
      end: pattern.lastIndex,
      jsonText: match[1]
    };
  }

  return lastMatch;
}

function extractDataStore(html) {
  const block = findDataStoreBlock(html);
  if (!block) {
    return null;
  }
  return block.jsonText.trim();
}

function normalizeJson(jsonText) {
  try {
    const parsed = JSON.parse(jsonText);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    console.warn("Warning: Failed to parse data-store JSON. Skipping data carry-over.");
    return null;
  }
}

function backupData(jsonText) {
  if (!jsonText) {
    return;
  }

  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = resolve(backupDir, `data-store-${timestamp}.json`);
  writeFileSync(backupPath, jsonText, "utf8");
}

function replaceDataStore(html, jsonText) {
  const block = findDataStoreBlock(html);
  if (!block) {
    throw new Error("data-store script tag not found in build output.");
  }
  const safeJson = jsonText.replace(/<\/script>/gi, "<\\/script>");
  const replacement = `<script id="data-store" type="application/json">${safeJson}</script>`;
  return html.slice(0, block.start) + replacement + html.slice(block.end);
}

let dataToCarry = null;
if (!cleanBuild) {
  if (existsSync(sourcePath)) {
    if (sourcePath.toLowerCase().endsWith(".json")) {
      const jsonText = readFileSync(sourcePath, "utf8");
      dataToCarry = normalizeJson(jsonText.trim());
    } else {
      const sourceHtml = readFileSync(sourcePath, "utf8");
      dataToCarry = normalizeJson(extractDataStore(sourceHtml));
    }
    backupData(dataToCarry);
  } else {
    console.warn(`Warning: Source file not found: ${sourcePath}`);
  }
}

execSync("vite build", { stdio: "inherit" });

const outputHtml = readFileSync(outputPath, "utf8");
const merged = dataToCarry ? replaceDataStore(outputHtml, dataToCarry) : outputHtml;
writeFileSync(finalOutputPath, merged, "utf8");

if (existsSync(outputPath)) {
  unlinkSync(outputPath);
}
