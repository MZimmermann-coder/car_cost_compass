<script>
  import { formatCurrency, formatNumber } from "../lib/format.js";
  import { num } from "../lib/compute.js";

  let {
    car,
    metrics,
    onEdit,
    onDuplicate,
    onDelete,
    onView,
    actions = null,
    delay = 0,
    highlight = false,
    interactive = true,
    showActions = true,
    variant = ""
  } = $props();

  const title = $derived(`${car.marke || ""} ${car.modell || ""}`.trim());
  const isElectric = $derived(car.kraftstoffart === "Elektro");

  const brandLogoUrl = $derived(getBrandLogoUrl(car.marke));
  const brandInitials = $derived(getBrandInitials(car.marke));
  const brandColor = $derived(getBrandColor(car.marke));
  const fuelInfo = $derived(getFuelInfo(car.kraftstoffart));
  const ownershipInfo = $derived(getOwnershipInfo(car.beschaffungsart));
  const configurationUrl = $derived(getExternalUrl(car.konfigurationslink));
  const engineColor = $derived(getEngineColor(fuelInfo.type));
  const engineGlow = $derived(toRgba(engineColor, 0.35));
  const actionConfig = $derived({
    edit: actions?.edit ?? true,
    duplicate: actions?.duplicate ?? true,
    view: actions?.view ?? true,
    delete: actions?.delete ?? true,
    link: actions?.link ?? true
  });
  const hasActions = $derived(
    showActions &&
      (actionConfig.edit ||
        actionConfig.duplicate ||
        actionConfig.view ||
        actionConfig.delete ||
        (actionConfig.link && configurationUrl))
  );

  const kilometerText = $derived(formatValue(car.kilometerstand, "km"));
  const batteryText = $derived(formatValue(car.batterie, "kWh"));
  const winterRangeText = $derived(formatValue(car.winterreichweite, "km"));
  const hasWinterRange = $derived(num(car.winterreichweite) > 0);
  const hasTrunkVolume = $derived(num(car.kofferraumVolumen) > 0);
  const exteriorDimensionsText = $derived.by(() => {
    const values = [car.laenge, car.breite, car.hoehe];
    if (!values.some((value) => num(value) > 0)) {
      return "";
    }
    const formatted = values.map((value) => num(value) > 0 ? formatNumber(num(value)) : "–");
    return `${formatted.join(" × ")} mm`;
  });

  let logoFailed = $state(false);

  $effect(() => {
    brandLogoUrl;
    logoFailed = false;
  });

  function handleCardActivate(event) {
    if (!interactive || !onView) {
      return;
    }
    if (event?.target?.closest?.(".card-actions")) {
      return;
    }
    onView(car);
  }

  function handleCardKeydown(event) {
    if (!interactive || event?.target?.closest?.(".card-actions")) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCardActivate(event);
    }
  }

  function formatValue(value, unit) {
    if (value === null || value === undefined || String(value).trim() === "") {
      return "-";
    }
    return `${formatNumber(num(value))} ${unit}`;
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

  function getBrandColor(brand) {
    const key = normalizeBrand(brand);
    const palette = [
      "#3b82f6",
      "#f97316",
      "#10b981",
      "#a855f7",
      "#ef4444",
      "#14b8a6",
      "#f59e0b",
      "#64748b",
      "#ec4899",
      "#22c55e"
    ];
    if (!key) {
      return palette[0];
    }
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
      hash = (hash * 31 + key.charCodeAt(i)) % palette.length;
    }
    return palette[hash];
  }

  function getFuelInfo(value) {
    const text = (value || "").trim().toLowerCase();
    if (!text) {
      return { type: "unknown", label: "Unbekannt", icon: "mdi:help-circle-outline" };
    }
    if (text.includes("elekt")) {
      return { type: "electric", label: "Elektro", icon: "mdi:flash" };
    }
    if (text.includes("diesel")) {
      return { type: "diesel", label: "Diesel", icon: "mdi:oil" };
    }
    return { type: "benzin", label: "Benzin", icon: "mdi:gas-station" };
  }

  function getOwnershipInfo(value) {
    const text = (value || "").trim().toLowerCase();
    if (text.includes("leasing")) {
      return { type: "lease", label: "Leasing" };
    }
    if (text.includes("kauf")) {
      return { type: "buy", label: "Kauf" };
    }
    return { type: "unknown", label: value || "Unbekannt" };
  }

  function getEngineColor(type) {
    if (type === "electric") return "#1f6d5a";
    if (type === "diesel") return "#7a4b15";
    if (type === "benzin") return "#8a1f1f";
    return "#6b7280";
  }

  function toRgba(hex, alpha) {
    const value = String(hex || "").replace("#", "");
    if (value.length !== 6 && value.length !== 3) {
      return `rgba(107, 114, 128, ${alpha})`;
    }
    const expanded =
      value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
    const r = parseInt(expanded.slice(0, 2), 16);
    const g = parseInt(expanded.slice(2, 4), 16);
    const b = parseInt(expanded.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
      return `rgba(107, 114, 128, ${alpha})`;
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
</script>

{#if interactive}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    class="card card-animated car-card"
    class:car-card-highlight={highlight}
    class:is-interactive={interactive}
    class:car-card-detail={variant === "detail"}
    style={`--brand-color: ${brandColor}; --engine-color: ${engineColor}; --engine-glow: ${engineGlow}; animation-delay: ${delay}ms`}
    role="button"
    tabindex="0"
    aria-label="Detail öffnen"
    onclick={handleCardActivate}
    onkeydown={handleCardKeydown}
  >
    <div class="card-accent"></div>
    <div class="card-header">
      {#if brandLogoUrl && !logoFailed}
        <div class="brand-logo">
          <img
            src={brandLogoUrl}
            alt={`${car.marke || "Fahrzeug"} Logo`}
            loading="lazy"
            onerror={() => (logoFailed = true)}
          />
        </div>
      {:else}
        <div class="brand-badge" aria-hidden="true">{brandInitials}</div>
      {/if}

      <div class="card-titles">
        <div class="card-title">{title || "Unbenannt"}</div>
        <div class="card-subtitle">{car.modellvariante || "-"}</div>
      </div>

      {#if hasActions}
        <div class="card-actions compact">
          {#if actionConfig.edit}
            <button
              type="button"
              class="icon-button"
              onclick={(event) => {
                event.stopPropagation();
                onEdit && onEdit(car);
              }}
              aria-label="Bearbeiten"
              title="Bearbeiten"
            >
              <iconify-icon icon="mdi:pencil" aria-hidden="true"></iconify-icon>
            </button>
          {/if}
          {#if actionConfig.duplicate}
            <button
              type="button"
              class="icon-button"
              onclick={(event) => {
                event.stopPropagation();
                onDuplicate && onDuplicate(car);
              }}
              aria-label="Duplizieren"
              title="Duplizieren"
            >
              <iconify-icon icon="mdi:content-copy" aria-hidden="true"></iconify-icon>
            </button>
          {/if}
          {#if actionConfig.view}
            <button
              type="button"
              class="icon-button"
              onclick={(event) => {
                event.stopPropagation();
                onView && onView(car);
              }}
              aria-label="Detail"
              title="Detail"
            >
              <iconify-icon icon="mdi:eye-outline" aria-hidden="true"></iconify-icon>
            </button>
          {/if}
          {#if actionConfig.link && configurationUrl}
            <a
              class="icon-button"
              href={configurationUrl}
              target="_blank"
              rel="noopener noreferrer"
              onclick={(event) => event.stopPropagation()}
              aria-label="Konfiguration öffnen"
              title="Konfiguration öffnen"
            >
              <iconify-icon icon="mdi:open-in-new" aria-hidden="true"></iconify-icon>
            </a>
          {/if}
          {#if actionConfig.delete}
            <button
              type="button"
              class="icon-button danger"
              onclick={(event) => {
                event.stopPropagation();
                onDelete && onDelete(car);
              }}
              aria-label="Löschen"
              title="Löschen"
            >
              <iconify-icon icon="mdi:trash-can-outline" aria-hidden="true"></iconify-icon>
            </button>
          {/if}
        </div>
      {/if}
    </div>

    <div class="chip-row">
      <span class={`chip chip-fuel chip-fuel-${fuelInfo.type}`}>
        <iconify-icon icon={fuelInfo.icon} aria-hidden="true"></iconify-icon>
        {fuelInfo.label}
      </span>
      <span class={`chip chip-ownership chip-ownership-${ownershipInfo.type}`}>{ownershipInfo.label}</span>
      <span class="chip">Baujahr {car.baujahr || "-"}</span>
      <span class="chip">{kilometerText}</span>
      {#if isElectric}
        <span class="chip">Batterie {batteryText}</span>
      {/if}
      {#if isElectric && hasWinterRange}
        <span class="chip">Winterreichweite {winterRangeText}</span>
      {/if}
    </div>

    {#if hasTrunkVolume || exteriorDimensionsText}
      <div class="vehicle-size-row">
        {#if hasTrunkVolume}
          <span>
            <iconify-icon icon="mdi:car-back" aria-hidden="true"></iconify-icon>
            {formatNumber(num(car.kofferraumVolumen))} l Kofferraum
          </span>
        {/if}
        {#if exteriorDimensionsText}
          <span>
            <iconify-icon icon="mdi:ruler-square" aria-hidden="true"></iconify-icon>
            {exteriorDimensionsText}
          </span>
        {/if}
      </div>
    {/if}

    <div class="card-content">
      <div class="kpi-panel">
        <div>
          <div class="kpi-value">{formatCurrency(metrics?.tcoMonat ?? 0)}</div>
          <div class="kpi-caption">TCO / Monat</div>
        </div>
        <div class="kpi-side">
          <div class="kpi-side-label">TCO / Jahr</div>
          <div class="kpi-side-value">{formatCurrency(metrics?.tcoJahr ?? 0)}</div>
        </div>
      </div>

      <div class="card-cost-grid">
        <div class="card-cost-item">
          <div class="kpi-label">Wartung / Monat</div>
          <div class="card-cost-value">{formatCurrency(num(car.wartung))}</div>
        </div>
        <div class="card-cost-item">
          <div class="kpi-label">Reparatur / Monat</div>
          <div class="card-cost-value">{formatCurrency(num(car.reparatur))}</div>
        </div>
        <div class="card-cost-item">
          <div class="kpi-label">Versicherung / Monat</div>
          <div class="card-cost-value">{formatCurrency(num(car.versicherung))}</div>
          <div class="card-cost-meta">{car.versicherungsart || "-"}</div>
        </div>
      </div>

      <div class="comment-box">
        <div class="comment-label">Notiz</div>
        <div class="card-comment" class:muted={!car.kommentar}>
          {car.kommentar || "Kein Kommentar"}
        </div>
      </div>
    </div>
  </div>
{:else}
  <div
    class="card card-animated car-card"
    class:car-card-highlight={highlight}
    class:car-card-detail={variant === "detail"}
    style={`--brand-color: ${brandColor}; --engine-color: ${engineColor}; --engine-glow: ${engineGlow}; animation-delay: ${delay}ms`}
  >
    <div class="card-accent"></div>
    <div class="card-header">
      {#if brandLogoUrl && !logoFailed}
        <div class="brand-logo">
          <img
            src={brandLogoUrl}
            alt={`${car.marke || "Fahrzeug"} Logo`}
            loading="lazy"
            onerror={() => (logoFailed = true)}
          />
        </div>
      {:else}
        <div class="brand-badge" aria-hidden="true">{brandInitials}</div>
      {/if}

      <div class="card-titles">
        <div class="card-title">{title || "Unbenannt"}</div>
        <div class="card-subtitle">{car.modellvariante || "-"}</div>
      </div>

      {#if hasActions}
        <div class="card-actions compact">
          {#if actionConfig.edit}
            <button
              type="button"
              class="icon-button"
              onclick={(event) => {
                event.stopPropagation();
                onEdit && onEdit(car);
              }}
              aria-label="Bearbeiten"
              title="Bearbeiten"
            >
              <iconify-icon icon="mdi:pencil" aria-hidden="true"></iconify-icon>
            </button>
          {/if}
          {#if actionConfig.duplicate}
            <button
              type="button"
              class="icon-button"
              onclick={(event) => {
                event.stopPropagation();
                onDuplicate && onDuplicate(car);
              }}
              aria-label="Duplizieren"
              title="Duplizieren"
            >
              <iconify-icon icon="mdi:content-copy" aria-hidden="true"></iconify-icon>
            </button>
          {/if}
          {#if actionConfig.view}
            <button
              type="button"
              class="icon-button"
              onclick={(event) => {
                event.stopPropagation();
                onView && onView(car);
              }}
              aria-label="Detail"
              title="Detail"
            >
              <iconify-icon icon="mdi:eye-outline" aria-hidden="true"></iconify-icon>
            </button>
          {/if}
          {#if actionConfig.link && configurationUrl}
            <a
              class="icon-button"
              href={configurationUrl}
              target="_blank"
              rel="noopener noreferrer"
              onclick={(event) => event.stopPropagation()}
              aria-label="Konfiguration öffnen"
              title="Konfiguration öffnen"
            >
              <iconify-icon icon="mdi:open-in-new" aria-hidden="true"></iconify-icon>
            </a>
          {/if}
          {#if actionConfig.delete}
            <button
              type="button"
              class="icon-button danger"
              onclick={(event) => {
                event.stopPropagation();
                onDelete && onDelete(car);
              }}
              aria-label="Löschen"
              title="Löschen"
            >
              <iconify-icon icon="mdi:trash-can-outline" aria-hidden="true"></iconify-icon>
            </button>
          {/if}
        </div>
      {/if}
    </div>

    <div class="chip-row">
      <span class={`chip chip-fuel chip-fuel-${fuelInfo.type}`}>
        <iconify-icon icon={fuelInfo.icon} aria-hidden="true"></iconify-icon>
        {fuelInfo.label}
      </span>
      <span class={`chip chip-ownership chip-ownership-${ownershipInfo.type}`}>{ownershipInfo.label}</span>
      <span class="chip">Baujahr {car.baujahr || "-"}</span>
      <span class="chip">{kilometerText}</span>
      {#if isElectric}
        <span class="chip">Batterie {batteryText}</span>
      {/if}
      {#if isElectric && hasWinterRange}
        <span class="chip">Winterreichweite {winterRangeText}</span>
      {/if}
    </div>

    {#if hasTrunkVolume || exteriorDimensionsText}
      <div class="vehicle-size-row">
        {#if hasTrunkVolume}
          <span>
            <iconify-icon icon="mdi:car-back" aria-hidden="true"></iconify-icon>
            {formatNumber(num(car.kofferraumVolumen))} l Kofferraum
          </span>
        {/if}
        {#if exteriorDimensionsText}
          <span>
            <iconify-icon icon="mdi:ruler-square" aria-hidden="true"></iconify-icon>
            {exteriorDimensionsText}
          </span>
        {/if}
      </div>
    {/if}

    <div class="card-content">
      <div class="kpi-panel">
        <div>
          <div class="kpi-value">{formatCurrency(metrics?.tcoMonat ?? 0)}</div>
          <div class="kpi-caption">TCO / Monat</div>
        </div>
        <div class="kpi-side">
          <div class="kpi-side-label">TCO / Jahr</div>
          <div class="kpi-side-value">{formatCurrency(metrics?.tcoJahr ?? 0)}</div>
        </div>
      </div>

      <div class="card-cost-grid">
        <div class="card-cost-item">
          <div class="kpi-label">Wartung / Monat</div>
          <div class="card-cost-value">{formatCurrency(num(car.wartung))}</div>
        </div>
        <div class="card-cost-item">
          <div class="kpi-label">Reparatur / Monat</div>
          <div class="card-cost-value">{formatCurrency(num(car.reparatur))}</div>
        </div>
        <div class="card-cost-item">
          <div class="kpi-label">Versicherung / Monat</div>
          <div class="card-cost-value">{formatCurrency(num(car.versicherung))}</div>
          <div class="card-cost-meta">{car.versicherungsart || "-"}</div>
        </div>
      </div>

      <div class="comment-box">
        <div class="comment-label">Notiz</div>
        <div class="card-comment" class:muted={!car.kommentar}>
          {car.kommentar || "Kein Kommentar"}
        </div>
      </div>
    </div>
  </div>
{/if}
