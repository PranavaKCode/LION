"use client";

import { upload } from "@vercel/blob/client";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import styles from "../page.module.css";
import type { LionMetrics } from "../lib/lion-data";
import type {
  LiveLabApiResponse,
  LiveLabOverlay,
  LiveLabPrediction,
  LiveLabResult,
  LiveLabVideoFrame,
} from "../lib/live-lab-types";

type LiveLabProps = {
  defaultVideoSrc: string;
  metrics: LionMetrics;
};

type PreviewKind = "video" | "image";

type PollingJob = {
  jobId: string;
  pollAfterMs: number;
  message: string;
};

type PanelSize = {
  width: number;
  height: number;
};

const SERVER_PROXY_VIDEO_LIMIT_BYTES = 4 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "N/A";
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isLocalOrigin() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

function getContainMetrics(panel: PanelSize, overlay: LiveLabOverlay | null) {
  if (!overlay || panel.width <= 0 || panel.height <= 0 || overlay.width <= 0 || overlay.height <= 0) {
    return null;
  }

  const scale = Math.min(panel.width / overlay.width, panel.height / overlay.height);
  const renderWidth = overlay.width * scale;
  const renderHeight = overlay.height * scale;

  return {
    scale,
    offsetX: (panel.width - renderWidth) / 2,
    offsetY: (panel.height - renderHeight) / 2,
  };
}

function getActiveVideoFrame(frames: LiveLabVideoFrame[], currentTime: number, sampleFps: number) {
  if (!frames.length) {
    return null;
  }

  let closestFrame = frames[0];
  let closestDelta = Math.abs(frames[0].time - currentTime);

  for (const frame of frames) {
    const delta = Math.abs(frame.time - currentTime);
    if (delta < closestDelta) {
      closestDelta = delta;
      closestFrame = frame;
    }
  }

  const maxDelta = Math.max(0.3, 1 / Math.max(sampleFps, 1));
  return closestDelta <= maxDelta ? closestFrame : null;
}

function getOverlayPredictions(overlay: LiveLabOverlay | null, currentTime: number) {
  if (!overlay) {
    return [] as LiveLabPrediction[];
  }

  if (overlay.kind === "image") {
    return overlay.predictions;
  }

  return getActiveVideoFrame(overlay.frames, currentTime, overlay.sampleFps)?.predictions ?? [];
}

function normalizeFetchError(error: unknown) {
  if (error instanceof Error && error.message === "Failed to fetch") {
    return "The upload request could not reach the remote storage service. Large deployed videos need Vercel Blob configured, while local runs should use the built-in proxy upload path.";
  }

  return error instanceof Error ? error.message : "Detection failed.";
}

async function parseResponse(response: Response) {
  const payload = (await response.json()) as LiveLabApiResponse & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Detection failed.");
  }
  return payload;
}

async function runServerUpload(file: File, confidence: number) {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("confidence", confidence.toFixed(2));

  const response = await fetch("/api/live-lab/detect", {
    method: "POST",
    body: formData,
  });

  return parseResponse(response);
}

async function uploadVideoToBlob(file: File) {
  const pathname = `live-lab/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  return upload(pathname, file, {
    access: "public",
    handleUploadUrl: "/api/live-lab/upload",
    contentType: file.type || "application/octet-stream",
    multipart: file.size >= 5 * 1024 * 1024,
  });
}

async function startRemoteVideoJob(inputUrl: string, sourceName: string) {
  const response = await fetch("/api/live-lab/detect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "start-video-job",
      inputUrl,
      sourceName,
    }),
  });

  return parseResponse(response);
}

function shouldUseServerProxy(file: File) {
  return isLocalOrigin() || file.size <= SERVER_PROXY_VIDEO_LIMIT_BYTES;
}

export function LiveLab({ defaultVideoSrc, metrics }: LiveLabProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewPanelRef = useRef<HTMLDivElement | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0.25);
  const [result, setResult] = useState<LiveLabResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [jobState, setJobState] = useState<PollingJob | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [panelSize, setPanelSize] = useState<PanelSize>({ width: 0, height: 0 });

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!previewPanelRef.current || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setPanelSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(previewPanelRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!jobState || !selectedFile) {
      return;
    }

    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
    }

    pollTimerRef.current = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          jobId: jobState.jobId,
          confidence: confidence.toFixed(2),
          sourceName: selectedFile.name,
        });

        const response = await fetch(`/api/live-lab/detect?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = await parseResponse(response);

        if (payload.status === "complete") {
          setResult(payload.result);
          setJobState(null);
          setProgressMessage(null);
          setIsRunning(false);
          return;
        }

        setJobState({
          jobId: payload.jobId,
          pollAfterMs: payload.pollAfterMs,
          message: payload.message,
        });
      } catch (error) {
        setErrorMessage(normalizeFetchError(error));
        setJobState(null);
        setProgressMessage(null);
        setIsRunning(false);
      }
    }, jobState.pollAfterMs);

    return () => {
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
      }
    };
  }, [jobState, confidence, selectedFile]);

  function clearSelection() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMessage(null);
    setIsRunning(false);
    setJobState(null);
    setProgressMessage(null);
    setCurrentTime(0);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleFileChange(file: File | null) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setResult(null);
      setErrorMessage(null);
      setIsRunning(false);
      setJobState(null);
      setProgressMessage(null);
      setCurrentTime(0);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setErrorMessage(null);
    setIsRunning(false);
    setJobState(null);
    setProgressMessage(null);
    setCurrentTime(0);
  }

  async function runDetection() {
    if (!selectedFile) {
      setErrorMessage("Choose an image or video before running detection.");
      return;
    }

    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    setIsRunning(true);
    setErrorMessage(null);
    setResult(null);
    setJobState(null);

    try {
      let payload: LiveLabApiResponse;

      if (selectedFile.type.startsWith("video/")) {
        if (shouldUseServerProxy(selectedFile)) {
          setProgressMessage(
            isLocalOrigin()
              ? "Uploading video through the local Live Lab server..."
              : "Uploading small video through the deployed Live Lab server...",
          );
          payload = await runServerUpload(selectedFile, confidence);
        } else {
          setProgressMessage("Uploading large video to Vercel Blob...");
          const blob = await uploadVideoToBlob(selectedFile);
          setProgressMessage("Starting remote video inference...");
          payload = await startRemoteVideoJob(blob.url, selectedFile.name);
        }
      } else {
        setProgressMessage("Sending image to hosted detector...");
        payload = await runServerUpload(selectedFile, confidence);
      }

      if (payload.status === "complete") {
        setResult(payload.result);
        setProgressMessage(null);
        setIsRunning(false);
        return;
      }

      setJobState({
        jobId: payload.jobId,
        pollAfterMs: payload.pollAfterMs,
        message: payload.message,
      });
      setProgressMessage(null);
      setIsRunning(false);
    } catch (error) {
      setErrorMessage(normalizeFetchError(error));
      setProgressMessage(null);
      setIsRunning(false);
    }
  }

  const localPreviewKind: PreviewKind = selectedFile?.type.startsWith("image/") ? "image" : "video";
  const displayKind = result?.annotatedKind ?? localPreviewKind;
  const displaySrc = previewUrl ?? defaultVideoSrc;
  const selectedSource = selectedFile?.name ?? metrics.sourceName;
  const selectedType = selectedFile?.type || (selectedFile ? "N/A" : "video/mp4");
  const selectedSize = selectedFile ? formatBytes(selectedFile.size) : "N/A";
  const activeOverlay = result?.overlay ?? null;
  const containMetrics = getContainMetrics(panelSize, activeOverlay);
  const overlayPredictions = getOverlayPredictions(activeOverlay, currentTime);
  const activeVideoFrame =
    activeOverlay?.kind === "video"
      ? getActiveVideoFrame(activeOverlay.frames, currentTime, activeOverlay.sampleFps)
      : null;
  const statusText = errorMessage
    ? "error"
    : jobState
      ? "processing"
      : isRunning
        ? "running"
        : result
          ? "complete"
          : "idle";
  const statusClassName = errorMessage
    ? styles.statusError
    : jobState || isRunning
      ? styles.statusRunning
      : result
        ? styles.statusSuccess
        : styles.statusIdle;
  const statusMessage = errorMessage
    ? errorMessage
    : jobState
      ? jobState.message
      : isRunning
        ? progressMessage ?? "Starting remote detection..."
        : result
          ? `Detection complete via ${result.model}`
          : "Choose a file and run detection.";
  const previewTag = result
    ? "remote detections"
    : jobState
      ? "remote job queued"
      : isRunning && selectedFile?.type.startsWith("video/")
        ? "uploading remote video"
        : selectedFile
          ? "local upload"
          : "demo preview";

  return (
    <div className={styles.liveGrid}>
      <article className={`${styles.card} ${styles.uploadCard}`}>
        <p className={styles.cardTopline}>Upload dock</p>
        <h3>Choose a reef clip or still image and run hosted detection.</h3>
        <p>
          Images go through the Live Lab server route directly. Videos use the local server proxy during development,
          while larger deployed uploads can stage in Vercel Blob before the remote Roboflow job starts.
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
            {selectedFile ? "ready for remote inference" : "accepted / video/* image/*"}
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
            disabled={!selectedFile || isRunning || Boolean(jobState)}
          >
            {jobState
              ? "Polling Remote Job..."
              : isRunning
                ? selectedFile?.type.startsWith("video/")
                  ? "Uploading..."
                  : "Running..."
                : "Run Detection"}
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
          <div ref={previewPanelRef} className={styles.previewPanel}>
            {displayKind === "image" ? (
              <Image
                fill
                unoptimized
                className={`${styles.fullVideo} ${styles.monitorMedia}`}
                src={displaySrc}
                alt={selectedSource}
                sizes="(max-width: 980px) 100vw, 70vw"
              />
            ) : (
              <video
                ref={videoRef}
                className={`${styles.fullVideo} ${styles.monitorMedia}`}
                src={displaySrc}
                controls
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                onLoadedMetadata={(event) => {
                  setCurrentTime(event.currentTarget.currentTime || 0);
                }}
                onTimeUpdate={(event) => {
                  setCurrentTime(event.currentTarget.currentTime || 0);
                }}
              />
            )}
            {containMetrics && overlayPredictions.length ? (
              <div className={styles.detectionOverlay}>
                {overlayPredictions.map((prediction, index) => {
                  const left = containMetrics.offsetX + (prediction.x - prediction.width / 2) * containMetrics.scale;
                  const top = containMetrics.offsetY + (prediction.y - prediction.height / 2) * containMetrics.scale;
                  const width = prediction.width * containMetrics.scale;
                  const height = prediction.height * containMetrics.scale;

                  return (
                    <div
                      key={`${prediction.className}-${prediction.x}-${prediction.y}-${index}`}
                      className={styles.detectionBox}
                      style={{ left, top, width, height }}
                    >
                      <span className={styles.detectionLabel}>
                        {prediction.className} {prediction.confidence.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}
            <span className={styles.previewTag}>{previewTag}</span>
            {activeVideoFrame ? (
              <span className={styles.previewSubtag}>{`frame ${activeVideoFrame.frame} / ${activeVideoFrame.time.toFixed(2)}s`}</span>
            ) : null}
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
              <strong>{result ? result.manifestUrl ?? "N/A" : metrics.manifestPath}</strong>
            </div>
            <div className={styles.miniMetricCompact}>
              <span>Output</span>
              <strong>{result ? result.annotatedUrl ?? "browser overlay" : metrics.outputVideoName}</strong>
            </div>
            <div className={styles.miniMetricCompact}>
              <span>Frame json</span>
              <strong>{result ? result.jsonUrl ?? "N/A" : metrics.frameJsonStatus}</strong>
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
            <li>Images use hosted inference through the server route, while local videos can proxy through the same route without Python.</li>
            <li>Large deployed videos should stage in Vercel Blob first so they avoid browser CORS issues and serverless body limits.</li>
            <li>The browser renders returned detections over the selected media without pretending an annotated video file was written on the host.</li>
          </ul>
        </article>
      </div>
    </div>
  );
}
