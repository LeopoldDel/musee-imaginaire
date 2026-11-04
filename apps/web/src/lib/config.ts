/**
 * Réglages de l'application.
 * Le nom affiché est PROVISOIRE : il ne doit apparaître nulle part en dur,
 * toujours via cette constante (ou la clé i18n qui l'interpole).
 */
export const APP_NAME = 'Musée imaginaire';
export const DEFAULT_LOCALE = 'fr' as const;
export const THEMES = ['musee', 'nuit'] as const;
export type Theme = (typeof THEMES)[number];
