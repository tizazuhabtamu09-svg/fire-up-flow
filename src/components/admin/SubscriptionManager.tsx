import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/app-config";
import { adminInput } from "@/components/admin/shared";
import { feeOverrides, featureLimits } from "@/lib/subscriptions";
import type { Database } from "@/integrations/supabase/types";

type Pkg = Database["public"]["Tables"]["subscription_packages"]["Row"];
type SubRow = Database["public"]["Tables"]["user_subscriptions"]["Row"] & {
  package: { name: string } | null;
};

const USER_TYPES = [
  { value: "broker", label: "Brokers" },
  { value: "employer", label: "Clients (employers)" },
  { value: "employee", label: "Employees" },
];

const FEE_KEYS = [
  { key: "register_employee", label: "Employee registration fee" },
  { key: "booking", label: "Booking fee" },
  { key: "pro_feature", label: "Pro feature rate" },
];

const emptyForm = {
  name: "",
  description: "",
  user_type: "broker",
  price: "",
  duration_days: "30",
  max_registrations: "",
  freeFees: {} as Record<string, boolean>,
};

function rulesSummary(pkg: Pkg): string {
  const parts: string[] = [];
  const overrides = feeOverrides({ package: pkg } as never);
  for (const [key, value] of Object.entries(overrides)) {
    if (value === 0) parts.push(`free ${FEE_KEYS.find((f) => f.key === key)?.label.toLowerCase() ?? key}`);
  }
  const max = featureLimits({ package: pkg } as never)["max_registrations"];
  if (typeof max === "number" && max > 0) parts.push(`max ${max} registrations`);
  return parts.length ? parts.join(" · ") : "no special rules";
}

/**
 * Admin console for subscription packages: create/edit plans per user type
 * with price, duration, waived fees and feature limits, and grant or revoke
 * subscriptions for individual users. Granting/revoking notifies the user
 * automatically (database trigger).
 */
export function SubscriptionManager() {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [subNames, setSubNames] = useState<Record<string, string>>({});
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [userQuery, setUserQuery] = useState("");
  const [userOptions, setUserOptions] = useState<{ id: string; full_name: string | null; role: string }[]>([]);
  const [grantUser, setGrantUser] = useState<{ id: string; name: string } | null>(null);
  const [grantPkgId, setGrantPkgId] = useState("");

  const load = useCallback(async () => {
    const [{ data: pkgs }, { data: recent }] = await Promise.all([
      supabase.from("subscription_packages").select("*").order("user_type").order("price"),
      supabase
        .from("user_subscriptions")
        .select("*, package:subscription_packages(name)")
        .order("created_at", { ascending: false })
        .limit(12),
    ]);
    setPackages(pkgs ?? []);
    const rows = (recent ?? []) as SubRow[];
    setSubs(rows);
    const ids = [...new Set(rows.map((r) => r.user_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      setSubNames(Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name ?? "Unnamed"])));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  // Debounced user search for the grant form.
  useEffect(() => {
    const q = userQuery.trim();
    if (q.length < 2) {
      setUserOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .ilike("full_name", `%${q}%`)
        .limit(8);
      setUserOptions(data ?? []);
    }, 300);
    return () => clearTimeout(timer);
  }, [userQuery]);

  function startEdit(pkg: Pkg) {
    const overrides = feeOverrides({ package: pkg } as never);
    const max = featureLimits({ package: pkg } as never)["max_registrations"];
    setEditingId(pkg.id);
    setForm({
      name: pkg.name,
      description: pkg.description ?? "",
      user_type: pkg.user_type,
      price: String(pkg.price),
      duration_days: String(pkg.duration_days),
      max_registrations: typeof max === "number" && max > 0 ? String(max) : "",
      freeFees: Object.fromEntries(FEE_KEYS.map((f) => [f.key, overrides[f.key] === 0])),
    });
    setStatus(null);
    setError(null);
  }

  async function savePackage(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = form.name.trim();
    const price = Number(form.price);
    const duration = parseInt(form.duration_days, 10);
    if (!name) return setError("A package name is required.");
    if (!Number.isFinite(price) || price < 0) return setError("Enter a valid price.");
    if (!Number.isInteger(duration) || duration <= 0) return setError("Duration must be a whole number of days.");

    const fee_overrides = Object.fromEntries(Object.entries(form.freeFees).filter(([, v]) => v).map(([k]) => [k, 0]));
    const maxReg = parseInt(form.max_registrations, 10);
    const feature_limits = Number.isInteger(maxReg) && maxReg > 0 ? { max_registrations: maxReg } : {};
    const payload = {
      name,
      description: form.description.trim() || null,
      user_type: form.user_type as Pkg["user_type"],
      price,
      duration_days: duration,
      fee_overrides,
      feature_limits,
    };
    const { error: err } = editingId
      ? await supabase.from("subscription_packages").update(payload).eq("id", editingId)
      : await supabase.from("subscription_packages").insert(payload);
    if (err) return setError(err.message);
    setStatus(editingId ? "Package updated." : "Package created.");
    setForm(emptyForm);
    setEditingId(null);
    load();
  }

  async function toggleActive(pkg: Pkg) {
    const { error: err } = await supabase.from("subscription_packages").update({ active: !pkg.active }).eq("id", pkg.id);
    if (err) return setError(err.message);
    setPackages((p) => p.map((x) => (x.id === pkg.id ? { ...x, active: !pkg.active } : x)));
  }

  async function removePackage(pkg: Pkg) {
    const { error: err } = await supabase.from("subscription_packages").delete().eq("id", pkg.id);
    if (err) return setError(err.message);
    setPackages((p) => p.filter((x) => x.id !== pkg.id));
  }

  async function grant(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const pkg = packages.find((p) => p.id === grantPkgId);
    if (!grantUser) return setError("Search and pick a user first.");
    if (!pkg) return setError("Choose a package to grant.");
    const expires = new Date(Date.now() + pkg.duration_days * 86_400_000).toISOString();
    const { error: err } = await supabase.from("user_subscriptions").insert({
      user_id: grantUser.id,
      package_id: pkg.id,
      status: "active",
      expires_at: expires,
    });
    if (err) return setError(err.message);
    setStatus(`${pkg.name} granted to ${grantUser.name} until ${new Date(expires).toLocaleDateString()}.`);
    setGrantUser(null);
    setUserQuery("");
    setGrantPkgId("");
    load();
  }

  async function revoke(sub: SubRow) {
    const { error: err } = await supabase.from("user_subscriptions").update({ status: "cancelled" }).eq("id", sub.id);
    if (err) return setError(err.message);
    setStatus("Subscription cancelled — the user was notified.");
    load();
  }

  return (
    <div className="space-y-8">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {status && <p className="text-sm text-primary">{status}</p>}

      <div>
        <h2 className="text-lg font-bold">Packages</h2>
        {packages.length === 0 ? (
          <p className="mt-2 text-muted-foreground">No packages yet — create the first one below.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {packages.map((pkg) => (
              <div key={pkg.id} className="card-soft flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-semibold">
                    {pkg.name}
                    <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                      {USER_TYPES.find((u) => u.value === pkg.user_type)?.label ?? pkg.user_type}
                    </span>
                    {!pkg.active && (
                      <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase text-destructive">
                        Inactive
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {money(pkg.price)} · {pkg.duration_days} days · {rulesSummary(pkg)}
                  </p>
                  {pkg.description && <p className="mt-1 text-xs text-muted-foreground">{pkg.description}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => startEdit(pkg)} className="btn-outline-brand text-xs">Edit</button>
                  <button onClick={() => toggleActive(pkg)} className="btn-outline-brand text-xs">
                    {pkg.active ? "Disable" : "Enable"}
                  </button>
                  <button onClick={() => removePackage(pkg)} className="text-xs font-semibold text-destructive hover:underline">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={savePackage} className="card-soft grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="text-lg font-bold sm:col-span-2">{editingId ? "Edit package" : "Create a package"}</h2>
        <input className={adminInput} placeholder="Package name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select className={adminInput} value={form.user_type} onChange={(e) => setForm({ ...form, user_type: e.target.value })}>
          {USER_TYPES.map((u) => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </select>
        <input className={adminInput} type="number" min={0} placeholder="Price in ETB" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input className={adminInput} type="number" min={1} placeholder="Duration (days)" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} />
        <input className={`${adminInput} sm:col-span-2`} placeholder="Short description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input
          className={`${adminInput} sm:col-span-2`}
          type="number"
          min={1}
          placeholder="Max registrations per period (optional — leave empty for unlimited)"
          value={form.max_registrations}
          onChange={(e) => setForm({ ...form, max_registrations: e.target.value })}
        />
        <fieldset className="rounded-xl border border-border p-4 sm:col-span-2">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Waived fees</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {FEE_KEYS.map((f) => (
              <label key={f.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(form.freeFees[f.key])}
                  onChange={(e) => setForm({ ...form, freeFees: { ...form.freeFees, [f.key]: e.target.checked } })}
                />
                Free {f.label.toLowerCase()}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex gap-2 sm:col-span-2">
          <button className="btn-brand text-sm">{editingId ? "Save changes" : "Create package"}</button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="btn-outline-brand text-sm">
              Cancel
            </button>
          )}
        </div>
      </form>

      <form onSubmit={grant} className="card-soft grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="text-lg font-bold sm:col-span-2">Grant a subscription</h2>
        <div className="relative">
          <input
            className={adminInput}
            placeholder="Search user by name…"
            value={grantUser ? grantUser.name : userQuery}
            onChange={(e) => {
              setGrantUser(null);
              setUserQuery(e.target.value);
            }}
          />
          {userOptions.length > 0 && !grantUser && (
            <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-card shadow-lg">
              {userOptions.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setGrantUser({ id: u.id, name: u.full_name ?? "Unnamed" });
                      setUserOptions([]);
                    }}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                  >
                    {u.full_name ?? "Unnamed"} <span className="text-xs text-muted-foreground">· {u.role}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <select className={adminInput} value={grantPkgId} onChange={(e) => setGrantPkgId(e.target.value)}>
          <option value="">Choose a package…</option>
          {packages
            .filter((p) => p.active)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {money(p.price)} / {p.duration_days}d
              </option>
            ))}
        </select>
        <button className="btn-brand text-sm sm:col-span-2">Grant subscription</button>
      </form>

      <div>
        <h2 className="text-lg font-bold">Recent subscriptions</h2>
        {subs.length === 0 ? (
          <p className="mt-2 text-muted-foreground">No subscriptions granted yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {subs.map((s) => (
              <div key={s.id} className="card-soft flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-semibold">
                    {subNames[s.user_id] ?? "User"} — {s.package?.name ?? "Package"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.starts_at).toLocaleDateString()} → {new Date(s.expires_at).toLocaleDateString()} ·{" "}
                    <span className="capitalize">{s.status}</span>
                  </p>
                </div>
                {s.status === "active" && new Date(s.expires_at) > new Date() && (
                  <button onClick={() => revoke(s)} className="btn-outline-brand text-xs">Cancel</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
