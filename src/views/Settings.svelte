<script>
  import { appState, markDirty } from "../lib/state.svelte.js";

  function handleInput() {
    markDirty();
  }
</script>

<div class="section-title settings-title">
  <div>
    <h1>Einstellungen</h1>
    <p>Globale Annahmen für Preise, Kostenentwicklung und Wertverlust.</p>
  </div>
</div>

<div class="settings-grid">
  <section class="card settings-card">
    <div class="settings-card-header">
      <div>
        <h3>Kraftstoffpreise</h3>
        <p class="settings-caption">Preise pro Einheit für die Verbrauchsrechnung.</p>
      </div>
    </div>
    <div class="form-grid settings-form-grid">
      <div class="form-field">
        <label for="settings-benzinpreis">Benzinpreis</label>
        <input
          id="settings-benzinpreis"
          bind:value={appState.settings.benzinpreis}
          inputmode="decimal"
          oninput={handleInput}
        />
        <div class="hint unit-hint">€/L</div>
      </div>
      <div class="form-field">
        <label for="settings-dieselpreis">Dieselpreis</label>
        <input
          id="settings-dieselpreis"
          bind:value={appState.settings.dieselpreis}
          inputmode="decimal"
          oninput={handleInput}
        />
        <div class="hint unit-hint">€/L</div>
      </div>
      <div class="form-field">
        <label for="settings-strompreis">Strompreis</label>
        <input
          id="settings-strompreis"
          bind:value={appState.settings.strompreis}
          inputmode="decimal"
          oninput={handleInput}
        />
        <div class="hint unit-hint">€/kWh</div>
      </div>
    </div>
  </section>

  <section class="card settings-card">
    <div class="settings-card-header">
      <div>
        <h3>Kostenparameter</h3>
        <p class="settings-caption">Rahmenwerte für die jährlichen Kosten.</p>
      </div>
    </div>
    <div class="form-grid settings-form-grid">
      <div class="form-field">
        <label for="settings-km-per-year">Jährliche Kilometer</label>
        <input
          id="settings-km-per-year"
          bind:value={appState.settings.kmPerYear}
          inputmode="numeric"
          oninput={handleInput}
        />
        <div class="hint unit-hint">km</div>
      </div>
      <div class="form-field">
        <label for="settings-opportunitaet">Opportunitätskosten</label>
        <input
          id="settings-opportunitaet"
          bind:value={appState.settings.opportunitaet}
          inputmode="decimal"
          oninput={handleInput}
        />
        <div class="hint unit-hint">%</div>
      </div>
      <div class="form-field">
        <label for="settings-kostensteigerung">Kostensteigerung</label>
        <input
          id="settings-kostensteigerung"
          bind:value={appState.settings.kostensteigerung}
          inputmode="decimal"
          oninput={handleInput}
        />
        <div class="hint unit-hint">%</div>
      </div>
    </div>
  </section>

  <section class="card settings-card">
    <div class="settings-card-header">
      <div>
        <h3>Planungshorizont</h3>
        <p class="settings-caption">Zeitraum für die Berechnung der Gesamtkosten.</p>
      </div>
    </div>
    <div class="form-grid settings-form-grid">
      <div class="form-field">
        <label for="settings-planungshorizont">Horizont</label>
        <input
          id="settings-planungshorizont"
          type="number"
          min="1"
          step="1"
          bind:value={appState.settings.planungshorizont}
          inputmode="numeric"
          oninput={handleInput}
        />
        <div class="hint unit-hint">Jahre</div>
      </div>
    </div>
  </section>

  <section class="card settings-card settings-card-accent">
    <div class="settings-card-header">
      <div>
        <h3>Wertverlust</h3>
        <p class="settings-caption">Prozentualer Wertverlust je Altersbereich.</p>
      </div>
    </div>
    <div class="form-grid settings-form-grid">
      <div class="form-field">
        <label for="settings-depr-age1">1. Jahr</label>
        <input
          id="settings-depr-age1"
          bind:value={appState.settings.depr.age1}
          inputmode="decimal"
          oninput={handleInput}
        />
        <div class="hint unit-hint">%</div>
      </div>
      <div class="form-field">
        <label for="settings-depr-age2-3">2.-3. Jahr</label>
        <input
          id="settings-depr-age2-3"
          bind:value={appState.settings.depr.age2_3}
          inputmode="decimal"
          oninput={handleInput}
        />
        <div class="hint unit-hint">%</div>
      </div>
      <div class="form-field">
        <label for="settings-depr-age4-5">4.-5. Jahr</label>
        <input
          id="settings-depr-age4-5"
          bind:value={appState.settings.depr.age4_5}
          inputmode="decimal"
          oninput={handleInput}
        />
        <div class="hint unit-hint">%</div>
      </div>
      <div class="form-field">
        <label for="settings-depr-age6-8">6.-8. Jahr</label>
        <input
          id="settings-depr-age6-8"
          bind:value={appState.settings.depr.age6_8}
          inputmode="decimal"
          oninput={handleInput}
        />
        <div class="hint unit-hint">%</div>
      </div>
      <div class="form-field">
        <label for="settings-depr-age9-12">9.-12. Jahr</label>
        <input
          id="settings-depr-age9-12"
          bind:value={appState.settings.depr.age9_12}
          inputmode="decimal"
          oninput={handleInput}
        />
        <div class="hint unit-hint">%</div>
      </div>
      <div class="form-field">
        <label for="settings-depr-age13p">ab 13. Jahr</label>
        <input
          id="settings-depr-age13p"
          bind:value={appState.settings.depr.age13p}
          inputmode="decimal"
          oninput={handleInput}
        />
        <div class="hint unit-hint">%</div>
      </div>
    </div>
  </section>
</div>
