import { create } from 'zustand'

type PreferencesState = {
  /** Reserved for Settings (density, quiet hours, etc.). */
  compactUi: boolean
  setCompactUi: (value: boolean) => void
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  compactUi: false,
  setCompactUi: (compactUi) => set({ compactUi }),
}))
