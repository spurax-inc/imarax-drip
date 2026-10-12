import Link from "next/link";

const PRINTIFY_URL = "https://printify.com/app/";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/catalog", label: "Catalog" },
  { href: "/admin/add", label: "Add a product" },
  { href: "/admin/orders", label: "Fulfilment" },
  { href: "/admin/printify", label: "Printify" },
  { href: "/admin/promotions", label: "Announcement & ads" },
];

export default function AdminNav({ active }: { active: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`rounded-full border px-5 py-2 text-sm font-semibold transition ${
            item.href === active
              ? "border-signal bg-signal text-white"
              : "border-black/20 hover:border-signal"
          }`}
        >
          {item.label}
        </Link>
      ))}

      <a
        href={PRINTIFY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-black bg-black px-5 py-2 text-sm font-semibold text-white transition hover:border-signal hover:bg-signal"
      >
        Open Printify ↗
      </a>
    </div>
  );
}