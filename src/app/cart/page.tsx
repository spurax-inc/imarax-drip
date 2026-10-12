"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  CART_EVENT,
  CartItem,
  getCart,
  removeFromCart,
  updateQuantity,
} from "@/lib/cart";
import { formatPrice } from "@/lib/products";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const load = () => setItems(getCart());

    load();
    window.addEventListener(CART_EVENT, load);

    return () => window.removeEventListener(CART_EVENT, load);
  }, []);

  const currency = items[0]?.currency ?? "NGN";
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <Header />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-signal">
            Your cart
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">Cart</h1>

          {items.length === 0 ? (
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
            <>
              <ul className="mt-10 divide-y divide-black/10 border-y border-black/10">
                {items.map((item) => (
                  <li
                    key={`${item.productId}-${item.size}-${item.color}`}
                    className="flex gap-5 py-6"
                  >
                    <div className="h-28 w-24 shrink-0 overflow-hidden rounded-sm bg-[#ececec]">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex justify-between gap-4">
                        <div>
                          <Link
                            href={`/shop/${item.slug}`}
                            className="font-semibold transition hover:text-signal"
                          >
                            {item.name}
                          </Link>

                          <p className="mt-1 text-sm text-gray-500">
                            {[item.size, item.color].filter(Boolean).join(" / ")}
                          </p>
                        </div>

                        <p className="font-semibold">
                          {formatPrice(item.price * item.quantity, item.currency)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center rounded-full border border-black/20">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.size,
                                item.color,
                                item.quantity - 1
                              )
                            }
                            className="h-10 w-10 text-lg transition hover:text-signal"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>

                          <span className="w-8 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.size,
                                item.color,
                                item.quantity + 1
                              )
                            }
                            className="h-10 w-10 text-lg transition hover:text-signal"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(item.productId, item.size, item.color)
                          }
                          className="text-sm text-gray-500 underline underline-offset-4 transition hover:text-signal"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex items-center justify-between">
                <p className="text-sm text-gray-500">Subtotal</p>
                <p className="text-2xl font-bold">
                  {formatPrice(total, currency)}
                </p>
              </div>

              <Link
                href="/checkout"
                className="mt-8 block w-full rounded-full bg-signal py-4 text-center text-sm font-semibold text-white transition hover:bg-signal-dark"
              >
                Checkout
              </Link>
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}