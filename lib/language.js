export const LANGUAGE_KEY = 'tdq_language';

export function normalizeLanguage(value) {
  return value === 'vi' ? 'vi' : 'en';
}

export function readStoredLanguage() {
  try {
    return normalizeLanguage(localStorage.getItem(LANGUAGE_KEY));
  } catch {
    return 'en';
  }
}

export function storeLanguage(value) {
  const language = normalizeLanguage(value);
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // Ignore private-mode storage failures.
  }
  return language;
}
