"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";
import {
  PRODUCT_COLUMNS,
  Product,
  formatPrice,
  isSoldOut,
  normalizeProduct,
} from "@/lib/products";
import { addToCart } from "@/lib/cart";

function ProductContent() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (fetchError) console.error(fetchError);

      setProduct(data ? normalizeProduct(data) : null);
      setLoading(false);
    }

    load();
  }, [slug]);

  const soldOut = product ? isSoldOut(product) : false;

  function handleAdd() {
    if (!product || soldOut) return;

    if (product.sizes.length > 0 && !size) {
      setError("Please choose a size.");
      setAdded(false);
      return;
    }

    if (product.colors.length > 0 && !color) {
      setError("Please choose a color.");
      setAdded(false);
      return;
    }

    setError("");

    const image = product.images[0] ?? product.image_url;

    addToCart({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      currency: product.currency,
      imageUrl: image,
      size,
      color,
      quantity: 1,
    });

    setAdded(true);
  }

  const gallery = product
    ? product.images.length > 0
      ? product.images
      : product.image_url
      ? [product.image_url]
      : []
    : [];

  const buttonClass = `rounded-full py-3.5 text-sm font-semibold text-white transition ${
    soldOut ? "cursor-not-allowed bg-gray-400" : "bg-signal hover:bg-signal-dark"
  }`;

  return (
    <section className="px-4 pb-28 pt-6 sm:px-6 md:py-12">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/shop"
          className="text-sm font-semibold underline underline-offset-4 transition hover:text-signal"
        >
          ← Back to shop
        </Link>

        {loading ? (
          <p className="mt-10 text-sm text-gray-500">Loading...</p>
        ) : !product ? (
          <div className="mt-10 rounded-sm bg-ash px-6 py-16 text-center">
            <p className="text-sm text-gray-500">Product not found.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 md:mt-10 md:grid-cols-2 md:gap-12">
            {/* IMAGES */}
            <div>
              {/* Phones: swipe sideways */}
              <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 md:hidden">
                {gallery.length > 0 ? (
                  gallery.map((src) => (
                    <div
                      key={src}
                      className="aspect-[4/5] w-[78%] shrink-0 snap-center overflow-hidden rounded-sm bg-[#ececec]"
                    >
                      <img
                        src={src}
                        alt={product.name}
                        className={`h-full w-full object-cover ${
                          soldOut ? "opacity-60" : ""
                        }`}
                      />
                    </div>
                  ))
                ) : (
                  <div className="flex aspect-[4/5] w-full items-center justify-center rounded-sm bg-[#ececec]">
                    <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
                      Imarax Drip
                    </span>
                  </div>
                )}
              </div>

              {/* Computers: big picture with thumbnails */}
              <div className="hidden md:block">
                <div className="aspect-[4/5] overflow-hidden rounded-sm bg-[#ececec]">
                  {gallery[activeImage] ? (
                    <img
                      src={gallery[activeImage]}
                      alt={product.name}
                      className={`h-full w-full object-cover ${
                        soldOut ? "opacity-60" : ""
                      }`}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
                        Imarax Drip
                      </span>
                    </div>
                  )}
                </div>

                {gallery.length > 1 && (
                  <div className="mt-4 flex gap-3">
                    {gallery.map((src, index) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        className={`h-20 w-16 overflow-hidden rounded-sm border-2 ${
                          index === activeImage
                            ? "border-signal"
                            : "border-transparent"
                        }`}
                      >
                        <img
                          src={src}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* DETAILS */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-signal">
                {product.category}
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl md:mt-3 md:text-4xl">
                {product.name}
              </h1>

              <p className="mt-3 text-xl font-semibold md:mt-4 md:text-2xl">
                {formatPrice(product.price, product.currency)}
              </p>

              {product.sizes.length > 0 && (
                <div className="mt-6 md:mt-8">
                  <p className="text-sm font-semibold">Size</p>

                  <div className="mt-3 flex flex-wrap gap-2 md:gap-3">
                    {product.sizes.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setSize(item)}
                        className={`min-w-11 rounded-full border px-4 py-2 text-sm font-semibold transition md:py-2.5 ${
                          size === item
                            ? "border-signal bg-signal text-white"
                            : "border-black/20 hover:border-signal"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.colors.length > 0 && (
                <div className="mt-5 md:mt-6">
                  <p className="text-sm font-semibold">Color</p>

                  <div className="mt-3 flex flex-wrap gap-2 md:gap-3">
                    {product.colors.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setColor(item)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition md:px-5 md:py-2.5 ${
                          color === item
                            ? "border-signal bg-signal text-white"
                            : "border-black/20 hover:border-signal"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p className="mt-5 text-sm font-medium text-signal">{error}</p>
              )}

              {added && !soldOut && (
                <p className="mt-5 text-sm">
                  Added to your cart.{" "}
                  <Link
                    href="/cart"
                    className="font-semibold text-signal underline underline-offset-4"
                  >
                    View cart
                  </Link>
                </p>
              )}

              {/* Computers: normal button */}
              <button
                type="button"
                onClick={handleAdd}
                disabled={soldOut}
                className={`mt-8 hidden w-full md:block md:py-4 ${buttonClass}`}
              >
                {soldOut ? "Sold out" : "Add to cart"}
              </button>

              {product.description && (
                <p className="mt-8 text-sm leading-7 text-gray-600 md:text-base md:leading-8">
                  {product.description}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Phones: bar fixed to the bottom of the screen */}
      {product && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-black/10 bg-white px-4 py-3 md:hidden">
          <div className="shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              Price
            </p>
            <p className="text-base font-bold">
              {formatPrice(product.price, product.currency)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            className={`flex-1 ${buttonClass}`}
          >
            {soldOut ? "Sold out" : "Add to cart"}
          </button>
        </div>
      )}
    </section>
  );
}

export default function ProductPage() {
  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <Header />

      <Suspense
        fallback={<p className="px-6 py-16 text-sm text-gray-500">Loading...</p>}
      >
        <ProductContent />
      </Suspense>

      <Footer />
    </main>
  );
}