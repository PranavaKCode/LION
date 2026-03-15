import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextResponse } from "next/server";
import type { LiveLabResult } from "../../../lib/live-lab-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_CONFIDENCE = 0.25;
const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;

type PredictionOutput = {
  image?: string;
  video?: string;
  json?: string;
};

type ManifestPayload = {
  hosted_model?: string;
  prediction_outputs?: Record<string, PredictionOutput>;
};

type ImagePredictionPayload = {
  predictions?: Array<{
    confidence?: number | string;
  }>;
  image?: {
    width?: number;
    height?: number;
  };
};

type VideoPredictionPayload = {
  source?: string;
  fps?: number;
  width?: number;
  height?: number;
  frame_count?: number;
  frames?: Array<{
    predictions?: Array<{
      confidence?: number | string;
    }>;
  }>;
};

type ServerConfig = {
  apiKey?: string;
  pythonCommand: string;
};

function isServerlessHost() {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.AWS_EXECUTION_ENV ||
      process.env.LAMBDA_TASK_ROOT,
  );
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function clampConfidence(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_CONFIDENCE;
  }

  return Math.min(0.95, Math.max(0.05, value));
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

function toPublicUrl(absolutePath: string, publicDir: string) {
  const relativePath = path.relative(publicDir, absolutePath);
  if (!relativePath || relativePath.startsWith("..")) {
    throw new Error(`Output path is outside the public directory: ${absolutePath}`);
  }

  return `/${relativePath.replace(/\\/g, "/")}`;
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

async function resolveServerConfig(): Promise<ServerConfig> {
  const envFromProcess = {
    apiKey: process.env.ROBOFLOW_API_KEY,
    pythonCommand: process.env.LIONFISH_PYTHON_BIN,
  };

  if (envFromProcess.apiKey && envFromProcess.pythonCommand) {
    return {
      apiKey: envFromProcess.apiKey,
      pythonCommand: envFromProcess.pythonCommand,
    };
  }

  const envFiles = [path.join(process.cwd(), ".env.local"), path.join(process.cwd(), ".env")];
  const envFromFiles: Record<string, string> = {};

  for (const envFile of envFiles) {
    try {
      Object.assign(envFromFiles, parseEnvFile(await readFile(envFile, "utf8")));
    } catch {
      // Ignore missing local env files and continue with other sources.
    }
  }

  return {
    apiKey: envFromProcess.apiKey || envFromFiles.ROBOFLOW_API_KEY,
    pythonCommand: envFromProcess.pythonCommand || envFromFiles.LIONFISH_PYTHON_BIN || "python",
  };
}

function collectConfidences(payload: ImagePredictionPayload | VideoPredictionPayload | null) {
  if (!payload) {
    return [] as number[];
  }

  if (Array.isArray((payload as VideoPredictionPayload).frames)) {
    return ((payload as VideoPredictionPayload).frames ?? []).flatMap((frame) =>
      (frame.predictions ?? [])
        .map((prediction) => Number(prediction.confidence))
        .filter((confidence) => Number.isFinite(confidence)),
    );
  }

  return ((payload as ImagePredictionPayload).predictions ?? [])
    .map((prediction) => Number(prediction.confidence))
    .filter((confidence) => Number.isFinite(confidence));
}

function buildResult(options: {
  manifest: ManifestPayload;
  outputRecord: PredictionOutput;
  payload: ImagePredictionPayload | VideoPredictionPayload | null;
  manifestPath: string;
  publicDir: string;
}): LiveLabResult {
  const { manifest, outputRecord, payload, manifestPath, publicDir } = options;
  const annotatedPath = outputRecord.video ?? outputRecord.image;
  if (!annotatedPath) {
    throw new Error("The detection run completed without an image or video output.");
  }

  const confidences = collectConfidences(payload);
  const isVideo = Boolean(outputRecord.video);
  const videoPayload = payload as VideoPredictionPayload | null;
  const imagePayload = payload as ImagePredictionPayload | null;
  const fpsValue = isVideo ? videoPayload?.fps : undefined;
  const frameCountValue = isVideo ? videoPayload?.frame_count : imagePayload ? 1 : undefined;
  const averageConfidence = confidences.length
    ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
    : 0;
  const maxConfidence = confidences.length ? Math.max(...confidences) : 0;
  const resolutionWidth = isVideo ? videoPayload?.width : imagePayload?.image?.width;
  const resolutionHeight = isVideo ? videoPayload?.height : imagePayload?.image?.height;
  const sourceName = isVideo
    ? path.basename(videoPayload?.source ?? annotatedPath)
    : path.basename(annotatedPath);

  return {
    annotatedKind: isVideo ? "video" : "image",
    annotatedUrl: toPublicUrl(annotatedPath, publicDir),
    jsonUrl: outputRecord.json ? toPublicUrl(outputRecord.json, publicDir) : null,
    manifestUrl: toPublicUrl(manifestPath, publicDir),
    model: manifest.hosted_model ?? "N/A",
    sourceName,
    detectionCount: String(confidences.length),
    frameCount: Number.isFinite(frameCountValue) ? String(frameCountValue) : "N/A",
    avgConfidence: formatMetric(averageConfidence),
    maxConfidence: formatMetric(maxConfidence),
    fps: formatMetric(fpsValue),
    resolution:
      Number.isFinite(resolutionWidth) && Number.isFinite(resolutionHeight)
        ? `${resolutionWidth} x ${resolutionHeight}`
        : "N/A",
    runtime:
      isVideo && Number.isFinite(frameCountValue) && Number.isFinite(fpsValue)
        ? formatRuntime(frameCountValue! / fpsValue!)
        : "N/A",
    outputMode: outputRecord.json
      ? `${isVideo ? "video" : "image"} + json`
      : isVideo
        ? "video only"
        : "image only",
  };
}

function runLionfishProcess(command: string, args: string[], config: ServerConfig) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ...(config.apiKey ? { ROBOFLOW_API_KEY: config.apiKey } : {}),
        LIONFISH_PYTHON_BIN: config.pythonCommand,
      },
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(stderr.trim() || stdout.trim() || `lionfish_yolo.py exited with code ${code}.`));
    });
  });
}

export async function POST(request: Request) {
  const serverConfig = await resolveServerConfig();

  if (isServerlessHost()) {
    return NextResponse.json(
      {
        error:
          "The deployed Live Lab is preview-only right now. This serverless host cannot run the local Python detection pipeline or persist annotated outputs. Run L.I.O.N. locally to process real uploads.",
      },
      { status: 501 },
    );
  }

  if (!serverConfig.apiKey) {
    return NextResponse.json(
      {
        error:
          "ROBOFLOW_API_KEY is not configured for the Next.js server. Add it to your environment or .env.local and restart the app.",
      },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const requestedConfidence = Number(formData.get("confidence") ?? DEFAULT_CONFIDENCE);
  const confidence = clampConfidence(requestedConfidence);

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a file before running detection." }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "The uploaded file is too large for the live lab. Keep uploads under 40 MB." },
      { status: 400 },
    );
  }

  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    return NextResponse.json(
      { error: "Only image and video uploads are supported in the live lab." },
      { status: 400 },
    );
  }

  const jobId = randomUUID();
  const publicDir = path.join(process.cwd(), "public");
  const outputRoot = path.join(publicDir, "live-lab-output", jobId);
  const tempRoot = path.join(os.tmpdir(), "lion-live-lab", jobId);
  const uploadPath = path.join(tempRoot, sanitizeFilename(file.name || `upload-${jobId}`));

  try {
    await mkdir(outputRoot, { recursive: true });
    await mkdir(tempRoot, { recursive: true });
    await writeFile(uploadPath, Buffer.from(await file.arrayBuffer()));

    await runLionfishProcess(
      serverConfig.pythonCommand,
      [
        "lionfish_yolo.py",
        "hosted-predict",
        "--preset",
        "lionfish",
        "--source",
        uploadPath,
        "--output-root",
        outputRoot,
        "--run-name",
        "result",
        "--conf",
        confidence.toFixed(2),
      ],
      serverConfig,
    );

    const manifestPath = path.join(outputRoot, "last_run.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as ManifestPayload;
    const outputRecord = Object.values(manifest.prediction_outputs ?? {})[0];

    if (!outputRecord) {
      throw new Error("The detector did not produce an output record.");
    }

    let payload: ImagePredictionPayload | VideoPredictionPayload | null = null;
    if (outputRecord.json) {
      payload = JSON.parse(await readFile(outputRecord.json, "utf8")) as ImagePredictionPayload | VideoPredictionPayload;
    }

    return NextResponse.json(
      buildResult({
        manifest,
        outputRecord,
        payload,
        manifestPath,
        publicDir,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Live lab inference failed.";
    return NextResponse.json(
      {
        error:
          `${message} If Python is not ready, set LIONFISH_PYTHON_BIN to a working Python 3.10-3.12 environment and install the project dependencies there.`,
      },
      { status: 500 },
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

