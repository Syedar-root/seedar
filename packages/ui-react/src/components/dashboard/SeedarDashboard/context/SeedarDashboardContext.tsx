import { createContext, useContext } from "react";
import type { SeedarDashboardContextValue } from "../types";

export const SeedarDashboardContext =
  createContext<SeedarDashboardContextValue | null>(null);

export const useSeedarDashboardContext = () => {
  const context = useContext(SeedarDashboardContext);
  if (!context) {
    throw new Error(
      "useSeedarDashboardContext must be used within SeedarDashboard",
    );
  }
  return context;
};
