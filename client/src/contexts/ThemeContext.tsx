import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeType = 'light' | 'dark' | 'blue' | 'green' | 'purple' | 'red';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize theme from localStorage or default to 'light'
  const [theme, setTheme] = useState<ThemeType>('light');
  
  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme') as ThemeType;
      if (savedTheme && ['light', 'dark', 'blue', 'green', 'purple', 'red'].includes(savedTheme)) {
        setTheme(savedTheme);
      }
    } catch (e) {
      console.error('Failed to load theme from localStorage', e);
    }
  }, []);

  // Update theme in localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('theme', theme);
      
      // Update document body with theme class
      document.body.className = '';
      document.body.classList.add(`theme-${theme}`);
    } catch (e) {
      console.error('Failed to save theme to localStorage', e);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}