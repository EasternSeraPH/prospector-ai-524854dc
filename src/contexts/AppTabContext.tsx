import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type AppTab = "chat" | "jobs";

interface AppTabContextValue {
  tab: AppTab;
  setTab: (tab: AppTab) => void;
}

const AppTabContext = createContext<AppTabContextValue | null>(null);

export function AppTabProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<AppTab>("chat");
  const value = useMemo(() => ({ tab, setTab }), [tab]);
  return <AppTabContext.Provider value={value}>{children}</AppTabContext.Provider>;
}

export function useAppTab() {
  const ctx = useContext(AppTabContext);
  if (!ctx) throw new Error("useAppTab must be used within AppTabProvider");
  return ctx;
}
