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
  konfigurationslink: "",
  baujahr: "",
  kilometerstand: "",
  neu: "Neu",
  beschaffungsart: "Kauf",
  kaufpreis: "",
  rabatt: "",
  bafaFoerderung: "",
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
  includeDepreciation: true,
  comparisonCarIds: [],
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

const uiStorageKey = "car-cost-compass-ui-state";
const validViews = new Set(["garage", "settings", "detail", "comparison"]);
const validGarageModes = new Set(["cards", "table"]);
const maxComparisonCars = 4;

function persistUiState() {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      uiStorageKey,
      JSON.stringify({
        view: uiState.currentView,
        carId: uiState.selectedCarId,
        garageMode: uiState.garageMode,
        includeDepreciation: uiState.includeDepreciation,
        comparisonCarIds: uiState.comparisonCarIds
      })
    );
  } catch (error) {
    console.warn("Could not persist UI state.", error);
  }
}

function restoreUiState() {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    const stored = JSON.parse(localStorage.getItem(uiStorageKey) || "null");
    if (!stored || typeof stored !== "object") {
      return;
    }

    const storedView = stored.view === "overview" ? "garage" : stored.view;
    if (validViews.has(storedView)) {
      uiState.currentView = storedView;
    }
    if (stored.carId !== undefined) {
      uiState.selectedCarId = stored.carId;
    }
    if (validGarageModes.has(stored.garageMode)) {
      uiState.garageMode = stored.garageMode;
    }
    if (typeof stored.includeDepreciation === "boolean") {
      uiState.includeDepreciation = stored.includeDepreciation;
    }
    if (Array.isArray(stored.comparisonCarIds)) {
      uiState.comparisonCarIds = [...new Set(stored.comparisonCarIds)].slice(0, maxComparisonCars);
    }

    if (
      uiState.currentView === "detail" &&
      !appState.cars.some((car) => car.id === uiState.selectedCarId)
    ) {
      uiState.currentView = "garage";
      uiState.selectedCarId = null;
    }
  } catch (error) {
    console.warn("Could not restore UI state.", error);
  }
}

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
    persistUiState();
    pushHistory("garage");
    return;
  }
  uiState.currentView = view;
  persistUiState();
  pushHistory(view);
}

export function setComparisonCarIds(carIds) {
  const ids = Array.isArray(carIds) ? carIds : [];
  uiState.comparisonCarIds = [...new Set(ids.filter(Boolean))].slice(0, maxComparisonCars);
  persistUiState();
}

export function addComparisonCar(carId) {
  setComparisonCarIds([...uiState.comparisonCarIds, carId]);
}

export function removeComparisonCar(carId) {
  setComparisonCarIds(uiState.comparisonCarIds.filter((id) => id !== carId));
}

export function viewCarDetail(carId) {
  uiState.selectedCarId = carId;
  uiState.currentView = "detail";
  persistUiState();
  pushHistory("detail", carId);
}

export function setGarageMode(mode) {
  if (!validGarageModes.has(mode)) {
    return;
  }
  uiState.garageMode = mode;
  persistUiState();
}

export function setIncludeDepreciation(value) {
  uiState.includeDepreciation = Boolean(value);
  persistUiState();
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
  const validCarIds = new Set(normalized.cars.map((car) => car.id));
  uiState.comparisonCarIds = uiState.comparisonCarIds.filter((id) => validCarIds.has(id));
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
restoreUiState();

let handlingPopstate = false;

function applyHistoryState(state) {
  if (!state || typeof state !== "object") {
    return;
  }
  uiState.currentView = state.view || "garage";
  uiState.selectedCarId = state.carId ?? null;
  if (state.garageMode) {
    uiState.garageMode = state.garageMode;
  }
  if (Array.isArray(state.comparisonCarIds)) {
    uiState.comparisonCarIds = [...new Set(state.comparisonCarIds)].slice(0, maxComparisonCars);
  }
  if (uiState.currentView === "detail" && !uiState.selectedCarId) {
    uiState.currentView = "garage";
  }
  persistUiState();
}

function pushHistory(view, carId = null) {
  if (handlingPopstate || typeof history === "undefined") {
    return;
  }
  const state = {
    view,
    carId,
    garageMode: uiState.garageMode,
    includeDepreciation: uiState.includeDepreciation,
    comparisonCarIds: [...uiState.comparisonCarIds]
  };
  history.pushState(state, "", "");
}

function initHistory() {
  if (typeof window === "undefined" || typeof history === "undefined") {
    return;
  }
  const initialState = {
    view: uiState.currentView,
    carId: uiState.selectedCarId,
    garageMode: uiState.garageMode,
    comparisonCarIds: [...uiState.comparisonCarIds]
  };
  history.replaceState(initialState, "", "");
  window.addEventListener("popstate", (event) => {
    handlingPopstate = true;
    applyHistoryState(event.state);
    handlingPopstate = false;
  });
}

initHistory();

