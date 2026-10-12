import Link from "next/link";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import Footer from "@/components/Footer";

const collections = [
  { name: "Clothing", text: "Tops, bottoms, sets and outerwear." },
  { name: "Footwear", text: "Sneakers, sandals and everyday pairs." },
  { name: "Accessories", text: "Caps, bags and the finishing touches." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <Header />
      <Hero />
      <FeaturedProducts />

      <section id="collections" className="bg-ash px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-signal">
            Collections
          </p>

          <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Shop by category
          </h2>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {collections.map((item) => (
              <Link
                key={item.name}
                href={`/shop?category=${encodeURIComponent(item.name)}`}
                className="group rounded-sm border-t-4 border-transparent bg-white p-8 transition hover:-translate-y-1 hover:border-signal hover:shadow-lg"
              >
                <p className="text-lg font-semibold">{item.name}</p>

                <p className="mt-3 text-sm leading-6 text-gray-500">
                  {item.text}
                </p>

                <span className="mt-8 inline-block text-sm font-semibold text-signal underline underline-offset-4">
                  Explore →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}