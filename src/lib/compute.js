export function num(value) {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  let text = String(value).trim();
  if (!text) {
    return 0;
  }

  if (text.includes(",") && text.includes(".")) {
    text = text.replace(/\./g, "").replace(",", ".");
  } else {
    text = text.replace(",", ".");
  }

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDepreciationRate(age, settings) {
  const depr = settings.depr || {};
  if (age <= 1) return num(depr.age1);
  if (age <= 3) return num(depr.age2_3);
  if (age <= 5) return num(depr.age4_5);
  if (age <= 8) return num(depr.age6_8);
  if (age <= 12) return num(depr.age9_12);
  return num(depr.age13p);
}

function getFuelPrice(kraftstoffart, settings) {
  if (kraftstoffart === "Diesel") return num(settings.dieselpreis);
  if (kraftstoffart === "Elektro") return num(settings.strompreis);
  return num(settings.benzinpreis);
}

function computeAge(baujahr, yearIndex) {
  const currentYear = new Date().getFullYear();
  const buildYear = num(baujahr) || currentYear;
  return currentYear - buildYear + yearIndex;
}

export function computeYearlyBreakdown(car, settings) {
  const years = Math.max(0, Math.round(num(settings.planungshorizont)));
  const results = [];
  let cumulative = 0;
  let previousRest = 0;

  const isPurchase = car.beschaffungsart === "Kauf";
  const isLease = car.beschaffungsart === "Leasing";
  const isNew = car.neu === "Neu";
  const isElectric = car.kraftstoffart === "Elektro";

  const purchasePrice = num(car.kaufpreis);
  const listPrice = purchasePrice + (isPurchase && isNew ? num(car.rabatt) : 0);
  const oppRate = num(settings.opportunitaet) / 100;
  const yearlyKm = num(settings.kmPerYear);

  for (let year = 1; year <= years; year += 1) {
    const age = computeAge(car.baujahr, year);
    const rate = getDepreciationRate(age, settings);
    let restwert = 0;
    let wertverlust = 0;

    if (isPurchase) {
      const base = year === 1 ? listPrice : previousRest;
      wertverlust = base * (rate / 100);
      restwert = base - wertverlust;
      previousRest = restwert;
    }

    const kaufpreis = isPurchase && year === 1 ? purchasePrice : 0;
    const steuerMehr = isPurchase && isNew && year === 1 ? num(car.steuerMehr) : 0;
    const leasing = isLease ? num(car.leasingrate) * 12 : 0;
    const versicherungSteuer = (num(car.versicherung) + num(car.steuerMonat)) * 12;

    const maintenanceBase = (num(car.wartung) + num(car.reparatur)) * 12;
    const wartungReparatur = maintenanceBase * Math.pow(1 + num(settings.kostensteigerung) / 100, year - 1);

    const fuelPrice = getFuelPrice(car.kraftstoffart, settings);
    const kraftstoff = (yearlyKm / 100) * num(car.verbrauch) * fuelPrice;

    const thg = isElectric ? -num(car.thg) : 0;
    const opportunitaet = isPurchase ? purchasePrice * Math.pow(1 + oppRate, year - 1) * oppRate : 0;

    const total =
      kaufpreis +
      steuerMehr +
      leasing +
      versicherungSteuer +
      wartungReparatur +
      kraftstoff +
      thg +
      wertverlust +
      opportunitaet;

    cumulative += total;

    results.push({
      year,
      kaufpreis,
      steuerMehr,
      leasing,
      versicherungSteuer,
      wartungReparatur,
      kraftstoff,
      thg,
      wertverlust,
      opportunitaet,
      total,
      cumulative,
      restwert
    });
  }

  return results;
}

export function computeOverviewMetrics(car, settings) {
  const breakdown = computeYearlyBreakdown(car, settings);
  const years = Math.max(0, Math.round(num(settings.planungshorizont)));
  const total = breakdown.length ? breakdown[breakdown.length - 1].cumulative : 0;
  const purchasePrice = car.beschaffungsart === "Kauf" ? num(car.kaufpreis) : 0;
  const tcoTotal = total - purchasePrice;
  const restwert = breakdown.length ? breakdown[breakdown.length - 1].restwert : 0;
  const totalKm = years > 0 ? num(settings.kmPerYear) * years : 0;

  return {
    tcoMonat: years > 0 ? tcoTotal / (years * 12) : 0,
    tcoJahr: years > 0 ? tcoTotal / years : 0,
    tcoKm: totalKm > 0 ? tcoTotal / totalKm : 0,
    tcoTotal,
    restwert
  };
}

export function computeRankings(cars, settings) {
  const scores = cars.map((car) => {
    const metrics = computeOverviewMetrics(car, settings);
    return { carId: car.id, tco: metrics.tcoTotal };
  });

  scores.sort((a, b) => a.tco - b.tco);

  const results = [];
  let lastValue = null;
  let rank = 0;

  for (const item of scores) {
    if (lastValue === null || item.tco !== lastValue) {
      rank += 1;
      lastValue = item.tco;
    }
    results.push({ carId: item.carId, rank });
  }

  return results;
}

