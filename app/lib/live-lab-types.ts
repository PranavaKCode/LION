export type LiveLabResult = {
  annotatedKind: "image" | "video";
  annotatedUrl: string;
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
};
