import { useLanguage } from "@/lib/i18n";import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { openSigned, uploadFile } from "@/lib/uploads";
import { AdminSection } from "@/components/admin/shared";
import { ChangeRequestQueue } from "@/components/admin/ChangeRequestQueue";

export const Route = createFileRoute("/_authenticated/admin/documents")({
  component: AdminDocuments
});

type DocTable = "applications" | "workers" | "broker_employers" | "employee_profiles";

type Doc = {
  label: string;
  bucket: string;
  path: string;
  table: DocTable;
  rowId: string;
  column: string;
};

type Person = {key: string;name: string;subtitle: string;docs: Doc[];};

async function setDocPath(table: DocTable, rowId: string, column: string, value: string | null) {
  const query = supabase.from(table) as unknown as {
    update: (v: Record<string, string | null>) => {
      eq: (c: string, v: string) => Promise<{error: {message: string;} | null;}>;
    };
  };
  return query.update({ [column]: value }).eq("id", rowId);
}

function AdminDocuments() {const { t } = useLanguage();
  const [people, setPeople] = useState<Person[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const pending = useRef<Doc | null>(null);

  const load = useCallback(async () => {
    const [apps, profiles, employees, workers, employers] = await Promise.all([
    supabase.from("applications").select("*"),
    supabase.from("profiles").select("id, full_name, phone, role"),
    supabase.from("employee_profiles").select("*"),
    supabase.from("workers").select("*"),
    supabase.from("broker_employers").select("*")]
    );

    const nameById = new Map((profiles.data ?? []).map((p) => [p.id, p.full_name ?? "Unnamed user"]));
    const next: Person[] = [];

    for (const a of apps.data ?? []) {
      const docs: Doc[] = [
      a.fayda_front && { label: "Fayda front", bucket: "id-documents", path: a.fayda_front, table: "applications" as const, rowId: a.id, column: "fayda_front" },
      a.fayda_back && { label: "Fayda back", bucket: "id-documents", path: a.fayda_back, table: "applications" as const, rowId: a.id, column: "fayda_back" },
      a.personal_photo && { label: "Personal photo", bucket: "avatars", path: a.personal_photo, table: "applications" as const, rowId: a.id, column: "personal_photo" }].
      filter(Boolean) as Doc[];

      const emp = (employees.data ?? []).find((e) => e.application_id === a.id);
      if (emp) {
        for (const [label, column, bucket] of [
        ["ID front", "id_photo_front", "id-documents"],
        ["ID back", "id_photo_back", "id-documents"],
        ["Contract", "contract_path", "id-documents"],
        ["Profile photo", "photo_url", "avatars"]] as
        const) {
          const value = emp[column];
          if (value) docs.push({ label, bucket, path: value, table: "employee_profiles", rowId: emp.id, column });
        }
      }

      if (docs.length)
      next.push({
        key: `app-${a.id}`,
        name: a.full_name || nameById.get(a.user_id) || "Applicant",
        subtitle: `${a.role} application${a.phone ? ` · ${a.phone}` : ""}`,
        docs
      });
    }

    for (const w of workers.data ?? []) {
      const docs: Doc[] = [];
      for (const [label, column, bucket] of [
      ["Fayda front", "fayda_front", "id-documents"],
      ["Fayda back", "fayda_back", "id-documents"],
      ["Contract", "contract_path", "id-documents"],
      ["Photo", "photo_url", "avatars"]] as
      const) {
        const value = w[column];
        if (value) docs.push({ label, bucket, path: value, table: "workers", rowId: w.id, column });
      }
      if (docs.length) next.push({ key: `worker-${w.id}`, name: w.full_name, subtitle: `Worker${w.phone ? ` · ${w.phone}` : ""}`, docs });
    }

    for (const e of employers.data ?? []) {
      const docs: Doc[] = [];
      for (const [label, column, bucket] of [
      ["Fayda front", "fayda_front", "id-documents"],
      ["Fayda back", "fayda_back", "id-documents"],
      ["Personal photo", "personal_photo", "avatars"]] as
      const) {
        const value = e[column];
        if (value) docs.push({ label, bucket, path: value, table: "broker_employers", rowId: e.id, column });
      }
      if (docs.length)
      next.push({ key: `employer-${e.id}`, name: e.full_name, subtitle: `Employer via broker${e.phone ? ` · ${e.phone}` : ""}`, docs });
    }

    setPeople(next);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startReplace(doc: Doc) {
    pending.current = doc;
    fileInput.current?.click();
  }

  async function onFile(file: File | undefined) {
    const doc = pending.current;
    pending.current = null;
    if (!file || !doc) return;
    setBusy(doc.path);
    setError(null);
    try {
      const path = await uploadFile(doc.bucket, doc.rowId, doc.column, file);
      const { error: err } = await setDocPath(doc.table, doc.rowId, doc.column, path);
      if (err) throw new Error(err.message);
      await supabase.storage.from(doc.bucket).remove([doc.path]);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not replace the document.");
    }
    setBusy(null);
  }

  async function remove(doc: Doc) {
    setBusy(doc.path);
    setError(null);
    const { error: err } = await setDocPath(doc.table, doc.rowId, doc.column, null);
    if (err) {
      setBusy(null);
      return setError(err.message);
    }
    await supabase.storage.from(doc.bucket).remove([doc.path]);
    await load();
    setBusy(null);
  }

  const shown = people.filter((p) => !q || `${p.name} ${p.subtitle}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <AdminSection
      title={t("ui.documents")}
      description="A permanent record of every uploaded document. View, replace or delete a file at any time.">
      
      <input ref={fileInput} type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("ui.search.by.name")}
        className="w-full max-w-sm rounded-xl border border-input bg-background px-3 py-2 text-sm" />
      
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-5 space-y-3">
        {shown.map((p) =>
        <div key={p.key} className="card-soft p-5">
            <p className="font-semibold">{p.name}</p>
            <p className="text-sm text-muted-foreground">{p.subtitle}</p>
            <div className="mt-3 space-y-2">
              {p.docs.map((d) =>
            <div key={`${d.table}-${d.column}-${d.path}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary/50 p-3 text-sm">
                  <span className="font-medium">{d.label}</span>
                  <span className="flex flex-wrap items-center gap-2">
                    <button onClick={() => openSigned(d.bucket, d.path)} className="btn-outline-brand text-xs">{t("ui.view")}</button>
                    <button disabled={busy === d.path} onClick={() => startReplace(d)} className="btn-outline-brand text-xs disabled:opacity-60">
                      {busy === d.path ? "Working…" : "Edit"}
                    </button>
                    <button disabled={busy === d.path} onClick={() => remove(d)} className="text-xs font-semibold text-destructive hover:underline disabled:opacity-60">{t("ui.delete")}

                </button>
                  </span>
                </div>
            )}
            </div>
          </div>
        )}
        {shown.length === 0 && <p className="text-muted-foreground">{t("ui.no.documents.uploaded.yet")}</p>}
      </div>

      <div className="mt-10 border-t border-border pt-8">
        <ChangeRequestQueue />
      </div>
    </AdminSection>);

}
