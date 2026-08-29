import { useEffect, useId, useState } from "react";
import { Camera } from "lucide-react";
import { CameraCapture } from "@/components/CameraCapture";
import { useLanguage } from "@/lib/i18n";

type Props = {
  /** Current selected file (controlled by parent). */
  file: File | null;
  onFile: (f: File | null) => void;
  accept?: string;
  label?: string;
  /** Show an image preview when the file is an image. */
  preview?: boolean;
  height?: string;
};

/** Reusable upload widget with preview, read progress and replace/delete controls. */
export function FileUpload({
  file,
  onFile,
  accept = "image/*",
  label,
  preview = true,
  height = "h-40",
}: Props) {
  const { t } = useLanguage();
  const resolvedLabel = label ?? t("auth.clickToUpload");
  const inputId = useId();
  const [url, setUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [camera, setCamera] = useState(false);
  const allowsCamera = accept.includes("image");

  useEffect(() => {
    if (!file || !preview || !file.type.startsWith("image/")) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, preview]);

  useEffect(() => {
    if (!file) {
      setProgress(0);
      return;
    }
    let p = 0;
    setProgress(0);
    const iv = setInterval(() => {
      p += 20;
      setProgress(Math.min(p, 100));
      if (p >= 100) clearInterval(iv);
    }, 60);
    return () => clearInterval(iv);
  }, [file]);

  const input = (
    <input
      id={inputId}
      type="file"
      accept={accept}
      className="hidden"
      onChange={(e) => onFile(e.target.files?.[0] ?? null)}
    />
  );

  const cameraButton = allowsCamera && (
    <button
      type="button"
      onClick={() => setCamera(true)}
      className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs hover:bg-secondary"
    >
      <Camera className="h-3.5 w-3.5" /> Take photo
    </button>
  );

  const cameraModal = camera && (
    <CameraCapture fileName={label ? label.toLowerCase().replace(/\s+/g, "-") : "photo"} onCapture={onFile} onClose={() => setCamera(false)} />
  );

  if (!file) {
    return (
      <div>
        <label
          htmlFor={inputId}
          className={`mt-1 flex ${height} cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-input bg-background text-sm text-muted-foreground hover:border-primary hover:text-foreground`}
        >
          <span className="text-2xl">{accept.startsWith("image") ? "📷" : "📄"}</span>
          <span>{resolvedLabel}</span>
          {input}
        </label>
        {allowsCamera && <div className="mt-2 flex justify-end">{cameraButton}</div>}
        {cameraModal}
      </div>
    );
  }

  return (
    <div className="mt-1 rounded-lg border border-input bg-background p-3">
      <div className={`relative overflow-hidden rounded-md bg-secondary ${url ? "" : "p-4"}`}>
        {url ? (
          <img src={url} alt={t("auth.uploadPreviewAlt")} className={`${height} w-full object-cover`} />
        ) : (
          <p className="truncate text-sm">{file.name}</p>
        )}
        {progress < 100 && (
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/20">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{progress < 100 ? t("auth.loadingPercent", { percent: progress }) : t("auth.ready")}</span>
        <div className="flex gap-2">
          {cameraButton}
          <label htmlFor={inputId} className="cursor-pointer rounded-md border border-input px-2 py-1 hover:bg-secondary">
            {t("auth.replace")}
          </label>
          <button
            type="button"
            onClick={() => onFile(null)}
            className="rounded-md border border-destructive/50 px-2 py-1 text-destructive hover:bg-destructive/10"
          >
            {t("auth.delete")}
          </button>
        </div>
      </div>
      {input}
      {cameraModal}
    </div>
  );
}
