export const PLACEMENTS = ["home", "shop"] as const;

export type CleanAd = {
  title: string;
  advertiser: string | null;
  image_url: string;
  link_url: string | null;
  placement: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

// Links must start with https://, http:// or a single /
export function cleanLink(
  value: unknown
): { ok: true; value: string | null } | { ok: false } {
  if (typeof value !== "string" || value.trim() === "") {
    return { ok: true, value: null };
  }

  const link = value.trim();

  if (link.startsWith("//")) return { ok: false };

  if (
    link.startsWith("https://") ||
    link.startsWith("http://") ||
    link.startsWith("/")
  ) {
    return { ok: true, value: link };
  }

  return { ok: false };
}

function cleanDate(value: unknown, endOfDay: boolean): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  return `${value}T${endOfDay ? "23:59:59" : "00:00:00"}Z`;
}

export function cleanAd(
  body: unknown
): { ok: true; value: CleanAd } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid data." };
  }

  const b = body as Record<string, unknown>;

  const title = typeof b.title === "string" ? b.title.trim() : "";
  if (!title) return { ok: false, error: "Please enter a title." };
  if (title.length > 80) {
    return { ok: false, error: "The title is too long (80 characters max)." };
  }

  const imageUrl = typeof b.image_url === "string" ? b.image_url.trim() : "";
  if (!imageUrl.startsWith("http")) {
    return { ok: false, error: "Please upload a picture for the ad." };
  }

  const placement = typeof b.placement === "string" ? b.placement : "";
  if (!(PLACEMENTS as readonly string[]).includes(placement)) {
    return { ok: false, error: "Please choose where the ad should appear." };
  }

  const link = cleanLink(b.link_url);
  if (!link.ok) {
    return {
      ok: false,
      error: "The link must start with https:// (or / for a page on your site).",
    };
  }

  const advertiser =
    typeof b.advertiser === "string" && b.advertiser.trim() !== ""
      ? b.advertiser.trim().slice(0, 60)
      : null;

  return {
    ok: true,
    value: {
      title,
      advertiser,
      image_url: imageUrl,
      link_url: link.value,
      placement,
      is_active: b.is_active !== false,
      starts_at: cleanDate(b.starts_at, false),
      ends_at: cleanDate(b.ends_at, true),
    },
  };
}