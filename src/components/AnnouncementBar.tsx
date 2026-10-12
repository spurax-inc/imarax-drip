"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Announcement = {
  text: string;
  link_url: string | null;
  is_active: boolean;
};

export default function AnnouncementBar() {
  const [item, setItem] = useState<Announcement | null>(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data } = await supabase
        .from("announcements")
        .select("text, link_url, is_active")
        .eq("id", 1)
        .maybeSingle();

      if (data && data.is_active && data.text.trim() !== "") {
        setItem(data);
      }
    }

    load();
  }, []);

  if (!item || closed) return null;

  const link = item.link_url;

  const message = <span>{item.text}</span>;

  return (
    <div className="relative bg-signal px-10 py-2.5 text-center text-xs font-semibold tracking-wide text-white">
      {link ? (
        link.startsWith("/") ? (
          <Link href={link} className="underline-offset-4 hover:underline">
            {message}
          </Link>
        ) : (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 hover:underline"
          >
            {message}
          </a>
        )
      ) : (
        message
      )}

      <button
        type="button"
        onClick={() => setClosed(true)}
        aria-label="Close announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 px-2 text-base leading-none opacity-80 transition hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}