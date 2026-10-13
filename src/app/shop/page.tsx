"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdBanner from "@/components/AdBanner";
import ProductCard, { PRODUCT_GRID } from "@/components/Productcard";
import { createClient } from "@/lib/supabase/client";
import { PRODUCT_COLUMNS, Product, normalizeProduct } from "@/lib/products";

const categories = ["All", "Clothing", "Footwear", "Accessories"];

function ShopContent() {
  const params = useSearchParams();
  const activeCategory = params.get("category") ?? "All";
  const search = (params.get("search") ?? "").toLowerCase();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setProducts((data ?? []).map(normalizeProduct));
      }

      setLoading(false);
    }

    load();
  }, []);

  const visible = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        activeCategory === "All" || p.category === activeCategory;
      const matchSearch =
        !search || p.name.toLowerCase().includes(search);

      return matchCategory && matchSearch;
    });
  }, [products, activeCategory, search]);

  return (
    <section className="px-3 pb-14 pt-6 sm:px-6 sm:pb-16">
      <div className="mx-auto max-w-7xl">
        <div className="px-1 sm:px-0">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-signal">
            Shop
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:mt-3 sm:text-4xl md:text-5xl">
            Everything Imarax Drip
          </h1>
        </div>

        <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto px-1 pb-1 sm:mt-8 sm:flex-wrap sm:gap-3 sm:px-0">
          {categories.map((category) => {
            const active = category === activeCategory;

            return (
              <Link
                key={category}
                href={
                  category === "All"
                    ? "/shop"
                    : `/shop?category=${encodeURIComponent(category)}`
                }
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition sm:px-5 sm:py-2.5 ${
                  active
                    ? "border-signal bg-signal text-white"
                    : "border-black/20 hover:border-signal"
                }`}
              >
                {category}
              </Link>
            );
          })}
        </div>

        {loading ? (
          <p className="mt-10 px-1 text-sm text-gray-500">Loading products...</p>
        ) : visible.length === 0 ? (
          <div className="mt-10 rounded-sm bg-ash px-6 py-16 text-center">
            <p className="text-sm text-gray-500">No products found.</p>
          </div>
        ) : (
          <div className={`mt-6 sm:mt-12 ${PRODUCT_GRID}`}>
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <Header />

      <AdBanner placement="shop" />

      <Suspense
        fallback={<p className="px-6 py-16 text-sm text-gray-500">Loading...</p>}
      >
        <ShopContent />
      </Suspense>

      <Footer />
    </main>
  );
}