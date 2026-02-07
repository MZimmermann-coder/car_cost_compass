const defaultSettings = {
  kmPerYear: 10000,
  benzinpreis: 1.85,
  dieselpreis: 1.75,
  strompreis: 0.35,
  opportunitaet: 4,
  kostensteigerung: 3,
  planungshorizont: 5,
  depr: {
    age1: 30,
    age2_3: 15,
    age4_5: 10,
    age6_8: 7,
    age9_12: 5,
    age13p: 4
  }
};

const defaultCarFields = {
  marke: "",
  modell: "",
  modellvariante: "",
  baujahr: "",
  kilometerstand: "",
  neu: "Neu",
  beschaffungsart: "Kauf",
  kaufpreis: "",
  rabatt: "",
  steuerMehr: "",
  leasingrate: "",
  versicherungsart: "Vollkasko",
  sfklasse: "",
  versicherung: "",
  steuerMonat: "",
  wartung: "",
  reparatur: "",
  kraftstoffart: "Benzin",
  verbrauch: "",
  winterreichweite: "",
  batterie: "",
  ladeleistung: "",
  thg: "",
  kommentar: ""
};

function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  const random = Math.random().toString(16).slice(2);
  return `id-${Date.now()}-${random}`;
}

export function createEmptyCar() {
  return {
    id: createId(),
    ...structuredClone(defaultCarFields)
  };
}

export const appState = $state({
  version: 1,
  settings: structuredClone(defaultSettings),
  cars: []
});

export const uiState = $state({
  currentView: "garage",
  selectedCarId: null,
  fileHandle: null,
  dirty: false,
  garageMode: "cards",
  garageFilters: {
    searchTerm: "",
    fuel: "all",
    ownership: "all",
    batteryMin: "",
    batteryMax: "",
    winterMin: "",
    winterMax: ""
  }
});

export function markDirty() {
  uiState.dirty = true;
}

export function resetDirty() {
  uiState.dirty = false;
}

export function navigateTo(view) {
  if (view === "overview") {
    uiState.currentView = "garage";
    uiState.garageMode = "table";
    return;
  }
  uiState.currentView = view;
}

export function viewCarDetail(carId) {
  uiState.selectedCarId = carId;
  uiState.currentView = "detail";
}

export function normalizeState(raw) {
  const safe = raw && typeof raw === "object" ? raw : {};
  const rawSettings = safe.settings && typeof safe.settings === "object" ? safe.settings : {};
  const rawDepr = rawSettings.depr && typeof rawSettings.depr === "object" ? rawSettings.depr : {};

  const normalizedSettings = {
    ...structuredClone(defaultSettings),
    ...rawSettings,
    depr: {
      ...structuredClone(defaultSettings.depr),
      ...rawDepr
    }
  };

  const rawCars = Array.isArray(safe.cars) ? safe.cars : [];
  const normalizedCars = rawCars.map((car) => {
    const base = structuredClone(defaultCarFields);
    const safeCar = car && typeof car === "object" ? car : {};
    return {
      id: safeCar.id || createId(),
      ...base,
      ...safeCar
    };
  });

  return {
    version: 1,
    settings: normalizedSettings,
    cars: normalizedCars
  };
}

export function loadState(newState) {
  const normalized = normalizeState(newState);
  appState.version = normalized.version;
  appState.settings = normalized.settings;
  appState.cars = normalized.cars;
  uiState.dirty = false;
}

export function initializeFromStore() {
  if (typeof document === "undefined") {
    return;
  }

  const store = document.getElementById("data-store");
  if (!store) {
    return;
  }

  try {
    const raw = JSON.parse(store.textContent || "{}");
    loadState(raw);
  } catch (error) {
    console.error("Failed to parse data-store.", error);
  }
}

initializeFromStore();

