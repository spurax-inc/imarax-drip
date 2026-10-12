"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { LogoIcon } from "@/components/Logo";
import Wordmark from "@/components/Wordmark";
import { OrderView, fetchOrder } from "@/lib/orderView";
import { formatPrice } from "@/lib/products";

const SUPPORT_EMAIL = "support@imaraxdrip.com";

function ReceiptContent() {
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
    return <p className="p-10 text-sm text-gray-500">Loading your receipt...</p>;
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-md p-10">
        <p className="text-sm text-gray-600">
          {error || "We could not find that receipt."}
        </p>

        <Link
          href="/track"
          className="mt-5 inline-block rounded-full bg-signal px-6 py-3 text-sm font-semibold text-white"
        >
          Find my order
        </Link>
      </div>
    );
  }

  const paid = order.status === "paid";
  const date = new Date(order.paid_at ?? order.created_at).toLocaleString(
    "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <div className="mx-auto max-w-2xl bg-white px-6 py-10 print:px-0 print:py-0">
      {/* BUTTONS (not printed) */}
      <div className="mb-8 flex flex-wrap gap-3 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-signal px-6 py-3 text-sm font-semibold text-white transition hover:bg-signal-dark"
        >
          Print / Save as PDF
        </button>

        <Link
          href={`/order/${encodeURIComponent(order.reference)}?key=${order.key}`}
          className="rounded-full border border-black px-6 py-3 text-sm font-semibold transition hover:border-signal hover:bg-signal hover:text-white"
        >
          Back to my order
        </Link>
      </div>

      {/* RECEIPT */}
      <div
        style={
          {
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          } as React.CSSProperties
        }
      >
        <div className="flex items-center justify-between border-b-4 border-signal pb-6">
          <div className="flex items-center gap-3">
            <LogoIcon size={44} />
            <Wordmark className="text-2xl" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
            Receipt
          </p>
        </div>

        {!paid ? (
          <p className="mt-8 text-sm text-gray-600">
            This order has not been paid, so there is no receipt yet.
          </p>
        ) : (
          <>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Receipt number
                </p>
                <p className="mt-1 text-sm font-bold">{order.reference}</p>

                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Date
                </p>
                <p className="mt-1 text-sm">{date}</p>

                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Payment
                </p>
                <p className="mt-1 text-sm">
                  Paid by card or bank via Paystack{" "}
                  <span className="ml-2 rounded-sm border border-signal px-2 py-0.5 text-xs font-bold text-signal">
                    PAID
                  </span>
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Billed and delivered to
                </p>

                <p className="mt-1 text-sm leading-6">
                  <span className="font-bold">{order.full_name}</span>
                  <br />
                  {order.email}
                  <br />
                  {order.phone}
                  <br />
                  {order.address}
                  <br />
                  {order.city}, {order.state}
                  <br />
                  {order.country}
                </p>
              </div>
            </div>

            <table className="mt-10 w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="py-3 pr-4 font-semibold">Item</th>
                  <th className="py-3 pr-4 text-center font-semibold">Qty</th>
                  <th className="py-3 pr-4 text-right font-semibold">Price</th>
                  <th className="py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-black/10">
                {order.items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-3 pr-4">
                      <p className="font-medium">{item.name}</p>

                      {[item.size, item.color].filter(Boolean).length > 0 && (
                        <p className="text-xs text-gray-500">
                          {[item.size, item.color].filter(Boolean).join(" / ")}
                        </p>
                      )}
                    </td>

                    <td className="py-3 pr-4 text-center">{item.quantity}</td>

                    <td className="py-3 pr-4 text-right">
                      {formatPrice(item.unit_price, order.currency)}
                    </td>

                    <td className="py-3 text-right">
                      {formatPrice(item.unit_price * item.quantity, order.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="border-t-2 border-black">
                  <td colSpan={3} className="py-4 pr-4 text-right font-semibold">
                    Total paid
                  </td>

                  <td className="py-4 text-right text-base font-bold">
                    {formatPrice(order.subtotal, order.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>

            <p className="mt-10 text-center text-sm font-semibold">
              Thank you for shopping with Imarax Drip.
            </p>
          </>
        )}

        <div className="mt-10 border-t border-black/10 pt-6 text-center text-xs text-gray-500">
          Imarax Drip is a brand of Spurax Inc. Questions? {SUPPORT_EMAIL}
        </div>
      </div>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <Suspense
        fallback={<p className="p-10 text-sm text-gray-500">Loading...</p>}
      >
        <ReceiptContent />
      </Suspense>
    </main>
  );
}