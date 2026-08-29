import { useState } from "react";
import { adminInput } from "@/components/admin/shared";
import {
  BANNER_PLACEMENTS,
  createBanner,
  deleteBanner,
  placementLabel,
  updateBanner,
  uploadBannerImage,
  useAllBanners,
  type BannerInput,
  type BannerWithUrls,
} from "@/lib/banners";

const empty: BannerInput = {
  title: "",
  subtitle: "",
  body: "",
  cta_label: "",
  cta_link: "",
  desktop_image: null,
  mobile_image: null,
  kind: "graphic",
  placement: "home_hero",
  active: true,
  sort_order: 0,
  starts_at: null,
  ends_at: null,
};

export function BannerManager({ userId }: { userId: string | null }) {
  const { banners, loading, reload } = useAllBanners();
  const [form, setForm] = useState<BannerInput>(empty);
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function set<K extends keyof BannerInput>(key: K, value: BannerInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (form.kind === "graphic" && !desktopFile && !mobileFile) {
        throw new Error("Upload at least one graphic (desktop or mobile).");
      }
      const desktop_image = desktopFile ? await uploadBannerImage(desktopFile, "desktop") : null;
      const mobile_image = mobileFile ? await uploadBannerImage(mobileFile, "mobile") : null;
      await createBanner(
        {
          ...form,
          title: form.title || null,
          subtitle: form.subtitle || null,
          body: form.body || null,
          cta_label: form.cta_label || null,
          cta_link: form.cta_link || null,
          desktop_image,
          mobile_image,
        },
        userId,
      );
      setForm(empty);
      setDesktopFile(null);
      setMobileFile(null);
      setMessage("Banner published.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(row: BannerWithUrls) {
    setError(null);
    try {
      await updateBanner(row.id, { active: !row.active });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function move(row: BannerWithUrls, delta: number) {
    try {
      await updateBanner(row.id, { sort_order: row.sort_order + delta });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function remove(row: BannerWithUrls) {
    if (!window.confirm("Delete this banner permanently?")) return;
    try {
      await deleteBanner(row);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <form onSubmit={submit} className="card-soft grid gap-4 p-5 md:grid-cols-2">
        <label className="block text-sm font-semibold">
          Banner type
          <select
            value={form.kind}
            onChange={(e) => set("kind", e.target.value)}
            className={`${adminInput} mt-1 font-normal`}
          >
            <option value="graphic">Graphic / image advertisement</option>
            <option value="text">Text banner (headline + message)</option>
          </select>
        </label>

        <label className="block text-sm font-semibold">
          Where it shows
          <select
            value={form.placement}
            onChange={(e) => set("placement", e.target.value)}
            className={`${adminInput} mt-1 font-normal`}
          >
            {BANNER_PLACEMENTS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold">
          Headline / title
          <input
            value={form.title ?? ""}
            onChange={(e) => set("title", e.target.value)}
            maxLength={120}
            className={`${adminInput} mt-1 font-normal`}
          />
        </label>

        <label className="block text-sm font-semibold">
          Small label above headline
          <input
            value={form.subtitle ?? ""}
            onChange={(e) => set("subtitle", e.target.value)}
            maxLength={80}
            className={`${adminInput} mt-1 font-normal`}
          />
        </label>

        <label className="block text-sm font-semibold md:col-span-2">
          Message
          <textarea
            value={form.body ?? ""}
            onChange={(e) => set("body", e.target.value)}
            rows={3}
            className={`${adminInput} mt-1 font-normal`}
          />
        </label>

        <label className="block text-sm font-semibold">
          Button label (optional)
          <input
            value={form.cta_label ?? ""}
            onChange={(e) => set("cta_label", e.target.value)}
            className={`${adminInput} mt-1 font-normal`}
          />
        </label>

        <label className="block text-sm font-semibold">
          Link (e.g. /jobs or https://…)
          <input
            value={form.cta_link ?? ""}
            onChange={(e) => set("cta_link", e.target.value)}
            className={`${adminInput} mt-1 font-normal`}
          />
        </label>

        <label className="block text-sm font-semibold">
          Desktop graphic (wide, e.g. 1600×500)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setDesktopFile(e.target.files?.[0] ?? null)}
            className={`${adminInput} mt-1 font-normal`}
          />
        </label>

        <label className="block text-sm font-semibold">
          Mobile graphic (tall, e.g. 800×800)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setMobileFile(e.target.files?.[0] ?? null)}
            className={`${adminInput} mt-1 font-normal`}
          />
        </label>

        <label className="block text-sm font-semibold">
          Start showing (optional)
          <input
            type="datetime-local"
            onChange={(e) => set("starts_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
            className={`${adminInput} mt-1 font-normal`}
          />
        </label>

        <label className="block text-sm font-semibold">
          Stop showing (optional)
          <input
            type="datetime-local"
            onChange={(e) => set("ends_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
            className={`${adminInput} mt-1 font-normal`}
          />
        </label>

        <div className="flex items-center gap-3 md:col-span-2">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
            />
            Show immediately
          </label>
          <button disabled={busy} className="btn-brand text-sm disabled:opacity-60">
            {busy ? "Publishing…" : "Publish banner"}
          </button>
        </div>
      </form>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}

      <h3 className="mt-8 text-sm font-bold uppercase tracking-widest text-muted-foreground">
        Banners
      </h3>
      {loading && <p className="mt-3 text-sm text-muted-foreground">Loading…</p>}
      {!loading && banners.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">No banners yet.</p>
      )}
      <div className="mt-3 space-y-3">
        {banners.map((b) => (
          <div key={b.id} className="card-soft flex flex-wrap items-center gap-4 p-4">
            <div className="flex gap-2">
              {b.desktopUrl && (
                <img src={b.desktopUrl} alt="Desktop artwork" className="h-16 w-28 rounded-lg object-cover" />
              )}
              {b.mobileUrl && (
                <img src={b.mobileUrl} alt="Mobile artwork" className="h-16 w-16 rounded-lg object-cover" />
              )}
            </div>
            <div className="min-w-[12rem] flex-1">
              <p className="font-semibold">{b.title || "(untitled banner)"}</p>
              <p className="text-xs text-muted-foreground">
                {placementLabel(b.placement)} · {b.kind === "graphic" ? "Graphic" : "Text"} · order{" "}
                {b.sort_order}
              </p>
              {b.cta_link && <p className="text-xs text-muted-foreground">→ {b.cta_link}</p>}
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                b.active ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"
              }`}
            >
              {b.active ? "Live" : "Hidden"}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => move(b, -1)} className="btn-outline-brand text-xs">↑</button>
              <button onClick={() => move(b, 1)} className="btn-outline-brand text-xs">↓</button>
              <button onClick={() => toggle(b)} className="btn-outline-brand text-xs">
                {b.active ? "Hide" : "Show"}
              </button>
              <button onClick={() => remove(b)} className="btn-outline-brand text-xs text-destructive">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
