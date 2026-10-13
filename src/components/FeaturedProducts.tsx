"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard, { PRODUCT_GRID } from "./Productcard";
import AdBanner from "./AdBanner";
import { createClient } from "@/lib/supabase/client";
import { PRODUCT_COLUMNS, Product, normalizeProduct } from "@/lib/products";

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) {
        console.error(error);
      } else {
        setProducts((data ?? []).map(normalizeProduct));
      }

      setLoading(false);
    }

    load();
  }, []);

  return (
    <section id="products" className="bg-white px-3 py-12 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between gap-4 px-1 sm:px-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-signal">
              Featured
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:mt-3 sm:text-4xl md:text-5xl">
              The latest drops
            </h2>
          </div>

          <Link
            href="/shop"
            className="shrink-0 text-sm font-semibold underline underline-offset-4 transition hover:text-signal"
          >
            View all
          </Link>
        </div>

        <AdBanner placement="home" compact />

        {loading ? (
          <p className="mt-10 px-1 text-sm text-gray-500">Loading products...</p>
        ) : products.length === 0 ? (
          <div className="mt-10 rounded-sm bg-ash px-6 py-16 text-center">
            <p className="text-sm text-gray-500">New products are coming soon.</p>
          </div>
        ) : (
          <div className={`mt-6 sm:mt-12 ${PRODUCT_GRID}`}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}