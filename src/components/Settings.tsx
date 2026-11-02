'use client';

import { useState } from 'react';
import '@/styles/settings.css';
import { t, type Locale } from '@/lib/i18n';

type SettingsProps = {
  hidden?: boolean;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onDeleteAccount: () => void;
};

export function Settings({ hidden, locale, onLocaleChange, onDeleteAccount }: SettingsProps) {
  const [timezone, setTimezone] = useState('America/Montreal');
  const [defaultReminder, setDefaultReminder] = useState(30);
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locale);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timezone,
          defaultReminder,
          locale: selectedLocale,
        }),
      });

      if (response.ok) {
        setSaved(true);
        onLocaleChange(selectedLocale);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteClick() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDeleteAccount();
  }

  if (hidden) return null;

  return (
    <div className="panel settings-panel">
      <h2 className="settings-title">{t('settings', locale)}</h2>

      <section className="settings-section">
        <h3>{t('preferences', locale)}</h3>

        <label className="settings-field">
          <span>{t('timezone', locale)}</span>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            <option value="America/Montreal">America/Montreal (EST)</option>
            <option value="America/Toronto">America/Toronto (EST)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="America/Chicago">America/Chicago (CST)</option>
            <option value="America/Vancouver">America/Vancouver (PST)</option>
            <option value="Europe/Paris">Europe/Paris (CET)</option>
            <option value="UTC">UTC</option>
          </select>
        </label>

        <label className="settings-field">
          <span>{t('defaultReminder', locale)}</span>
          <select
            value={defaultReminder}
            onChange={(e) => setDefaultReminder(Number(e.target.value))}
          >
            <option value={0}>{t('noReminder', locale)}</option>
            <option value={5}>5 {t('minutes', locale)}</option>
            <option value={10}>10 {t('minutes', locale)}</option>
            <option value={15}>15 {t('minutes', locale)}</option>
            <option value={30}>30 {t('minutes', locale)}</option>
            <option value={60}>1 {t('hours', locale)}</option>
          </select>
        </label>

        <label className="settings-field">
          <span>{t('language', locale)}</span>
          <select
            value={selectedLocale}
            onChange={(e) => setSelectedLocale(e.target.value as Locale)}
          >
            <option value="fr">{t('french', locale)}</option>
            <option value="en">{t('english', locale)}</option>
          </select>
        </label>

        <button
          type="button"
          className="settings-save-button"
          onClick={handleSave}
          disabled={saving}
        >
          {saved ? t('saved', locale) : t('save', locale)}
        </button>
      </section>

      <section className="settings-section settings-danger-zone">
        <h3>{t('deleteAccount', locale)}</h3>

        {confirmDelete && (
          <p className="settings-warning">{t('deleteAccountConfirm', locale)}</p>
        )}

        <button
          type="button"
          className="settings-delete-button"
          onClick={handleDeleteClick}
        >
          {confirmDelete ? t('confirmDeletion', locale) : t('deleteAccount', locale)}
        </button>

        {confirmDelete && (
          <button
            type="button"
            className="settings-cancel-button"
            onClick={() => setConfirmDelete(false)}
          >
            {t('cancelDeletion', locale)}
          </button>
        )}
      </section>
    </div>
  );
}
