
import en from './en.ts';

const translations: Record<string, string> = en;

/**
 * A simple translation function for the English-only app.
 * @param key The key from the en.ts translation file.
 * @returns The translated string or the key itself if not found.
 */
export const t = (key: string): string => {
  return translations[key] || key;
};
