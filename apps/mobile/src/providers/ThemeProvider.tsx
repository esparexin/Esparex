import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const systemColorScheme = useNativeColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorScheme>('system');

  const activeTheme: 'light' | 'dark' =
    colorScheme === 'system'
      ? (systemColorScheme === 'dark' ? 'dark' : 'light')
      : colorScheme;

  return (
    <ThemeContext.Provider value={{ colorScheme, activeTheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
