import React, { useState } from "react";

function setTheme(next) {
  const root = document.documentElement;
  if (next === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  localStorage.setItem("theme", next);
}

function ThemeToggle() {
  const [mode, setMode] = useState(
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );
  return (
    <button
      className="bg-card border border-border rounded-md px-3 py-2"
      onClick={() => {
        const next = mode === "dark" ? "light" : "dark";
        setMode(next);
        setTheme(next);
      }}
      title="Toggle theme"
    >
      {mode === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
export default ThemeToggle;