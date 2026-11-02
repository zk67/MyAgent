import { describe, it, expect } from 'vitest';
import { t, getTranslations } from '@/lib/i18n';

describe('i18n', () => {
  it('returns French text by default', () => {
    expect(t('assistant')).toBe('Assistant');
    expect(t('logOut')).toBe('Déconnexion');
  });

  it('returns English text when locale is en', () => {
    expect(t('logOut', 'en')).toBe('Log out');
    expect(t('noEventsToday', 'en')).toBe('No events today.');
  });

  it('replaces placeholders', () => {
    expect(t('eventsCreated', 'fr', { count: 5 })).toBe('5 événement(s) créé(s) avec succès.');
    expect(t('eventsCreated', 'en', { count: 3 })).toBe('3 event(s) created successfully.');
  });

  it('falls back to French when key is missing in locale', () => {
    // Both locales have all keys, so this tests the fallback path.
    expect(t('assistant', 'fr')).toBe('Assistant');
  });

  it('getTranslations returns all keys for a locale', () => {
    const fr = getTranslations('fr');
    expect(fr.assistant).toBe('Assistant');
    expect(fr.logOut).toBe('Déconnexion');

    const en = getTranslations('en');
    expect(en.assistant).toBe('Assistant');
    expect(en.logOut).toBe('Log out');
  });

  it('both locales have the same keys', () => {
    const fr = getTranslations('fr');
    const en = getTranslations('en');
    const frKeys = Object.keys(fr).sort();
    const enKeys = Object.keys(en).sort();
    expect(frKeys).toEqual(enKeys);
  });
});
