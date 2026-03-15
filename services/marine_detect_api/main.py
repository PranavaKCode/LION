from __future__ import annotations

import json
import mimetypes
import os
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from pydantic import BaseModel, Field

REPO_ROOT = Path(__file__).resolve().parents[2]
LION_SCRIPT = REPO_ROOT / "lionfish_yolo.py"
DEFAULT_CONFIDENCE = 0.25
DEFAULT_SPECIALTIES = ("fish-invertebrates", "megafauna")
VIDEO_SUFFIXES = {".mp4", ".avi", ".mov", ".mkv", ".m4v", ".webm"}
MODEL_SPECS = {
    "fish-invertebrates": {
        "label": "Fish + Invertebrates",
        "env_var": "FISH_INV_MODEL_PATH",
        "fallback": REPO_ROOT / "models" / "FishInv.pt",
    },
    "megafauna": {
        "label": "MegaFauna + Rare Species",
        "env_var": "MEGA_FAUNA_MODEL_PATH",
        "fallback": REPO_ROOT / "models" / "MegaFauna.pt",
    },
}

app = FastAPI(title="L.I.O.N. Marine Detect Service", version="0.1.0")


class DetectFromUrlRequest(BaseModel):
    inputUrl: str
    sourceName: str | None = None
    confidence: float = DEFAULT_CONFIDENCE
    specialties: list[str] = Field(default_factory=lambda: list(DEFAULT_SPECIALTIES))


def require_authorization(authorization: str | None) -> None:
    expected = os.getenv("MARINE_DETECT_API_TOKEN", "").strip()
    if not expected:
        return

    if authorization != f"Bearer {expected}":
        raise HTTPException(status_code=401, detail="Unauthorized marine-detect request.")


def clamp_confidence(value: float | int | None) -> float:
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return DEFAULT_CONFIDENCE
    return min(0.95, max(0.05, numeric))


def sanitize_filename(name: str | None, fallback: str) -> str:
    candidate = (name or fallback).strip()
    if not candidate:
        candidate = fallback
    return "".join(char if char.isalnum() or char in {".", "_", "-"} else "_" for char in candidate)


def is_video_source(file_path: Path, content_type: str | None = None) -> bool:
    if content_type and content_type.startswith("video/"):
        return True
    return file_path.suffix.lower() in VIDEO_SUFFIXES


def normalize_specialties(values: list[str] | None) -> list[str]:
    normalized = [value for value in (values or []) if value in MODEL_SPECS]
    return normalized or list(DEFAULT_SPECIALTIES)


def resolve_model_paths(specialties: list[str]) -> list[tuple[str, Path]]:
    resolved: list[tuple[str, Path]] = []
    for specialty in normalize_specialties(specialties):
        spec = MODEL_SPECS[specialty]
        configured = os.getenv(spec["env_var"], "").strip()
        candidates = [Path(configured).expanduser()] if configured else []
        candidates.append(spec["fallback"])
        model_path = next((candidate.resolve() for candidate in candidates if candidate and candidate.exists()), None)
        if model_path is None:
            raise HTTPException(
                status_code=500,
                detail=f"Could not find the {spec['label']} weights. Set {spec['env_var']} on the service host.",
            )
        resolved.append((spec["label"], model_path))
    return resolved


def format_metric(value: float | None, digits: int = 2) -> str:
    return f"{value:.{digits}f}" if isinstance(value, (float, int)) else "N/A"


def format_runtime(total_seconds: float | None) -> str:
    if total_seconds is None:
      return "N/A"
    minutes = int(total_seconds // 60)
    seconds = total_seconds - minutes * 60
    return f"{minutes:02d}:{seconds:04.1f}"


def normalize_prediction(prediction: dict[str, Any]) -> dict[str, Any]:
    return {
        "className": str(prediction.get("class", "object")),
        "confidence": float(prediction.get("confidence", 0)),
        "x": float(prediction.get("x", 0)),
        "y": float(prediction.get("y", 0)),
        "width": float(prediction.get("width", 0)),
        "height": float(prediction.get("height", 0)),
    }


def filter_predictions(predictions: list[dict[str, Any]], confidence: float) -> list[dict[str, Any]]:
    return [prediction for prediction in predictions if prediction["confidence"] >= confidence]


def build_summary(predictions: list[dict[str, Any]]) -> tuple[str, str, str]:
    confidences = [prediction["confidence"] for prediction in predictions]
    if not confidences:
        return "0", "N/A", "N/A"
    average = sum(confidences) / len(confidences)
    return str(len(predictions)), format_metric(average), format_metric(max(confidences))


def build_image_result(payload: dict[str, Any], confidence: float, source_name: str, model_display: str) -> dict[str, Any]:
    image = payload.get("image") or {}
    width = int(image.get("width", 0) or 0)
    height = int(image.get("height", 0) or 0)
    predictions = filter_predictions(
        [normalize_prediction(prediction) for prediction in payload.get("predictions", [])],
        confidence,
    )
    detection_count, avg_confidence, max_confidence = build_summary(predictions)

    return {
        "annotatedKind": "image",
        "annotatedUrl": None,
        "jsonUrl": None,
        "manifestUrl": None,
        "model": model_display,
        "sourceName": source_name,
        "detectionCount": detection_count,
        "frameCount": "1",
        "avgConfidence": avg_confidence,
        "maxConfidence": max_confidence,
        "fps": "N/A",
        "resolution": f"{width} x {height}" if width and height else "N/A",
        "runtime": "N/A",
        "outputMode": "remote reef-health service + overlay",
        "overlay": {
            "kind": "image",
            "width": width,
            "height": height,
            "predictions": predictions,
        }
        if width and height
        else None,
    }


def build_video_result(payload: dict[str, Any], confidence: float, source_name: str, model_display: str) -> dict[str, Any]:
    fps = float(payload.get("fps", 0) or 0)
    width = int(payload.get("width", 0) or 0)
    height = int(payload.get("height", 0) or 0)
    frames = []
    flattened: list[dict[str, Any]] = []

    for index, frame in enumerate(payload.get("frames", []), start=1):
        predictions = filter_predictions(
            [normalize_prediction(prediction) for prediction in frame.get("predictions", [])],
            confidence,
        )
        flattened.extend(predictions)
        frames.append(
            {
                "frame": int(frame.get("frame", index) or index),
                "time": float(frame.get("time", (index - 1) / fps if fps else index - 1)),
                "predictions": predictions,
            }
        )

    detection_count, avg_confidence, max_confidence = build_summary(flattened)
    frame_count = int(payload.get("frame_count", len(frames)) or len(frames))
    runtime = (frame_count / fps) if fps else (frames[-1]["time"] if frames else None)

    return {
        "annotatedKind": "video",
        "annotatedUrl": None,
        "jsonUrl": None,
        "manifestUrl": None,
        "model": model_display,
        "sourceName": source_name,
        "detectionCount": detection_count,
        "frameCount": str(frame_count),
        "avgConfidence": avg_confidence,
        "maxConfidence": max_confidence,
        "fps": format_metric(fps) if fps else "N/A",
        "resolution": f"{width} x {height}" if width and height else "N/A",
        "runtime": format_runtime(runtime),
        "outputMode": "remote reef-health service + overlay",
        "overlay": {
            "kind": "video",
            "width": width,
            "height": height,
            "sampleFps": fps or 1,
            "frames": frames,
        }
        if width and height
        else None,
    }


def execute_local_predict(input_path: Path, source_name: str, confidence: float, specialties: list[str]) -> dict[str, Any]:
    models = resolve_model_paths(specialties)
    model_display = f"reef-health-suite / {' + '.join(label for label, _ in models)}"

    with tempfile.TemporaryDirectory(prefix="lion-reef-service-") as temp_dir:
        run_root = Path(temp_dir) / "run"
        args = [
            sys.executable,
            str(LION_SCRIPT),
            "local-predict",
            "--output-root",
            str(run_root),
            "--run-name",
            "predict",
            "--conf",
            str(confidence),
        ]

        if is_video_source(input_path):
            args.extend(["--video", str(input_path)])
        else:
            args.extend(["--source", str(input_path)])

        for label, model_path in models:
            args.extend(["--model-path", str(model_path), "--model-label", label])

        completed = subprocess.run(
            args,
            cwd=REPO_ROOT,
            env=os.environ.copy(),
            capture_output=True,
            text=True,
            check=False,
        )
        if completed.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=completed.stderr.strip() or completed.stdout.strip() or "marine-detect service inference failed.",
            )

        manifest_path = run_root / "last_run.json"
        if not manifest_path.exists():
            raise HTTPException(status_code=500, detail="The remote reef-health service did not produce a run manifest.")

        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        output_record = next(iter((manifest.get("prediction_outputs") or {}).values()), None)
        json_path = Path(output_record.get("json", "")) if output_record else None
        if json_path is None or not json_path.exists():
            raise HTTPException(status_code=500, detail="The remote reef-health service did not produce JSON overlay output.")

        payload = json.loads(json_path.read_text(encoding="utf-8"))

    if is_video_source(input_path):
        result = build_video_result(payload, confidence, source_name, model_display)
    else:
        result = build_image_result(payload, confidence, source_name, model_display)

    return {
        "status": "complete",
        "message": "Remote reef-health detection complete.",
        "result": result,
    }


def save_upload(upload: UploadFile, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("wb") as target:
        while True:
            chunk = upload.file.read(1024 * 1024)
            if not chunk:
                break
            target.write(chunk)


def download_input(input_url: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(input_url) as response, destination.open("wb") as target:
        target.write(response.read())


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/detect/upload")
def detect_upload(
    file: UploadFile = File(...),
    confidence: float = Form(DEFAULT_CONFIDENCE),
    specialties: list[str] = Form(default_factory=lambda: list(DEFAULT_SPECIALTIES)),
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    require_authorization(authorization)
    safe_name = sanitize_filename(file.filename, "upload.bin")

    with tempfile.TemporaryDirectory(prefix="lion-reef-upload-") as temp_dir:
        input_path = Path(temp_dir) / safe_name
        save_upload(file, input_path)
        return execute_local_predict(input_path, safe_name, clamp_confidence(confidence), specialties)


@app.post("/detect/url")
def detect_url(payload: DetectFromUrlRequest, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    require_authorization(authorization)
    inferred_name = payload.sourceName or sanitize_filename(Path(payload.inputUrl).name or "remote-input.bin", "remote-input.bin")
    with tempfile.TemporaryDirectory(prefix="lion-reef-url-") as temp_dir:
        extension = Path(inferred_name).suffix or mimetypes.guess_extension(mimetypes.guess_type(payload.inputUrl)[0] or "") or ".bin"
        input_path = Path(temp_dir) / sanitize_filename(f"input{extension}", "input.bin")
        try:
            download_input(payload.inputUrl, input_path)
        except Exception as exc:  # pragma: no cover - network failures depend on deployment
            raise HTTPException(status_code=400, detail=f"Could not download remote input: {exc}") from exc
        return execute_local_predict(input_path, inferred_name, clamp_confidence(payload.confidence), payload.specialties)
