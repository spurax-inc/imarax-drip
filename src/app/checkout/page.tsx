"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartItem, getCart } from "@/lib/cart";
import { formatPrice } from "@/lib/products";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-full border border-black/20 bg-white px-5 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-signal";

export default function CheckoutPage() {
  const [supabase] = useState(() => createClient());

  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("Nigeria");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setItems(getCart());
    setReady(true);

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail((current) => current || data.user?.email || "");
        setFullName(
          (current) =>
            current ||
            ((data.user?.user_metadata?.full_name as string | undefined) ?? "")
        );
      }
    });
  }, [supabase]);

  const currency = items[0]?.currency ?? "NGN";
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            color: i.color,
            quantity: i.quantity,
          })),
          customer: { fullName, email, phone, address, city, state, country },
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.url) {
        setError(json.error ?? "Could not start the payment.");
        setBusy(false);
        return;
      }

      window.location.href = json.url;
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <Header />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-signal">
            Checkout
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Delivery and payment
          </h1>

          {!ready ? (
            <p className="mt-10 text-sm text-gray-500">Loading...</p>
          ) : items.length === 0 ? (
            <div className="mt-12 rounded-sm bg-ash px-6 py-20 text-center">
              <p className="text-sm text-gray-500">Your cart is empty.</p>

              <Link
                href="/shop"
                className="mt-6 inline-block rounded-full bg-signal px-6 py-3 text-sm font-semibold text-white transition hover:bg-signal-dark"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid gap-12 md:grid-cols-[1.3fr_1fr]">
              {/* FORM */}
              <form onSubmit={handlePay} className="space-y-4">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  required
                  className={inputClass}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    required
                    className={inputClass}
                  />

                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                    required
                    className={inputClass}
                  />
                </div>

                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Delivery address"
                  required
                  className={inputClass}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    required
                    className={inputClass}
                  />

                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    required
                    className={inputClass}
                  />
                </div>

                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country"
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
                  {busy ? "Please wait..." : `Pay ${formatPrice(total, currency)}`}
                </button>

                <p className="text-center text-xs text-gray-500">
                  You will be taken to Paystack to pay securely.
                </p>
              </form>

              {/* SUMMARY */}
              <aside className="h-fit rounded-sm bg-ash p-6">
                <p className="text-sm font-semibold">Order summary</p>

                <ul className="mt-5 space-y-4">
                  {items.map((item) => (
                    <li
                      key={`${item.productId}-${item.size}-${item.color}`}
                      className="flex justify-between gap-4 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {item.name} × {item.quantity}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-500">
                          {[item.size, item.color].filter(Boolean).join(" / ")}
                        </p>
                      </div>

                      <p className="font-medium">
                        {formatPrice(item.price * item.quantity, item.currency)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex justify-between border-t border-black/10 pt-4 text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span>Included</span>
                </div>

                <div className="mt-3 flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{formatPrice(total, currency)}</span>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}