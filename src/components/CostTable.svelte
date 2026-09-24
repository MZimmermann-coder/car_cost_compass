<script>
  import { formatCurrency, formatNumber } from "../lib/format.js";
  import { getBafaAmount, getPurchasePriceAfterDiscount, num } from "../lib/compute.js";

  let {
    rows = [],
    car = null,
    settings = null,
    includeDepreciation = true,
    highlightYear = null,
    onHoverYear
  } = $props();

  let tooltip = $state({
    text: "",
    x: 0,
    y: 0,
    visible: false
  });

  const showEstimatedRestwert = $derived(
    rows.some((row) => row.usesCustomFiveYearResidualValue)
  );

  function getDepreciationRate(age, settingsValue) {
    const depr = settingsValue?.depr || {};
    if (age <= 1) return num(depr.age1);
    if (age <= 3) return num(depr.age2_3);
    if (age <= 5) return num(depr.age4_5);
    if (age <= 8) return num(depr.age6_8);
    if (age <= 12) return num(depr.age9_12);
    return num(depr.age13p);
  }

  function getFuelPrice(kraftstoffart, settingsValue) {
    if (kraftstoffart === "Diesel") return num(settingsValue?.dieselpreis);
    if (kraftstoffart === "Elektro") return num(settingsValue?.strompreis);
    return num(settingsValue?.benzinpreis);
  }

  function computeAge(baujahr, yearIndex) {
    const currentYear = new Date().getFullYear();
    const buildYear = num(baujahr) || currentYear;
    return currentYear - buildYear + yearIndex;
  }

  function buildTooltip(lines) {
    return lines.filter(Boolean).join("\n");
  }

  function formatCompactNumber(value, fractionDigits = 2) {
    const numeric = num(value);
    if (!Number.isFinite(numeric)) {
      return "-";
    }
    const decimals = Math.abs(numeric % 1) < 0.001 ? 0 : fractionDigits;
    return formatNumber(numeric, decimals);
  }

  function buildRowTooltips(row, index) {
    if (!car || !settings) {
      return {};
    }

    const isPurchase = car.beschaffungsart === "Kauf";
    const isLease = car.beschaffungsart === "Leasing";
    const isNew = car.neu === "Neu";
    const isElectric = car.kraftstoffart === "Elektro";

    const listPrice = num(car.kaufpreis);
    const purchasePrice = getPurchasePriceAfterDiscount(car);
    const appliedDiscount = Math.max(0, listPrice - purchasePrice);
    const bafaAmount = getBafaAmount(car, settings);
    const fundedPurchasePrice = Math.max(0, purchasePrice - bafaAmount);
    const oppRate = num(settings.opportunitaet) / 100;
    const yearlyKm = num(settings.kmPerYear);
    const maintenanceBase = (num(car.wartung) + num(car.reparatur)) * 12;
    const maintenanceFactor = Math.pow(1 + num(settings.kostensteigerung) / 100, row.year - 1);
    const fuelPrice = getFuelPrice(car.kraftstoffart, settings);
    const fuelUnit = car.kraftstoffart === "Elektro" ? "€/kWh" : "€/L";

    const age = computeAge(car.baujahr, row.year);
    const rate = getDepreciationRate(age, settings);
    const prevRestwert = rows[index - 1]?.restwert ?? listPrice;
    const baseValue = row.year === 1 ? listPrice : prevRestwert;
    const appliedDepreciation = baseValue - row.restwert;
    const estimatedDepreciation = row.estimatedDepreciation ?? appliedDepreciation;
    const usesCustomFiveYearResidualValue = Boolean(row.usesCustomFiveYearResidualValue);

    const listenpreisTip = isPurchase
      ? buildTooltip([
          "Listenpreis (Information, nur im Jahr 1)",
          `${formatCurrency(listPrice)}; Kaufpreis nach Rabatt ${formatCurrency(purchasePrice)} wird separat berücksichtigt`
        ])
      : buildTooltip(["Kein Listenpreis bei Leasing", "0 €"]);

    const rabattTip = isPurchase && row.year === 1 && includeDepreciation
      ? buildTooltip([
          `Listenpreis ${formatCurrency(listPrice)} - Kaufpreis ${formatCurrency(purchasePrice)}`,
          `-${formatCurrency(appliedDiscount)} als Korrektur des Wertverlusts`
        ])
      : buildTooltip([
          includeDepreciation
            ? "Kein Rabattabzug in diesem Jahr"
            : "Rabatt wird zusammen mit dem Wertverlust nicht im TCO berücksichtigt",
          "0 €"
        ]);

    const steuerMehrTip = isPurchase && isNew
      ? buildTooltip([
          "Steuerliche Mehrbelastung (nur im Jahr 1 bei Neuwagen)",
          formatCurrency(num(car.steuerMehr))
        ])
      : buildTooltip(["Keine steuerliche Mehrbelastung", "0 €"]);

    const bafaFoerderungTip = bafaAmount > 0 && includeDepreciation
      ? buildTooltip([
          "BAFA-Förderung (Abzug nur im Jahr 1 bei neuen Elektrofahrzeugen)",
          formatCurrency(-bafaAmount)
        ])
      : buildTooltip([
          !includeDepreciation && bafaAmount > 0
            ? "BAFA-Förderung wird zusammen mit dem Wertverlust nicht im TCO berücksichtigt"
            : "Keine BAFA-Förderung",
          "0 €"
        ]);

    const leasingTip = isLease
      ? buildTooltip([
          `Leasingrate ${formatCurrency(num(car.leasingrate))} / Monat x 12`,
          formatCurrency(row.leasing)
        ])
      : buildTooltip(["Kein Leasing", "0 €"]);

    const versicherungTip = buildTooltip([
      `(${formatCurrency(num(car.versicherung))} + ${formatCurrency(num(car.steuerMonat))}) x 12`,
      formatCurrency(row.versicherungSteuer)
    ]);

    const wartungTip = buildTooltip([
      `(${formatCurrency(num(car.wartung))} + ${formatCurrency(num(car.reparatur))}) x 12 = ${formatCurrency(maintenanceBase)}`,
      `Kostensteigerung ${formatNumber(num(settings.kostensteigerung))}% -> x ${maintenanceFactor.toFixed(2)}`,
      formatCurrency(row.wartungReparatur)
    ]);

    const kraftstoffTip = buildTooltip([
      `(${formatNumber(yearlyKm)} km / 100) x ${formatCompactNumber(car.verbrauch)} x ${formatCurrency(fuelPrice, 2)} ${fuelUnit}`,
      formatCurrency(row.kraftstoff)
    ]);

    const thgTip = isElectric
      ? buildTooltip([`THG-Quote: -${formatCurrency(num(settings.thg))} pro Jahr`, formatCurrency(row.thg)])
      : buildTooltip(["Keine THG-Quote", "0 €"]);

    const wertverlustTip = isPurchase && includeDepreciation
      ? buildTooltip([
          usesCustomFiveYearResidualValue
            ? `Basisschätzung ${formatCurrency(estimatedDepreciation)} x Kalibrierungsfaktor ${formatCompactNumber(row.depreciationCalibrationFactor, 3)}`
            : `Basiswert ${formatCurrency(baseValue)} x ${formatNumber(rate)}%`,
          usesCustomFiveYearResidualValue
            ? `Kalibriert auf ${formatCurrency(num(car.restwertNach5Jahren))} Restwert nach 5 Jahren`
            : "",
          formatCurrency(row.wertverlust)
        ])
      : buildTooltip([
          isPurchase
            ? `${usesCustomFiveYearResidualValue ? "Kalibrierter" : "Geschätzter"} Wertverlust ${formatCurrency(appliedDepreciation)} wird nicht im TCO berücksichtigt`
            : "Kein Wertverlust bei Leasing",
          "0 €"
        ]);

    const opportunitaetTip = isPurchase
      ? buildTooltip([
          `Kaufpreis nach Rabatt abzüglich BAFA ${formatCurrency(fundedPurchasePrice)} x ${(1 + oppRate).toFixed(2)} ^ ${row.year - 1} x ${formatNumber(oppRate * 100)}%`,
          formatCurrency(row.opportunitaet)
        ])
      : buildTooltip(["Keine Opportunitätskosten bei Leasing", "0 €"]);

    const totalTip = buildTooltip([
      "Wirtschaftliche Jahreskosten (Kaufpreis ist nur Information):",
      `${formatCurrency(row.rabatt)} + ${formatCurrency(row.bafaFoerderung)} + ${formatCurrency(row.steuerMehr)} + ${formatCurrency(row.leasing)} + ${formatCurrency(row.versicherungSteuer)} + ${formatCurrency(row.wartungReparatur)} + ${formatCurrency(row.kraftstoff)} + ${formatCurrency(row.thg)} + ${formatCurrency(row.wertverlust)} + ${formatCurrency(row.opportunitaet)}`,
      formatCurrency(row.total)
    ]);

    const prevCumulative = rows[index - 1]?.cumulative ?? 0;
    const cumulativeTip = buildTooltip([
      `Vorjahr kumuliert ${formatCurrency(prevCumulative)} + Jahreskosten ${formatCurrency(row.total)}`,
      formatCurrency(row.cumulative)
    ]);

    const restwertTip = isPurchase
      ? buildTooltip([
          usesCustomFiveYearResidualValue
            ? `Vorjahreswert ${formatCurrency(baseValue)} - kalibrierter Wertverlust ${formatCurrency(appliedDepreciation)}`
            : `Basiswert ${formatCurrency(baseValue)} - geschätzter Wertverlust ${formatCurrency(appliedDepreciation)}`,
          usesCustomFiveYearResidualValue
            ? `Kurve endet nach 5 Jahren bei ${formatCurrency(num(car.restwertNach5Jahren))}`
            : "",
          formatCurrency(row.restwert)
        ])
      : buildTooltip(["Kein Restwert bei Leasing", "0 €"]);

    const estimatedRestwertTip = isPurchase
      ? buildTooltip([
          "Unsere unveränderte Schätzung aus den prozentualen Altersstaffeln",
          `Ohne Kalibrierung auf den eingegebenen 5-Jahres-Restwert: ${formatCurrency(row.estimatedRestwert)}`
        ])
      : buildTooltip(["Keine Restwertschätzung bei Leasing", "0 €"]);

    return {
      listenpreis: listenpreisTip,
      rabatt: rabattTip,
      bafaFoerderung: bafaFoerderungTip,
      steuerMehr: steuerMehrTip,
      leasing: leasingTip,
      versicherungSteuer: versicherungTip,
      wartungReparatur: wartungTip,
      kraftstoff: kraftstoffTip,
      thg: thgTip,
      wertverlust: wertverlustTip,
      opportunitaet: opportunitaetTip,
      total: totalTip,
      cumulative: cumulativeTip,
      restwert: restwertTip,
      estimatedRestwert: estimatedRestwertTip
    };
  }

  function updateTooltip(event) {
    const target = event?.target?.closest?.(".has-tooltip");
    if (!target) {
      tooltip.visible = false;
      return;
    }
    const text = target.dataset.tooltip;
    if (!text) {
      tooltip.visible = false;
      return;
    }
    const rect = target.getBoundingClientRect();
    const padding = 12;
    const maxWidth = 320;
    const maxLeft = typeof window !== "undefined" ? window.innerWidth - maxWidth - padding : rect.left;
    const left = Math.max(padding, Math.min(rect.left, maxLeft));

    tooltip.text = text;
    tooltip.x = left;
    tooltip.y = rect.top;
    tooltip.visible = true;
  }

  function clearTooltip() {
    tooltip.visible = false;
  }
</script>

<div
  class="table-wrap"
  role="region"
  aria-label="Kostenübersicht"
  onmousemove={updateTooltip}
  onmouseleave={clearTooltip}
  onwheel={clearTooltip}
>
  <table>
    <thead>
      <tr>
        <th>Jahr</th>
        <th>Listenpreis</th>
        <th>Rabatt</th>
        <th>BAFA Förderung</th>
        <th>Steuerliche Mehrbelastung</th>
        <th>Leasing</th>
        <th>Versicherung/Steuer</th>
        <th>Wartung/Reparatur</th>
        <th>Kraftstoff</th>
        <th>THG-Quote</th>
        <th>Wertverlust</th>
        <th>Opportunität</th>
        <th>Jahreskosten (TCO)</th>
        <th>TCO kumuliert</th>
        <th>{showEstimatedRestwert ? "Restwert (kalibriert)" : "Restwert"}</th>
        {#if showEstimatedRestwert}
          <th>Restwert (eigene Schätzung)</th>
        {/if}
      </tr>
    </thead>
    <tbody>
      {#each rows as row, index}
        {@const tips = buildRowTooltips(row, index)}
        <tr
          class:row-highlight={highlightYear === row.year}
          onmouseenter={() => onHoverYear && onHoverYear(row.year)}
          onmouseleave={() => onHoverYear && onHoverYear(null)}
        >
          <td>{row.year}</td>
          <td class="has-tooltip" data-tooltip={tips.listenpreis}>{formatCurrency(row.listenpreis)}</td>
          <td class="has-tooltip" data-tooltip={tips.rabatt}>{formatCurrency(row.rabatt)}</td>
          <td class="has-tooltip" data-tooltip={tips.bafaFoerderung}>{formatCurrency(row.bafaFoerderung)}</td>
          <td class="has-tooltip" data-tooltip={tips.steuerMehr}>{formatCurrency(row.steuerMehr)}</td>
          <td class="has-tooltip" data-tooltip={tips.leasing}>{formatCurrency(row.leasing)}</td>
          <td class="has-tooltip" data-tooltip={tips.versicherungSteuer}>{formatCurrency(row.versicherungSteuer)}</td>
          <td class="has-tooltip" data-tooltip={tips.wartungReparatur}>{formatCurrency(row.wartungReparatur)}</td>
          <td class="has-tooltip" data-tooltip={tips.kraftstoff}>{formatCurrency(row.kraftstoff)}</td>
          <td class="has-tooltip" data-tooltip={tips.thg}>{formatCurrency(row.thg)}</td>
          <td class="has-tooltip" data-tooltip={tips.wertverlust}>{formatCurrency(row.wertverlust)}</td>
          <td class="has-tooltip" data-tooltip={tips.opportunitaet}>{formatCurrency(row.opportunitaet)}</td>
          <td class="has-tooltip" data-tooltip={tips.total}>{formatCurrency(row.total)}</td>
          <td class="has-tooltip" data-tooltip={tips.cumulative}>{formatCurrency(row.cumulative)}</td>
          <td class="has-tooltip" data-tooltip={tips.restwert}>{formatCurrency(row.restwert)}</td>
          {#if showEstimatedRestwert}
            <td class="has-tooltip" data-tooltip={tips.estimatedRestwert}>
              {formatCurrency(row.estimatedRestwert)}
            </td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
  {#if tooltip.visible}
    <div
      class="floating-tooltip"
      style={`--tooltip-x: ${tooltip.x}px; --tooltip-y: ${tooltip.y}px`}
    >
      {tooltip.text}
    </div>
  {/if}
</div>
