"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";
import { fetchOrder } from "@/lib/orderView";

type MyOrder = {
  reference: string;
  status: string;
  fulfilment_status: string | null;
  created_at: string;
  access_token: string;
};

const inputClass =
  "w-full rounded-full border border-black/20 bg-white px-5 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-signal";

function progress(order: MyOrder) {
  if (order.status === "pending") return "Awaiting payment";
  if (order.status === "failed") return "Payment failed";
  if (order.status !== "paid") return order.status;

  switch (order.fulfilment_status) {
    case "packed":
      return "Packed";
    case "shipped":
      return "On the way";
    case "delivered":
      return "Delivered";
    default:
      return "Order confirmed";
  }
}

export default function TrackPage() {
  const router = useRouter();

  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mine, setMine] = useState<MyOrder[]>([]);

  useEffect(() => {
    const supabase = createClient();

    async function loadMine() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) return;

      const { data } = await supabase
        .from("orders")
        .select("reference, status, fulfilment_status, created_at, access_token")
        .order("created_at", { ascending: false });

      setMine((data ?? []) as MyOrder[]);
    }

    loadMine();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const result = await fetchOrder({
      reference: reference.trim(),
      email: email.trim(),
    });

    if (!result.order) {
      setError(result.error);
      setBusy(false);
      return;
    }

    router.push(
      `/order/${encodeURIComponent(result.order.reference)}?key=${result.order.key}`
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <Header />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-signal">
            Track
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Track my order
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            Enter your order number and the email you used at checkout.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Order number, e.g. IMX-..."
              required
              className={inputClass}
            />

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className={inputClass}
            />

            {error && <p className="text-sm font-medium text-signal">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-signal py-4 text-sm font-semibold text-white transition hover:bg-signal-dark disabled:opacity-60"
            >
              {busy ? "Looking..." : "Track my order"}
            </button>
          </form>

          {mine.length > 0 && (
            <div className="mt-14">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-signal">
                Your orders
              </p>

              <ul className="mt-5 divide-y divide-black/10 border-y border-black/10">
                {mine.map((order) => (
                  <li key={order.reference}>
                    <Link
                      href={`/order/${encodeURIComponent(order.reference)}?key=${order.access_token}`}
                      className="flex items-center justify-between gap-4 py-4 transition hover:text-signal"
                    >
                      <div>
                        <p className="text-sm font-semibold">{order.reference}</p>

                        <p className="mt-0.5 text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString("en-GB")}
                        </p>
                      </div>

                      <span className="text-xs font-semibold uppercase tracking-[0.15em]">
                        {progress(order)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}