// ──────────────────────────────────────────────
// useInstallPrompt — captures the beforeinstallprompt event
// and exposes a prompt() function + a ready flag.
// Returns null on browsers that don't support installation
// (Safari, already-installed PWA, etc.).
// ──────────────────────────────────────────────
import { useState, useEffect } from "react";

export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile automatically
      e.preventDefault();
      setPromptEvent(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // If the app is already installed the event fires on 'appinstalled'
    const installed = () => setPromptEvent(null);
    window.addEventListener("appinstalled", installed);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const prompt = async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") setPromptEvent(null);
  };

  return promptEvent ? prompt : null;
}
