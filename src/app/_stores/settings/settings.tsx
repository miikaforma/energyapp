import { type ISettings } from "@energyapp/shared/interfaces";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type SettingsState = {
  settings: ISettings;
  setSettings: (settings: ISettings) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: {
        margin: 0.59,
        addElectricityTax: true,
        nightTransfer: false,
        transferDay: 2.95,
        transferNight: 1.5,
        nightStart: 22,
        nightEnd: 7,
        showConsumptionEffects: true,
      } as ISettings,
      setSettings: (settings) => set({ settings }),
    }),
    {
      name: "settings-storage", // unique name
      storage: createJSONStorage(() => localStorage), // (optional) by default the 'localStorage' is used
    },
  ),
);
