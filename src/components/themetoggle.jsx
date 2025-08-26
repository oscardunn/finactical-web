import React, { useEffect, useState } from "react";

function setTheme(next) {
  const root = document.documentElement;
  if (next === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  localStorage.setItem("theme", next);
}

const SunIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    {...props}
  >
    <circle cx="12" cy="12" r="5" />
    <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const MoonIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    {...props}
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

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
      {mode === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
