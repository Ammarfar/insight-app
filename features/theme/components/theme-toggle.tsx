"use client";

import { Moon, Sun } from "lucide-react";
import { useState, useTransition } from "react";
import { updateThemeAction } from "../actions";
import type { ThemeMode } from "../contracts";

export function ThemeToggle({ initialTheme }: { initialTheme: ThemeMode }) {
  const [theme, setTheme] = useState(initialTheme);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const nextTheme = theme === "light" ? "dark" : "light";
  const label = `Switch to ${nextTheme} theme`;

  function toggleTheme() {
    const previousTheme = theme;
    setMessage("");
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;

    startTransition(async () => {
      const result = await updateThemeAction(nextTheme);
      if (result.status === "success") return;

      setTheme(previousTheme);
      document.documentElement.dataset.theme = previousTheme;
      setMessage(result.message ?? "Theme could not be saved.");
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label={label}
        aria-pressed={theme === "dark"}
        className="grid size-10 place-items-center rounded-lg text-muted transition-colors hover:bg-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 disabled:cursor-wait disabled:opacity-60"
        disabled={pending}
        onClick={toggleTheme}
        title={label}
      >
        {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
      </button>
      <span className="sr-only" aria-live="polite">{message}</span>
    </>
  );
}
