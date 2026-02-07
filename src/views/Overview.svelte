<script>
  import { appState, navigateTo, viewCarDetail } from "../lib/state.svelte.js";
  import { computeOverviewMetrics, computeRankings, num } from "../lib/compute.js";
  import { formatCurrency, formatNumber } from "../lib/format.js";

  let {
    embedded = false,
    onRequestAdd,
    cars = null,
    isFiltered = false,
    onClearFilters
  } = $props();

  let sortKey = $state("rank");
  let sortDir = $state("asc");

  const horizonYears = $derived(Math.max(0, Math.round(num(appState.settings.planungshorizont))));
  const horizonLabel = $derived(horizonYears === 1 ? "Jahr" : "Jahren");
  const columns = $derived.by(() => [
    { key: "marke", label: "Marke" },
    { key: "modell", label: "Modell" },
    { key: "modellvariante", label: "Modellvariante" },
    { key: "baujahr", label: "Baujahr" },
    { key: "beschaffungsart", label: "Beschaffungsart" },
    { key: "kaufpreis", label: "Kaufpreis" },
    { key: "leasingrate", label: "Leasingrate" },
    { key: "batterie", label: "Nettobatterie" },
    { key: "winterreichweite", label: "Winterreichweite" },
    { key: "tcoMonat", label: "TCO/Monat" },
    { key: "tcoJahr", label: "TCO/Jahr" },
    { key: "tcoKm", label: "TCO/km" },
    { key: "tcoTotal", label: `TCO nach ${horizonYears} ${horizonLabel}` },
    { key: "rank", label: "Rang" },
    { key: "kommentar", label: "Kommentar" }
  ]);

  const highlightKeys = [
    "batterie",
    "winterreichweite",
    "tcoMonat",
    "tcoJahr",
    "tcoKm",
    "tcoTotal"
  ];

  const higherBetter = ["winterreichweite", "batterie"];

  const carList = $derived.by(() => (Array.isArray(cars) ? cars : appState.cars));

  const rows = $derived.by(() => {
    const rankingList = computeRankings(carList, appState.settings);
    const rankMap = new Map(rankingList.map((item) => [item.carId, item.rank]));
    return carList.map((car) => {
      const metrics = computeOverviewMetrics(car, appState.settings);
      return {
        car,
        metrics,
        rank: rankMap.get(car.id) || "-"
      };
    });
  });

  const minMaxMap = $derived.by(() => {
    const result = {};
    for (const key of highlightKeys) {
      const values = rows
        .map((row) => getNumericValue(row, key))
        .filter((value) => Number.isFinite(value) && value > 0);
      if (values.length) {
        result[key] = {
          min: Math.min(...values),
          max: Math.max(...values)
        };
      }
    }
    return result;
  });

  const sortedRows = $derived.by(() => {
    const copy = [...rows];
    const direction = sortDir === "asc" ? 1 : -1;

    copy.sort((a, b) => {
      const aValue = getSortValue(a, sortKey);
      const bValue = getSortValue(b, sortKey);

      if (typeof aValue === "string" || typeof bValue === "string") {
        return String(aValue).localeCompare(String(bValue), "de") * direction;
      }

      return (Number(aValue) - Number(bValue)) * direction;
    });

    return copy;
  });

  function setSort(key) {
    if (sortKey === key) {
      sortDir = sortDir === "asc" ? "desc" : "asc";
      return;
    }
    sortKey = key;
    sortDir = "asc";
  }

  function normalizeBrand(brand) {
    return (brand || "")
      .trim()
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]/g, "");
  }

  function getBrandSlug(brand) {
    const normalized = normalizeBrand(brand);
    if (!normalized) return "";
    const map = {
      vw: "volkswagen",
      volkswagen: "volkswagen",
      bmw: "bmw",
      hyundai: "hyundai",
      mercedes: "mercedesbenz",
      mercedesbenz: "mercedesbenz",
      audi: "audi",
      tesla: "tesla",
      skoda: "skoda",
      seat: "seat",
      opel: "opel",
      ford: "ford",
      toyota: "toyota",
      honda: "honda",
      nissan: "nissan",
      renault: "renault",
      peugeot: "peugeot",
      kia: "kia",
      volvo: "volvo",
      porsche: "porsche",
      mini: "mini",
      mazda: "mazda",
      fiat: "fiat",
      citroen: "citroen",
      jeep: "jeep",
      jaguar: "jaguar",
      landrover: "landrover"
    };
    return map[normalized] || normalized;
  }

  function getBrandInitials(brand) {
    const text = (brand || "").trim();
    if (!text) return "CC";
    const parts = text.split(/\s+/);
    if (parts.length > 1) {
      return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
    }
    if (text.length <= 3) return text.toUpperCase();
    return text.slice(0, 2).toUpperCase();
  }

  function getSortValue(row, key) {
    if (key === "marke") return row.car.marke;
    if (key === "modell") return row.car.modell;
    if (key === "modellvariante") return row.car.modellvariante;
    if (key === "baujahr") return num(row.car.baujahr);
    if (key === "beschaffungsart") return row.car.beschaffungsart;
    if (key === "kaufpreis") return num(row.car.kaufpreis);
    if (key === "leasingrate") return num(row.car.leasingrate);
    if (key === "batterie") return num(row.car.batterie);
    if (key === "winterreichweite") return num(row.car.winterreichweite);
    if (key === "tcoMonat") return row.metrics.tcoMonat;
    if (key === "tcoJahr") return row.metrics.tcoJahr;
    if (key === "tcoKm") return row.metrics.tcoKm;
    if (key === "tcoTotal") return row.metrics.tcoTotal;
    if (key === "rank") return typeof row.rank === "number" ? row.rank : 9999;
    if (key === "kommentar") return row.car.kommentar;
    return "";
  }

  function getNumericValue(row, key) {
    if (key === "kaufpreis") return num(row.car.kaufpreis);
    if (key === "leasingrate") return num(row.car.leasingrate);
    if (key === "batterie") return num(row.car.batterie);
    if (key === "winterreichweite") return num(row.car.winterreichweite);
    if (key === "tcoMonat") return row.metrics.tcoMonat;
    if (key === "tcoJahr") return row.metrics.tcoJahr;
    if (key === "tcoKm") return row.metrics.tcoKm;
    if (key === "tcoTotal") return row.metrics.tcoTotal;
    return NaN;
  }

  function getHighlightClass(key, value) {
    const range = minMaxMap[key];
    if (!range || !Number.isFinite(value) || value <= 0) {
      return "";
    }

    if (range.min === range.max) {
      return "";
    }

    const isHigherBetter = higherBetter.includes(key);
    if (isHigherBetter) {
      if (value === range.max) return "cell-best";
      if (value === range.min) return "cell-worst";
      return "";
    }

    if (value === range.min) return "cell-best";
    if (value === range.max) return "cell-worst";
    return "";
  }

  function formatCell(row, key) {
    if (key === "kaufpreis") return formatCurrency(num(row.car.kaufpreis));
    if (key === "leasingrate") return formatCurrency(num(row.car.leasingrate));
    if (key === "batterie") return formatNumber(num(row.car.batterie));
    if (key === "winterreichweite") return formatNumber(num(row.car.winterreichweite));
    if (key === "tcoMonat") return formatCurrency(row.metrics.tcoMonat);
    if (key === "tcoJahr") return formatCurrency(row.metrics.tcoJahr);
    if (key === "tcoKm") return formatCurrency(row.metrics.tcoKm, 2);
    if (key === "tcoTotal") return formatCurrency(row.metrics.tcoTotal);
    if (key === "rank") return row.rank;
    if (key === "kommentar") return row.car.kommentar || "-";
    if (key === "baujahr") return row.car.baujahr || "-";
    if (key === "beschaffungsart") return row.car.beschaffungsart || "-";
    return row.car[key] || "-";
  }

  function handleRowKey(event, carId) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      viewCarDetail(carId);
    }
  }

  function handleEmptyAction() {
    if (embedded && onRequestAdd) {
      onRequestAdd();
      return;
    }
    navigateTo("garage");
  }

  function handleLogoError(event) {
    event.currentTarget?.closest?.(".brand-cell")?.classList.add("logo-failed");
  }
</script>

{#if !embedded}
  <div class="section-title">
    <div>
      <h1>Übersicht</h1>
      <p>Vergleiche alle Fahrzeuge auf einen Blick und sortiere nach Bedarf.</p>
    </div>
  </div>
{/if}

{#if rows.length === 0}
  <div class="card empty-state">
    {#if isFiltered}
      <h3>Keine Treffer</h3>
      <p>Kein Fahrzeug entspricht den aktuellen Filtern.</p>
      {#if onClearFilters}
        <button class="button ghost" onclick={onClearFilters}>Filter zurücksetzen</button>
      {/if}
    {:else}
      <h3>Keine Fahrzeuge zum Vergleichen</h3>
      <p>Füge zuerst ein Fahrzeug hinzu, um die Übersicht zu nutzen.</p>
      <button class="button" onclick={handleEmptyAction}>
        {embedded ? "Fahrzeug hinzufügen" : "Zur Garage"}
      </button>
    {/if}
  </div>
{:else}
  <div class="table-wrap">
    <table class="overview-table">
      <thead>
        <tr>
          {#each columns as column}
            <th>
              <button
                type="button"
                class="table-sort"
                onclick={() => setSort(column.key)}
              >
                <span>{column.label}</span>
                {#if sortKey === column.key}
                  <span class="sort-indicator">{sortDir === "asc" ? "▲" : "▼"}</span>
                {/if}
              </button>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each sortedRows as row}
          <tr
            role="button"
            tabindex="0"
            onclick={() => viewCarDetail(row.car.id)}
            onkeydown={(event) => handleRowKey(event, row.car.id)}
          >
            {#each columns as column}
              {@const cellValue = getNumericValue(row, column.key)}
              <td class={getHighlightClass(column.key, cellValue)}>
                {#if column.key === "marke"}
                  {@const slug = getBrandSlug(row.car.marke)}
                  {@const logoUrl = slug ? `https://cdn.simpleicons.org/${slug}/1a1a1a` : ""}
                  <div class={`brand-cell ${logoUrl ? "" : "logo-failed"}`}>
                    {#if logoUrl}
                      <img
                        class="brand-icon"
                        src={logoUrl}
                        alt={`${row.car.marke || "Fahrzeug"} Logo`}
                        loading="lazy"
                        onerror={handleLogoError}
                      />
                    {/if}
                    <span class="brand-fallback">{getBrandInitials(row.car.marke)}</span>
                    <span class="brand-text">{row.car.marke || "-"}</span>
                  </div>
                {:else}
                  {formatCell(row, column.key)}
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
