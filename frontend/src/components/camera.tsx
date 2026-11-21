"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useStrings } from "@/lib/strings";

/** Longest side of the photo sent to LaMP (the API asks for 1,600 px at most). */
const MAX_SIDE = 1600;

/**
 * The phone's back camera, full screen, with one shutter button.
 * If the browser can't open the camera (no permission, no camera, plain http), onUnavailable is called
 * so the page can fall back to the phone's own camera app.
 */
export function CameraView({
  onPhoto,
  onClose,
  onUnavailable,
}: {
  onPhoto: (file: File) => void;
  onClose: () => void;
  onUnavailable: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const { t } = useStrings();

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("no camera");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1920 } },
          audio: false,
        });
        if (cancelled) return;
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play();
        setReady(true);
      } catch {
        if (!cancelled) onUnavailable();
      }
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onUnavailable]);

  function shoot() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const scale = Math.min(1, MAX_SIDE / Math.max(v.videoWidth, v.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(v.videoWidth * scale);
    canvas.height = Math.round(v.videoHeight * scale);
    canvas.getContext("2d")!.drawImage(v, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => blob && onPhoto(new File([blob], "photo.jpg", { type: "image/jpeg" })), "image/jpeg", 0.9);
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={t("CAMERA")} className="fixed inset-0 z-50 flex flex-col bg-black">
      <video ref={videoRef} playsInline muted className="min-h-0 flex-1 object-cover" />
      {/* A frame to line the page up in */}
      <div aria-hidden className="pointer-events-none absolute inset-x-6 top-16 bottom-40 rounded-3xl border-2 border-white/70" />
      <p className="absolute inset-x-0 top-5 text-center text-sm font-semibold text-white drop-shadow">
        {ready ? t("CAMERA_FIT") : t("CAMERA_OPENING")}
      </p>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-10 pt-6 pb-[calc(28px+env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("CAMERA_CLOSE")}
          className="inline-flex size-12 items-center justify-center rounded-full bg-white/15 text-white"
        >
          <X className="size-6" aria-hidden />
        </button>
        <button
          type="button"
          onClick={shoot}
          disabled={!ready}
          aria-label={t("CAMERA_SHOOT")}
          className="size-[72px] rounded-full border-4 border-white bg-white/90 shadow-lg ring-4 ring-black/30 active:scale-95 disabled:opacity-50"
        />
        <span className="size-12" aria-hidden />
      </div>
    </div>
  );
}
