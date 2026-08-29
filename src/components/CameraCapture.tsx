import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, X } from "lucide-react";

/**
 * Device-camera capture modal. Opens the live camera stream, lets the user take
 * a still photo, review it and either retake or use it. Works on phones (rear
 * camera by default) and laptops (webcam).
 */
export function CameraCapture({
  onCapture,
  onClose,
  fileName = "photo",
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
  fileName?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [shot, setShot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch {
        if (!cancelled) setError("Could not open the camera. Allow camera access in your browser, or upload a file instead.");
      }
    })();
    return () => {
      cancelled = true;
      stop();
    };
  }, [facing, stop]);

  function take() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setShot(canvas.toDataURL("image/jpeg", 0.9));
  }

  async function use() {
    if (!shot) return;
    const blob = await (await fetch(shot)).blob();
    onCapture(new File([blob], `${fileName}-${Date.now()}.jpg`, { type: "image/jpeg" }));
    stop();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Take a photo</h3>
          <button type="button" onClick={() => { stop(); onClose(); }} className="rounded-full p-1 hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl bg-black">
          {error ? (
            <p className="p-6 text-center text-sm text-destructive">{error}</p>
          ) : shot ? (
            <img src={shot} alt="Captured preview" className="max-h-80 w-full object-contain" />
          ) : (
            <video ref={videoRef} playsInline muted className="max-h-80 w-full object-contain" />
          )}
        </div>

        <div className="mt-3 flex flex-wrap justify-end gap-2 text-sm">
          {!error && !shot && (
            <>
              <button
                type="button"
                onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
                className="btn-outline-brand inline-flex items-center gap-1 px-3 py-2"
              >
                <RefreshCw className="h-4 w-4" /> Flip
              </button>
              <button type="button" onClick={take} className="btn-brand inline-flex items-center gap-1 px-4 py-2">
                <Camera className="h-4 w-4" /> Capture
              </button>
            </>
          )}
          {shot && (
            <>
              <button type="button" onClick={() => setShot(null)} className="btn-outline-brand px-3 py-2">
                Retake
              </button>
              <button type="button" onClick={use} className="btn-brand px-4 py-2">
                Use photo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
