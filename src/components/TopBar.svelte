<script>
  import { uiState } from "../lib/state.svelte.js";
  import { openFile, saveFile, saveFileAs } from "../lib/storage.js";

  let { onToggleSidebar } = $props();

  const headerTitle = "Car Cost Compass";
</script>

<header class="topbar">
  <div class="left">
    <button class="hamburger" onclick={() => onToggleSidebar && onToggleSidebar()} aria-label="Menü">
      <span></span>
      <span></span>
      <span></span>
    </button>
    <div>
      <div class="file-info">
        <span>{headerTitle}</span>
        {#if uiState.dirty}
          <span class="dirty-indicator"></span>
        {/if}
      </div>
      <div class="hint">Fahrzeugkosten kompakt im Blick</div>
    </div>
  </div>
  <div class="right">
    <button class="button secondary" onclick={openFile}>Öffnen</button>
    <button class="button" onclick={saveFile}>Speichern</button>
    <button class="button ghost" onclick={() => saveFileAs()}>Speichern unter</button>
  </div>
</header>
