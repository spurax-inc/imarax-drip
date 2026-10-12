"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

type Ad = {
  id: string;
  title: string;
  advertiser: string | null;
  image_url: string;
  link_url: string | null;
  placement: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

type AdForm = {
  title: string;
  advertiser: string;
  image_url: string;
  link_url: string;
  placement: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
};

const emptyAd: AdForm = {
  title: "",
  advertiser: "",
  image_url: "",
  link_url: "",
  placement: "home",
  is_active: true,
  starts_at: "",
  ends_at: "",
};

const placements = [
  { value: "home", label: "Home page (below the products)" },
  { value: "shop", label: "Shop page (at the top)" },
];

const inputClass =
  "w-full rounded-sm border border-black/20 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-signal";

const labelClass =
  "mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500";

function adStatus(ad: Ad) {
  const now = Date.now();

  if (!ad.is_active) return "Paused";
  if (ad.starts_at && new Date(ad.starts_at).getTime() > now) return "Scheduled";
  if (ad.ends_at && new Date(ad.ends_at).getTime() < now) return "Expired";

  return "Live";
}

export default function PromotionsPage() {
  const [supabase] = useState(() => createClient());

  const [status, setStatus] = useState<
    "loading" | "signedout" | "denied" | "ready"
  >("loading");

  const [annText, setAnnText] = useState("");
  const [annLink, setAnnLink] = useState("");
  const [annActive, setAnnActive] = useState(false);
  const [annSaving, setAnnSaving] = useState(false);

  const [ads, setAds] = useState<Ad[]>([]);
  const [form, setForm] = useState<AdForm>(emptyAd);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const api = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const headers = new Headers(init.headers);

      if (token) headers.set("Authorization", `Bearer ${token}`);

      return fetch(path, { ...init, headers });
    },
    [supabase]
  );

  const loadAll = useCallback(async () => {
    const annRes = await api("/api/admin/announcement");

    if (annRes.status === 401 || annRes.status === 403) return false;

    const annJson = await annRes.json();
    const ann = annJson.announcement;

    setAnnText(ann?.text ?? "");
    setAnnLink(ann?.link_url ?? "");
    setAnnActive(ann?.is_active === true);

    const adsRes = await api("/api/admin/ads");
    const adsJson = await adsRes.json();
    setAds(adsJson.ads ?? []);

    return true;
  }, [api]);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setStatus("signedout");
        return;
      }

      const ok = await loadAll();
      setStatus(ok ? "ready" : "denied");
    }

    init();
  }, [supabase, loadAll]);

  function setField<K extends keyof AdForm>(key: K, value: AdForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(emptyAd);
    setEditingId(null);
  }

  async function saveAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    setAnnSaving(true);
    setError("");
    setNotice("");

    const res = await api("/api/admin/announcement", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: annText,
        link_url: annLink,
        is_active: annActive,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Could not save the announcement.");
    } else {
      setNotice("Announcement saved.");
    }

    setAnnSaving(false);
  }

  async function handleUpload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const data = new FormData();
    data.append("file", file);

    const res = await api("/api/admin/upload", { method: "POST", body: data });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Upload failed.");
    } else {
      setField("image_url", json.url);
    }

    setUploading(false);
  }

  async function saveAd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const res = await api(
      editingId ? `/api/admin/ads/${editingId}` : "/api/admin/ads",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Could not save the ad.");
      setSaving(false);
      return;
    }

    setNotice(editingId ? "Ad updated." : "Ad added.");
    resetForm();
    await loadAll();
    setSaving(false);
  }

  function editAd(ad: Ad) {
    setEditingId(ad.id);
    setError("");
    setNotice("");
    setForm({
      title: ad.title,
      advertiser: ad.advertiser ?? "",
      image_url: ad.image_url,
      link_url: ad.link_url ?? "",
      placement: ad.placement,
      is_active: ad.is_active,
      starts_at: ad.starts_at ? ad.starts_at.slice(0, 10) : "",
      ends_at: ad.ends_at ? ad.ends_at.slice(0, 10) : "",
    });

    window.scrollTo({ top: 300, behavior: "smooth" });
  }

  async function toggleAd(ad: Ad) {
    setError("");
    setNotice("");

    const res = await api(`/api/admin/ads/${ad.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: ad.title,
        advertiser: ad.advertiser,
        image_url: ad.image_url,
        link_url: ad.link_url,
        placement: ad.placement,
        is_active: !ad.is_active,
        starts_at: ad.starts_at ? ad.starts_at.slice(0, 10) : "",
        ends_at: ad.ends_at ? ad.ends_at.slice(0, 10) : "",
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Could not update the ad.");
      return;
    }

    await loadAll();
  }

  async function deleteAd(ad: Ad) {
    if (!window.confirm(`Delete the ad "${ad.title}"?`)) return;

    setError("");
    setNotice("");

    const res = await api(`/api/admin/ads/${ad.id}`, { method: "DELETE" });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Could not delete the ad.");
      return;
    }

    setNotice("Ad deleted.");
    if (editingId === ad.id) resetForm();
    await loadAll();
  }

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <Header />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/admin"
            className="text-sm font-semibold underline underline-offset-4 transition hover:text-signal"
          >
            ← Products &amp; orders
          </Link>

          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-signal">
            Admin
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Announcement &amp; ads
          </h1>

          {status === "loading" && (
            <p className="mt-8 text-sm text-gray-500">Loading...</p>
          )}

          {status === "signedout" && (
            <div className="mt-8 rounded-sm bg-ash p-8">
              <p className="text-sm text-gray-600">
                Please sign in with your admin account first.
              </p>

              <Link
                href="/account"
                className="mt-6 inline-block rounded-full bg-signal px-6 py-3 text-sm font-semibold text-white transition hover:bg-signal-dark"
              >
                Go to sign in
              </Link>
            </div>
          )}

          {status === "denied" && (
            <div className="mt-8 rounded-sm bg-ash p-8">
              <p className="text-sm text-gray-600">
                This account does not have admin access.
              </p>
            </div>
          )}

          {status === "ready" && (
            <>
              {error && (
                <p className="mt-6 text-sm font-medium text-signal">{error}</p>
              )}

              {notice && (
                <p className="mt-6 text-sm font-medium text-gray-700">
                  {notice}
                </p>
              )}

              {/* ANNOUNCEMENT BAR */}
              <form
                onSubmit={saveAnnouncement}
                className="mt-8 space-y-5 rounded-sm border border-black/10 p-6"
              >
                <p className="text-lg font-semibold">Announcement bar</p>

                <p className="text-sm text-gray-500">
                  The orange strip at the very top of every page.
                </p>

                <div>
                  <label className={labelClass}>Message</label>
                  <input
                    type="text"
                    value={annText}
                    onChange={(e) => setAnnText(e.target.value)}
                    maxLength={160}
                    placeholder="e.g. New drop this Friday. Free delivery over ₦50,000"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Link (optional)</label>
                  <input
                    type="text"
                    value={annLink}
                    onChange={(e) => setAnnLink(e.target.value)}
                    placeholder="/shop or https://..."
                    className={inputClass}
                  />
                </div>

                <label className="flex items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={annActive}
                    onChange={(e) => setAnnActive(e.target.checked)}
                    className="h-4 w-4 accent-[#d2561f]"
                  />
                  Show the announcement bar
                </label>

                {annText.trim() !== "" && (
                  <div className="rounded-sm bg-signal px-4 py-2.5 text-center text-xs font-semibold tracking-wide text-white">
                    {annText}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={annSaving}
                  className="rounded-full bg-signal px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-signal-dark disabled:opacity-60"
                >
                  {annSaving ? "Saving..." : "Save announcement"}
                </button>
              </form>

              {/* AD FORM */}
              <form
                onSubmit={saveAd}
                className="mt-10 space-y-5 rounded-sm border border-black/10 p-6"
              >
                <p className="text-lg font-semibold">
                  {editingId ? "Edit ad" : "Add a sponsored ad"}
                </p>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Title</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setField("title", e.target.value)}
                      placeholder="e.g. Summer collection by BrandName"
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Advertiser (brand name)</label>
                    <input
                      type="text"
                      value={form.advertiser}
                      onChange={(e) => setField("advertiser", e.target.value)}
                      placeholder="e.g. BrandName"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Image</label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload(e.target.files)}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-full file:border-0 file:bg-signal file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-signal-dark disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    {uploading && (
                      <p className="text-xs font-medium text-gray-500">
                        Uploading image...
                      </p>
                    )}

                    {form.image_url && (
                      <div className="overflow-hidden rounded-sm border border-black/10 bg-ash">
                        <img
                          src={form.image_url}
                          alt={form.title || "Ad preview"}
                          className="h-28 w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Link URL</label>
                  <input
                    type="url"
                    value={form.link_url}
                    onChange={(e) => setField("link_url", e.target.value)}
                    placeholder="https://example.com or /shop"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Placement</label>
                  <select
                    value={form.placement}
                    onChange={(e) => setField("placement", e.target.value)}
                    className={inputClass}
                  >
                    {placements.map((placement) => (
                      <option key={placement.value} value={placement.value}>
                        {placement.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Starts on</label>
                  <input
                    type="date"
                    value={form.starts_at}
                    onChange={(e) => setField("starts_at", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Ends on</label>
                  <input
                    type="date"
                    value={form.ends_at}
                    onChange={(e) => setField("ends_at", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-3 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setField("is_active", e.target.checked)}
                      className="h-4 w-4 accent-[#d2561f]"
                    />
                    Active / live
                  </label>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="rounded-full bg-signal px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-signal-dark disabled:opacity-60"
                  >
                    {saving ? "Saving..." : editingId ? "Update ad" : "Add ad"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-full border border-black/15 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-black/30"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-10">
                <p className="text-lg font-semibold">Current ads</p>

                {ads.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-500">
                    No ads yet. Add one above to start promoting.
                  </p>
                ) : (
                  <div className="mt-5 space-y-4">
                    {ads.map((ad) => (
                      <div
                        key={ad.id}
                        className="rounded-sm border border-black/10 bg-white p-4"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-start gap-4">
                            {ad.image_url && (
                              <img
                                src={ad.image_url}
                                alt={ad.title}
                                className="h-16 w-20 rounded-sm object-cover"
                              />
                            )}

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900">
                                  {ad.title}
                                </p>
                                <span className="rounded-full bg-ash px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-600">
                                  {adStatus(ad)}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-gray-600">
                                {ad.advertiser || "Brand"} · {ad.placement}
                              </p>
                              {ad.link_url && (
                                <a
                                  href={ad.link_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-1 inline-block text-xs font-medium text-signal underline-offset-4 hover:underline"
                                >
                                  View link
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleAd(ad)}
                              className="rounded-full border border-black/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-gray-700 transition hover:border-black/30"
                            >
                              {ad.is_active ? "Pause" : "Resume"}
                            </button>
                            <button
                              type="button"
                              onClick={() => editAd(ad)}
                              className="rounded-full border border-black/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-gray-700 transition hover:border-black/30"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteAd(ad)}
                              className="rounded-full border border-[#d2561f]/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-signal transition hover:bg-[#d2561f]/5"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}