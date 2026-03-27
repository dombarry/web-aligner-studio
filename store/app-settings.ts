import { create } from "zustand";

interface AppSettingsState {
  showVirtualPrinters: boolean;
  setShowVirtualPrinters: (v: boolean) => void;
}

export const useAppSettings = create<AppSettingsState>((set) => ({
  showVirtualPrinters: false,
  setShowVirtualPrinters: (v) => set({ showVirtualPrinters: v }),
}));
