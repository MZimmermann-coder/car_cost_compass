<script>
  import {
    appState,
    navigateTo,
    toggleGarageCarFavorite,
    setGarageCarsHidden,
    toggleGarageCarHidden,
    uiState,
    viewCarDetail
  } from "../lib/state.svelte.js";
  import {
    computeOverviewMetrics,
    computeRankings,
    getBafaAmount,
    getEffectivePurchasePrice,
    num
  } from "../lib/compute.js";
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
    { key: "kofferraumVolumen", label: "Kofferraum (l)" },
    { key: "laenge", label: "Länge (mm)" },
    { key: "breite", label: "Breite (mm)" },
    { key: "hoehe", label: "Höhe (mm)" },
    { key: "beschaffungsart", label: "Beschaffungsart" },
    { key: "kaufpreis", label: "Listenpreis" },
    { key: "rabatt", label: "Rabatt" },
    { key: "bafaFoerderung", label: "BAFA Förderung" },
    { key: "effektiverKaufpreis", label: "Tatsächlicher Preis" },
    { key: "leasingrate", label: "Leasingrate" },
    { key: "versicherung", label: "Versicherung / Monat" },
    { key: "versicherungsart", label: "Versicherungsart" },
    { key: "wartung", label: "Wartung / Monat" },
    { key: "reparatur", label: "Reparatur / Monat" },
    { key: "garantieJahre", label: "Garantie (Jahre)" },
    { key: "serviceintervallJahre", label: "Service (Jahre)" },
    { key: "serviceintervallKilometer", label: "Service (km)" },
    { key: "batterie", label: "Nettobatterie" },
    { key: "winterreichweite", label: "Winterreichweite" },
    { key: "onePedalBisStillstand", label: "One-Pedal bis Stillstand" },
    { key: "sitzbelueftungVerfuegbar", label: "Sitzbelüftung" },
    { key: "wertverlust", label: "Wertverlust" },
    { key: "tcoMonat", label: "TCO/Monat" },
    { key: "tcoJahr", label: "TCO/Jahr" },
    { key: "tcoKm", label: "TCO/km" },
    { key: "tcoTotal", label: `TCO nach ${horizonYears} ${horizonLabel}` },
    { key: "rank", label: "Rang" },
    { key: "kommentar", label: "Kommentar" },
    { key: "konfigurationslink", label: "Konfiguration" }
  ]);

  const highlightDirections = {
    effektiverKaufpreis: "lower",
    leasingrate: "lower",
    versicherung: "lower",
    wartung: "lower",
    reparatur: "lower",
    wertverlust: "lower",
    garantieJahre: "higher",
    serviceintervallJahre: "higher",
    serviceintervallKilometer: "higher",
    winterreichweite: "higher",
    tcoMonat: "lower"
  };

  const carList = $derived.by(() => (Array.isArray(cars) ? cars : appState.cars));

  const rankingCars = $derived.by(() =>
    embedded
      ? carList.filter((car) => !uiState.hiddenGarageCarIds.includes(car.id))
      : carList
  );

  const rows = $derived.by(() => {
    const rankingList = computeRankings(rankingCars, appState.settings, {
      includeDepreciation: uiState.includeDepreciation
    });
    const rankMap = new Map(rankingList.map((item) => [item.carId, item.rank]));
    return carList.map((car) => {
      const metrics = computeOverviewMetrics(car, appState.settings, {
        includeDepreciation: uiState.includeDepreciation
      });
      return {
        car,
        metrics,
        rank: rankMap.get(car.id) || "-"
      };
    });
  });

  const allRowsHidden = $derived(rows.length > 0 && rows.every((row) => isRowHidden(row)));

  const minMaxMap = $derived.by(() => {
    const result = {};
    const comparisonRows = embedded ? rows.filter((row) => !isRowHidden(row)) : rows;
    for (const key of Object.keys(highlightDirections)) {
      const values = comparisonRows
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
      const aHidden = isRowHidden(a);
      const bHidden = isRowHidden(b);
      if (aHidden !== bHidden) {
        return aHidden ? 1 : -1;
      }

      const aValue = getSortValue(a, sortKey);
      const bValue = getSortValue(b, sortKey);

      if (typeof aValue === "string" || typeof bValue === "string") {
        return String(aValue).localeCompare(String(bValue), "de") * direction;
      }

      return (Number(aValue) - Number(bValue)) * direction;
    });

    return copy;
  });

  function isRowHidden(row) {
    return embedded && uiState.hiddenGarageCarIds.includes(row.car.id);
  }

  function isRowFavorite(row) {
    return embedded && uiState.favoriteGarageCarIds.includes(row.car.id);
  }

  function toggleAllRows() {
    setGarageCarsHidden(rows.map((row) => row.car.id), !allRowsHidden);
  }

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
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
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

  function getBrandLogoUrl(brand) {
    if (normalizeBrand(brand) === "cupra") {
      return "https://upload.wikimedia.org/wikipedia/commons/e/ef/Cupra_symbol.svg";
    }
    const slug = getBrandSlug(brand);
    return slug ? `https://cdn.simpleicons.org/${slug}/1a1a1a` : "";
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
    if (key === "kofferraumVolumen") return num(row.car.kofferraumVolumen);
    if (key === "laenge") return num(row.car.laenge);
    if (key === "breite") return num(row.car.breite);
    if (key === "hoehe") return num(row.car.hoehe);
    if (key === "beschaffungsart") return row.car.beschaffungsart;
    if (key === "kaufpreis") return num(row.car.kaufpreis);
    if (key === "rabatt") return num(row.car.rabatt);
    if (key === "bafaFoerderung") return getBafaAmount(row.car, appState.settings);
    if (key === "effektiverKaufpreis") return getEffectivePurchasePrice(row.car, appState.settings);
    if (key === "leasingrate") return num(row.car.leasingrate);
    if (key === "versicherung") return num(row.car.versicherung);
    if (key === "versicherungsart") return row.car.versicherungsart;
    if (key === "wartung") return num(row.car.wartung);
    if (key === "reparatur") return num(row.car.reparatur);
    if (key === "wertverlust") return row.metrics.wertverlust;
    if (key === "garantieJahre") return num(row.car.garantieJahre);
    if (key === "serviceintervallJahre") return num(row.car.serviceintervallJahre);
    if (key === "serviceintervallKilometer") return num(row.car.serviceintervallKilometer);
    if (key === "batterie") return num(row.car.batterie);
    if (key === "winterreichweite") return num(row.car.winterreichweite);
    if (key === "onePedalBisStillstand") return row.car.onePedalBisStillstand;
    if (key === "sitzbelueftungVerfuegbar") {
      return typeof row.car.sitzbelueftungVerfuegbar === "boolean"
        ? row.car.sitzbelueftungVerfuegbar ? 1 : 0
        : Number.NaN;
    }
    if (key === "wertverlust") return row.metrics.wertverlust;
    if (key === "tcoMonat") return row.metrics.tcoMonat;
    if (key === "tcoJahr") return row.metrics.tcoJahr;
    if (key === "tcoKm") return row.metrics.tcoKm;
    if (key === "tcoTotal") return row.metrics.tcoTotal;
    if (key === "rank") return typeof row.rank === "number" ? row.rank : 9999;
    if (key === "kommentar") return row.car.kommentar;
    if (key === "konfigurationslink") return row.car.konfigurationslink;
    return "";
  }

  function getNumericValue(row, key) {
    if (key === "effektiverKaufpreis") return getEffectivePurchasePrice(row.car, appState.settings);
    if (key === "leasingrate") return num(row.car.leasingrate);
    if (key === "versicherung") return num(row.car.versicherung);
    if (key === "wartung") return num(row.car.wartung);
    if (key === "reparatur") return num(row.car.reparatur);
    if (key === "garantieJahre") return num(row.car.garantieJahre);
    if (key === "serviceintervallJahre") return num(row.car.serviceintervallJahre);
    if (key === "serviceintervallKilometer") return num(row.car.serviceintervallKilometer);
    if (key === "winterreichweite") return num(row.car.winterreichweite);
    if (key === "tcoMonat") return row.metrics.tcoMonat;
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

    const isHigherBetter = highlightDirections[key] === "higher";
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
    if (key === "rabatt") return formatCurrency(num(row.car.rabatt));
    if (key === "bafaFoerderung") return formatCurrency(getBafaAmount(row.car, appState.settings));
    if (key === "effektiverKaufpreis") return formatCurrency(getEffectivePurchasePrice(row.car, appState.settings));
    if (key === "leasingrate") return formatCurrency(num(row.car.leasingrate));
    if (key === "versicherung") return formatCurrency(num(row.car.versicherung));
    if (key === "versicherungsart") return row.car.versicherungsart || "-";
    if (key === "wartung") return formatCurrency(num(row.car.wartung));
    if (key === "reparatur") return formatCurrency(num(row.car.reparatur));
    if (key === "garantieJahre") {
      const years = num(row.car.garantieJahre);
      return years ? `${formatNumber(years, Number.isInteger(years) ? 0 : 1)} ${years === 1 ? "Jahr" : "Jahre"}` : "-";
    }
    if (key === "serviceintervallJahre") {
      const years = num(row.car.serviceintervallJahre);
      return years ? `${formatNumber(years, Number.isInteger(years) ? 0 : 1)} ${years === 1 ? "Jahr" : "Jahre"}` : "-";
    }
    if (key === "serviceintervallKilometer") {
      return num(row.car.serviceintervallKilometer)
        ? `${formatNumber(num(row.car.serviceintervallKilometer))} km`
        : "-";
    }
    if (key === "batterie") return formatNumber(num(row.car.batterie));
    if (key === "winterreichweite") return formatNumber(num(row.car.winterreichweite));
    if (key === "onePedalBisStillstand") return row.car.onePedalBisStillstand || "-";
    if (key === "sitzbelueftungVerfuegbar") {
      return typeof row.car.sitzbelueftungVerfuegbar === "boolean"
        ? row.car.sitzbelueftungVerfuegbar ? "Ja" : "Nein"
        : "-";
    }
    if (key === "kofferraumVolumen") {
      return num(row.car.kofferraumVolumen) ? `${formatNumber(num(row.car.kofferraumVolumen))} l` : "-";
    }
    if (key === "laenge" || key === "breite" || key === "hoehe") {
      return num(row.car[key]) ? `${formatNumber(num(row.car[key]))} mm` : "-";
    }
    if (key === "wertverlust") return formatCurrency(row.metrics.wertverlust);
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

  function getExternalUrl(value) {
    const text = String(value || "").trim();
    if (!text) {
      return "";
    }

    try {
      const url = new URL(text);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function handleRowKey(event, carId) {
    if (event.target !== event.currentTarget) {
      return;
    }
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
    <table class="overview-table" class:garage-table={embedded}>
      <thead>
        <tr>
          {#if embedded}
            <th class="garage-visibility-header" aria-label="Sichtbarkeit">
              <button
                type="button"
                class="garage-row-visibility"
                aria-label={allRowsHidden ? "Alle Fahrzeuge wieder einblenden" : "Alle Fahrzeuge ausblenden"}
                aria-pressed={allRowsHidden}
                title={allRowsHidden ? "Alle Fahrzeuge wieder einblenden" : "Alle Fahrzeuge ausblenden"}
                onclick={toggleAllRows}
              >
                <iconify-icon
                  icon={allRowsHidden ? "mdi:eye-off-outline" : "mdi:eye-outline"}
                  aria-hidden="true"
                ></iconify-icon>
              </button>
            </th>
            <th class="garage-favorite-header" aria-label="Favoriten">
              <iconify-icon icon="mdi:star-outline" aria-hidden="true"></iconify-icon>
            </th>
          {/if}
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
            class:garage-row-hidden={isRowHidden(row)}
            role="button"
            tabindex="0"
            onclick={() => viewCarDetail(row.car.id)}
            onkeydown={(event) => handleRowKey(event, row.car.id)}
          >
            {#if embedded}
              <td class="garage-visibility-cell">
                <button
                  type="button"
                  class="garage-row-visibility"
                  aria-label={isRowHidden(row) ? "Fahrzeug wieder einblenden" : "Fahrzeug ausblenden"}
                  aria-pressed={isRowHidden(row)}
                  title={isRowHidden(row) ? "Fahrzeug wieder einblenden" : "Fahrzeug ausblenden"}
                  onclick={(event) => {
                    event.stopPropagation();
                    toggleGarageCarHidden(row.car.id);
                  }}
                >
                  <iconify-icon
                    icon={isRowHidden(row) ? "mdi:eye-off-outline" : "mdi:eye-outline"}
                    aria-hidden="true"
                  ></iconify-icon>
                </button>
              </td>
              <td class="garage-favorite-cell">
                <button
                  type="button"
                  class="garage-row-favorite"
                  aria-label={isRowFavorite(row) ? "Favorit entfernen" : "Als Favorit markieren"}
                  aria-pressed={isRowFavorite(row)}
                  title={isRowFavorite(row) ? "Favorit entfernen" : "Als Favorit markieren"}
                  onclick={(event) => {
                    event.stopPropagation();
                    toggleGarageCarFavorite(row.car.id);
                  }}
                >
                  <iconify-icon
                    icon={isRowFavorite(row) ? "mdi:star" : "mdi:star-outline"}
                    aria-hidden="true"
                  ></iconify-icon>
                </button>
              </td>
            {/if}
            {#each columns as column}
              {@const cellValue = getNumericValue(row, column.key)}
              <td class={isRowHidden(row) ? "" : getHighlightClass(column.key, cellValue)}>
                {#if column.key === "marke"}
                  {@const logoUrl = getBrandLogoUrl(row.car.marke)}
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
                {:else if column.key === "konfigurationslink"}
                  {@const configurationUrl = getExternalUrl(row.car.konfigurationslink)}
                  {#if configurationUrl}
                    <a
                      class="table-link"
                      href={configurationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onclick={(event) => event.stopPropagation()}
                    >
                      <iconify-icon icon="mdi:open-in-new" aria-hidden="true"></iconify-icon>
                      Öffnen
                    </a>
                  {:else}
                    -
                  {/if}
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
