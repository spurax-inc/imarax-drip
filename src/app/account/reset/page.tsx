"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-full border border-black/20 bg-white px-5 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-signal";

export default function ResetPasswordPage() {
  const [supabase] = useState(() => createClient());

  const [status, setStatus] = useState<
    "checking" | "ready" | "invalid" | "done"
  >("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let finished = false;

    function markReady() {
      finished = true;
      setStatus((current) => (current === "done" ? current : "ready"));
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        markReady();
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) markReady();
    });

    const timer = window.setTimeout(() => {
      if (!finished) setStatus("invalid");
    }, 4000);

    return () => {
      window.clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setBusy(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
    } else {
      setStatus("done");
    }

    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <Header />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-signal">
            Account
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Choose a new password.
          </h1>

          {status === "checking" && (
            <p className="mt-8 text-sm text-gray-500">Checking your link...</p>
          )}

          {status === "invalid" && (
            <div className="mt-8 rounded-sm bg-ash p-6">
              <p className="text-sm text-gray-600">
                This reset link is invalid or has expired. Please request a new
                one.
              </p>

              <Link
                href="/account"
                className="mt-5 inline-block rounded-full bg-signal px-6 py-3 text-sm font-semibold text-white transition hover:bg-signal-dark"
              >
                Back to sign in
              </Link>
            </div>
          )}

          {status === "ready" && (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password (at least 6 characters)"
                minLength={6}
                required
                className={inputClass}
              />

              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat the new password"
                minLength={6}
                required
                className={inputClass}
              />

              {error && (
                <p className="text-sm font-medium text-signal">{error}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-signal py-4 text-sm font-semibold text-white transition hover:bg-signal-dark disabled:opacity-60"
              >
                {busy ? "Please wait..." : "Save new password"}
              </button>
            </form>
          )}

          {status === "done" && (
            <div className="mt-8 rounded-sm bg-ash p-6">
              <p className="text-sm text-gray-600">
                Your password has been changed.
              </p>

              <Link
                href="/account"
                className="mt-5 inline-block rounded-full bg-signal px-6 py-3 text-sm font-semibold text-white transition hover:bg-signal-dark"
              >
                Go to my account
              </Link>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}