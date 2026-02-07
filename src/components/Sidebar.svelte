<script>
  import { uiState, navigateTo } from "../lib/state.svelte.js";

  let { open, onClose } = $props();

  const items = [
    { id: "garage", label: "Garage" },
    { id: "detail", label: "Detail" },
    { id: "settings", label: "Einstellungen" }
  ];

  function handleNavigate(item) {
    if (item.id === "detail" && !uiState.selectedCarId) {
      return;
    }
    navigateTo(item.id);
    if (onClose) {
      onClose();
    }
  }
</script>

<aside class={`sidebar ${open ? "open" : ""}`}>
  <h2>Car Cost Compass</h2>
  <nav>
    {#each items as item}
      <button
        type="button"
        class={`nav-item ${uiState.currentView === item.id ? "active" : ""} ${
          item.id === "detail" && !uiState.selectedCarId ? "disabled" : ""
        }`}
        aria-current={uiState.currentView === item.id ? "page" : undefined}
        disabled={item.id === "detail" && !uiState.selectedCarId}
        onclick={() => handleNavigate(item)}
      >
        {item.label}
      </button>
    {/each}
  </nav>
</aside>
