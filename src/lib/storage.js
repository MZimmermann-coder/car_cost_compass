import { appState, uiState, loadState, resetDirty } from "./state.svelte.js";

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

function extractState(html) {
  const block = findDataStoreBlock(html);
  if (!block) {
    throw new Error("data-store script tag not found");
  }
  const jsonText = block.jsonText.trim();
  return JSON.parse(jsonText);
}

function buildHtmlWithState(html, state) {
  const jsonText = JSON.stringify(state, null, 2);
  const block = findDataStoreBlock(html);
  if (!block) {
    throw new Error("data-store script tag not found");
  }
  const safeJson = jsonText.replace(/<\/script>/gi, "<\\/script>");
  const replacement = `<script id="data-store" type="application/json">${safeJson}</script>`;
  return html.slice(0, block.start) + replacement + html.slice(block.end);
}

function getStateSnapshot() {
  return {
    version: appState.version,
    settings: appState.settings,
    cars: appState.cars
  };
}

function getDocumentHtml() {
  const html = document.documentElement.outerHTML;
  if (html.toLowerCase().startsWith("<!doctype")) {
    return html;
  }
  return `<!doctype html>\n${html}`;
}

async function writeToHandle(handle, html) {
  const writable = await handle.createWritable();
  await writable.write(html);
  await writable.close();
}

function notifyError(message, error) {
  console.error(error);
  window.alert(message);
}

export async function openFile() {
  if (window.showOpenFilePicker) {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: "HTML",
            accept: { "text/html": [".html"] }
          }
        ]
      });

      if (!handle) {
        return;
      }

      const file = await handle.getFile();
      const text = await file.text();
      const state = extractState(text);
      loadState(state);
      uiState.fileHandle = handle;
      return;
    } catch (error) {
      if (error && error.name === "AbortError") {
        return;
      }
      notifyError("Datei konnte nicht geöffnet werden.", error);
      return;
    }
  }

  await openFileFallback();
}

async function openFileFallback() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".html,text/html";
    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (!file) {
        resolve();
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const state = extractState(String(reader.result));
          loadState(state);
          uiState.fileHandle = null;
        } catch (error) {
          notifyError("Datei konnte nicht gelesen werden.", error);
        }
        resolve();
      };
      reader.readAsText(file);
    });
    input.click();
  });
}

export async function saveFile() {
  try {
    const html = buildHtmlWithState(
      getDocumentHtml(),
      getStateSnapshot()
    );

    if (!uiState.fileHandle) {
      await saveFileAs(html);
      return;
    }

    await writeToHandle(uiState.fileHandle, html);
    resetDirty();
  } catch (error) {
    notifyError("Datei konnte nicht gespeichert werden.", error);
  }
}

export async function saveFileAs(existingHtml) {
  const html =
    existingHtml ||
    buildHtmlWithState(getDocumentHtml(), getStateSnapshot());

  if (window.showSaveFilePicker) {
    try {
      const pickerOptions = {
        suggestedName: uiState.fileHandle ? uiState.fileHandle.name : "car_cost_compass.html",
        types: [
          {
            description: "HTML",
            accept: { "text/html": [".html"] }
          }
        ]
      };

      if (uiState.fileHandle) {
        pickerOptions.startIn = uiState.fileHandle;
      }

      const handle = await window.showSaveFilePicker({
        ...pickerOptions
      });

      if (!handle) {
        return;
      }

      await writeToHandle(handle, html);
      uiState.fileHandle = handle;
      resetDirty();
      return;
    } catch (error) {
      if (error && error.name === "AbortError") {
        return;
      }
      notifyError("Datei konnte nicht gespeichert werden.", error);
      return;
    }
  }

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "car_cost_compass.html";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  resetDirty();
}


