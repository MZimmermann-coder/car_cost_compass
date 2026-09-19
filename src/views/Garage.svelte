<script>
  import { onMount, tick } from "svelte";
  import {
    appState,
    createEmptyCar,
    markDirty,
    navigateTo,
    removeComparisonCar,
    setIncludeDepreciation,
    setGarageMode,
    uiState,
    viewCarDetail
  } from "../lib/state.svelte.js";
  import { computeOverviewMetrics, num } from "../lib/compute.js";
  import CarCard from "../components/CarCard.svelte";
  import CarEditor from "../components/CarEditor.svelte";
  import Overview from "./Overview.svelte";

  let editorOpen = $state(false);
  let editingCar = $state(null);

  const filters = uiState.garageFilters;

  let highlightIds = $state([]);
  let initialized = false;
  let prevIds = new Set();
  const highlightTimers = new Map();

  let chipRowHeight = $state(0);

  const metricsById = $derived.by(() => {
    const map = new Map();
    for (const car of appState.cars) {
      map.set(
        car.id,
        computeOverviewMetrics(car, appState.settings, {
          includeDepreciation: uiState.includeDepreciation
        })
      );
    }
    return map;
  });

  const viewMode = $derived(uiState.garageMode || "cards");

  const isFiltered = $derived(
    filters.searchTerm.trim().length > 0 ||
      filters.fuel !== "all" ||
      filters.ownership !== "all" ||
      filters.batteryMin.trim().length > 0 ||
      filters.batteryMax.trim().length > 0 ||
      filters.winterMin.trim().length > 0 ||
      filters.winterMax.trim().length > 0
  );

  const filteredCars = $derived.by(() => {
    const term = filters.searchTerm.trim().toLowerCase();
    const batteryMinActive = /\d/.test(filters.batteryMin);
    const batteryMaxActive = /\d/.test(filters.batteryMax);
    const winterMinActive = /\d/.test(filters.winterMin);
    const winterMaxActive = /\d/.test(filters.winterMax);
    const batteryMinValue = batteryMinActive ? num(filters.batteryMin) : null;
    const batteryMaxValue = batteryMaxActive ? num(filters.batteryMax) : null;
    const winterMinValue = winterMinActive ? num(filters.winterMin) : null;
    const winterMaxValue = winterMaxActive ? num(filters.winterMax) : null;

    return appState.cars.filter((car) => {
      if (term) {
        const haystack = [
          car.marke,
          car.modell,
          car.modellvariante,
          car.kommentar,
          car.baujahr
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) {
          return false;
        }
      }

      if (filters.fuel !== "all") {
        const fuel = (car.kraftstoffart || "").toLowerCase();
        if (filters.fuel === "electric" && !fuel.includes("elekt")) return false;
        if (filters.fuel === "diesel" && !fuel.includes("diesel")) return false;
        if (filters.fuel === "benzin" && !fuel.includes("benzin")) return false;
      }

      if (filters.ownership !== "all") {
        const ownership = (car.beschaffungsart || "").toLowerCase();
        if (filters.ownership === "lease" && !ownership.includes("leasing")) return false;
        if (filters.ownership === "buy" && !ownership.includes("kauf")) return false;
      }

      if (batteryMinActive || batteryMaxActive) {
        const batteryValue = num(car.batterie);
        if (batteryValue > 0) {
          if (batteryMinActive && batteryValue < batteryMinValue) return false;
          if (batteryMaxActive && batteryValue > batteryMaxValue) return false;
        }
      }

      if (winterMinActive || winterMaxActive) {
        const winterValue = num(car.winterreichweite);
        if (winterValue > 0) {
          if (winterMinActive && winterValue < winterMinValue) return false;
          if (winterMaxActive && winterValue > winterMaxValue) return false;
        }
      }

      return true;
    });
  });

  const sortedCars = $derived.by(() => {
    const list = [...filteredCars];
    list.sort((a, b) => {
      const aValue = metricsById.get(a.id)?.tcoMonat;
      const bValue = metricsById.get(b.id)?.tcoMonat;
      const aScore = Number.isFinite(aValue) ? aValue : Number.POSITIVE_INFINITY;
      const bScore = Number.isFinite(bValue) ? bValue : Number.POSITIVE_INFINITY;
      if (aScore === bScore) {
        return `${a.marke} ${a.modell}`.localeCompare(`${b.marke} ${b.modell}`, "de");
      }
      return aScore - bScore;
    });
    return list;
  });

  function openEditor(car = null) {
    editingCar = car;
    editorOpen = true;
  }

  function closeEditor() {
    editorOpen = false;
    editingCar = null;
  }

  function handleDuplicate(car) {
    const copy = { ...car };
    copy.id = createEmptyCar().id;
    appState.cars = [...appState.cars, copy];
    markDirty();
  }

  function handleDelete(car) {
    if (window.confirm("Fahrzeug wirklich löschen?")) {
      appState.cars = appState.cars.filter((item) => item.id !== car.id);
      removeComparisonCar(car.id);
      markDirty();
    }
  }

  function setViewMode(mode) {
    setGarageMode(mode);
  }

  function setDepreciationMode(value) {
    setIncludeDepreciation(value);
  }

  function clearFilters() {
    filters.searchTerm = "";
    filters.fuel = "all";
    filters.ownership = "all";
    filters.batteryMin = "";
    filters.batteryMax = "";
    filters.winterMin = "";
    filters.winterMax = "";
  }

  $effect(() => {
    if (uiState.currentView === "overview") {
      uiState.currentView = "garage";
      uiState.garageMode = "table";
    }
  });

  $effect(() => {
    const ids = appState.cars.map((car) => car.id);
    const currentIds = new Set(ids);
    if (!initialized) {
      prevIds = currentIds;
      initialized = true;
      return;
    }

    const newIds = ids.filter((id) => !prevIds.has(id));
    if (newIds.length) {
      highlightIds = [...new Set([...highlightIds, ...newIds])];
      for (const id of newIds) {
        if (highlightTimers.has(id)) {
          clearTimeout(highlightTimers.get(id));
        }
        highlightTimers.set(
          id,
          setTimeout(() => {
            highlightIds = highlightIds.filter((item) => item !== id);
            highlightTimers.delete(id);
          }, 2000)
        );
      }
    }

    prevIds = currentIds;
  });

  async function measureChipRows() {
    await tick();
    const rows = document.querySelectorAll(".chip-row");
    let maxHeight = 0;
    rows.forEach((row) => {
      maxHeight = Math.max(maxHeight, row.offsetHeight);
    });
    chipRowHeight = maxHeight;
  }

  $effect(() => {
    const mode = viewMode;
    const count = sortedCars.length;
    if (mode !== "cards" || count === 0) {
      chipRowHeight = 0;
      return;
    }
    measureChipRows();
  });

  onMount(() => {
    const handleResize = () => {
      if (viewMode === "cards") {
        measureChipRows();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  });
</script>

{#if editorOpen}
  <CarEditor car={editingCar} onClose={closeEditor} fullScreen={true} />
{:else}
  <div class="section-title">
    <div>
      <h1>Garage</h1>
      <p>Verwalte deine Fahrzeuge und starte Vergleiche.</p>
    </div>
    <div class="header-actions">
      <div class="view-toggle" role="tablist" aria-label="Ansicht wählen">
        <button
          type="button"
          class={`toggle-button ${viewMode === "cards" ? "active" : ""}`}
          role="tab"
          aria-selected={viewMode === "cards"}
          onclick={() => setViewMode("cards")}
        >
          Karten
        </button>
        <button
          type="button"
          class={`toggle-button ${viewMode === "table" ? "active" : ""}`}
          role="tab"
          aria-selected={viewMode === "table"}
          onclick={() => setViewMode("table")}
        >
          Tabelle
        </button>
      </div>
      <label class="calculation-toggle">
        <input
          type="checkbox"
          checked={uiState.includeDepreciation}
          onchange={(event) => setDepreciationMode(event.currentTarget.checked)}
        />
        <span>Fahrzeugwert (Wertverlust, Rabatt, BAFA) im TCO</span>
      </label>
      <button class="button ghost" onclick={() => navigateTo("comparison")}>Vergleichen</button>
      <button class="button" onclick={() => openEditor(null)}>Fahrzeug hinzufügen</button>
    </div>
  </div>

  <div class="filter-bar">
    <div class="filter-group">
      <label class="filter-label" for="garage-search">Suche</label>
      <input
        id="garage-search"
        type="search"
        class="filter-input"
        placeholder="Marke, Modell, Kommentar"
        bind:value={filters.searchTerm}
      />
    </div>
    <div class="filter-group">
      <label class="filter-label" for="garage-fuel">Antrieb</label>
      <select id="garage-fuel" bind:value={filters.fuel}>
        <option value="all">Alle</option>
        <option value="benzin">Benzin</option>
        <option value="diesel">Diesel</option>
        <option value="electric">Elektro</option>
      </select>
    </div>
    <div class="filter-group">
      <label class="filter-label" for="garage-ownership">Beschaffung</label>
      <select id="garage-ownership" bind:value={filters.ownership}>
        <option value="all">Alle</option>
        <option value="buy">Kauf</option>
        <option value="lease">Leasing</option>
      </select>
    </div>
    <div class="filter-group">
      <div class="filter-label">Batterie (kWh)</div>
      <div class="filter-range">
        <input
          type="text"
          inputmode="decimal"
          placeholder="Min"
          aria-label="Batterie Minimum"
          bind:value={filters.batteryMin}
        />
        <input
          type="text"
          inputmode="decimal"
          placeholder="Max"
          aria-label="Batterie Maximum"
          bind:value={filters.batteryMax}
        />
      </div>
    </div>
    <div class="filter-group">
      <div class="filter-label">Winterreichweite (km)</div>
      <div class="filter-range">
        <input
          type="text"
          inputmode="decimal"
          placeholder="Min"
          aria-label="Winterreichweite Minimum"
          bind:value={filters.winterMin}
        />
        <input
          type="text"
          inputmode="decimal"
          placeholder="Max"
          aria-label="Winterreichweite Maximum"
          bind:value={filters.winterMax}
        />
      </div>
    </div>
    {#if isFiltered}
      <button class="button ghost" onclick={clearFilters}>Filter zurücksetzen</button>
    {/if}
  </div>

  {#if appState.cars.length === 0}
    <div class="card empty-state">
      <h3>Noch keine Fahrzeuge vorhanden</h3>
      <p>Füge dein erstes Fahrzeug hinzu, um Kosten zu vergleichen.</p>
      <button class="button" onclick={() => openEditor(null)}>Fahrzeug hinzufügen</button>
    </div>
  {:else if filteredCars.length === 0}
    <div class="card empty-state">
      <h3>Keine Treffer</h3>
      <p>Kein Fahrzeug entspricht den aktuellen Filtern.</p>
      <button class="button ghost" onclick={clearFilters}>Filter zurücksetzen</button>
    </div>
  {:else if viewMode === "cards"}
    <div class="grid" style={`--chip-row-height: ${chipRowHeight ? `${chipRowHeight}px` : "auto"}`}>
      {#each sortedCars as car, index (car.id)}
        <CarCard
          car={car}
          metrics={metricsById.get(car.id)}
          onEdit={openEditor}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onView={(target) => viewCarDetail(target.id)}
          delay={index * 60}
          highlight={highlightIds.includes(car.id)}
        />
      {/each}
    </div>
  {:else}
    <Overview
      embedded={true}
      cars={filteredCars}
      isFiltered={isFiltered}
      onClearFilters={clearFilters}
      onRequestAdd={() => openEditor(null)}
    />
  {/if}
{/if}
