"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setIsError(false);

    const supabase = createClient();
    const { error } = await supabase
      .from("subscribers")
      .insert({ email: email.trim().toLowerCase() });

    if (error && error.code !== "23505") {
      setIsError(true);
      setMessage("Could not subscribe. Please try again.");
    } else if (error) {
      setMessage("You're already subscribed.");
    } else {
      setMessage("Thanks for subscribing.");
      setEmail("");
    }

    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          required
          className="min-w-0 flex-1 rounded-full border border-white/20 bg-transparent px-5 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-signal"
        />

        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-signal px-6 py-3 text-sm font-semibold text-white transition hover:bg-signal-dark disabled:opacity-60"
        >
          {busy ? "..." : "Subscribe"}
        </button>
      </div>

      {message && (
        <p
          className={`mt-3 text-xs ${
            isError ? "text-signal" : "text-gray-400"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}