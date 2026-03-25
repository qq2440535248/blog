import { ref, watch } from "vue";

const STORAGE_KEY = "code_theme";

function getInitialTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "dark" || saved === "light") {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useCodeTheme() {
  const theme = ref(getInitialTheme());

  watch(theme, (next) => {
    localStorage.setItem(STORAGE_KEY, next);
  });

  function toggleTheme() {
    theme.value = theme.value === "dark" ? "light" : "dark";
  }

  return {
    codeTheme: theme,
    toggleCodeTheme: toggleTheme,
  };
}
