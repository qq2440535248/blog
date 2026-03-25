import { ref, watch } from "vue";

const STORAGE_KEY = "code_theme";
const sharedTheme = ref(getInitialTheme());
let initialized = false;

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
    if (!initialized) {
        watch(sharedTheme, (next) => {
            localStorage.setItem(STORAGE_KEY, next);
        }, { immediate: true });
        initialized = true;
    }

    function toggleTheme() {
        sharedTheme.value = sharedTheme.value === "dark" ? "light" : "dark";
    }

    return {
        codeTheme: sharedTheme,
        toggleCodeTheme: toggleTheme,
    };
}
