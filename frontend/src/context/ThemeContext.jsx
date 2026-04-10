import { createContext, useContext, useState, useEffect } from 'react';
import { THEMES } from '../utils/constants';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'tt_theme';

// Theme-specific class maps for components
const themeClasses = {
  [THEMES.INDIGO]: {
    accent: 'indigo',
    btnPrimary: 'btn-primary',
    tabActive: 'tab-btn-active',
    badgeAccent: 'badge-indigo',
    ring: 'focus:ring-indigo-500',
    border: 'border-indigo-600',
    bg: 'bg-indigo-600',
    bgLight: 'bg-indigo-50',
    text: 'text-indigo-600',
    textDark: 'text-indigo-700',
    hoverBg: 'hover:bg-indigo-700',
    navActive: 'bg-indigo-50 text-indigo-700',
    statIcon: 'text-indigo-500 bg-indigo-50',
  },
  [THEMES.EMERALD]: {
    accent: 'emerald',
    btnPrimary: 'btn-primary-emerald',
    tabActive: 'tab-btn-emerald-active',
    badgeAccent: 'badge-emerald',
    ring: 'focus:ring-emerald-500',
    border: 'border-emerald-600',
    bg: 'bg-emerald-600',
    bgLight: 'bg-emerald-50',
    text: 'text-emerald-600',
    textDark: 'text-emerald-700',
    hoverBg: 'hover:bg-emerald-700',
    navActive: 'bg-emerald-50 text-emerald-700',
    statIcon: 'text-emerald-500 bg-emerald-50',
  },
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || THEMES.INDIGO;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === THEMES.INDIGO ? THEMES.EMERALD : THEMES.INDIGO));
  };

  const t = themeClasses[theme] || themeClasses[THEMES.INDIGO];

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, t, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
