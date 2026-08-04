"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <button
        aria-label="Cambiar tema"
        className="btn-ghost p-2"
        style={{ width: "36px", height: "36px" }}
      >
        <Sun className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
      className="btn-ghost p-2"
      style={{ width: "36px", height: "36px" }}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
