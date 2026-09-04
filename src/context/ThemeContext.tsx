import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "nativewind";

type ThemeMode = "light" | "dark";

type ThemeContextType = {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@business_manager_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { setColorScheme } = useColorScheme();

  // Dark mode is the default theme
  const [theme, setThemeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    loadTheme();
  }, []);

  async function loadTheme() {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);

      if (savedTheme === "dark" || savedTheme === "light") {
        // Restore the user's previously selected theme
        setThemeState(savedTheme);
        setColorScheme(savedTheme);
      } else {
        // No saved preference → default to dark mode
        setThemeState("dark");
        setColorScheme("dark");
      }
    } catch (error) {
      console.error("THEME LOAD ERROR:", error);

      // If loading fails, stay on dark mode
      setThemeState("dark");
      setColorScheme("dark");
    }
  }

  async function setTheme(nextTheme: ThemeMode) {
    try {
      setThemeState(nextTheme);
      setColorScheme(nextTheme);

      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (error) {
      console.error("THEME SAVE ERROR:", error);
    }
  }

  async function toggleTheme() {
    await setTheme(theme === "light" ? "dark" : "light");
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}