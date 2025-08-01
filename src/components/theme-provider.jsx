/* eslint-disable react/prop-types */
import { createContext, useContext, useEffect, useState } from "react";

/**
 * THEME PROVIDER INITIAL STATE
 * Default configuration for theme management
 */
const initialState = {
  theme: "system",
  setTheme: () => null,
};

/**
 * THEME PROVIDER CONTEXT
 * React context for managing application theme state
 */
const ThemeProviderContext = createContext(initialState);

/**
 * THEME PROVIDER COMPONENT
 * Provides theme management functionality for HIRED platform
 * 
 * FEATURES:
 * - Light/Dark/System theme support
 * - Automatic system theme detection
 * - Local storage persistence
 * - Dynamic CSS class application
 * - Context-based theme state management
 * - Responsive to system preference changes
 * 
 * USAGE CONTEXT:
 * - Wraps the entire application
 * - Provides theme context to all components
 * - Enables consistent theming across platform
 * - Supports user preference persistence
 * - Integrates with Tailwind CSS dark mode
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.defaultTheme - Default theme ("light", "dark", "system")
 * @param {string} props.storageKey - localStorage key for theme persistence
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(storageKey) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};