const STORAGE_KEY = 'gemini_api_key';

export const getGeminiKey = (): string => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? value.trim() : '';
  } catch {
    return '';
  }
};

export const setGeminiKey = (key: string): void => {
  try {
    const value = key.trim();
    if (!value) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Ignore storage failures (e.g., privacy mode)
  }
};

export const clearGeminiKey = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures
  }
};

export const hasGeminiKey = (): boolean => {
  return !!getGeminiKey();
};
