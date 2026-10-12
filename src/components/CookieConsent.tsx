"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "imarax_cookie_consent";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
const OPEN_EVENT = "imx-open-cookie-settings";

type Choice = { analytics: boolean; marketing: boolean; ts?: string };

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    __imxConsentReady?: boolean;
  }
}

function ensureGtag() {
  window.dataLayer = window.dataLayer || [];

  if (!window.gtag) {
    window.gtag = function () {
      // Google's script expects the arguments object itself.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
  }

  // Everything denied until the visitor chooses.
  if (!window.__imxConsentReady) {
    window.__imxConsentReady = true;

    window.gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }
}

function loadGA() {
  if (!GA_ID || document.getElementById("imx-ga")) return;

  const script = document.createElement("script");
  script.id = "imx-ga";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.gtag("js", new Date());
  window.gtag("config", GA_ID);
}

function clearGACookies() {
  const host = window.location.hostname;
  const parts = host.split(".");
  const parent = parts.length > 2 ? parts.slice(-2).join(".") : host;

  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim();

    if (name.startsWith("_ga")) {
      const expired = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;

      document.cookie = expired;
      document.cookie = `${expired}; domain=${host}`;
      document.cookie = `${expired}; domain=.${parent}`;
    }
  });
}

function applyChoice(choice: Choice) {
  window.gtag("consent", "update", {
    analytics_storage: choice.analytics ? "granted" : "denied",
    ad_storage: choice.marketing ? "granted" : "denied",
    ad_user_data: choice.marketing ? "granted" : "denied",
    ad_personalization: choice.marketing ? "granted" : "denied",
  });

  if (choice.analytics) {
    loadGA();
  } else {
    clearGACookies();
  }

  // If you add an ad pixel later (Meta, TikTok), load it here only when
  // choice.marketing is true.
}

function readSaved(): Choice | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Choice) : null;
  } catch {
    return null;
  }
}

export default function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    ensureGtag();

    const saved = readSaved();

    if (saved) {
      applyChoice(saved);
      setAnalytics(saved.analytics);
      setMarketing(saved.marketing);
    } else {
      setBannerOpen(true);
    }

    setMounted(true);

    function openSettings() {
      const current = readSaved();
      setAnalytics(Boolean(current?.analytics));
      setMarketing(Boolean(current?.marketing));
      setModalOpen(true);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setModalOpen(false);
    }

    window.addEventListener(OPEN_EVENT, openSettings);
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener(OPEN_EVENT, openSettings);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  function choose(choice: Choice) {
    const saved = { ...choice, ts: new Date().toISOString() };

    try {
      window.localStorage.setItem(KEY, JSON.stringify(saved));
    } catch {
      // storage unavailable, the choice still applies for this visit
    }

    applyChoice(saved);
    setBannerOpen(false);
    setModalOpen(false);
  }

  if (!mounted) return null;

  const outlineButton =
    "rounded-full border border-black px-5 py-2.5 text-sm font-semibold transition hover:border-signal hover:bg-signal hover:text-white";
  const solidButton =
    "rounded-full bg-signal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-signal-dark";

  return (
    <>
      {bannerOpen && (
        <div
          role="dialog"
          aria-label="Cookie notice"
          className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-2xl rounded-sm border border-black/10 border-t-signal bg-white p-6 shadow-2xl"
          style={{ borderTopWidth: 4 }}
        >
          <h3 className="text-lg font-bold">We use cookies</h3>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            We use essential cookies to make our site work. With your
            permission, we also use analytics and marketing cookies to
            understand how the site is used and to show relevant ads. You can
            accept all, reject non-essential cookies, or customise your
            choices. See our{" "}
            <Link
              href="/privacy"
              className="font-semibold text-black underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            .
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => choose({ analytics: true, marketing: true })}
              className={solidButton}
            >
              Accept all
            </button>

            <button
              type="button"
              onClick={() => choose({ analytics: false, marketing: false })}
              className={outlineButton}
            >
              Reject non-essential
            </button>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className={outlineButton}
            >
              Customise
            </button>
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cookie settings"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-sm bg-white p-6">
            <h3 className="text-xl font-bold">Cookie settings</h3>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Choose which cookies you allow. You can change this at any time
              from the Cookie Settings link in the footer.
            </p>

            <div className="mt-5 divide-y divide-black/10 border-t border-black/10">
              <div className="flex items-start justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-semibold">Essential</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Needed for the site to work, such as your cart and login.
                    Always on.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked
                  disabled
                  aria-label="Essential cookies, always on"
                  className="mt-1 h-5 w-5 accent-[#d2561f]"
                />
              </div>

              <div className="flex items-start justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-semibold">Analytics</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Google Analytics helps us see how visitors use the site so
                    we can improve it.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  aria-label="Analytics cookies"
                  className="mt-1 h-5 w-5 accent-[#d2561f]"
                />
              </div>

              <div className="flex items-start justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-semibold">Marketing</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Used to measure our marketing and show you relevant ads on
                    other sites and platforms.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  aria-label="Marketing cookies"
                  className="mt-1 h-5 w-5 accent-[#d2561f]"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => choose({ analytics, marketing })}
                className={solidButton}
              >
                Save my choices
              </button>

              <button
                type="button"
                onClick={() => choose({ analytics: true, marketing: true })}
                className={outlineButton}
              >
                Accept all
              </button>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className={outlineButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}