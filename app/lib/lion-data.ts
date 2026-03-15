import { access, readFile } from "node:fs/promises";
import path from "node:path";

export type LionMetrics = {
  hostedModel: string;
  hostedModelShort: string;
  frameCount: string;
  fps: string;
  detectionCount: string;
  avgConfidence: string;
  maxConfidence: string;
  runtime: string;
  resolution: string;
  sourceName: string;
  outputMode: string;
  manifestPath: string;
  outputVideoName: string;
  frameJsonStatus: string;
  presetName: string;
  hasEvaluationData: boolean;
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
  hostedModel: "N/A",
  hostedModelShort: "N/A",
  frameCount: "N/A",
  fps: "N/A",
  detectionCount: "N/A",
  avgConfidence: "N/A",
  maxConfidence: "N/A",
  runtime: "N/A",
  resolution: "N/A",
  sourceName: "lionfish-demo.mp4",
  outputMode: "demo preview",
  manifestPath: "N/A",
  outputVideoName: "lionfish-demo.mp4",
  frameJsonStatus: "N/A",
  presetName: "lionfish",
  hasEvaluationData: false,
};

function formatMetric(value?: number, digits = 2) {
  return Number.isFinite(value) ? value!.toFixed(digits) : "N/A";
}

function formatRuntime(totalSeconds?: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds === undefined) {
    return "N/A";
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(1).padStart(4, "0")}`;
}

function resolveShortModel(model?: string) {
  if (!model) {
    return "N/A";
  }

  const parts = model.split("/");
  return parts.slice(-2).join("/") || model;
}

function toDisplayNumber(value?: number) {
  return Number.isFinite(value) ? String(value) : "N/A";
}

function toRelativePath(filePath?: string) {
  if (!filePath) {
    return "N/A";
  }

  return path.relative(process.cwd(), filePath).replace(/\\/g, "/") || path.basename(filePath);
}

async function findExistingPath(candidates: string[]) {
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Continue searching other candidate paths.
    }
  }

  return null;
}

function resolveCandidate(baseDir: string, candidate?: string) {
  if (!candidate) {
    return null;
  }

  return path.isAbsolute(candidate) ? candidate : path.resolve(baseDir, candidate);
}

export async function getLionMetrics(): Promise<LionMetrics> {
  const manifestPath = await findExistingPath([
    path.resolve(process.cwd(), "runs", "lionfish", "last_run.json"),
    path.resolve(process.cwd(), "..", "runs", "lionfish", "last_run.json"),
  ]);

  if (!manifestPath) {
    return DEFAULT_METRICS;
  }

  try {
    const manifestRaw = await readFile(manifestPath, "utf8");
    const manifest = JSON.parse(manifestRaw) as ManifestPayload;
    const manifestDir = path.dirname(manifestPath);
    const predictionOutput = Object.values(manifest.prediction_outputs ?? {})[0];

    const payloadPath = await findExistingPath(
      [
        resolveCandidate(manifestDir, predictionOutput?.json),
        path.resolve(manifestDir, "hosted-predict", "120391-720880500_small.json"),
        path.resolve(path.dirname(manifestDir), "hosted-predict", "120391-720880500_small.json"),
      ].filter((candidate): candidate is string => Boolean(candidate)),
    );

    const outputVideoPath = await findExistingPath(
      [
        resolveCandidate(manifestDir, predictionOutput?.video),
        path.resolve(manifestDir, "hosted-predict", "120391-720880500_small_pred.mp4"),
        path.resolve(path.dirname(manifestDir), "hosted-predict", "120391-720880500_small_pred.mp4"),
      ].filter((candidate): candidate is string => Boolean(candidate)),
    );

    if (!payloadPath) {
      const hostedModel = manifest.hosted_model ?? DEFAULT_METRICS.hostedModel;
      return {
        ...DEFAULT_METRICS,
        hostedModel,
        hostedModelShort: resolveShortModel(hostedModel),
        manifestPath: toRelativePath(manifestPath),
        outputVideoName: outputVideoPath ? path.basename(outputVideoPath) : DEFAULT_METRICS.outputVideoName,
        outputMode: outputVideoPath ? "video export" : DEFAULT_METRICS.outputMode,
        hasEvaluationData: false,
      };
    }

    const payloadRaw = await readFile(payloadPath, "utf8");
    const payload = JSON.parse(payloadRaw) as PredictionPayload;
    const frames = Array.isArray(payload.frames) ? payload.frames : [];
    const confidences = frames.flatMap((frame) =>
      (frame.predictions ?? [])
        .map((prediction) => Number(prediction.confidence))
        .filter((confidence) => Number.isFinite(confidence)),
    );

    const frameCount = payload.frame_count;
    const fpsNumber = payload.fps;
    const average = confidences.length
      ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
      : undefined;
    const max = confidences.length ? Math.max(...confidences) : undefined;
    const runtime = frameCount && fpsNumber ? frameCount / fpsNumber : undefined;
    const hostedModel = manifest.hosted_model ?? DEFAULT_METRICS.hostedModel;
    const sourceName = payload.source ? path.basename(payload.source) : DEFAULT_METRICS.sourceName;

    return {
      hostedModel,
      hostedModelShort: resolveShortModel(hostedModel),
      frameCount: toDisplayNumber(frameCount),
      fps: formatMetric(fpsNumber),
      detectionCount: toDisplayNumber(confidences.length || undefined),
      avgConfidence: formatMetric(average),
      maxConfidence: formatMetric(max),
      runtime: formatRuntime(runtime),
      resolution:
        Number.isFinite(payload.width) && Number.isFinite(payload.height)
          ? `${payload.width} x ${payload.height}`
          : "N/A",
      sourceName,
      outputMode: outputVideoPath ? "video + json" : "json export",
      manifestPath: toRelativePath(manifestPath),
      outputVideoName: outputVideoPath ? path.basename(outputVideoPath) : "N/A",
      frameJsonStatus: path.basename(payloadPath),
      presetName: "lionfish",
      hasEvaluationData: true,
    };
  } catch {
    return DEFAULT_METRICS;
  }
}
