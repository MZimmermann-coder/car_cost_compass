<script>
  import { appState, navigateTo, uiState } from "../lib/state.svelte.js";
  import {
    computeOverviewMetrics,
    computeYearlyBreakdown,
    getPurchasePriceAfterDiscount,
    num
  } from "../lib/compute.js";
  import { formatCurrency, formatNumber } from "../lib/format.js";
  import CostTable from "../components/CostTable.svelte";
  import CarCard from "../components/CarCard.svelte";
  import CarEditor from "../components/CarEditor.svelte";
  import CostChart from "../components/CostChart.svelte";

  let { carId } = $props();

  const car = $derived(appState.cars.find((item) => item.id === carId));
  const metrics = $derived(
    car
      ? computeOverviewMetrics(car, appState.settings, {
          includeDepreciation: uiState.includeDepreciation
        })
      : null
  );
  const breakdown = $derived(
    car
      ? computeYearlyBreakdown(car, appState.settings, {
          includeDepreciation: uiState.includeDepreciation
        })
      : []
  );
  const planningYears = $derived(Math.max(0, Math.round(num(appState.settings.planungshorizont))));

  const consumptionUnit = $derived(car?.kraftstoffart === "Elektro" ? "kWh/100km" : "L/100km");

  let hoverYear = $state(null);
  let editorOpen = $state(false);
  let editingCar = $state(null);

  const infoItems = $derived.by(() => {
    if (!car) return [];
    const isPurchase = car.beschaffungsart === "Kauf";
    const isLease = car.beschaffungsart === "Leasing";
    const isNew = car.neu === "Neu";
    const isElectric = car.kraftstoffart === "Elektro";
    const items = [
      { label: "Zustand", value: car.neu || "-" },
      { label: "Versicherungsart", value: car.versicherungsart || "-" },
      { label: "SF-Klasse", value: car.sfklasse || "-" },
      {
        label: "Versicherung / Monat",
        value: num(car.versicherung) ? formatCurrency(num(car.versicherung)) : "-"
      },
      {
        label: "Steuer / Monat",
        value: num(car.steuerMonat) ? formatCurrency(num(car.steuerMonat)) : "-"
      },
      {
        label: "Wartung / Monat",
        value: num(car.wartung) ? formatCurrency(num(car.wartung)) : "-"
      },
      {
        label: "Reparatur / Monat",
        value: num(car.reparatur) ? formatCurrency(num(car.reparatur)) : "-"
      },
      {
        label: "Verbrauch",
        value: num(car.verbrauch) ? `${formatNumber(num(car.verbrauch))} ${consumptionUnit}` : "-"
      }
    ];

    if (isPurchase) {
      items.splice(1, 0, {
        label: "Listenpreis",
        value: num(car.kaufpreis) ? formatCurrency(num(car.kaufpreis)) : "-"
      });
      if (isNew) {
        items.splice(2, 0,
          { label: "Rabatt", value: num(car.rabatt) ? formatCurrency(num(car.rabatt)) : "-" },
          {
            label: "BAFA Förderung",
            value: num(car.bafaFoerderung) ? formatCurrency(num(car.bafaFoerderung)) : "-"
          },
          {
            label: "Steuerliche Mehrbelastung",
            value: num(car.steuerMehr) ? formatCurrency(num(car.steuerMehr)) : "-"
          }
        );
      }
    }

    if (isLease) {
      items.splice(1, 0, {
        label: "Leasingrate",
        value: num(car.leasingrate) ? formatCurrency(num(car.leasingrate)) : "-"
      });
    }

    if (isElectric) {
      items.push(
        {
          label: "Ladeleistung 10-80% DC",
          value: num(car.ladeleistung) ? `${formatNumber(num(car.ladeleistung))} kW` : "-"
        },
        {
          label: "THG-Quote",
          value: num(car.thg) ? `${formatNumber(num(car.thg))} €/Jahr` : "-"
        }
      );
    }

    return items;
  });

  const summaryTooltips = $derived.by(() => {
    if (!car || !metrics) return {};
    const listPrice = car.beschaffungsart === "Kauf" ? num(car.kaufpreis) : 0;
    const discount = car.beschaffungsart === "Kauf" && car.neu === "Neu"
      ? num(car.rabatt)
      : 0;
    const purchasePrice = getPurchasePriceAfterDiscount(car);
    const bafaAmount = car.beschaffungsart === "Kauf" && car.neu === "Neu"
      ? num(car.bafaFoerderung)
      : 0;
    const cumulative = breakdown.length ? breakdown[breakdown.length - 1].cumulative : 0;
    const tcoTotal = metrics.tcoTotal ?? 0;
    const tcoMonat = planningYears > 0 ? tcoTotal / (planningYears * 12) : 0;
    const restwert = breakdown.length ? breakdown[breakdown.length - 1].restwert : 0;

    const depreciationLabel = uiState.includeDepreciation
      ? `Wertverlust, Rabatt und BAFA-Förderung berücksichtigt; BAFA-Förderung ${formatCurrency(bafaAmount)} ist im 1. Jahr enthalten`
      : "Wertverlust, Rabatt und BAFA-Förderung nicht im TCO berücksichtigt";

    return {
      tcoTotal: `Listenpreis ${formatCurrency(listPrice)} - Rabatt ${formatCurrency(discount)} = Kaufpreis nach Rabatt ${formatCurrency(purchasePrice)}; kumulierte wirtschaftliche Jahreskosten ${formatCurrency(cumulative)} = TCO ${formatCurrency(tcoTotal)}; der Kaufpreis wird nicht zusätzlich zu Wertverlust und Restwert addiert; ${depreciationLabel}`,
      tcoMonat: `TCO gesamt ${formatCurrency(tcoTotal)} / (${planningYears} Jahre x 12 Monate) = ${formatCurrency(tcoMonat)}`,
      restwert: `Restwert nach ${planningYears} Jahren = ${formatCurrency(restwert)}`
    };
  });

  function handleBack() {
    if (typeof history !== "undefined" && history.length > 1) {
      history.back();
      return;
    }
    navigateTo("garage");
  }

  function openEditor() {
    if (!car) return;
    editingCar = car;
    editorOpen = true;
  }

  function closeEditor() {
    editorOpen = false;
    editingCar = null;
  }
</script>

{#if !car}
  <div class="card empty-state">
    <h3>Fahrzeug nicht gefunden</h3>
    <p>Das Fahrzeug existiert nicht mehr. Kehre zur Garage zurück.</p>
    <button class="button" onclick={() => navigateTo("garage")}>Zur Garage</button>
  </div>
{:else if editorOpen}
  <CarEditor car={editingCar} onClose={closeEditor} fullScreen={true} />
{:else}
  <div class="section-title">
    <div>
      <h1>Detailanalyse</h1>
      <p>{car.marke} {car.modell} {car.modellvariante}</p>
    </div>
    <button class="button ghost" onclick={handleBack}>Zurück</button>
  </div>

  <section class="detail-section">
    <h2>Fahrzeug</h2>
    <div class="detail-general">
      <CarCard
        car={car}
        metrics={metrics}
        interactive={false}
        showActions={true}
        actions={{ edit: true, duplicate: false, view: false, delete: false }}
        onEdit={openEditor}
        variant="detail"
      />
      <div class="card info-card">
        <h3>Weitere Fahrzeugdaten</h3>
        <div class="info-grid">
          {#each infoItems as item}
            <div class="info-item">
              <span class="info-label">{item.label}</span>
              <span class="info-value">{item.value}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </section>

  <section class="detail-section">
    <h2>Finanzen</h2>
    <div class="summary-strip">
      <div
        class="summary-item has-tooltip"
        data-tooltip={summaryTooltips.tcoTotal}
      >
        <div class="kpi-label">TCO gesamt</div>
        <div class="value">{formatCurrency(metrics?.tcoTotal ?? 0)}</div>
      </div>
      <div
        class="summary-item has-tooltip"
        data-tooltip={summaryTooltips.tcoMonat}
      >
        <div class="kpi-label">TCO/Monat</div>
        <div class="value">{formatCurrency(metrics?.tcoMonat ?? 0)}</div>
      </div>
      <div
        class="summary-item has-tooltip"
        data-tooltip={summaryTooltips.restwert}
      >
        <div class="kpi-label">Restwert</div>
        <div class="value">{formatCurrency(metrics?.restwert ?? 0)}</div>
      </div>
    </div>

    <CostTable
      rows={breakdown}
      car={car}
      settings={appState.settings}
      includeDepreciation={uiState.includeDepreciation}
      highlightYear={hoverYear}
      onHoverYear={(year) => (hoverYear = year)}
    />

    {#if breakdown.length}
      <div class="card chart-card">
        <div class="chart-header">
          <h3>Kostenverlauf</h3>
          <span class="chart-caption">Planungshorizont: {planningYears} Jahre</span>
        </div>
        <div class="chart-wrap">
          <CostChart
            rows={breakdown}
            highlightYear={hoverYear}
            onHoverYear={(year) => (hoverYear = year)}
            horizon={planningYears}
          />
        </div>
      </div>
    {/if}
  </section>
{/if}
