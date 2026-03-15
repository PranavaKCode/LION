"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import styles from "../page.module.css";
import type { LionMetrics } from "../lib/lion-data";
import type { LiveLabResult } from "../lib/live-lab-types";

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
  const [confidence, setConfidence] = useState(0.25);
  const [result, setResult] = useState<LiveLabResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function clearSelection() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMessage(null);
    setIsRunning(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleFileChange(file: File | null) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setResult(null);
      setErrorMessage(null);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setErrorMessage(null);
  }

  async function runDetection() {
    if (!selectedFile) {
      setErrorMessage("Choose an image or video before running detection.");
      return;
    }

    setIsRunning(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.set("file", selectedFile);
      formData.set("confidence", confidence.toFixed(2));

      const response = await fetch("/api/live-lab/detect", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as LiveLabResult & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Detection failed.");
      }

      setResult(payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Detection failed.");
    } finally {
      setIsRunning(false);
    }
  }

  const localPreviewKind: PreviewKind = selectedFile?.type.startsWith("image/") ? "image" : "video";
  const displayKind = result?.annotatedKind ?? localPreviewKind;
  const displaySrc = result?.annotatedUrl ?? previewUrl ?? defaultVideoSrc;
  const selectedSource = selectedFile?.name ?? metrics.sourceName;
  const selectedType = selectedFile?.type || (selectedFile ? "N/A" : "video/mp4");
  const selectedSize = selectedFile ? formatBytes(selectedFile.size) : "N/A";
  const statusText = errorMessage
    ? "error"
    : isRunning
      ? "running"
      : result
        ? "complete"
        : "idle";
  const statusClassName = errorMessage
    ? styles.statusError
    : isRunning
      ? styles.statusRunning
      : result
        ? styles.statusSuccess
        : styles.statusIdle;
  const statusMessage = errorMessage
    ? errorMessage
    : isRunning
      ? "Running hosted Roboflow inference..."
      : result
        ? `Detection complete via ${result.model}`
        : "Choose a file and run detection.";

  return (
    <div className={styles.liveGrid}>
      <article className={`${styles.card} ${styles.uploadCard}`}>
        <p className={styles.cardTopline}>Upload dock</p>
        <h3>Choose a reef clip or still image and run hosted detection.</h3>
        <p>
          Local L.I.O.N. runs use the real Python detection pipeline. The deployed site keeps the upload experience and
          preview UI, but it stays in preview-only mode until inference is moved to a deployment-friendly backend.
        </p>
        <input
          ref={inputRef}
          id={inputId}
          className={styles.uploadInput}
          type="file"
          accept="video/*,image/*"
          onChange={(event) => {
            handleFileChange(event.target.files?.[0] ?? null);
          }}
        />
        <label className={styles.dropzone} htmlFor={inputId}>
          <div className={styles.dropzoneIcon}>{selectedFile ? "OK" : "+"}</div>
          <div className={styles.dropzoneCopy}>
            {selectedFile ? "Detection input ready" : "Click here to choose footage or stills"}
          </div>
          <div className={styles.dropzoneHint}>
            {selectedFile ? "ready for hosted inference" : "accepted / video/* image/*"}
          </div>
        </label>
        <div className={styles.fileChipRow}>
          <span className={styles.fileChip}>{selectedSource}</span>
          <span className={styles.fileChip}>{selectedType}</span>
          <span className={styles.fileChip}>{`size / ${selectedSize}`}</span>
          <span className={styles.fileChip}>{`conf / ${confidence.toFixed(2)}`}</span>
        </div>
        <div className={styles.controlStack}>
          <div className={styles.controlHeader}>
            <span>Confidence threshold</span>
            <strong>{confidence.toFixed(2)}</strong>
          </div>
          <input
            className={styles.rangeInput}
            type="range"
            min="0.05"
            max="0.95"
            step="0.05"
            value={confidence}
            onChange={(event) => {
              setConfidence(Number(event.target.value));
            }}
          />
        </div>
        <div className={`${styles.statusBanner} ${statusClassName}`}>{statusMessage}</div>
        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={runDetection}
            disabled={!selectedFile || isRunning}
          >
            {isRunning ? "Running..." : "Run Detection"}
          </button>
          {selectedFile ? (
            <button type="button" className={styles.secondaryButton} onClick={clearSelection} disabled={isRunning}>
              Clear Selection
            </button>
          ) : null}
          {result?.jsonUrl ? (
            <a className={styles.secondaryButton} href={result.jsonUrl} target="_blank" rel="noreferrer">
              Open JSON
            </a>
          ) : null}
        </div>
      </article>

      <article className={`${styles.card} ${styles.monitorCard}`}>
        <p className={styles.cardTopline}>Annotated monitor</p>
        <div className={styles.monitorGrid}>
          <div className={styles.previewPanel}>
            {displayKind === "image" ? (
              <Image
                fill
                unoptimized
                className={styles.fullVideo}
                src={displaySrc}
                alt={selectedSource}
                sizes="(max-width: 980px) 100vw, 70vw"
              />
            ) : (
              <video
                className={styles.fullVideo}
                src={displaySrc}
                controls
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            )}
            <span className={styles.previewTag}>{result ? "annotated output" : selectedFile ? "local upload" : "demo preview"}</span>
          </div>
          <div className={styles.previewStats}>
            <div className={styles.miniMetric}>
              <span>Status</span>
              <strong>{statusText}</strong>
            </div>
            <div className={styles.miniMetric}>
              <span>Detections</span>
              <strong>{result?.detectionCount ?? "N/A"}</strong>
            </div>
            <div className={styles.miniMetric}>
              <span>Max confidence</span>
              <strong>{result?.maxConfidence ?? "N/A"}</strong>
            </div>
            <div className={styles.miniMetric}>
              <span>Model</span>
              <strong>{result?.model ?? metrics.hostedModel}</strong>
            </div>
            <div className={styles.miniMetric}>
              <span>Resolution</span>
              <strong>{result?.resolution ?? metrics.resolution}</strong>
            </div>
            <div className={styles.miniMetric}>
              <span>FPS</span>
              <strong>{result?.fps ?? metrics.fps}</strong>
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
              <strong>{result?.manifestUrl ?? metrics.manifestPath}</strong>
            </div>
            <div className={styles.miniMetricCompact}>
              <span>Output</span>
              <strong>{result?.annotatedUrl ?? metrics.outputVideoName}</strong>
            </div>
            <div className={styles.miniMetricCompact}>
              <span>Frame json</span>
              <strong>{result?.jsonUrl ?? metrics.frameJsonStatus}</strong>
            </div>
            <div className={styles.miniMetricCompact}>
              <span>Runtime</span>
              <strong>{result?.runtime ?? metrics.runtime}</strong>
            </div>
          </div>
        </article>
        <article className={`${styles.card} ${styles.opsCard}`}>
          <p className={styles.cardTopline}>Current page state</p>
          <ul className={styles.noteList}>
            <li>Local runs call the real `lionfish_yolo.py` detection flow through the server route.</li>
            <li>The deployed site is preview-only for Live Lab today; full inference currently works from a local L.I.O.N. setup.</li>
            <li>Missing `ROBOFLOW_API_KEY` or Python setup errors are surfaced directly in the live lab instead of being hidden.</li>
          </ul>
        </article>
      </div>
    </div>
  );
}




