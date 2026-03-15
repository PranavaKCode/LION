import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_DETECTOR_ID,
  getDetectorOption,
  normalizeReefSpecialties,
  type ReefSpecialtyId,
} from "../../../lib/detector-config";
import type {
  LiveLabApiResponse,
  LiveLabCompleteResponse,
  LiveLabPrediction,
  LiveLabQueuedResponse,
  LiveLabResult,
  LiveLabVideoFrame,
} from "../../../lib/live-lab-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_CONFIDENCE = 0.25;
const MAX_IMAGE_UPLOAD_BYTES = 40 * 1024 * 1024;
const MAX_SERVER_PROXY_VIDEO_BYTES = 4 * 1024 * 1024;
const ROBOFLOW_DETECT_URL = "https://detect.roboflow.com";
const ROBOFLOW_API_URL = "https://api.roboflow.com";
const DEFAULT_MODEL_WORKSPACE = "su-eaelw";
const DEFAULT_MODEL_PROJECT = "lionfish-qs3tq";
const DEFAULT_MODEL_VERSION = 49;
const DEFAULT_VIDEO_INFER_FPS = 5;
const VIDEO_POLL_INTERVAL_MS = 10000;
const LOCAL_UPLOAD_ROOT = path.resolve(process.cwd(), "runs", "live-lab-inputs");
const LOCAL_REEF_RUN_ROOT = path.resolve(process.cwd(), "runs", "reef-health-live-lab");

const LOCAL_REEF_MODEL_SPECS: Record<ReefSpecialtyId, { label: string; envVar: string; fallbackPaths: string[] }> = {
  "fish-invertebrates": {
    label: "Fish + Invertebrates",
    envVar: "FISH_INV_MODEL_PATH",
    fallbackPaths: [path.resolve("C:/Users/goodp/Downloads/FishInv.pt")],
  },
  megafauna: {
    label: "MegaFauna + Rare Species",
    envVar: "MEGA_FAUNA_MODEL_PATH",
    fallbackPaths: [path.resolve("C:/Users/goodp/Downloads/MegaFauna.pt")],
  },
};

type ServerConfig = {
  apiKey?: string;
  modelWorkspace: string;
  modelProject: string;
  modelVersion: number;
  videoInferFps: number;
  pythonCommand: string;
  envValues: Record<string, string>;
};

type HostedModelConfig = {
  modelWorkspace: string;
  modelProject: string;
  modelVersion: number;
};

type RoboflowPrediction = {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  confidence?: number | string;
  class?: string;
};

type RoboflowImagePayload = {
  predictions?: RoboflowPrediction[];
  image?: {
    width?: number | string;
    height?: number | string;
  };
};

type RoboflowVideoJobPayload = {
  job_id?: string;
  output_signed_url?: string;
  status?: number;
  error?: string;
  message?: string;
};

type RoboflowVideoFramePayload = {
  time?: number | string;
  image?: {
    width?: number | string;
    height?: number | string;
  };
  predictions?: RoboflowPrediction[];
};

type RoboflowVideoOutputPayload = {
  frame_offset?: Array<number | string>;
  time_offset?: Array<number | string>;
  [key: string]: unknown;
};

type LocalImagePayload = {
  predictions?: RoboflowPrediction[];
  image?: {
    width?: number;
    height?: number;
  };
};

type LocalVideoFramePayload = {
  frame?: number;
  time?: number;
  predictions?: RoboflowPrediction[];
};

type LocalVideoPayload = {
  source?: string;
  fps?: number;
  width?: number;
  height?: number;
  frame_count?: number;
  frames?: LocalVideoFramePayload[];
};

type PredictionOutputRecord = {
  image?: string;
  video?: string;
  json?: string;
};

type LocalManifestPayload = {
  prediction_outputs?: Record<string, PredictionOutputRecord>;
};

type StartVideoJobRequest = {
  intent?: string;
  inputUrl?: string;
  sourceName?: string;
  detectorId?: string;
};

function isServerlessHost() {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.AWS_EXECUTION_ENV ||
      process.env.LAMBDA_TASK_ROOT,
  );
}

function parseEnvFile(raw: string) {
  const values: Record<string, string> = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (!key) {
      continue;
    }

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function clampConfidence(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_CONFIDENCE;
  }

  return Math.min(0.95, Math.max(0.05, value));
}

function toNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

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

function sanitizeSourceName(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 200) : fallback;
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function normalizePrediction(prediction: RoboflowPrediction): LiveLabPrediction {
  return {
    className: String(prediction.class ?? "object"),
    confidence: Number(prediction.confidence ?? 0),
    x: Number(prediction.x ?? 0),
    y: Number(prediction.y ?? 0),
    width: Number(prediction.width ?? 0),
    height: Number(prediction.height ?? 0),
  };
}

function filterPredictions(predictions: LiveLabPrediction[], confidence: number) {
  return predictions.filter((prediction) => prediction.confidence >= confidence);
}

function buildSummary(predictions: LiveLabPrediction[]) {
  const confidences = predictions.map((prediction) => prediction.confidence).filter((value) => Number.isFinite(value));
  const average = confidences.length
    ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
    : undefined;
  const max = confidences.length ? Math.max(...confidences) : undefined;

  return {
    detectionCount: String(predictions.length),
    avgConfidence: formatMetric(average),
    maxConfidence: formatMetric(max),
  };
}

function buildHostedModelConfig(config: ServerConfig, detectorId?: string | null): HostedModelConfig {
  const detector = getDetectorOption(detectorId ?? DEFAULT_DETECTOR_ID);
  return {
    modelWorkspace: detector.hostedModelWorkspace || config.modelWorkspace,
    modelProject: detector.hostedModelProject || config.modelProject,
    modelVersion: detector.hostedModelVersion || config.modelVersion,
  };
}

function buildHostedModelDisplay(config: HostedModelConfig) {
  return config.modelWorkspace && config.modelWorkspace !== "roboflow"
    ? `${config.modelWorkspace}/${config.modelProject}/${config.modelVersion}`
    : `${config.modelProject}/${config.modelVersion}`;
}

function buildImageResult(options: {
  modelDisplay: string;
  payload: RoboflowImagePayload | LocalImagePayload;
  confidence: number;
  sourceName: string;
  outputMode: string;
  manifestLabel?: string | null;
}): LiveLabResult {
  const { modelDisplay, payload, confidence, sourceName, outputMode, manifestLabel } = options;
  const predictions = filterPredictions((payload.predictions ?? []).map(normalizePrediction), confidence);
  const summary = buildSummary(predictions);
  const width = toNumber(payload.image?.width);
  const height = toNumber(payload.image?.height);

  return {
    annotatedKind: "image",
    annotatedUrl: null,
    jsonUrl: null,
    manifestUrl: manifestLabel ?? null,
    model: modelDisplay,
    sourceName,
    detectionCount: summary.detectionCount,
    frameCount: "1",
    avgConfidence: summary.avgConfidence,
    maxConfidence: summary.maxConfidence,
    fps: "N/A",
    resolution: Number.isFinite(width) && Number.isFinite(height) ? `${width} x ${height}` : "N/A",
    runtime: "N/A",
    outputMode,
    overlay:
      Number.isFinite(width) && Number.isFinite(height)
        ? {
            kind: "image",
            width: width!,
            height: height!,
            predictions,
          }
        : null,
  };
}

function buildHostedVideoResult(options: {
  modelDisplay: string;
  modelProject: string;
  inferFps: number;
  payload: RoboflowVideoOutputPayload;
  confidence: number;
  sourceName: string;
  jsonUrl: string | null;
}): LiveLabResult {
  const { modelDisplay, modelProject, inferFps, payload, confidence, sourceName, jsonUrl } = options;
  const frameOffsets = Array.isArray(payload.frame_offset) ? payload.frame_offset : [];
  const timeOffsets = Array.isArray(payload.time_offset) ? payload.time_offset : [];
  const modelKey = Object.keys(payload).find((key) => key !== "frame_offset" && key !== "time_offset") ?? modelProject;
  const rawFrames = Array.isArray(payload[modelKey]) ? (payload[modelKey] as RoboflowVideoFramePayload[]) : [];

  const frames: LiveLabVideoFrame[] = rawFrames.map((framePayload, index) => ({
    frame: toNumber(frameOffsets[index]) ?? index,
    time: toNumber(timeOffsets[index]) ?? toNumber(framePayload.time) ?? index / inferFps,
    predictions: filterPredictions((framePayload.predictions ?? []).map(normalizePrediction), confidence),
  }));

  const allPredictions = frames.flatMap((frame) => frame.predictions);
  const summary = buildSummary(allPredictions);
  const firstImage = rawFrames.find((framePayload) => framePayload.image)?.image;
  const width = toNumber(firstImage?.width);
  const height = toNumber(firstImage?.height);
  const runtimeSeconds = frames.length ? Math.max(...frames.map((frame) => frame.time)) : undefined;

  return {
    annotatedKind: "video",
    annotatedUrl: null,
    jsonUrl,
    manifestUrl: null,
    model: modelDisplay,
    sourceName,
    detectionCount: summary.detectionCount,
    frameCount: String(rawFrames.length),
    avgConfidence: summary.avgConfidence,
    maxConfidence: summary.maxConfidence,
    fps: formatMetric(inferFps),
    resolution: Number.isFinite(width) && Number.isFinite(height) ? `${width} x ${height}` : "N/A",
    runtime: formatRuntime(runtimeSeconds),
    outputMode: "remote video api + overlay",
    overlay:
      Number.isFinite(width) && Number.isFinite(height)
        ? {
            kind: "video",
            width: width!,
            height: height!,
            sampleFps: inferFps,
            frames,
          }
        : null,
  };
}

function buildLocalVideoResult(options: {
  modelDisplay: string;
  payload: LocalVideoPayload;
  confidence: number;
  sourceName: string;
  manifestLabel: string | null;
}): LiveLabResult {
  const { modelDisplay, payload, confidence, sourceName, manifestLabel } = options;
  const frames: LiveLabVideoFrame[] = (payload.frames ?? []).map((framePayload, index) => ({
    frame: toNumber(framePayload.frame) ?? index + 1,
    time: toNumber(framePayload.time) ?? (toNumber(payload.fps) ? index / Number(payload.fps) : index),
    predictions: filterPredictions((framePayload.predictions ?? []).map(normalizePrediction), confidence),
  }));

  const allPredictions = frames.flatMap((frame) => frame.predictions);
  const summary = buildSummary(allPredictions);
  const runtimeSeconds =
    Number.isFinite(payload.frame_count) && Number.isFinite(payload.fps) && payload.fps
      ? Number(payload.frame_count) / Number(payload.fps)
      : frames.length
        ? Math.max(...frames.map((frame) => frame.time))
        : undefined;

  return {
    annotatedKind: "video",
    annotatedUrl: null,
    jsonUrl: null,
    manifestUrl: manifestLabel,
    model: modelDisplay,
    sourceName,
    detectionCount: summary.detectionCount,
    frameCount: Number.isFinite(payload.frame_count) ? String(payload.frame_count) : String(frames.length),
    avgConfidence: summary.avgConfidence,
    maxConfidence: summary.maxConfidence,
    fps: formatMetric(toNumber(payload.fps)),
    resolution:
      Number.isFinite(payload.width) && Number.isFinite(payload.height)
        ? `${payload.width} x ${payload.height}`
        : "N/A",
    runtime: formatRuntime(runtimeSeconds),
    outputMode: "local reef-health suite + overlay",
    overlay:
      Number.isFinite(payload.width) && Number.isFinite(payload.height)
        ? {
            kind: "video",
            width: payload.width!,
            height: payload.height!,
            sampleFps: toNumber(payload.fps) ?? 1,
            frames,
          }
        : null,
  };
}

async function resolveServerConfig(): Promise<ServerConfig> {
  const envFromProcess = {
    apiKey: process.env.ROBOFLOW_API_KEY,
    modelWorkspace: process.env.ROBOFLOW_WORKSPACE,
    modelProject: process.env.ROBOFLOW_PROJECT,
    modelVersion: process.env.ROBOFLOW_MODEL_VERSION,
    videoInferFps: process.env.ROBOFLOW_VIDEO_INFER_FPS,
    pythonCommand: process.env.LION_PYTHON_BIN || process.env.LIONFISH_PYTHON_BIN,
    fishInvModelPath: process.env.FISH_INV_MODEL_PATH,
    megaFaunaModelPath: process.env.MEGA_FAUNA_MODEL_PATH,
  };

  const envFiles = [path.join(process.cwd(), ".env.local"), path.join(process.cwd(), ".env")];
  const envFromFiles: Record<string, string> = {};

  for (const envFile of envFiles) {
    try {
      Object.assign(envFromFiles, parseEnvFile(await readFile(envFile, "utf8")));
    } catch {
      // Ignore missing env files and continue with other sources.
    }
  }

  const envValues = {
    ...envFromFiles,
    ...Object.fromEntries(
      Object.entries(envFromProcess).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    ),
  };

  return {
    apiKey: envFromProcess.apiKey || envFromFiles.ROBOFLOW_API_KEY,
    modelWorkspace: envFromProcess.modelWorkspace || envFromFiles.ROBOFLOW_WORKSPACE || DEFAULT_MODEL_WORKSPACE,
    modelProject: envFromProcess.modelProject || envFromFiles.ROBOFLOW_PROJECT || DEFAULT_MODEL_PROJECT,
    modelVersion:
      toNumber(envFromProcess.modelVersion) ||
      toNumber(envFromFiles.ROBOFLOW_MODEL_VERSION) ||
      DEFAULT_MODEL_VERSION,
    videoInferFps:
      toNumber(envFromProcess.videoInferFps) ||
      toNumber(envFromFiles.ROBOFLOW_VIDEO_INFER_FPS) ||
      DEFAULT_VIDEO_INFER_FPS,
    pythonCommand:
      envFromProcess.pythonCommand || envFromFiles.LION_PYTHON_BIN || envFromFiles.LIONFISH_PYTHON_BIN || "python",
    envValues,
  };
}

async function fetchJson<T>(url: string, init: RequestInit, errorLabel: string): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`${errorLabel}: ${details || response.statusText}`);
  }

  return (await response.json()) as T;
}

async function requestVideoUploadUrl(fileName: string, config: ServerConfig) {
  const signedUrlPayload = await fetchJson<{ signed_url: string }>(
    `${ROBOFLOW_API_URL}/video_upload_signed_url?api_key=${encodeURIComponent(config.apiKey!)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_name: fileName }),
    },
    "Error requesting Roboflow video upload URL",
  );

  return signedUrlPayload.signed_url;
}

async function uploadVideoFileToRoboflow(file: File, config: ServerConfig) {
  const signedUrl = await requestVideoUploadUrl(file.name || "uploaded-video.mp4", config);
  const uploadResponse = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: Buffer.from(await file.arrayBuffer()),
    cache: "no-store",
  });

  if (!uploadResponse.ok) {
    const details = await uploadResponse.text();
    throw new Error(`Error uploading video to Roboflow: ${details || uploadResponse.statusText}`);
  }

  return signedUrl;
}

async function startVideoJob(options: {
  config: ServerConfig;
  modelConfig: HostedModelConfig;
  inputUrl: string;
  sourceName: string;
}): Promise<LiveLabQueuedResponse> {
  const { config, modelConfig, inputUrl, sourceName } = options;
  const jobPayload = await fetchJson<RoboflowVideoJobPayload>(
    `${ROBOFLOW_API_URL}/videoinfer/?api_key=${encodeURIComponent(config.apiKey!)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input_url: inputUrl,
        infer_fps: config.videoInferFps,
        models: [
          {
            model_id: modelConfig.modelProject,
            model_version: modelConfig.modelVersion,
            inference_type: "object-detection",
          },
        ],
      }),
    },
    "Error starting Roboflow video inference",
  );

  if (!jobPayload.job_id) {
    throw new Error("Roboflow did not return a video job id.");
  }

  return {
    status: "queued",
    jobId: jobPayload.job_id,
    pollAfterMs: VIDEO_POLL_INTERVAL_MS,
    annotatedKind: "video",
    model: buildHostedModelDisplay(modelConfig),
    sourceName,
    message: "Video uploaded. Roboflow is processing frames remotely.",
  };
}

async function pollVideoJob(options: {
  config: ServerConfig;
  modelConfig: HostedModelConfig;
  jobId: string;
  confidence: number;
  sourceName: string;
}): Promise<LiveLabApiResponse> {
  const { config, modelConfig, jobId, confidence, sourceName } = options;
  const statusPayload = await fetchJson<RoboflowVideoJobPayload>(
    `${ROBOFLOW_API_URL}/videoinfer/?api_key=${encodeURIComponent(config.apiKey!)}&job_id=${encodeURIComponent(jobId)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
    "Error polling Roboflow video inference",
  );

  if (typeof statusPayload.status !== "number" || statusPayload.status === 1) {
    return {
      status: "processing",
      jobId,
      pollAfterMs: VIDEO_POLL_INTERVAL_MS,
      annotatedKind: "video",
      model: buildHostedModelDisplay(modelConfig),
      sourceName,
      message: "Remote video detection is still running. Checking again shortly.",
    };
  }

  if (statusPayload.status > 1 || !statusPayload.output_signed_url) {
    throw new Error(statusPayload.error || statusPayload.message || "Roboflow video inference failed.");
  }

  const outputPayload = await fetchJson<RoboflowVideoOutputPayload>(
    statusPayload.output_signed_url,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
    "Error downloading Roboflow video results",
  );

  const result = buildHostedVideoResult({
    modelDisplay: buildHostedModelDisplay(modelConfig),
    modelProject: modelConfig.modelProject,
    inferFps: config.videoInferFps,
    payload: outputPayload,
    confidence,
    sourceName,
    jsonUrl: statusPayload.output_signed_url,
  });

  const response: LiveLabCompleteResponse = {
    status: "complete",
    message: "Remote video detection complete.",
    result,
  };

  return response;
}

function runPythonCommand(command: string, args: string[]) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(stderr.trim() || stdout.trim() || `Python process exited with code ${code}.`));
    });
  });
}

async function resolveExistingPath(candidates: string[]) {
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Keep searching.
    }
  }

  return null;
}

async function resolveLocalSuiteModels(config: ServerConfig, specialties: ReefSpecialtyId[]) {
  const resolved = [] as Array<{ id: ReefSpecialtyId; label: string; path: string }>;

  for (const specialty of specialties) {
    const spec = LOCAL_REEF_MODEL_SPECS[specialty];
    const configuredPath = config.envValues[spec.envVar];
    const modelPath = await resolveExistingPath([configuredPath, ...spec.fallbackPaths].filter(Boolean) as string[]);
    if (!modelPath) {
      throw new Error(
        `Could not find the ${spec.label} model. Set ${spec.envVar} in .env.local or place the weight at one of the expected fallback paths.`,
      );
    }

    resolved.push({ id: specialty, label: spec.label, path: modelPath });
  }

  return resolved;
}

async function writeUploadedInput(file: File) {
  const inputDir = path.join(LOCAL_UPLOAD_ROOT, randomUUID());
  const inputPath = path.join(inputDir, sanitizeFilename(file.name || "upload.bin"));
  await writeFile(inputPath, Buffer.from(await file.arrayBuffer()));
  return inputPath;
}

async function runLocalReefHealthSuite(options: {
  config: ServerConfig;
  file: File;
  confidence: number;
  specialties: ReefSpecialtyId[];
}): Promise<LiveLabCompleteResponse> {
  const { config, file, confidence, specialties } = options;

  if (isServerlessHost()) {
    throw new Error(
      "The Reef Health Suite is local-only for now because it depends on YOLO weight files and a local Python environment.",
    );
  }

  const models = await resolveLocalSuiteModels(config, specialties);
  const inputPath = await writeUploadedInput(file);
  const runRoot = path.join(LOCAL_REEF_RUN_ROOT, randomUUID());
  const args = [path.resolve(process.cwd(), "lionfish_yolo.py"), "local-predict"];

  if (file.type.startsWith("video/")) {
    args.push("--video", inputPath);
  } else {
    args.push("--source", inputPath);
  }

  args.push("--output-root", runRoot, "--run-name", "predict", "--conf", confidence.toString());

  for (const model of models) {
    args.push("--model-path", model.path, "--model-label", model.label);
  }

  await runPythonCommand(config.pythonCommand, args);

  const manifestPath = path.join(runRoot, "last_run.json");
  const manifestRaw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw) as LocalManifestPayload;
  const outputRecord = Object.values(manifest.prediction_outputs ?? {})[0];
  const jsonPath = outputRecord?.json;
  if (!jsonPath) {
    throw new Error("The local reef-health suite did not produce a JSON overlay payload.");
  }

  const payloadRaw = await readFile(jsonPath, "utf8");
  const modelDisplay = `reef-health-suite / ${models.map((model) => model.label).join(" + ")}`;
  const manifestLabel = path.relative(process.cwd(), manifestPath).replace(/\\/g, "/");

  if (file.type.startsWith("video/")) {
    const payload = JSON.parse(payloadRaw) as LocalVideoPayload;
    return {
      status: "complete",
      message: "Local reef-health detection complete.",
      result: buildLocalVideoResult({
        modelDisplay,
        payload,
        confidence,
        sourceName: sanitizeSourceName(file.name, "uploaded-video.mp4"),
        manifestLabel,
      }),
    };
  }

  const payload = JSON.parse(payloadRaw) as LocalImagePayload;
  return {
    status: "complete",
    message: "Local reef-health detection complete.",
    result: buildImageResult({
      modelDisplay,
      payload,
      confidence,
      sourceName: sanitizeSourceName(file.name, "uploaded-image.jpg"),
      outputMode: "local reef-health suite + overlay",
      manifestLabel,
    }),
  };
}

export async function GET(request: NextRequest) {
  const config = await resolveServerConfig();
  if (!config.apiKey) {
    return NextResponse.json(
      {
        error: "ROBOFLOW_API_KEY is not configured for the Live Lab server route.",
      },
      { status: 500 },
    );
  }

  const jobId = request.nextUrl.searchParams.get("jobId");
  const confidence = clampConfidence(Number(request.nextUrl.searchParams.get("confidence") ?? DEFAULT_CONFIDENCE));
  const sourceName = sanitizeSourceName(request.nextUrl.searchParams.get("sourceName"), "uploaded-video.mp4");
  const detectorId = request.nextUrl.searchParams.get("detectorId") ?? DEFAULT_DETECTOR_ID;
  const detector = getDetectorOption(detectorId);

  if (!jobId) {
    return NextResponse.json({ error: "A Roboflow video job id is required." }, { status: 400 });
  }

  if (detector.kind !== "hosted") {
    return NextResponse.json({ error: "Local detector suites do not use remote polling jobs." }, { status: 400 });
  }

  try {
    const payload = await pollVideoJob({
      config,
      modelConfig: buildHostedModelConfig(config, detector.id),
      jobId,
      confidence,
      sourceName,
    });
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Live Lab video polling failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const config = await resolveServerConfig();
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    if (!config.apiKey) {
      return NextResponse.json(
        {
          error:
            "ROBOFLOW_API_KEY is not configured for the Next.js server. Add it to your deployment environment or local env file and restart the app.",
        },
        { status: 500 },
      );
    }

    const body = (await request.json()) as StartVideoJobRequest;
    const detector = getDetectorOption(body.detectorId ?? DEFAULT_DETECTOR_ID);
    if (detector.kind !== "hosted") {
      return NextResponse.json({ error: "The Reef Health Suite does not start remote hosted video jobs." }, { status: 400 });
    }

    if (body.intent !== "start-video-job") {
      return NextResponse.json({ error: "Unsupported Live Lab request intent." }, { status: 400 });
    }

    const inputUrl = body.inputUrl?.trim();
    if (!inputUrl) {
      return NextResponse.json({ error: "A public upload URL is required to start video inference." }, { status: 400 });
    }

    try {
      const sourceName = sanitizeSourceName(body.sourceName, "uploaded-video.mp4");
      return NextResponse.json(
        await startVideoJob({
          config,
          modelConfig: buildHostedModelConfig(config, detector.id),
          inputUrl,
          sourceName,
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Live Lab video setup failed.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const confidence = clampConfidence(Number(formData.get("confidence") ?? DEFAULT_CONFIDENCE));
  const detectorId = String(formData.get("detectorId") ?? DEFAULT_DETECTOR_ID);
  const detector = getDetectorOption(detectorId);
  const specialties = normalizeReefSpecialties(formData.getAll("specialties").map(String));

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a file before running detection." }, { status: 400 });
  }

  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    return NextResponse.json(
      { error: "Only image and video uploads are supported in the live lab." },
      { status: 400 },
    );
  }

  if (detector.kind === "local") {
    try {
      return NextResponse.json(
        await runLocalReefHealthSuite({
          config,
          file,
          confidence,
          specialties,
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Local reef-health detection failed.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (!config.apiKey) {
    return NextResponse.json(
      {
        error:
          "ROBOFLOW_API_KEY is not configured for the Next.js server. Add it to your deployment environment or local env file and restart the app.",
      },
      { status: 500 },
    );
  }

  const modelConfig = buildHostedModelConfig(config, detector.id);

  if (file.type.startsWith("image/")) {
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "The uploaded image is too large for the live lab. Keep image uploads under 40 MB." },
        { status: 400 },
      );
    }

    try {
      const params = new URLSearchParams({
        api_key: config.apiKey,
        name: file.name || "upload-image.jpg",
        overlap: "30",
        confidence: String(Math.round(confidence * 100)),
        stroke: "1",
        labels: "false",
        format: "json",
      });

      const imagePayload = await fetchJson<RoboflowImagePayload>(
        `${ROBOFLOW_DETECT_URL}/${modelConfig.modelProject}/${modelConfig.modelVersion}?${params.toString()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: Buffer.from(await file.arrayBuffer()).toString("base64"),
        },
        "Error running Roboflow image inference",
      );

      const response: LiveLabCompleteResponse = {
        status: "complete",
        message: `${detector.label} detection complete.`,
        result: buildImageResult({
          modelDisplay: buildHostedModelDisplay(modelConfig),
          payload: imagePayload,
          confidence,
          sourceName: sanitizeSourceName(file.name, "uploaded-image.jpg"),
          outputMode: "remote image api + overlay",
        }),
      };

      return NextResponse.json(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Live Lab image inference failed.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (isServerlessHost() && file.size > MAX_SERVER_PROXY_VIDEO_BYTES) {
    return NextResponse.json(
      {
        error:
          "This deployment cannot proxy videos over 4 MB through a serverless function. Configure Vercel Blob with BLOB_READ_WRITE_TOKEN for large deployed uploads, or run the app locally for direct proxy uploads.",
      },
      { status: 400 },
    );
  }

  try {
    const inputUrl = await uploadVideoFileToRoboflow(file, config);
    return NextResponse.json(
      await startVideoJob({
        config,
        modelConfig,
        inputUrl,
        sourceName: sanitizeSourceName(file.name, "uploaded-video.mp4"),
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Live Lab video inference failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
