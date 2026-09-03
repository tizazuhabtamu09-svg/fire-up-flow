import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { money, type SectorType } from "@/lib/app-config";
import { usePricing } from "@/lib/pricing";
import { SectorSelect } from "@/components/SectorSelect";
import { CityPicker } from "@/components/CityPicker";
import { EMPLOYMENT_TYPES, useJobAccess } from "@/lib/jobs";

export const Route = createFileRoute("/_authenticated/post-job")({
  head: () => ({
    meta: [
      { title: "Post a job — Agaze/አጋዝ" },
      { name: "description", content: "Employers: create a job listing, pay the posting fee and publish after review." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PostJobPage,
});

const cls = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none focus:border-primary";

function PostJobPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const access = useJobAccess(user?.id);
  const { prices } = usePricing(user?.id);
  const fee = Number(prices["job_post"] ?? 0);

  const [form, setForm] = useState({
    title: "",
    sector: "" as SectorType | "",
    sectorOther: "",
    employmentType: "full_time",
    companyName: "",
    closingDate: "",
    salary: "",
    salaryMax: "",
    openings: "1",
    city: "",
    subCity: "",
    area: "",
    contactPhone: "",
    description: "",
    requirements: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.title.trim() || !form.description.trim()) return setError("A title and description are required.");
    setSaving(true);
    setError(null);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    const { data, error: err } = await supabase
      .from("job_posts")
      .insert({
        employer_id: user.id,
        employer_name: profile?.full_name ?? null,
        title: form.title.trim(),
        sector: form.sector || null,
        sector_other: form.sectorOther.trim() || null,
        employment_type: form.employmentType,
        company_name: form.companyName.trim() || null,
        closing_date: form.closingDate || null,
        salary: form.salary ? Number(form.salary) : null,
        salary_max: form.salaryMax ? Number(form.salaryMax) : null,
        openings: Number(form.openings) || 1,
        city: form.city.trim() || null,
        sub_city: form.subCity.trim() || null,
        area: form.area.trim() || null,
        contact_phone: form.contactPhone.trim() || profile?.phone || null,
        description: form.description.trim(),
        requirements: form.requirements.trim() || null,
        fee_amount: fee,
        status: fee > 0 ? "awaiting_payment" : "pending_approval",
      })
      .select("id")
      .single();

    setSaving(false);
    if (err || !data) return setError(err?.message ?? "Could not save the job.");

    if (fee > 0) {
      navigate({ to: "/payment", search: { purpose: "job_post", amount: fee, job: data.id } });
    } else {
      navigate({ to: "/my-jobs" });
    }
  }

  if (access.loading) return <p className="text-muted-foreground">Checking permissions…</p>;
  if (!access.canPost)
    return (
      <div className="card-soft p-10 text-center">
        <h1 className="text-2xl font-bold">Employers only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Job posting is available to employer and staff accounts.
        </p>
        <Link to="/dashboard" className="btn-brand mt-6 inline-block text-sm">Back to dashboard</Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Post a job</h1>
      <p className="font-amharic text-muted-foreground">ስራ ይለጥፉ</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Fill in the details, pay the posting fee of{" "}
        <span className="font-semibold text-foreground">{money(fee)}</span>, then our team reviews the
        listing before it goes live.
      </p>

      <form onSubmit={submit} className="card-soft mt-6 space-y-5 p-6">
        <label className="block">
          <span className="text-sm font-medium">Job title *</span>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} required className={cls} placeholder="e.g. Live-in house maid" />
        </label>

        <SectorSelect
          value={form.sector}
          other={form.sectorOther}
          onChange={(v) => set("sector", v)}
          onOtherChange={(v) => set("sectorOther", v)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Employment type</span>
            <select value={form.employmentType} onChange={(e) => set("employmentType", e.target.value)} className={cls}>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Company / organisation</span>
            <input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} className={cls} placeholder="e.g. Agaze Facility Services" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Closing date</span>
            <input type="date" value={form.closingDate} onChange={(e) => set("closingDate", e.target.value)} className={cls} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Monthly salary (ETB)</span>
            <input type="number" min={0} value={form.salary} onChange={(e) => set("salary", e.target.value)} className={cls} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Maximum salary (optional)</span>
            <input type="number" min={0} value={form.salaryMax} onChange={(e) => set("salaryMax", e.target.value)} className={cls} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Openings</span>
            <input type="number" min={1} value={form.openings} onChange={(e) => set("openings", e.target.value)} className={cls} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Contact phone</span>
            <input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} className={cls} placeholder="+251…" />
          </label>
        </div>

        <CityPicker value={form.city} onChange={(v) => set("city", v)} label="City" />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Sub city</span>
            <input value={form.subCity} onChange={(e) => set("subCity", e.target.value)} className={cls} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Area</span>
            <input value={form.area} onChange={(e) => set("area", e.target.value)} className={cls} />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Job description *</span>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={6}
            required
            className={cls}
            placeholder="Describe the daily duties, working hours, household size, benefits…"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Requirements (optional)</span>
          <textarea value={form.requirements} onChange={(e) => set("requirements", e.target.value)} rows={4} className={cls} />
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <button disabled={saving} className="btn-brand w-full disabled:opacity-60">
          {saving ? "Saving…" : fee > 0 ? `Proceed to Post — ${money(fee)}` : "Proceed to Post"}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          You will be taken to the payment page. After payment your job waits for staff approval.
        </p>
      </form>
    </div>
  );
}
