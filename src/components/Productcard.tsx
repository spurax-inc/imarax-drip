import Link from "next/link";
import { Product, formatPrice, isSoldOut, mainImage } from "@/lib/products";

export default function ProductCard({ product }: { product: Product }) {
  const image = mainImage(product);
  const soldOut = isSoldOut(product);

  return (
    <article className="group">
      <Link href={`/shop/${product.slug}`}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-[#ececec]">
          {image ? (
            <img
              src={image}
              alt={product.name}
              className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
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

          {soldOut ? (
            <span className="absolute left-3 top-3 rounded-full bg-black px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
              Sold out
            </span>
          ) : (
            product.is_featured && (
              <span className="absolute left-3 top-3 rounded-full bg-signal px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                Featured
              </span>
            )
          )}
        </div>
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/shop/${product.slug}`}
            className="font-semibold transition hover:text-signal"
          >
            {product.name}
          </Link>

          <p className="mt-1 text-sm text-gray-500">{product.category}</p>
        </div>

        <p className="font-semibold">
          {formatPrice(product.price, product.currency)}
        </p>
      </div>
    </article>
  );
}