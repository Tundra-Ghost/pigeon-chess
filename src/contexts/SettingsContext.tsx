import React, { createContext, useContext, useMemo, useState } from 'react';
import { setSoundOptions } from '../sound';

type Settings = {
  showHints: boolean;
  sfxEnabled: boolean;
  sfxVolume: number;
  bgmEnabled: boolean;
  bgmVolume: number;
  theme: 'auto'|'light'|'dark';
};

const defaultSettings: Settings = {
  showHints: true,
  sfxEnabled: true,
  sfxVolume: 0.7,
  bgmEnabled: true,
  bgmVolume: 0.5,
  theme: 'auto',
};

type Ctx = {
  settings: Settings;
  setSettings: (next: Partial<Settings>) => void;
};

const SettingsContext = createContext<Ctx>({ settings: defaultSettings, setSettings: () => {} });

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, set] = useState<Settings>(() => {
    try { return { ...defaultSettings, ...(JSON.parse(localStorage.getItem('settings') || '{}')) }; } catch { return defaultSettings; }
  });

  const api = useMemo<Ctx>(() => ({
    settings,
    setSettings(next) {
      const merged = { ...settings, ...next } as Settings;
      set(merged);
      localStorage.setItem('settings', JSON.stringify(merged));
      setSoundOptions({
        sfxEnabled: merged.sfxEnabled,
        sfxVolume: merged.sfxVolume,
        bgmEnabled: merged.bgmEnabled,
        bgmVolume: merged.bgmVolume,
      });
    },
  }), [settings]);

  return <SettingsContext.Provider value={api}>{children}</SettingsContext.Provider>;
}

export function useSettings() { return useContext(SettingsContext); }

