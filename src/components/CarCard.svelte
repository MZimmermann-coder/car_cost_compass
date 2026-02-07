<script>
  import { formatCurrency } from "../lib/format.js";

  let { car, metrics, onEdit, onDuplicate, onDelete, onView, delay = 0 } = $props();

  const title = $derived(`${car.marke || ""} ${car.modell || ""}`.trim());
</script>

<div class="card card-animated" style={`animation-delay: ${delay}ms`}>
  <div class="card-title">{title || "Unbenannt"}</div>
  <div class="card-subtitle">{car.modellvariante || "-"}</div>
  <div class="kpi-row">
    <span class="kpi-label">TCO/Monat</span>
    <span>{formatCurrency(metrics?.tcoMonat ?? 0)}</span>
  </div>
  <div class="kpi-row">
    <span class="kpi-label">TCO/Jahr</span>
    <span>{formatCurrency(metrics?.tcoJahr ?? 0)}</span>
  </div>
  <div class="card-actions">
    <button class="button secondary" onclick={() => onEdit && onEdit(car)}>Bearbeiten</button>
    <button class="button ghost" onclick={() => onDuplicate && onDuplicate(car)}>Duplizieren</button>
    <button class="button ghost" onclick={() => onView && onView(car)}>Detail</button>
    <button class="button danger" onclick={() => onDelete && onDelete(car)}>Löschen</button>
  </div>
</div>


