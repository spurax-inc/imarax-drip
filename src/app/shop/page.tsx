"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdBanner from "@/components/AdBanner";
import ProductCard from "@/components/Productcard";
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
    <section className="px-6 pb-16 pt-6">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-signal">
          Shop
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          Everything Imarax Drip
        </h1>

        <div className="mt-8 flex flex-wrap gap-3">
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
                className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
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
          <p className="mt-16 text-sm text-gray-500">Loading products...</p>
        ) : visible.length === 0 ? (
          <div className="mt-12 rounded-sm bg-ash px-6 py-20 text-center">
            <p className="text-sm text-gray-500">No products found.</p>
          </div>
        ) : (
          <div className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
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