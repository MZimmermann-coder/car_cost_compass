<script>
  import { navigateTo, uiState } from "../lib/state.svelte.js";
  import { openFile, saveFile, saveFileAs } from "../lib/storage.js";

  const headerTitle = "Car Cost Compass";
  const navigationItems = [
    { id: "garage", label: "Garage" },
    { id: "comparison", label: "Vergleich" },
    { id: "detail", label: "Detail" },
    { id: "settings", label: "Einstellungen" }
  ];

  function handleNavigate(item) {
    if (item.id === "detail" && !uiState.selectedCarId) {
      return;
    }
    navigateTo(item.id);
  }
</script>

<header class="topbar">
  <div class="left">
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
  <nav class="header-nav" aria-label="Hauptnavigation">
    {#each navigationItems as item}
      <button
        type="button"
        class={`nav-item ${uiState.currentView === item.id ? "active" : ""}`}
        aria-current={uiState.currentView === item.id ? "page" : undefined}
        disabled={item.id === "detail" && !uiState.selectedCarId}
        onclick={() => handleNavigate(item)}
      >
        {item.label}
      </button>
    {/each}
  </nav>
  <div class="right">
    <button class="button secondary" onclick={openFile}>Öffnen</button>
    <button class="button" onclick={saveFile}>Speichern</button>
    <button class="button ghost" onclick={() => saveFileAs()}>Speichern unter</button>
  </div>
</header>
