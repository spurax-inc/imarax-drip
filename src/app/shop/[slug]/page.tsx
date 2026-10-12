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
      return;
    }

    if (product.colors.length > 0 && !color) {
      setError("Please choose a color.");
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

  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/shop"
          className="text-sm font-semibold underline underline-offset-4 transition hover:text-signal"
        >
          ← Back to shop
        </Link>

        {loading ? (
          <p className="mt-12 text-sm text-gray-500">Loading...</p>
        ) : !product ? (
          <div className="mt-12 rounded-sm bg-ash px-6 py-20 text-center">
            <p className="text-sm text-gray-500">Product not found.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-12 md:grid-cols-2">
            {/* IMAGES */}
            <div>
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

            {/* DETAILS */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-signal">
                {product.category}
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight">
                {product.name}
              </h1>

              <p className="mt-4 text-2xl font-semibold">
                {formatPrice(product.price, product.currency)}
              </p>

              {product.description && (
                <p className="mt-6 leading-8 text-gray-600">
                  {product.description}
                </p>
              )}

              {product.sizes.length > 0 && (
                <div className="mt-8">
                  <p className="text-sm font-semibold">Size</p>

                  <div className="mt-3 flex flex-wrap gap-3">
                    {product.sizes.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setSize(item)}
                        className={`min-w-12 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
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
                <div className="mt-6">
                  <p className="text-sm font-semibold">Color</p>

                  <div className="mt-3 flex flex-wrap gap-3">
                    {product.colors.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setColor(item)}
                        className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
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
                <p className="mt-6 text-sm font-medium text-signal">{error}</p>
              )}

              <button
                type="button"
                onClick={handleAdd}
                disabled={soldOut}
                className={`mt-8 w-full rounded-full py-4 text-sm font-semibold text-white transition ${
                  soldOut
                    ? "cursor-not-allowed bg-gray-400"
                    : "bg-signal hover:bg-signal-dark"
                }`}
              >
                {soldOut ? "Sold out" : "Add to cart"}
              </button>

              {added && !soldOut && (
                <p className="mt-4 text-sm">
                  Added to your cart.{" "}
                  <Link
                    href="/cart"
                    className="font-semibold text-signal underline underline-offset-4"
                  >
                    View cart
                  </Link>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
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