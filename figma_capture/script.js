const manifestUrl = "../runs/lionfish/last_run.json";
const framesUrl = "../runs/lionfish/hosted-predict/120391-720880500_small.json";
const videoUrl = "../runs/lionfish/hosted-predict/120391-720880500_small_pred.mp4";

const defaultStats = {
  hostedModel: "su-eaelw/lionfish-qs3tq/49",
  hostedModelShort: "lionfish/49",
  frameCount: "246",
  fps: "29.97",
  detectionCount: "246",
  avgConfidence: "0.87",
  maxConfidence: "0.88",
  runtime: "00:08.2",
  resolution: "960 x 540",
  sourceName: "120391-720880500_small.mp4",
  sourceShort: "120391..."
};

const formatNumber = (value, digits = 2) => Number(value).toFixed(digits);

const formatRuntime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${remainder.toFixed(1).padStart(4, "0")}`;
};

const setBindings = (stats) => {
  document.querySelectorAll("[data-bind]").forEach((node) => {
    const key = node.getAttribute("data-bind");
    if (stats[key] !== undefined) {
      node.textContent = stats[key];
    }
  });
};

const calculateStats = (manifest, framesPayload) => {
  const frameEntries = Array.isArray(framesPayload.frames) ? framesPayload.frames : [];
  const predictions = frameEntries.flatMap((frame) => Array.isArray(frame.predictions) ? frame.predictions : []);
  const confidences = predictions
    .map((entry) => Number(entry.confidence))
    .filter((value) => Number.isFinite(value));
  const meanConfidence = confidences.length
    ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
    : Number(defaultStats.avgConfidence);
  const peakConfidence = confidences.length ? Math.max(...confidences) : Number(defaultStats.maxConfidence);
  const fps = Number(framesPayload.fps) || Number(defaultStats.fps);
  const frameCount = Number(framesPayload.frame_count) || Number(defaultStats.frameCount);
  const runtime = fps > 0 ? frameCount / fps : 8.2;
  const hostedModel = manifest?.hosted_model || defaultStats.hostedModel;
  const sourceName = framesPayload?.source ? framesPayload.source.split("\\").pop() : defaultStats.sourceName;

  return {
    hostedModel,
    hostedModelShort: hostedModel.split("/").slice(-2).join("/"),
    frameCount: String(frameCount),
    fps: formatNumber(fps),
    detectionCount: String(predictions.length || frameCount),
    avgConfidence: formatNumber(meanConfidence),
    maxConfidence: formatNumber(peakConfidence),
    runtime: formatRuntime(runtime),
    resolution: `${framesPayload.width || 960} x ${framesPayload.height || 540}`,
    sourceName,
    sourceShort: sourceName.length > 10 ? `${sourceName.slice(0, 7)}...` : sourceName
  };
};

const drawFallback = (canvas) => {
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#103f52");
  gradient.addColorStop(1, "#1f8a70");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(255, 248, 236, 0.85)";
  context.font = "700 24px Consolas";
  context.fillText("L.I.O.N. frame unavailable", 32, canvas.height / 2);
};

const captureFramesToCanvases = () => {
  const canvases = Array.from(document.querySelectorAll(".gallery-canvas"));
  if (!canvases.length) {
    return;
  }

  const video = document.createElement("video");
  video.src = videoUrl;
  video.muted = true;
  video.preload = "auto";
  video.crossOrigin = "anonymous";

  const captureCanvas = (canvas) =>
    new Promise((resolve) => {
      const seekTime = Number(canvas.dataset.frameSeconds || 0);

      const onSeeked = () => {
        try {
          const context = canvas.getContext("2d");
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
        } catch {
          drawFallback(canvas);
        }
        resolve();
      };

      video.currentTime = Math.min(seekTime, Math.max(video.duration - 0.2, 0));
      video.addEventListener("seeked", onSeeked, { once: true });
    });

  video.addEventListener(
    "loadeddata",
    async () => {
      for (const canvas of canvases) {
        await captureCanvas(canvas);
      }
    },
    { once: true }
  );

  video.addEventListener(
    "error",
    () => {
      canvases.forEach(drawFallback);
    },
    { once: true }
  );
};

const hydrateStats = async () => {
  setBindings(defaultStats);

  try {
    const [manifestResponse, framesResponse] = await Promise.all([fetch(manifestUrl), fetch(framesUrl)]);
    if (!manifestResponse.ok || !framesResponse.ok) {
      return;
    }

    const manifestPayload = await manifestResponse.json();
    const framePayload = await framesResponse.json();
    setBindings(calculateStats(manifestPayload, framePayload));
  } catch (error) {
    console.warn("Unable to load L.I.O.N. run artifacts for capture page.", error);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  hydrateStats();
  captureFramesToCanvases();
});


