import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeType = 'light' | 'dark' | 'blue' | 'purple' | 'green' | 'red';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>(() => {
    // Try to get theme from localStorage, default to 'light'
    const savedTheme = localStorage.getItem('bakeDiaryTheme') as ThemeType;
    return savedTheme || 'light';
  });

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('bakeDiaryTheme', theme);
    
    // Remove all theme classes first
    document.documentElement.classList.remove(
      'theme-light', 
      'theme-dark', 
      'theme-blue', 
      'theme-purple', 
      'theme-green', 
      'theme-red'
    );
    
    // Add the selected theme class
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};