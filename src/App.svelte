<script>
  import Sidebar from "./components/Sidebar.svelte";
  import TopBar from "./components/TopBar.svelte";
  import Garage from "./views/Garage.svelte";
  import Overview from "./views/Overview.svelte";
  import Detail from "./views/Detail.svelte";
  import Settings from "./views/Settings.svelte";
  import { uiState } from "./lib/state.svelte.js";

  let sidebarOpen = $state(false);

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  function closeSidebar() {
    sidebarOpen = false;
  }

  $effect(() => {
    if (!uiState.dirty) {
      return;
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  });
</script>

<div class="app">
  <TopBar onToggleSidebar={toggleSidebar} />
  <div class="layout">
    <Sidebar open={sidebarOpen} onClose={closeSidebar} />
    <main class="content fade-in">
      {#if uiState.currentView === "garage"}
        <Garage />
      {:else if uiState.currentView === "overview"}
        <Overview />
      {:else if uiState.currentView === "detail"}
        <Detail carId={uiState.selectedCarId} />
      {:else if uiState.currentView === "settings"}
        <Settings />
      {/if}
    </main>
  </div>
  {#if sidebarOpen}
    <button
      type="button"
      class="sidebar-backdrop"
      onclick={closeSidebar}
      aria-label="Menü schließen"
    ></button>
  {/if}
</div>

