export const CONSENT_KEY = "eb_storage_choice_v1";
export const SORT_KEY = "eb_menu_sort_v1";
export const CONSENT_LIFETIME = 180 * 24 * 60 * 60 * 1000;
const SORTS = ["featured", "price-low", "price-high", "name"];

export function readConsent(storage, now = Date.now()) {
  try {
    const store = storage || localStorage;
    const value = JSON.parse(store.getItem(CONSENT_KEY));
    if (!value || value.version !== 1 || typeof value.preferences !== "boolean" || !Number.isFinite(value.savedAt) || value.savedAt > now || now - value.savedAt >= CONSENT_LIFETIME) {
      store.removeItem(SORT_KEY);
      return null;
    }
    return value;
  } catch { return null; }
}

export function saveConsent(preferences, storage, now = Date.now()) {
  const choice = { version: 1, preferences: preferences === true, savedAt: now };
  try {
    const store = storage || localStorage;
    if (!choice.preferences) store.removeItem(SORT_KEY);
    store.setItem(CONSENT_KEY, JSON.stringify(choice));
  } catch { /* The React provider keeps the choice for this visit. */ }
  return choice;
}

export function readMenuSort(choice, storage, now = Date.now()) {
  if (!choice?.preferences || now - choice.savedAt >= CONSENT_LIFETIME) return null;
  try {
    const value = (storage || localStorage).getItem(SORT_KEY);
    return SORTS.includes(value) ? value : null;
  } catch { return null; }
}

export function saveMenuSort(sort, choice, storage, now = Date.now()) {
  if (!choice?.preferences || now - choice.savedAt >= CONSENT_LIFETIME || !SORTS.includes(sort)) return;
  try { (storage || localStorage).setItem(SORT_KEY, sort); }
  catch { /* Sorting still works without persistent storage. */ }
}
