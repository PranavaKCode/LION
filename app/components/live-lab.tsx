"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "../page.module.css";
import type { LionMetrics } from "../lib/lion-data";

type LiveLabProps = {
  defaultVideoSrc: string;
  metrics: LionMetrics;
};

type PreviewKind = "video" | "image";

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "N/A";
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LiveLab({ defaultVideoSrc, metrics }: LiveLabProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<PreviewKind>("video");

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      setPreviewKind("video");
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(nextPreviewUrl);
    setPreviewKind(selectedFile.type.startsWith("image/") ? "image" : "video");

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [selectedFile]);

  const previewSrc = previewUrl ?? defaultVideoSrc;
  const selectedSource = selectedFile?.name ?? metrics.sourceName;
  const selectedType = selectedFile?.type || (selectedFile ? "N/A" : "video/mp4");
  const selectedSize = selectedFile ? formatBytes(selectedFile.size) : "N/A";
  const previewLabel = selectedFile ? "local upload" : "demo preview";

  return (
    <div className={styles.liveGrid}>
      <article className={`${styles.card} ${styles.uploadCard}`}>
        <p className={styles.cardTopline}>Upload dock</p>
        <h3>Choose a reef clip or still image to preview locally.</h3>
        <p>
          This now works as an actual local media picker. Inference is still not wired on the page, so analytics and
          detections remain explicit placeholders until the backend is connected.
        </p>
        <input
          ref={inputRef}
          id={inputId}
          className={styles.uploadInput}
          type="file"
          accept="video/*,image/*"
          onChange={(event) => {
            setSelectedFile(event.target.files?.[0] ?? null);
          }}
        />
        <label className={styles.dropzone} htmlFor={inputId}>
          <div className={styles.dropzoneIcon}>{selectedFile ? "OK" : "+"}</div>
          <div className={styles.dropzoneCopy}>
            {selectedFile ? "Local preview ready" : "Click here to choose footage or stills"}
          </div>
          <div className={styles.dropzoneHint}>
            {selectedFile ? "preview only / inference N/A" : "accepted / video/* image/*"}
          </div>
        </label>
        <div className={styles.fileChipRow}>
          <span className={styles.fileChip}>{selectedSource}</span>
          <span className={styles.fileChip}>{selectedType}</span>
          <span className={styles.fileChip}>{selectedSize}</span>
        </div>
        <div className={styles.actionRow}>
          {selectedFile ? (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                setSelectedFile(null);
                if (inputRef.current) {
                  inputRef.current.value = "";
                }
              }}
            >
              Clear Selection
            </button>
          ) : null}
          <a className={styles.primaryButton} href="#analytics">
            Review Placeholder Metrics
          </a>
        </div>
      </article>

      <article className={`${styles.card} ${styles.monitorCard}`}>
        <p className={styles.cardTopline}>Annotated monitor</p>
        <div className={styles.monitorGrid}>
          <div className={styles.previewPanel}>
            {previewKind === "image" ? (
              <img className={styles.fullVideo} src={previewSrc} alt={selectedSource} />
            ) : (
              <video
                className={styles.fullVideo}
                src={previewSrc}
                controls
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            )}
            <span className={styles.previewTag}>{previewLabel}</span>
          </div>
          <div className={styles.previewStats}>
            <div className={styles.miniMetric}>
              <span>Selected file</span>
              <strong>{selectedSource}</strong>
            </div>
            <div className={styles.miniMetric}>
              <span>Media type</span>
              <strong>{selectedType}</strong>
            </div>
            <div className={styles.miniMetric}>
              <span>File size</span>
              <strong>{selectedSize}</strong>
            </div>
            <div className={styles.miniMetric}>
              <span>Inference output</span>
              <strong>N/A</strong>
            </div>
          </div>
        </div>
      </article>

      <div className={styles.opsStack}>
        <article className={`${styles.card} ${styles.opsCard}`}>
          <p className={styles.cardTopline}>Run context</p>
          <div className={styles.opsGrid}>
            <div className={styles.miniMetricCompact}>
              <span>Manifest</span>
              <strong>{metrics.manifestPath}</strong>
            </div>
            <div className={styles.miniMetricCompact}>
              <span>Output video</span>
              <strong>{metrics.outputVideoName}</strong>
            </div>
            <div className={styles.miniMetricCompact}>
              <span>Frame json</span>
              <strong>{metrics.frameJsonStatus}</strong>
            </div>
            <div className={styles.miniMetricCompact}>
              <span>Preset</span>
              <strong>{metrics.presetName}</strong>
            </div>
          </div>
        </article>
        <article className={`${styles.card} ${styles.opsCard}`}>
          <p className={styles.cardTopline}>Current page state</p>
          <ul className={styles.noteList}>
            <li>Upload and local preview work from the browser without any fake inference output.</li>
            <li>Metrics stay real if repo exports exist, otherwise they fall back to explicit N/A placeholders.</li>
            <li>Evaluation charts remain placeholders until model scoring data is connected.</li>
          </ul>
        </article>
      </div>
    </div>
  );
}
