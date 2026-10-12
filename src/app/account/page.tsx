"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/products";

type Mode = "signin" | "signup" | "forgot";

type OrderRow = {
  id: string;
  reference: string;
  status: string;
  fulfilment_status: string | null;
  tracking_note: string | null;
  subtotal: number;
  currency: string;
  created_at: string;
  order_items: {
    name: string;
    size: string | null;
    color: string | null;
    quantity: number;
  }[];
};

const TERMS_VERSION = "2026-10-11";

const inputClass =
  "w-full rounded-full border border-black/20 bg-white px-5 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-signal";

function progressLabel(order: OrderRow) {
  if (order.status === "pending") return "Awaiting payment";
  if (order.status === "failed") return "Payment failed";
  if (order.status !== "paid") return order.status;

  switch (order.fulfilment_status) {
    case "packed":
      return "Packed";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    default:
      return "Order received";
  }
}

export default function AccountPage() {
  const [supabase] = useState(() => createClient());

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    async function loadOrders() {
      setOrdersLoading(true);

      const { data, error: ordersError } = await supabase
        .from("orders")
        .select(
          "id, reference, status, fulfilment_status, tracking_note, subtotal, currency, created_at, order_items(name, size, color, quantity)"
        )
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error(ordersError);
      } else {
        setOrders((data ?? []) as unknown as OrderRow[]);
      }

      setOrdersLoading(false);
    }

    loadOrders();
  }, [user, supabase]);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setMessage("");
    setAgreed(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    if (mode === "signup") {
      if (!agreed) {
        setError("Please tick the box to agree to the Terms and Privacy Policy.");
        setBusy(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            terms_accepted_at: new Date().toISOString(),
            terms_version: TERMS_VERSION,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (!data.session) {
        setMessage(
          "Account created. Check your email to confirm it, then sign in."
        );
        setMode("signin");
      }
    } else if (mode === "signin") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      }
    } else {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/account/reset` }
      );

      if (resetError) {
        setError(resetError.message);
      } else {
        setMessage(
          "If an account exists for that email, we have sent a link to reset your password."
        );
      }
    }

    setBusy(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) || "there";

  const heading =
    mode === "signin"
      ? "Welcome back."
      : mode === "signup"
      ? "Join Imarax Drip."
      : "Reset your password.";

  const subheading =
    mode === "signin"
      ? "Sign in to see your account and orders."
      : mode === "signup"
      ? "Create an account to save your details and track orders."
      : "Enter your email and we will send you a link to choose a new password.";

  const buttonLabel =
    mode === "signin"
      ? "Sign in"
      : mode === "signup"
      ? "Create account"
      : "Send reset link";

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <Header />

      <section className="px-6 py-16">
        <div className={`mx-auto ${user ? "max-w-2xl" : "max-w-md"}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-signal">
            Account
          </p>

          {loading ? (
            <p className="mt-6 text-sm text-gray-500">Loading...</p>
          ) : user ? (
            <>
              <h1 className="mt-3 text-4xl font-bold tracking-tight">
                Hi, {displayName}.
              </h1>

              <p className="mt-3 text-sm text-gray-500">{user.email}</p>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                <Link
                  href="/shop"
                  className="block rounded-full bg-signal py-4 text-center text-sm font-semibold text-white transition hover:bg-signal-dark"
                >
                  Shop
                </Link>

                <Link
                  href="/cart"
                  className="block rounded-full border border-black py-4 text-center text-sm font-semibold transition hover:border-signal hover:bg-signal hover:text-white"
                >
                  View cart
                </Link>

                <Link
                  href="/checkout"
                  className="block rounded-full border border-black py-4 text-center text-sm font-semibold transition hover:border-signal hover:bg-signal hover:text-white"
                >
                  Go to checkout
                </Link>
              </div>

              <div className="mt-14">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-signal">
                  Your orders
                </p>

                {ordersLoading ? (
                  <p className="mt-6 text-sm text-gray-500">Loading orders...</p>
                ) : orders.length === 0 ? (
                  <div className="mt-6 rounded-sm bg-ash p-6">
                    <p className="text-sm text-gray-500">
                      You have no orders yet. When you buy something, it will
                      show up here.
                    </p>
                  </div>
                ) : (
                  <ul className="mt-6 space-y-4">
                    {orders.map((order) => (
                      <li
                        key={order.id}
                        className="rounded-sm border border-black/10 p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold">
                            {order.reference}
                          </p>

                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${
                              order.status === "paid"
                                ? "bg-signal text-white"
                                : "bg-ash text-gray-600"
                            }`}
                          >
                            {progressLabel(order)}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short", year: "numeric" }
                          )}
                        </p>

                        {order.status === "paid" &&
                          order.tracking_note &&
                          ["shipped", "delivered"].includes(
                            order.fulfilment_status ?? ""
                          ) && (
                            <p className="mt-3 rounded-sm bg-ash px-4 py-3 text-sm text-gray-700">
                              <span className="font-semibold">Tracking:</span>{" "}
                              {order.tracking_note}
                            </p>
                          )}

                        <ul className="mt-4 space-y-1 text-sm text-gray-600">
                          {order.order_items.map((item, index) => (
                            <li key={index}>
                              {item.name} × {item.quantity}
                              {[item.size, item.color].filter(Boolean).length >
                                0 &&
                                ` (${[item.size, item.color]
                                  .filter(Boolean)
                                  .join(" / ")})`}
                            </li>
                          ))}
                        </ul>

                        <p className="mt-4 text-sm font-bold">
                          {formatPrice(Number(order.subtotal), order.currency)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="mt-12 text-sm font-semibold text-gray-500 underline underline-offset-4 transition hover:text-signal"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <h1 className="mt-3 text-4xl font-bold tracking-tight">
                {heading}
              </h1>

              <p className="mt-3 text-sm text-gray-500">{subheading}</p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                {mode === "signup" && (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    required
                    className={inputClass}
                  />
                )}

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className={inputClass}
                />

                {mode !== "forgot" && (
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (at least 6 characters)"
                    minLength={6}
                    required
                    className={inputClass}
                  />
                )}

                {mode === "signin" && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-xs font-semibold text-gray-500 underline underline-offset-4 transition hover:text-signal"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {mode === "signup" && (
                  <label className="flex items-start gap-3 text-xs leading-5 text-gray-600">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      required
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#d2561f]"
                    />

                    <span>
                      I am 18 or older and I agree to the{" "}
                      <Link
                        href="/terms"
                        target="_blank"
                        className="font-semibold text-signal underline underline-offset-2"
                      >
                        Terms &amp; Conditions
                      </Link>{" "}
                      and the{" "}
                      <Link
                        href="/privacy"
                        target="_blank"
                        className="font-semibold text-signal underline underline-offset-2"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>
                )}

                {error && (
                  <p className="text-sm font-medium text-signal">{error}</p>
                )}

                {message && <p className="text-sm text-gray-600">{message}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full bg-signal py-4 text-sm font-semibold text-white transition hover:bg-signal-dark disabled:opacity-60"
                >
                  {busy ? "Please wait..." : buttonLabel}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                {mode === "signin" ? (
                  <>
                    New here?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("signup")}
                      className="font-semibold text-signal underline underline-offset-4"
                    >
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    {mode === "signup"
                      ? "Already have an account?"
                      : "Remembered it?"}{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("signin")}
                      className="font-semibold text-signal underline underline-offset-4"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}