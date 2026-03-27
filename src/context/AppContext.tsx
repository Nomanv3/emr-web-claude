import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface AppContextValue {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  viewMode: 'comfortable' | 'compact';
  setViewMode: (mode: 'comfortable' | 'compact') => void;
  clinicLocation: string;
  setClinicLocation: (location: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'comfortable' | 'compact'>('comfortable');
  const [clinicLocation, setClinicLocation] = useState('Asia/Kolkata');

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        setSidebarOpen,
        viewMode,
        setViewMode,
        clinicLocation,
        setClinicLocation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
