import { useLanguage } from "@/lib/i18n";import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { signedUrl } from "@/lib/uploads";
import { DOC_SLOTS, type ChangeTarget } from "@/lib/change-requests";

/**
 * Every document collected during registration, rendered as a preview the
 * broker (or staff) can click to open full size.
 */
export function ProfileDocuments({
  target,
  record



}: {target: ChangeTarget;record: Record<string, unknown>;}) {const { t } = useLanguage();
  const slots = DOC_SLOTS[target].filter((s) => typeof record[s.key] === "string" && record[s.key]);
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    Promise.all(
      slots.map(async (s) => [s.key, await signedUrl(s.bucket, String(record[s.key]), 900)] as const)
    ).then((pairs) => {
      if (!active) return;
      const next: Record<string, string> = {};
      for (const [key, url] of pairs) if (url) next[key] = url;
      setUrls(next);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, JSON.stringify(slots.map((s) => record[s.key]))]);

  if (slots.length === 0)
  return <p className="text-sm text-muted-foreground">{t("ui.no.documents.were.uploaded.for.this.registration")}</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {slots.map((s) => {
        const url = urls[s.key];
        return (
          <div key={s.key} className="rounded-xl border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{s.label}</p>
            {url ?
            <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                <img src={url} alt={s.label} className="h-36 w-full rounded-lg object-cover" />
              </a> :

            <div className="mt-2 flex h-36 w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <FileText className="h-6 w-6" />
              </div>
            }
          </div>);

      })}
    </div>);

}
