import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

function setTheme(next) {
  const root = document.documentElement;
  if (next === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  localStorage.setItem("theme", next);
}



export default function ThemeToggle() {
  const [mode, setMode] = useState(
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );

  useEffect(() => {
    // sync with stored preference on mount (in case of SSR / reload)
    const ls = localStorage.getItem("theme");
    if (ls === "dark" || ls === "light") {
      setMode(ls);
      setTheme(ls);
    }
  }, []);

  const next = mode === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={() => {
        setMode(next);
        setTheme(next);
      }}
      aria-label={
        mode === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
      title={mode === "dark" ? "Light mode" : "Dark mode"}
    >
    {mode === "dark"
     ? <Sun className="w-[20px] h-[20px]" strokeWidth={1.8} />
     : <Moon className="w-[20px] h-[20px]" strokeWidth={1.8} />
   }
    </button>
  );
}
