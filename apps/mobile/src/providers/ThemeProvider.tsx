import React, { createContext, useContext, useState } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';

type ColorScheme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  colorScheme: ColorScheme;
  activeTheme: 'light' | 'dark';
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colorScheme: 'system',
  activeTheme: 'light',
  setColorScheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Esparex is enforced light-mode only (EA-059, PR #650).
  const [colorScheme, setColorScheme] = useState<ColorScheme>('system');
  const activeTheme: 'light' | 'dark' = 'light';

  return (
    <ThemeContext.Provider value={{ colorScheme, activeTheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
