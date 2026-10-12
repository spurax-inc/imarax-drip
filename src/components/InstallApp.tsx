"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

export default function InstallApp() {
  const [promptEvent, setPromptEvent] = useState<InstallEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);

    function onPrompt(e: Event) {
      e.preventDefault();
      setPromptEvent(e as InstallEvent);
    }

    function onInstalled() {
      setInstalled(true);
      setPromptEvent(null);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  if (promptEvent) {
    return (
      <button
        type="button"
        onClick={async () => {
          await promptEvent.prompt();
          await promptEvent.userChoice;
          setPromptEvent(null);
        }}
        className="w-full rounded-full border border-black py-3 text-sm font-semibold transition hover:border-signal hover:bg-signal hover:text-white"
      >
        Install the app
      </button>
    );
  }

  if (isIos) {
    return (
      <p className="text-xs leading-6 text-gray-500">
        To install on iPhone: tap the Share button, then &quot;Add to Home
        Screen&quot;.
      </p>
    );
  }

  return null;
}