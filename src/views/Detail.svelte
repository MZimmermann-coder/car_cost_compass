<script>
  import { appState, navigateTo } from "../lib/state.svelte.js";
  import { computeOverviewMetrics, computeYearlyBreakdown } from "../lib/compute.js";
  import { formatCurrency } from "../lib/format.js";
  import CostTable from "../components/CostTable.svelte";

  let { carId } = $props();

  const car = $derived(appState.cars.find((item) => item.id === carId));
  const metrics = $derived(car ? computeOverviewMetrics(car, appState.settings) : null);
  const breakdown = $derived(car ? computeYearlyBreakdown(car, appState.settings) : []);
</script>

{#if !car}
  <div class="card empty-state">
    <h3>Fahrzeug nicht gefunden</h3>
    <p>Das Fahrzeug existiert nicht mehr. Kehre zur Garage zur�ck.</p>
    <button class="button" onclick={() => navigateTo("garage")}>Zur Garage</button>
  </div>
{:else}
  <div class="section-title">
    <div>
      <h1>Detailanalyse</h1>
      <p>{car.marke} {car.modell} {car.modellvariante}</p>
    </div>
  </div>

  <div class="summary-strip">
    <div class="summary-item">
      <div class="kpi-label">TCO gesamt</div>
      <div class="value">{formatCurrency(metrics?.tcoTotal ?? 0)}</div>
    </div>
    <div class="summary-item">
      <div class="kpi-label">TCO/Monat</div>
      <div class="value">{formatCurrency(metrics?.tcoMonat ?? 0)}</div>
    </div>
    <div class="summary-item">
      <div class="kpi-label">Restwert</div>
      <div class="value">{formatCurrency(metrics?.restwert ?? 0)}</div>
    </div>
  </div>

  <CostTable rows={breakdown} />
{/if}


