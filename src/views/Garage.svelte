<script>
  import { appState, createEmptyCar, markDirty, viewCarDetail } from "../lib/state.svelte.js";
  import { computeOverviewMetrics } from "../lib/compute.js";
  import CarCard from "../components/CarCard.svelte";
  import CarEditor from "../components/CarEditor.svelte";

  let editorOpen = $state(false);
  let editingCar = $state(null);

  const metricsById = $derived.by(() => {
    const map = new Map();
    for (const car of appState.cars) {
      map.set(car.id, computeOverviewMetrics(car, appState.settings));
    }
    return map;
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
      markDirty();
    }
  }
</script>

{#if editorOpen}
  <CarEditor car={editingCar} onClose={closeEditor} fullScreen={true} />
{:else}
  <div class="section-title">
    <div>
      <h1>Garage</h1>
      <p>Verwalte deine Fahrzeuge und starte Vergleiche.</p>
    </div>
    <button class="button" onclick={() => openEditor(null)}>Fahrzeug hinzufügen</button>
  </div>

  {#if appState.cars.length === 0}
    <div class="card empty-state">
      <h3>Noch keine Fahrzeuge vorhanden</h3>
      <p>Füge dein erstes Fahrzeug hinzu, um Kosten zu vergleichen.</p>
      <button class="button" onclick={() => openEditor(null)}>Fahrzeug hinzufügen</button>
    </div>
  {:else}
    <div class="grid">
      {#each appState.cars as car, index (car.id)}
        <CarCard
          car={car}
          metrics={metricsById.get(car.id)}
          onEdit={openEditor}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onView={(target) => viewCarDetail(target.id)}
          delay={index * 60}
        />
      {/each}
    </div>
  {/if}
{/if}
