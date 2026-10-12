"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { clearCart } from "@/lib/cart";
import { OrderView, fetchOrder } from "@/lib/orderView";
import { formatPrice } from "@/lib/products";

type Status = "checking" | "paid" | "failed";

function SuccessContent() {
  const params = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref");

  const [status, setStatus] = useState<Status>("checking");
  const [reason, setReason] = useState("");
  const [order, setOrder] = useState<OrderView | null>(null);

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      setReason("No payment reference was found.");
      return;
    }

    async function verify() {
      try {
        const res = await fetch(
          `/api/checkout/verify?reference=${encodeURIComponent(reference!)}`
        );
        const json = await res.json();

        if (json.paid) {
          clearCart();
          setStatus("paid");

          if (json.key) {
            const result = await fetchOrder({
              reference: reference!,
              key: json.key,
            });

            if (result.order) setOrder(result.order);
          }
        } else {
          setStatus("failed");
          setReason(json.reason ?? "Payment was not completed.");
        }
      } catch {
        setStatus("failed");
        setReason("Could not confirm your payment.");
      }
    }

    verify();
  }, [reference]);

  const first = order?.full_name.trim().split(/\s+/)[0];

  return (
    <div className="mx-auto max-w-xl">
      {status === "checking" && (
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-signal">
            One moment
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Confirming your payment...
          </h1>
        </div>
      )}

      {status === "paid" && (
        <>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-signal">
              Order confirmed
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight">
              {first ? `Thank you, ${first}.` : "Thank you."}
            </h1>

            <p className="mt-4 text-sm leading-7 text-gray-600">
              Your payment went through and your order has been confirmed.
              Keep your order number safe.
            </p>
          </div>

          <div className="mt-10 rounded-sm border border-black/10 border-t-signal p-6" style={{ borderTopWidth: 4 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Order number
            </p>

            <p className="mt-1 text-lg font-bold">{reference}</p>

            {order && (
              <>
                <ul className="mt-5 space-y-2 border-t border-black/10 pt-5 text-sm">
                  {order.items.map((item, index) => (
                    <li key={index} className="flex justify-between gap-4">
                      <span>
                        {item.name} × {item.quantity}
                        {[item.size, item.color].filter(Boolean).length > 0 && (
                          <span className="text-gray-500">
                            {" "}
                            ({[item.size, item.color].filter(Boolean).join(" / ")})
                          </span>
                        )}
                      </span>

                      <span className="font-medium">
                        {formatPrice(item.unit_price * item.quantity, order.currency)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex justify-between border-t border-black/10 pt-5 text-base font-bold">
                  <span>Total paid</span>
                  <span>{formatPrice(order.subtotal, order.currency)}</span>
                </div>

                <p className="mt-5 text-xs leading-6 text-gray-500">
                  Delivering to {order.full_name}, {order.address}, {order.city},{" "}
                  {order.state}, {order.country}.
                </p>
              </>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {order && (
              <>
                <Link
                  href={`/receipt/${encodeURIComponent(order.reference)}?key=${order.key}`}
                  className="rounded-full bg-signal px-8 py-4 text-center text-sm font-semibold text-white transition hover:bg-signal-dark"
                >
                  View receipt
                </Link>

                <Link
                  href={`/order/${encodeURIComponent(order.reference)}?key=${order.key}`}
                  className="rounded-full border border-black px-8 py-4 text-center text-sm font-semibold transition hover:border-signal hover:bg-signal hover:text-white"
                >
                  Track my order
                </Link>
              </>
            )}

            <Link
              href="/shop"
              className="rounded-full border border-black px-8 py-4 text-center text-sm font-semibold transition hover:border-signal hover:bg-signal hover:text-white"
            >
              Keep shopping
            </Link>
          </div>
        </>
      )}

      {status === "failed" && (
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-signal">
            Payment not completed
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Something went wrong.
          </h1>

          <p className="mt-4 text-sm leading-7 text-gray-600">
            {reason} Your cart is still saved, so you can try again.
          </p>

          <div className="mt-10">
            <Link
              href="/cart"
              className="rounded-full bg-signal px-8 py-4 text-sm font-semibold text-white transition hover:bg-signal-dark"
            >
              Back to cart
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <Header />

      <section className="px-6 py-20">
        <Suspense
          fallback={<p className="text-center text-sm text-gray-500">Loading...</p>}
        >
          <SuccessContent />
        </Suspense>
      </section>

      <Footer />
    </main>
  );
}