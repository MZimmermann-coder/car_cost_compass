const numberFormatters = new Map();

function getFormatter(options) {
  const key = JSON.stringify(options);
  if (!numberFormatters.has(key)) {
    numberFormatters.set(key, new Intl.NumberFormat("de-DE", options));
  }
  return numberFormatters.get(key);
}

export function formatNumber(value, fractionDigits = 0) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return getFormatter({
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);
}

export function formatCurrency(value, fractionDigits = 0) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return getFormatter({
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);
}

export function formatPercent(value, fractionDigits = 1) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return getFormatter({
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value) + " %";
}

export function formatServiceInterval(yearsValue, kilometersValue) {
  const years = Number(yearsValue);
  const kilometers = Number(kilometersValue);
  const parts = [];

  if (Number.isFinite(years) && years > 0) {
    const fractionDigits = Number.isInteger(years) ? 0 : 1;
    parts.push(`${formatNumber(years, fractionDigits)} ${years === 1 ? "Jahr" : "Jahre"}`);
  }

  if (Number.isFinite(kilometers) && kilometers > 0) {
    parts.push(`${formatNumber(kilometers)} km`);
  }

  return parts.length ? parts.join(" oder ") : "-";
}

