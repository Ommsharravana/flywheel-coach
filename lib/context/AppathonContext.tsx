'use client';

import { createContext, useContext, ReactNode } from 'react';

interface AppathonContextType {
  isAppathonMode: boolean;
}

const AppathonContext = createContext<AppathonContextType>({
  isAppathonMode: false,
});

interface AppathonProviderProps {
  children: ReactNode;
  isAppathonMode: boolean;
}

export function AppathonProvider({
  children,
  isAppathonMode,
}: AppathonProviderProps) {
  return (
    <AppathonContext.Provider value={{ isAppathonMode }}>
      {children}
    </AppathonContext.Provider>
  );
}

export function useAppathonMode() {
  const context = useContext(AppathonContext);
  if (context === undefined) {
    throw new Error('useAppathonMode must be used within an AppathonProvider');
  }
  return context;
}

// Export the context for testing purposes
export { AppathonContext };
