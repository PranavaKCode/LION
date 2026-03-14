import { readFile } from "node:fs/promises";
import path from "node:path";

export type LionMetrics = {
  hostedModel: string;
  hostedModelShort: string;
  frameCount: number;
  fps: string;
  detectionCount: number;
  avgConfidence: string;
  maxConfidence: string;
  runtime: string;
  resolution: string;
  sourceName: string;
  outputMode: string;
};

type PredictionFrame = {
  predictions?: Array<{
    confidence?: number | string;
  }>;
};

type PredictionPayload = {
  source?: string;
  fps?: number;
  width?: number;
  height?: number;
  frame_count?: number;
  frames?: PredictionFrame[];
};

type ManifestPayload = {
  hosted_model?: string;
  prediction_outputs?: Record<string, { video?: string; json?: string }>;
};

const DEFAULT_METRICS: LionMetrics = {
  hostedModel: "su-eaelw/lionfish-qs3tq/49",
  hostedModelShort: "lionfish-qs3tq/49",
  frameCount: 246,
  fps: "29.97",
  detectionCount: 248,
  avgConfidence: "0.87",
  maxConfidence: "0.91",
  runtime: "00:08.2",
  resolution: "960 x 540",
  sourceName: "120391-720880500_small.mp4",
  outputMode: "video + json",
};

function formatMetric(value: number, digits = 2) {
  return value.toFixed(digits);
}

function formatRuntime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(1).padStart(4, "0")}`;
}

function resolveShortModel(model: string) {
  const parts = model.split("/");
  return parts.slice(-2).join("/") || model;
}

export async function getLionMetrics(): Promise<LionMetrics> {
  try {
    const manifestPath = path.resolve(process.cwd(), "..", "runs", "lionfish", "last_run.json");
    const manifestRaw = await readFile(manifestPath, "utf8");
    const manifest = JSON.parse(manifestRaw) as ManifestPayload;
    const predictionOutput = Object.values(manifest.prediction_outputs ?? {})[0];
    const payloadPath = predictionOutput?.json && path.isAbsolute(predictionOutput.json)
      ? predictionOutput.json
      : path.resolve(process.cwd(), "..", "runs", "lionfish", "hosted-predict", "120391-720880500_small.json");

    const payloadRaw = await readFile(payloadPath, "utf8");
    const payload = JSON.parse(payloadRaw) as PredictionPayload;
    const frames = Array.isArray(payload.frames) ? payload.frames : [];
    const confidences = frames.flatMap((frame) =>
      (frame.predictions ?? [])
        .map((prediction) => Number(prediction.confidence))
        .filter((confidence) => Number.isFinite(confidence)),
    );

    const frameCount = payload.frame_count ?? DEFAULT_METRICS.frameCount;
    const fpsNumber = payload.fps ?? Number(DEFAULT_METRICS.fps);
    const average = confidences.length
      ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
      : Number(DEFAULT_METRICS.avgConfidence);
    const max = confidences.length ? Math.max(...confidences) : Number(DEFAULT_METRICS.maxConfidence);
    const runtime = fpsNumber > 0 ? frameCount / fpsNumber : 8.2;
    const hostedModel = manifest.hosted_model ?? DEFAULT_METRICS.hostedModel;
    const sourceName = payload.source ? path.basename(payload.source) : DEFAULT_METRICS.sourceName;

    return {
      hostedModel,
      hostedModelShort: resolveShortModel(hostedModel),
      frameCount,
      fps: formatMetric(fpsNumber),
      detectionCount: confidences.length || DEFAULT_METRICS.detectionCount,
      avgConfidence: formatMetric(average),
      maxConfidence: formatMetric(max),
      runtime: formatRuntime(runtime),
      resolution: `${payload.width ?? 960} x ${payload.height ?? 540}`,
      sourceName,
      outputMode: predictionOutput?.json ? "video + json" : "video only",
    };
  } catch {
    return DEFAULT_METRICS;
  }
}
