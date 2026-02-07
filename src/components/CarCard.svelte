<script>
  import { formatCurrency } from "../lib/format.js";

  let { car, metrics, onEdit, onDuplicate, onDelete, onView, delay = 0 } = $props();

  const title = $derived(`${car.marke || ""} ${car.modell || ""}`.trim());
</script>

<div class="card card-animated car-card" style={`animation-delay: ${delay}ms`}>
  <div class="card-header">
    <div class="card-titles">
      <div class="card-title">{title || "Unbenannt"}</div>
      <div class="card-subtitle">{car.modellvariante || "-"}</div>
    </div>
    <div class="card-actions compact">
      <button
        type="button"
        class="icon-button"
        onclick={() => onEdit && onEdit(car)}
        aria-label="Bearbeiten"
        title="Bearbeiten"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
      </button>
      <button
        type="button"
        class="icon-button"
        onclick={() => onDuplicate && onDuplicate(car)}
        aria-label="Duplizieren"
        title="Duplizieren"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <rect x="3" y="3" width="13" height="13" rx="2" />
        </svg>
      </button>
      <button
        type="button"
        class="icon-button"
        onclick={() => onView && onView(car)}
        aria-label="Detail"
        title="Detail"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
      <button
        type="button"
        class="icon-button danger"
        onclick={() => onDelete && onDelete(car)}
        aria-label="Löschen"
        title="Löschen"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </button>
    </div>
  </div>

  <div class="kpi-row">
    <span class="kpi-label">TCO/Monat</span>
    <span>{formatCurrency(metrics?.tcoMonat ?? 0)}</span>
  </div>
  <div class="kpi-row">
    <span class="kpi-label">TCO/Jahr</span>
    <span>{formatCurrency(metrics?.tcoJahr ?? 0)}</span>
  </div>
  <div class="card-meta">
    <span class="meta-label">Baujahr</span>
    <span>{car.baujahr || "-"}</span>
  </div>
  <div class="card-comment" class:muted={!car.kommentar}>
    {car.kommentar || "Kein Kommentar"}
  </div>
</div>
