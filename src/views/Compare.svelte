<script>
  import { onMount } from "svelte";
  import {
    addComparisonCar,
    appState,
    navigateTo,
    removeComparisonCar,
    setComparisonCarIds,
    uiState,
    viewCarDetail
  } from "../lib/state.svelte.js";
  import {
    computeOverviewMetrics,
    computeYearlyBreakdown,
    getBafaAmount,
    getEffectivePurchasePrice,
    num
  } from "../lib/compute.js";
  import { formatCurrency, formatNumber } from "../lib/format.js";
  import CostTable from "../components/CostTable.svelte";

  const maxComparisonCars = 4;

  const horizonYears = $derived(Math.max(0, Math.round(num(appState.settings.planungshorizont))));
  const horizonLabel = $derived(horizonYears === 1 ? "Jahr" : "Jahre");
  const selectedCars = $derived.by(() =>
    uiState.comparisonCarIds
      .map((id) => appState.cars.find((car) => car.id === id))
      .filter(Boolean)
  );
  const availableCars = $derived.by(() =>
    appState.cars.filter((car) => !uiState.comparisonCarIds.includes(car.id))
  );
  const metricsById = $derived.by(() => {
    const result = new Map();
    for (const car of selectedCars) {
      result.set(
        car.id,
        computeOverviewMetrics(car, appState.settings, {
          includeDepreciation: uiState.includeDepreciation
        })
      );
    }
    return result;
  });
  const yearlyRowsById = $derived.by(() => {
    const result = new Map();
    for (const car of selectedCars) {
      result.set(
        car.id,
        computeYearlyBreakdown(car, appState.settings, {
          includeDepreciation: uiState.includeDepreciation
        })
      );
    }
    return result;
  });

  const comparisonSections = $derived.by(() => [
    {
      title: "TCO",
      rows: [
        { key: "tcoTotal", label: `TCO gesamt (${horizonYears} ${horizonLabel})`, format: "currency", better: "lower" },
        { key: "tcoJahr", label: "TCO / Jahr", format: "currency", better: "lower" },
        { key: "tcoMonat", label: "TCO / Monat", format: "currency", better: "lower" },
        { key: "tcoKm", label: "TCO / km", format: "currency", decimals: 2, better: "lower" },
        { key: "restwert", label: "Restwert", format: "currency", better: "higher" },
        { key: "wertverlust", label: "Wertverlust", format: "currency", better: "lower" }
      ]
    },
    {
      title: "Kosten und Anschaffung",
      rows: [
        { key: "kaufpreis", label: "Listenpreis", format: "currency", hideZero: true, better: "lower" },
        { key: "rabatt", label: "Rabatt", format: "currency", hideZero: true },
        { key: "bafaFoerderung", label: "BAFA-Förderung", format: "currency", hideZero: true },
        { key: "effektiverKaufpreis", label: "Effektiver Kaufpreis", format: "currency", hideZero: true, better: "lower" },
        { key: "leasingrate", label: "Leasingrate / Monat", format: "currency", hideZero: true, better: "lower" },
        { key: "versicherung", label: "Versicherung / Monat", format: "currency", better: "lower" },
        { key: "wartung", label: "Wartung / Monat", format: "currency", better: "lower" },
        { key: "reparatur", label: "Reparatur / Monat", format: "currency", better: "lower" }
      ]
    },
    {
      title: "Fahrzeug",
      rows: [
        { key: "baujahr", label: "Baujahr", format: "number" },
        { key: "neu", label: "Zustand", format: "text" },
        { key: "beschaffungsart", label: "Beschaffung", format: "text" },
        { key: "kraftstoffart", label: "Antrieb", format: "text" },
        { key: "verbrauch", label: "Verbrauch", format: "number", better: "lower" },
        { key: "batterie", label: "Batterie", format: "number", unit: "kWh", hideZero: true, better: "higher" },
        { key: "winterreichweite", label: "Winterreichweite", format: "number", unit: "km", hideZero: true, better: "higher" },
        { key: "garantieJahre", label: "Herstellergarantie", format: "number", unit: "Jahre", hideZero: true },
        { key: "serviceintervallJahre", label: "Service nach Zeit", format: "number", unit: "Jahre", hideZero: true },
        { key: "serviceintervallKilometer", label: "Service nach Strecke", format: "number", unit: "km", hideZero: true }
      ]
    },
    {
      title: "Raum & Abmessungen",
      rows: [
        { key: "kofferraumVolumen", label: "Kofferraumvolumen", format: "number", unit: "l", hideZero: true, better: "higher" },
        { key: "laenge", label: "Länge", format: "number", unit: "mm", hideZero: true },
        { key: "breite", label: "Breite ohne Außenspiegel", format: "number", unit: "mm", hideZero: true },
        { key: "hoehe", label: "Höhe", format: "number", unit: "mm", hideZero: true }
      ]
    }
  ]);

  onMount(() => {
    if (uiState.comparisonCarIds.length === 0 && appState.cars.length > 0) {
      setComparisonCarIds(appState.cars.slice(0, 2).map((car) => car.id));
    }
  });

  $effect(() => {
    const availableIds = new Set(appState.cars.map((car) => car.id));
    const validIds = uiState.comparisonCarIds.filter((id) => availableIds.has(id));
    if (validIds.length !== uiState.comparisonCarIds.length) {
      setComparisonCarIds(validIds);
    }
  });

  function getCarName(car) {
    return `${car.marke || "Unbenannt"} ${car.modell || ""}`.trim();
  }

  function getCarSubtitle(car) {
    return car.modellvariante || car.beschaffungsart || "";
  }

  function getOptions(currentId) {
    return appState.cars.filter(
      (car) => car.id === currentId || !uiState.comparisonCarIds.includes(car.id)
    );
  }

  function addSlot() {
    const nextCar = availableCars[0];
    if (nextCar && selectedCars.length < maxComparisonCars) {
      addComparisonCar(nextCar.id);
    }
  }

  function replaceCar(index, carId) {
    if (!carId) return;
    const nextIds = [...uiState.comparisonCarIds];
    if (nextIds.some((id, currentIndex) => currentIndex !== index && id === carId)) {
      return;
    }
    nextIds[index] = carId;
    setComparisonCarIds(nextIds);
  }

  function getValue(car, key) {
    const metrics = metricsById.get(car.id);
    if (key === "tcoTotal") return metrics?.tcoTotal ?? 0;
    if (key === "tcoJahr") return metrics?.tcoJahr ?? 0;
    if (key === "tcoMonat") return metrics?.tcoMonat ?? 0;
    if (key === "tcoKm") return metrics?.tcoKm ?? 0;
    if (key === "restwert") return metrics?.restwert ?? 0;
    if (key === "wertverlust") return metrics?.wertverlust ?? 0;
    if (key === "kaufpreis") return car.beschaffungsart === "Kauf" ? num(car.kaufpreis) : 0;
    if (key === "rabatt") return car.beschaffungsart === "Kauf" ? num(car.rabatt) : 0;
    if (key === "bafaFoerderung") return getBafaAmount(car, appState.settings);
    if (key === "effektiverKaufpreis") return getEffectivePurchasePrice(car, appState.settings);
    if (key === "leasingrate") return car.beschaffungsart === "Leasing" ? num(car.leasingrate) : 0;
    if (key === "versicherung") return num(car.versicherung);
    if (key === "wartung") return num(car.wartung);
    if (key === "reparatur") return num(car.reparatur);
    if (key === "baujahr") return num(car.baujahr);
    if (key === "verbrauch") return num(car.verbrauch);
    if (key === "batterie") return num(car.batterie);
    if (key === "winterreichweite") return num(car.winterreichweite);
    if (key === "garantieJahre") return num(car.garantieJahre);
    if (key === "serviceintervallJahre") return num(car.serviceintervallJahre);
    if (key === "serviceintervallKilometer") return num(car.serviceintervallKilometer);
    if (key === "kofferraumVolumen") return num(car.kofferraumVolumen);
    if (key === "laenge") return num(car.laenge);
    if (key === "breite") return num(car.breite);
    if (key === "hoehe") return num(car.hoehe);
    if (key === "neu") return car.neu || "-";
    if (key === "beschaffungsart") return car.beschaffungsart || "-";
    if (key === "kraftstoffart") return car.kraftstoffart || "-";
    return "-";
  }

  function formatValue(row, car) {
    const value = getValue(car, row.key);
    if (row.format === "currency") {
      if (row.hideZero && !value) return "-";
      return formatCurrency(value, row.decimals ?? 0);
    }
    if (row.format === "number") {
      if (row.hideZero && !value) return "-";
      if (row.key === "garantieJahre" || row.key === "serviceintervallJahre") {
        return `${formatNumber(value, Number.isInteger(value) ? 0 : 1)} ${value === 1 ? "Jahr" : "Jahre"}`;
      }
      const unit = row.key === "verbrauch"
        ? car.kraftstoffart === "Elektro" ? "kWh/100 km" : "L/100 km"
        : row.unit;
      return `${formatNumber(value)}${unit ? ` ${unit}` : ""}`;
    }
    return value || "-";
  }

  function getValueClass(row, car) {
    if (!row.better) return "";
    const value = getValue(car, row.key);
    if (!Number.isFinite(value) || value <= 0) return "";
    const values = selectedCars
      .map((selectedCar) => getValue(selectedCar, row.key))
      .filter((item) => Number.isFinite(item) && item > 0);
    if (values.length < 2) return "";
    const target = row.better === "higher" ? Math.max(...values) : Math.min(...values);
    return value === target ? "comparison-best" : "";
  }
</script>

<div class="section-title comparison-title">
  <div>
    <h1>Fahrzeugvergleich</h1>
    <p>Stelle bis zu vier Fahrzeuge anhand ihrer Kosten und wichtigsten Daten gegenüber.</p>
  </div>
  <button class="button ghost" onclick={() => navigateTo("garage")}>Zur Garage</button>
</div>

{#if appState.cars.length === 0}
  <div class="card empty-state">
    <h3>Noch keine Fahrzeuge vorhanden</h3>
    <p>Füge zuerst Fahrzeuge hinzu, um einen Vergleich zu starten.</p>
    <button class="button" onclick={() => navigateTo("garage")}>Zur Garage</button>
  </div>
{:else}
  <section class="card comparison-selection">
    <div class="comparison-selection-header">
      <div>
        <h2>Vergleichsauswahl</h2>
        <p class="settings-caption">Wähle zwei bis vier Fahrzeuge. Die Auswahl bleibt beim nächsten Öffnen erhalten.</p>
      </div>
      <div class="comparison-actions">
        <button
          class="button"
          type="button"
          onclick={addSlot}
          disabled={selectedCars.length >= maxComparisonCars || availableCars.length === 0}
        >
          Fahrzeug hinzufügen
        </button>
        {#if selectedCars.length > 0}
          <button class="button ghost" type="button" onclick={() => setComparisonCarIds([])}>
            Auswahl leeren
          </button>
        {/if}
      </div>
    </div>

    <div class="comparison-slots">
      {#each selectedCars as car, index (car.id)}
        <div class="comparison-slot">
          <div class="comparison-slot-header">
            <label for={`comparison-car-${index}`}>Fahrzeug {index + 1}</label>
            <button
              class="icon-button"
              type="button"
              aria-label={`${getCarName(car)} aus Vergleich entfernen`}
              title="Entfernen"
              onclick={() => removeComparisonCar(car.id)}
            >
              <iconify-icon icon="mdi:close" aria-hidden="true"></iconify-icon>
            </button>
          </div>
          <select
            id={`comparison-car-${index}`}
            value={car.id}
            onchange={(event) => replaceCar(index, event.currentTarget.value)}
          >
            {#each getOptions(car.id) as option (option.id)}
              <option value={option.id}>{getCarName(option)}</option>
            {/each}
          </select>
          <div class="comparison-slot-subtitle">{getCarSubtitle(car)}</div>
        </div>
      {/each}
      {#if selectedCars.length === 0}
        <div class="comparison-selection-empty">
          <p>Füge mindestens zwei Fahrzeuge hinzu, um sie zu vergleichen.</p>
          <button class="button ghost" type="button" onclick={addSlot} disabled={availableCars.length === 0}>
            Erstes Fahrzeug auswählen
          </button>
        </div>
      {/if}
    </div>
    <div class="comparison-selection-footer">
      <span class="hint">{selectedCars.length} von {maxComparisonCars} Fahrzeugen ausgewählt</span>
      {#if selectedCars.length === 1}
        <span class="hint">Wähle noch ein Fahrzeug für den direkten Vergleich.</span>
      {/if}
    </div>
  </section>

  {#if selectedCars.length >= 2}
    <section class="card comparison-results">
      <div class="comparison-results-header">
        <div>
          <h2>Direktvergleich</h2>
          <p class="settings-caption">Grün markiert den jeweils besten Wert in der Zeile.</p>
        </div>
      </div>
      <div class="table-wrap comparison-table-wrap">
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Merkmal</th>
              {#each selectedCars as car (car.id)}
                <th>
                  <div class="comparison-car-heading">
                    <strong>{getCarName(car)}</strong>
                    <span>{getCarSubtitle(car)}</span>
                    <button class="table-link" type="button" onclick={() => viewCarDetail(car.id)}>
                      Details öffnen
                    </button>
                  </div>
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each comparisonSections as section}
              <tr class="comparison-section-row">
                <th colspan={selectedCars.length + 1}>{section.title}</th>
              </tr>
              {#each section.rows as row}
                <tr>
                  <th>{row.label}</th>
                  {#each selectedCars as car (car.id)}
                    <td class={getValueClass(row, car)}>{formatValue(row, car)}</td>
                  {/each}
                </tr>
              {/each}
            {/each}
          </tbody>
        </table>
      </div>
    </section>

    <section class="card comparison-yearly">
      <div class="comparison-results-header">
        <div>
          <h2>Jahresverlauf</h2>
          <p class="settings-caption">Die jährliche Kostenliste entspricht der Detailanalyse jedes Fahrzeugs.</p>
        </div>
      </div>
      {#each selectedCars as car (car.id)}
        <div class="comparison-yearly-car">
          <div class="comparison-yearly-car-header">
            <div>
              <h3>{getCarName(car)}</h3>
              <span class="hint">{getCarSubtitle(car)}</span>
            </div>
            <button class="button ghost" type="button" onclick={() => viewCarDetail(car.id)}>
              Detailanalyse öffnen
            </button>
          </div>
          <CostTable
            rows={yearlyRowsById.get(car.id) ?? []}
            car={car}
            settings={appState.settings}
            includeDepreciation={uiState.includeDepreciation}
          />
        </div>
      {/each}
    </section>
  {:else}
    <div class="card empty-state comparison-empty-state">
      <h3>Vergleich noch nicht bereit</h3>
      <p>Wähle mindestens zwei Fahrzeuge aus, um Kosten und Ausstattung direkt zu vergleichen.</p>
    </div>
  {/if}
{/if}
