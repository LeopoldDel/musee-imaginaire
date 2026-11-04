import { DEFAULT_LOCALE } from '#lib/config.ts';
import { fr, type MessageKey, type Messages } from './fr.ts';

export type { MessageKey } from './fr.ts';

const catalogs = {
  fr: fr as Messages
} as const;

export type Locale = keyof typeof catalogs;

let current: Locale = DEFAULT_LOCALE;

export function setLocale(locale: Locale): void {
  current = locale;
}

export function interpolate(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match
  );
}

/** Traduit une clé. Les clés sont typées : une faute de frappe ne compile pas. */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  return interpolate(catalogs[current][key], params);
}
