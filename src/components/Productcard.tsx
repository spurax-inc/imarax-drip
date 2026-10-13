import Link from "next/link";
import { Product, formatPrice, isSoldOut, mainImage } from "@/lib/products";

// How many products sit in each row.
// Phones: 4 across. Tablets: 3. Computers: 4.
// To change phones to 3 across, change "grid-cols-4" to "grid-cols-3".
export const PRODUCT_GRID =
  "grid grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10";

export default function ProductCard({ product }: { product: Product }) {
  const image = mainImage(product);
  const soldOut = isSoldOut(product);

  return (
    <article className="group min-w-0">
      <Link href={`/shop/${product.slug}`}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-[#ececec]">
          {image ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
                soldOut ? "opacity-60" : ""
              }`}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-gray-400 sm:text-xs sm:tracking-[0.25em]">
                Imarax Drip
              </span>
            </div>
          )}

          {soldOut ? (
            <span className="absolute left-1 top-1 rounded-full bg-black px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wider text-white sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.2em]">
              Sold out
            </span>
          ) : (
            product.is_featured && (
              <span className="absolute left-3 top-3 hidden rounded-full bg-signal px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white sm:block">
                Featured
              </span>
            )
          )}
        </div>
      </Link>

      <div className="mt-1.5 flex flex-col gap-0.5 sm:mt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <Link
            href={`/shop/${product.slug}`}
            className="line-clamp-2 text-[11px] font-semibold leading-tight transition hover:text-signal sm:text-base sm:leading-normal"
          >
            {product.name}
          </Link>

          <p className="mt-0.5 hidden text-sm text-gray-500 sm:block">
            {product.category}
          </p>
        </div>

        <p className="text-[11px] font-bold sm:shrink-0 sm:text-base sm:font-semibold">
          {formatPrice(product.price, product.currency)}
        </p>
      </div>
    </article>
  );
}