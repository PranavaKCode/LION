"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./gallery-frame.module.css";

type GalleryFrameProps = {
  label: string;
  seconds: number;
  videoSrc: string;
  width: number;
  height: number;
  compact?: boolean;
};

export function GalleryFrame({
  label,
  seconds,
  videoSrc,
  width,
  height,
  compact = false,
}: GalleryFrameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let cancelled = false;
    const video = document.createElement("video");
    video.src = videoSrc;
    video.muted = true;
    video.preload = "auto";
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    const drawFallback = () => {
      const context = canvas.getContext("2d");
      if (!context || cancelled) {
        return;
      }

      const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#103f52");
      gradient.addColorStop(1, "#1f8a70");
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "rgba(255, 248, 236, 0.9)";
      context.font = compact ? "600 16px var(--font-mono-lion)" : "700 22px var(--font-mono-lion)";
      context.fillText(label, compact ? 18 : 24, canvas.height / 2);
      setReady(true);
    };

    const handleSeeked = () => {
      const context = canvas.getContext("2d");
      if (!context || cancelled) {
        return;
      }

      try {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        setReady(true);
      } catch {
        drawFallback();
      }
    };

    const handleLoaded = () => {
      const target = Math.min(seconds, Math.max(video.duration - 0.2, 0));
      video.currentTime = Number.isFinite(target) ? target : 0;
    };

    video.addEventListener("loadeddata", handleLoaded, { once: true });
    video.addEventListener("seeked", handleSeeked, { once: true });
    video.addEventListener("error", drawFallback, { once: true });

    return () => {
      cancelled = true;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [compact, height, label, seconds, videoSrc, width]);

  return (
    <div className={styles.shell} data-ready={ready}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        width={width}
        height={height}
        aria-label={label}
      />
      {!ready ? <div className={styles.loading}>{label}</div> : null}
    </div>
  );
}
