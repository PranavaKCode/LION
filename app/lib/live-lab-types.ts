export type LiveLabPrediction = {
  className: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LiveLabImageOverlay = {
  kind: "image";
  width: number;
  height: number;
  predictions: LiveLabPrediction[];
};

export type LiveLabVideoFrame = {
  frame: number;
  time: number;
  predictions: LiveLabPrediction[];
};

export type LiveLabVideoOverlay = {
  kind: "video";
  width: number;
  height: number;
  sampleFps: number;
  frames: LiveLabVideoFrame[];
};

export type LiveLabOverlay = LiveLabImageOverlay | LiveLabVideoOverlay;

export type LiveLabResult = {
  annotatedKind: "image" | "video";
  annotatedUrl: string | null;
  jsonUrl: string | null;
  manifestUrl: string | null;
  model: string;
  sourceName: string;
  detectionCount: string;
  frameCount: string;
  avgConfidence: string;
  maxConfidence: string;
  fps: string;
  resolution: string;
  runtime: string;
  outputMode: string;
  overlay: LiveLabOverlay | null;
};

export type LiveLabPreparedUploadResponse = {
  status: "upload-ready";
  uploadUrl: string;
  annotatedKind: "video";
  model: string;
  sourceName: string;
  message: string;
};

export type LiveLabQueuedResponse = {
  status: "queued" | "processing";
  jobId: string;
  pollAfterMs: number;
  annotatedKind: "video";
  model: string;
  sourceName: string;
  message: string;
};

export type LiveLabCompleteResponse = {
  status: "complete";
  message?: string;
  result: LiveLabResult;
};

export type LiveLabApiResponse =
  | LiveLabPreparedUploadResponse
  | LiveLabQueuedResponse
  | LiveLabCompleteResponse;
