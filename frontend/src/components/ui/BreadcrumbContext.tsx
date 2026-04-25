import { createContext, useContext, useState, type ReactNode } from "react";

const BreadcrumbLabelContext = createContext<{
  lastLabel: string | undefined;
  setLastLabel: (label: string | undefined) => void;
}>({ lastLabel: undefined, setLastLabel: () => {} });

export function BreadcrumbLabelProvider({ children }: { children: ReactNode }) {
  const [lastLabel, setLastLabel] = useState<string | undefined>();
  return (
    <BreadcrumbLabelContext.Provider value={{ lastLabel, setLastLabel }}>
      {children}
    </BreadcrumbLabelContext.Provider>
  );
}

export function useSetBreadcrumbLabel() {
  return useContext(BreadcrumbLabelContext).setLastLabel;
}

export function useBreadcrumbLabel() {
  return useContext(BreadcrumbLabelContext).lastLabel;
}
