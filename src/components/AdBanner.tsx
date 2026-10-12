"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Ad = {
  id: string;
  title: string;
  advertiser: string | null;
  image_url: string;
  link_url: string | null;
};

export default function AdBanner({
  placement,
  compact = false,
}: {
  placement: "home" | "shop";
  compact?: boolean;
}) {
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data } = await supabase
        .from("ads")
        .select("id, title, advertiser, image_url, link_url")
        .eq("placement", placement)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setAd(data[Math.floor(Math.random() * data.length)]);
      }
    }

    load();
  }, [placement]);

  if (!ad) return null;

  const picture = (
    <div
      className={`overflow-hidden rounded-sm bg-[#ececec] ${
        compact
          ? "aspect-[16/5] sm:aspect-[16/3]"
          : "aspect-[16/7] sm:aspect-[16/5]"
      }`}
    >
      <img
        src={ad.image_url}
        alt={ad.title}
        className="h-full w-full object-cover"
      />
    </div>
  );

  const external = ad.link_url?.startsWith("http");

  const content = (
    <>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400">
        Sponsored{ad.advertiser ? ` · ${ad.advertiser}` : ""}
      </p>

      {ad.link_url ? (
        <a
          href={ad.link_url}
          {...(external
            ? { target: "_blank", rel: "sponsored noopener noreferrer" }
            : {})}
          className="block transition hover:opacity-90"
        >
          {picture}
        </a>
      ) : (
        picture
      )}
    </>
  );

  if (compact) {
    return <div className="mt-10">{content}</div>;
  }

  return (
    <section className="px-6 py-10">
      <div className="mx-auto max-w-7xl">{content}</div>
    </section>
  );
}
