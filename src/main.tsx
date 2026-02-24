import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Devtools & source code protection
const DEVTOOLS_PASSWORD = "earthin2026";

(() => {
  let authenticated = false;

  // Block common keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (authenticated) return;

    const blocked =
      // F12
      e.key === "F12" ||
      // Ctrl+Shift+I / Cmd+Option+I (DevTools)
      ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "i") ||
      // Ctrl+Shift+J / Cmd+Option+J (Console)
      ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "j") ||
      // Ctrl+Shift+C / Cmd+Option+C (Inspect)
      ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "c") ||
      // Ctrl+U / Cmd+U (View Source)
      ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") ||
      // Ctrl+S (Save page)
      ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s");

    if (blocked) {
      e.preventDefault();
      e.stopPropagation();
      const pwd = prompt("Enter developer password to continue:");
      if (pwd === DEVTOOLS_PASSWORD) {
        authenticated = true;
      }
    }
  }, true);

  // Block right-click context menu
  document.addEventListener("contextmenu", (e) => {
    if (authenticated) return;
    e.preventDefault();
    const pwd = prompt("Enter developer password to continue:");
    if (pwd === DEVTOOLS_PASSWORD) {
      authenticated = true;
    }
  });
})();

createRoot(document.getElementById("root")!).render(<App />);
