import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useProfile } from "@/lib/use-session";
import { uploadFile } from "@/lib/uploads";
import {
  EDITABLE_FIELDS,
  submitChangeRequest,
  loadChangeRequestsFor,
  changeStatusLabel,
  fieldLabel,
  type ChangeRequest,
} from "@/lib/change-requests";

export const Route = createFileRoute("/_authenticated/update-profile")({
  head: () => ({
    meta: [
      { title: "Update profile — Agaze/አጋዝ" },
      {
        name: "description",
        content: "Submit corrections to your employee registration and guarantor details for document review.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UpdateProfilePage,
});

const input = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

const GUARANTOR_FIELDS = [
  { key: "guarantor_name", label: "Guarantor name" },
  { key: "guarantor_phone", label: "Guarantor phone" },
  { key: "guarantor_id_number", label: "Guarantor ID number" },
  { key: "guarantor_relationship", label: "Relationship to you" },
] as const;

const GUARANTOR_DOCS = [
  { key: "guarantor_photo", label: "Guarantor photo", bucket: "avatars" },
  { key: "guarantor_id_photo", label: "Guarantor ID document", bucket: "id-documents" },
] as const;

const PERSONAL_FIELDS = EDITABLE_FIELDS.workers.filter((f) => !f.key.startsWith("guarantor_"));

type WorkerRow = Record<string, unknown> & { id: string; full_name: string };

function UpdateProfilePage() {
  const { user } = useSession();
  const { profile } = useProfile(user?.id);
  const [tab, setTab] = useState<"personal" | "guarantor">("personal");
  const [worker, setWorker] = useState<WorkerRow | null>(null);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (workerId: string) => {
    setRequests((await loadChangeRequestsFor(workerId)) as ChangeRequest[]);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    (async () => {
      const { data } = await supabase.from("workers").select("*").eq("user_id", user.id).maybeSingle();
      if (!active) return;
      setWorker((data as WorkerRow | null) ?? null);
      setLoading(false);
      if (data?.id) refresh(data.id);
    })();
    return () => {
      active = false;
    };
  }, [user?.id, refresh]);

  if (loading) return <p className="text-muted-foreground">Loading your registration…</p>;

  if (!worker) {
    return (
      <div className="card-soft p-6">
        <h1 className="text-2xl font-bold">Update profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We could not find an employee registration linked to your account. Please contact the back office if you
          believe this is a mistake.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Update profile</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Changes are not applied straight away. Everything you submit here goes to the back-office document review
          queue and is only published once approved.
        </p>
      </div>

      <div className="flex gap-2 rounded-full bg-secondary p-1 text-sm font-semibold">
        {[
          { key: "personal", label: "Personal Information" },
          { key: "guarantor", label: "Update Guarantor" },
        ].map((x) => (
          <button
            key={x.key}
            onClick={() => setTab(x.key as "personal" | "guarantor")}
            className={`flex-1 rounded-full px-4 py-2 transition ${
              tab === x.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === "personal" ? (
        <PersonalTab
          worker={worker}
          userId={user!.id}
          requesterName={profile?.full_name ?? null}
          onSubmitted={() => refresh(worker.id)}
        />
      ) : (
        <GuarantorTab
          worker={worker}
          userId={user!.id}
          requesterName={profile?.full_name ?? null}
          onSubmitted={() => refresh(worker.id)}
        />
      )}

      <History rows={requests} />
    </div>
  );
}

function useDraft(worker: WorkerRow, keys: string[]) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const k of keys) next[k] = worker[k] == null ? "" : String(worker[k]);
    setDraft(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worker, keys.join(",")]);
  return [draft, setDraft] as const;
}

function PersonalTab({
  worker,
  userId,
  requesterName,
  onSubmitted,
}: {
  worker: WorkerRow;
  userId: string;
  requesterName: string | null;
  onSubmitted: () => void;
}) {
  const keys = PERSONAL_FIELDS.map((f) => f.key);
  const [draft, setDraft] = useDraft(worker, keys);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const changes: Record<string, string | number | null> = {};
    for (const field of PERSONAL_FIELDS) {
      const value = draft[field.key] ?? "";
      const current = worker[field.key] == null ? "" : String(worker[field.key]);
      if (value.trim() === current.trim()) continue;
      changes[field.key] =
        value.trim() === "" ? null : field.type === "number" ? Number(value) : value.trim();
    }
    if (Object.keys(changes).length === 0) return setError("Nothing changed yet.");

    setBusy(true);
    try {
      await submitChangeRequest({
        target: "workers",
        targetId: worker.id,
        targetName: worker.full_name,
        requestedBy: userId,
        requesterName,
        changes,
        note: note.trim() || null,
      });
      setDone(true);
      setNote("");
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your update.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="card-soft space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {PERSONAL_FIELDS.map((f) => (
          <label key={f.key} className="block text-sm font-semibold">
            {f.label}
            <input
              value={draft[f.key] ?? ""}
              type={f.type === "number" ? "number" : "text"}
              onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
              className={input}
            />
          </label>
        ))}
      </div>

      <label className="block text-sm font-semibold">
        Note for the reviewer (optional)
        <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={input} />
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {done && <p className="text-sm text-emerald-600">Sent for document review.</p>}
      <button disabled={busy} className="btn-brand text-sm disabled:opacity-60">
        {busy ? "Submitting…" : "Submit for review"}
      </button>
    </form>
  );
}

function GuarantorTab({
  worker,
  userId,
  requesterName,
  onSubmitted,
}: {
  worker: WorkerRow;
  userId: string;
  requesterName: string | null;
  onSubmitted: () => void;
}) {
  const keys = GUARANTOR_FIELDS.map((f) => f.key);
  const [draft, setDraft] = useDraft(worker, keys);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const changes: Record<string, string | number | null> = {};
    for (const field of GUARANTOR_FIELDS) {
      const value = draft[field.key] ?? "";
      const current = worker[field.key] == null ? "" : String(worker[field.key]);
      if (value.trim() === current.trim()) continue;
      changes[field.key] = value.trim() === "" ? null : value.trim();
    }

    setBusy(true);
    try {
      for (const doc of GUARANTOR_DOCS) {
        const file = files[doc.key];
        if (!file) continue;
        changes[doc.key] = await uploadFile(doc.bucket, userId, doc.key, file);
      }
      if (Object.keys(changes).length === 0) {
        setBusy(false);
        return setError("Nothing changed yet.");
      }
      await submitChangeRequest({
        target: "workers",
        targetId: worker.id,
        targetName: worker.full_name,
        requestedBy: userId,
        requesterName,
        changes,
        note: note.trim() || null,
      });
      setDone(true);
      setFiles({});
      setNote("");
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your update.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="card-soft space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {GUARANTOR_FIELDS.map((f) => (
          <label key={f.key} className="block text-sm font-semibold">
            {f.label}
            <input
              value={draft[f.key] ?? ""}
              onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
              className={input}
            />
          </label>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {GUARANTOR_DOCS.map((d) => (
          <label key={d.key} className="block text-sm font-semibold">
            {d.label}
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFiles({ ...files, [d.key]: e.target.files?.[0] ?? null })}
              className={`${input} file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-xs file:font-semibold`}
            />
            {files[d.key] && <span className="text-xs font-normal text-muted-foreground">{files[d.key]?.name}</span>}
          </label>
        ))}
      </div>

      <label className="block text-sm font-semibold">
        Note for the reviewer (optional)
        <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={input} />
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {done && <p className="text-sm text-emerald-600">Sent for document review.</p>}
      <button disabled={busy} className="btn-brand text-sm disabled:opacity-60">
        {busy ? "Submitting…" : "Submit for review"}
      </button>
    </form>
  );
}

function History({ rows }: { rows: ChangeRequest[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="card-soft p-6">
      <h2 className="text-lg font-semibold">Your submitted updates</h2>
      <div className="mt-4 space-y-3">
        {rows.map((r) => {
          const changes = (r.changes ?? {}) as Record<string, unknown>;
          return (
            <div key={r.id} className="rounded-2xl bg-secondary/50 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{changeStatusLabel(r.status)}</span>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-muted-foreground">
                {Object.keys(changes)
                  .map((k) => fieldLabel("workers", k))
                  .join(", ")}
              </p>
              {r.admin_note && <p className="mt-1">Reviewer note: {r.admin_note}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
