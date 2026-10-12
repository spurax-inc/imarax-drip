"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderTimeline from "@/components/OrderTimeline";
import { OrderView, currentStep, fetchOrder } from "@/lib/orderView";
import { formatPrice } from "@/lib/products";

function OrderContent() {
  const params = useParams<{ reference: string }>();
  const search = useSearchParams();

  const reference = params.reference;
  const key = search.get("key") ?? "";

  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await fetchOrder({ reference, key });

      setOrder(result.order);
      setError(result.error);
      setLoading(false);
    }

    load();
  }, [reference, key]);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading your order...</p>;
  }

  if (!order) {
    return (
      <div className="rounded-sm bg-ash p-8">
        <p className="text-sm text-gray-600">
          {error || "We could not find that order."}
        </p>

        <Link
          href="/track"
          className="mt-5 inline-block rounded-full bg-signal px-6 py-3 text-sm font-semibold text-white transition hover:bg-signal-dark"
        >
          Find my order
        </Link>
      </div>
    );
  }

  const step = currentStep(order);
  const shippedOrLater = step >= 2;
  const receiptHref = `/receipt/${encodeURIComponent(order.reference)}?key=${order.key}`;

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-signal">
        Your order
      </p>

      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        {order.reference}
      </h1>

      <p className="mt-2 text-sm text-gray-500">
        Placed on{" "}
        {new Date(order.created_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

      {step === -1 ? (
        <div className="mt-8 rounded-sm bg-ash p-6">
          <p className="text-sm text-gray-600">
            This order has not been paid yet, so it is not being prepared.
          </p>
        </div>
      ) : (
        <div className="mt-10 rounded-sm border border-black/10 p-6">
          <OrderTimeline order={order} />

          {shippedOrLater && order.tracking_note && (
            <p className="mt-6 rounded-sm bg-ash px-4 py-3 text-sm text-gray-700">
              <span className="font-semibold">Tracking:</span>{" "}
              {order.tracking_note}
            </p>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Delivering to
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-700">
            {order.full_name}
            <br />
            {order.address}
            <br />
            {order.city}, {order.state}
            <br />
            {order.country}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Items
          </p>

          <ul className="mt-3 space-y-1 text-sm text-gray-700">
            {order.items.map((item, index) => (
              <li key={index}>
                {item.name} × {item.quantity}
                {[item.size, item.color].filter(Boolean).length > 0 &&
                  ` (${[item.size, item.color].filter(Boolean).join(" / ")})`}
              </li>
            ))}
          </ul>

          <p className="mt-3 text-base font-bold">
            {formatPrice(order.subtotal, order.currency)}
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        {step >= 0 && (
          <Link
            href={receiptHref}
            className="rounded-full bg-signal px-8 py-4 text-sm font-semibold text-white transition hover:bg-signal-dark"
          >
            View receipt
          </Link>
        )}

        <Link
          href="/support"
          className="rounded-full border border-black px-8 py-4 text-sm font-semibold transition hover:border-signal hover:bg-signal hover:text-white"
        >
          Need help?
        </Link>
      </div>
    </>
  );
}

export default function OrderPage() {
  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <Header />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <Suspense
            fallback={<p className="text-sm text-gray-500">Loading...</p>}
          >
            <OrderContent />
          </Suspense>
        </div>
      </section>

      <Footer />
    </main>
  );
}