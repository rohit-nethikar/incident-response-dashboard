import { create } from "zustand";
import type { Severity, IncidentStatus, SourceSystem } from "@incident-dash/shared";

interface IncidentFilters {
  severity?: Severity;
  status?: IncidentStatus;
  sourceSystem?: SourceSystem;
  search: string;
}

interface UiState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  filters: IncidentFilters;
  setFilters: (filters: Partial<IncidentFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: IncidentFilters = {
  search: "",
};

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  filters: defaultFilters,
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: defaultFilters }),
}));
