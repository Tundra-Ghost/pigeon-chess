import React, { createContext, useContext, useState } from 'react';

type UiCtx = {
  openAuth: () => void;
  closeAuth: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  authOpen: boolean;
  settingsOpen: boolean;
};

const UiContext = createContext<UiCtx>({ openAuth(){}, closeAuth(){}, openSettings(){}, closeSettings(){}, authOpen:false, settingsOpen:false });

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const value: UiCtx = {
    authOpen, settingsOpen,
    openAuth: () => setAuthOpen(true),
    closeAuth: () => setAuthOpen(false),
    openSettings: () => setSettingsOpen(true),
    closeSettings: () => setSettingsOpen(false),
  };
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(){ return useContext(UiContext); }

