<script>
  import { appState, createEmptyCar, markDirty } from "../lib/state.svelte.js";

  let { car, onClose } = $props();

  const draft = $state(createEmptyCar());

  $effect(() => {
    const base = car ? structuredClone(car) : createEmptyCar();
    Object.assign(draft, base);
  });

  const isEdit = $derived(Boolean(car));
  const isLease = $derived(draft.beschaffungsart === "Leasing");
  const isPurchase = $derived(draft.beschaffungsart === "Kauf");
  const isNew = $derived(draft.neu === "Neu");
  const isElectric = $derived(draft.kraftstoffart === "Elektro");
  const consumptionUnit = $derived(isElectric ? "kWh/100km" : "L/100km");

  function handleSave() {
    const cleaned = structuredClone(draft);

    if (isLease) {
      cleaned.kaufpreis = "0";
      cleaned.rabatt = "0";
      cleaned.steuerMehr = "0";
    }

    if (isPurchase) {
      cleaned.leasingrate = "0";
    }

    if (!isNew) {
      cleaned.rabatt = "0";
      cleaned.steuerMehr = "0";
    }

    if (!isElectric) {
      cleaned.batterie = "0";
      cleaned.ladeleistung = "0";
      cleaned.thg = "0";
      cleaned.winterreichweite = "0";
    }

    if (isEdit && car) {
      const index = appState.cars.findIndex((item) => item.id === car.id);
      if (index !== -1) {
        appState.cars[index] = { ...appState.cars[index], ...cleaned, id: car.id };
      }
    } else {
      const newId = cleaned.id || createEmptyCar().id;
      appState.cars = [...appState.cars, { ...cleaned, id: newId }];
    }

    markDirty();
    if (onClose) {
      onClose();
    }
  }
</script>

<button
  type="button"
  class="editor-backdrop"
  onclick={() => onClose && onClose()}
  aria-label="Editor schließen"
></button>
<section class="editor-panel">
  <div class="editor-header">
    <h2>{isEdit ? "Fahrzeug bearbeiten" : "Fahrzeug hinzufügen"}</h2>
    <button class="button ghost" onclick={() => onClose && onClose()}>Schließen</button>
  </div>
  <div class="editor-body">
    <div class="card">
      <h3>Basisdaten</h3>
      <div class="form-grid">
        <div class="form-field">
          <label for="car-marke">Marke</label>
          <input id="car-marke" bind:value={draft.marke} placeholder="z.B. VW" />
        </div>
        <div class="form-field">
          <label for="car-modell">Modell</label>
          <input id="car-modell" bind:value={draft.modell} placeholder="z.B. Golf" />
        </div>
        <div class="form-field">
          <label for="car-modellvariante">Modellvariante</label>
          <input id="car-modellvariante" bind:value={draft.modellvariante} />
        </div>
        <div class="form-field">
          <label for="car-baujahr">Baujahr</label>
          <input id="car-baujahr" bind:value={draft.baujahr} inputmode="numeric" placeholder="2020" />
        </div>
        <div class="form-field">
          <label for="car-kilometerstand">Kilometerstand</label>
          <input
            id="car-kilometerstand"
            bind:value={draft.kilometerstand}
            inputmode="numeric"
            placeholder="50000"
          />
          <div class="hint">km</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>Besitz</h3>
      <div class="form-grid">
        <div class="form-field">
          <label for="car-neu">Neu/Gebraucht</label>
          <select id="car-neu" bind:value={draft.neu}>
            <option>Neu</option>
            <option>Gebraucht</option>
          </select>
        </div>
        <div class="form-field">
          <label for="car-beschaffungsart">Beschaffungsart</label>
          <select id="car-beschaffungsart" bind:value={draft.beschaffungsart}>
            <option>Kauf</option>
            <option>Leasing</option>
          </select>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>Kosten</h3>
      <div class="form-grid">
        <div class="form-field">
          <label for="car-kaufpreis">Kaufpreis</label>
          <input id="car-kaufpreis" bind:value={draft.kaufpreis} inputmode="decimal" disabled={isLease} />
          <div class="hint">€</div>
        </div>
        <div class="form-field">
          <label for="car-rabatt">Rabatt</label>
          <input id="car-rabatt" bind:value={draft.rabatt} inputmode="decimal" disabled={isLease || !isNew} />
          <div class="hint">€</div>
        </div>
        <div class="form-field">
          <label for="car-steuer-mehr">Steuerliche Mehrbelastung</label>
          <input
            id="car-steuer-mehr"
            bind:value={draft.steuerMehr}
            inputmode="decimal"
            disabled={isLease || !isNew}
          />
          <div class="hint">€</div>
        </div>
        <div class="form-field">
          <label for="car-leasingrate">Leasingrate</label>
          <input
            id="car-leasingrate"
            bind:value={draft.leasingrate}
            inputmode="decimal"
            disabled={isPurchase}
          />
          <div class="hint">€/Monat</div>
        </div>
        <div class="form-field">
          <label for="car-versicherungsart">Versicherungsart</label>
          <select id="car-versicherungsart" bind:value={draft.versicherungsart}>
            <option>Vollkasko</option>
            <option>Teilkasko</option>
            <option>Haftpflicht</option>
          </select>
        </div>
        <div class="form-field">
          <label for="car-sfklasse">SF-Klasse</label>
          <input id="car-sfklasse" bind:value={draft.sfklasse} />
        </div>
        <div class="form-field">
          <label for="car-versicherung">Versicherung</label>
          <input id="car-versicherung" bind:value={draft.versicherung} inputmode="decimal" />
          <div class="hint">€/Monat</div>
        </div>
        <div class="form-field">
          <label for="car-steuer-monat">Steuer</label>
          <input id="car-steuer-monat" bind:value={draft.steuerMonat} inputmode="decimal" />
          <div class="hint">€/Monat</div>
        </div>
        <div class="form-field">
          <label for="car-wartung">Wartung</label>
          <input id="car-wartung" bind:value={draft.wartung} inputmode="decimal" />
          <div class="hint">€/Monat</div>
        </div>
        <div class="form-field">
          <label for="car-reparatur">Reparatur</label>
          <input id="car-reparatur" bind:value={draft.reparatur} inputmode="decimal" />
          <div class="hint">€/Monat</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>E-Mobilität</h3>
      <div class="form-grid">
        <div class="form-field">
          <label for="car-kraftstoffart">Kraftstoffart</label>
          <select id="car-kraftstoffart" bind:value={draft.kraftstoffart}>
            <option>Benzin</option>
            <option>Diesel</option>
            <option>Elektro</option>
          </select>
        </div>
        <div class="form-field">
          <label for="car-verbrauch">Verbrauch</label>
          <input id="car-verbrauch" bind:value={draft.verbrauch} inputmode="decimal" />
          <div class="hint">{consumptionUnit}</div>
        </div>
        <div class="form-field">
          <label for="car-winterreichweite">Winterreichweite</label>
          <input
            id="car-winterreichweite"
            bind:value={draft.winterreichweite}
            inputmode="decimal"
            disabled={!isElectric}
          />
          <div class="hint">km</div>
        </div>
        <div class="form-field">
          <label for="car-batterie">Nettobatterie</label>
          <input id="car-batterie" bind:value={draft.batterie} inputmode="decimal" disabled={!isElectric} />
          <div class="hint">kWh</div>
        </div>
        <div class="form-field">
          <label for="car-ladeleistung">Ladeleistung</label>
          <input
            id="car-ladeleistung"
            bind:value={draft.ladeleistung}
            inputmode="decimal"
            disabled={!isElectric}
          />
          <div class="hint">kW</div>
        </div>
        <div class="form-field">
          <label for="car-thg">THG-Quote</label>
          <input id="car-thg" bind:value={draft.thg} inputmode="decimal" disabled={!isElectric} />
          <div class="hint">€/Jahr</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>Notizen</h3>
      <div class="form-field">
        <label for="car-kommentar">Kommentar</label>
        <textarea id="car-kommentar" rows="3" bind:value={draft.kommentar}></textarea>
      </div>
    </div>
  </div>
  <div class="editor-footer">
    <button class="button secondary" onclick={() => onClose && onClose()}>Abbrechen</button>
    <button class="button" onclick={handleSave}>Speichern</button>
  </div>
</section>


