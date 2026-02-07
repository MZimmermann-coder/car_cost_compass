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

