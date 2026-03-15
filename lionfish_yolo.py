from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any


DEFAULT_OUTPUT_ROOT = Path("runs") / "lionfish"
DEFAULT_CONFIDENCE = 0.25
DEFAULT_FONT_SCALE = 0.55
DEFAULT_LABEL_STROKE = 2
DEFAULT_ROBOFLOW_KEY_ENV = "ROBOFLOW_API_KEY"
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
VIDEO_SUFFIXES = {".mp4", ".avi", ".mov", ".mkv", ".m4v"}
MODEL_PRESETS: dict[str, dict[str, Any]] = {
    "lionfish": {
        "label": "Hosted Roboflow lionfish detector",
        "rf_model_workspace": "su-eaelw",
        "rf_model_project": "lionfish-qs3tq",
        "rf_model_version": 49,
    },
}


class CliError(RuntimeError):
    """Raised when the command line input is incomplete or invalid."""


def require_roboflow():
    try:
        from roboflow import Roboflow
    except ImportError as exc:
        raise CliError(
            "Roboflow is not installed. Use Python 3.10-3.12 and run `py -3.11 -m pip install -e .` first."
        ) from exc
    return Roboflow


def require_cv2():
    try:
        import cv2
    except ImportError as exc:
        raise CliError(
            "OpenCV is not installed. Use Python 3.10-3.12 and run `py -3.11 -m pip install -e .` first."
        ) from exc
    return cv2


def resolve_path(value: str | Path) -> Path:
    return Path(value).expanduser().resolve()


def ensure_exists(path: Path, description: str) -> Path:
    if not path.exists():
        raise CliError(f"{description} does not exist: {path}")
    return path


def to_jsonable(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): to_jsonable(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [to_jsonable(item) for item in value]
    if hasattr(value, "item"):
        try:
            return value.item()
        except Exception:
            pass
    if isinstance(value, Path):
        return str(value)
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)


def normalize_prediction_payload(payload: Any) -> Any:
    payload = to_jsonable(payload)
    if isinstance(payload, str):
        try:
            return json.loads(payload)
        except json.JSONDecodeError:
            return {"raw": payload}
    return payload


def save_run_manifest(output_root: Path, manifest: dict[str, Any]) -> Path:
    output_root.mkdir(parents=True, exist_ok=True)
    manifest_path = output_root / "last_run.json"
    manifest_path.write_text(json.dumps(to_jsonable(manifest), indent=2), encoding="utf-8")
    return manifest_path


def preset_names() -> list[str]:
    return sorted(MODEL_PRESETS)


def get_preset(preset_name: str | None) -> dict[str, Any] | None:
    if not preset_name:
        return None
    return MODEL_PRESETS.get(preset_name)


def apply_preset_defaults(args: argparse.Namespace) -> None:
    preset = get_preset(getattr(args, "preset", None))
    if not preset:
        return

    if hasattr(args, "rf_model_workspace") and not getattr(args, "rf_model_workspace", None):
        args.rf_model_workspace = preset.get("rf_model_workspace")
    if hasattr(args, "rf_model_project") and not getattr(args, "rf_model_project", None):
        args.rf_model_project = preset.get("rf_model_project")
    if hasattr(args, "rf_model_version") and getattr(args, "rf_model_version", None) is None:
        args.rf_model_version = preset.get("rf_model_version")


def resolve_api_key(args: argparse.Namespace) -> str:
    if args.rf_api_key:
        return args.rf_api_key

    api_key = os.getenv(args.rf_api_key_env)
    if api_key:
        return api_key

    fallback_api_key = os.getenv("ROBOFLOW_API_KEY")
    if fallback_api_key:
        return fallback_api_key

    if args.rf_api_key_env.startswith("rf_"):
        raise CliError(
            "Expected --rf-api-key-env to be an environment variable name like `ROBOFLOW_API_KEY`, "
            "but it looks like a Roboflow key was used there. Use --rf-api-key or set $env:ROBOFLOW_API_KEY instead."
        )

    raise CliError(f"Roboflow API key is missing. Set {args.rf_api_key_env} or pass --rf-api-key.")


def collect_image_inputs(source: Path) -> list[Path]:
    if source.is_file():
        suffix = source.suffix.lower()
        if suffix in VIDEO_SUFFIXES:
            raise CliError("This source is a video file. Use --video or pass the file via --source by itself.")
        if suffix not in IMAGE_SUFFIXES:
            raise CliError(f"Unsupported image type for hosted inference: {source}")
        return [source]

    image_paths = sorted(path for path in source.rglob("*") if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES)
    if not image_paths:
        raise CliError(f"No images were found under {source}")
    return image_paths


def resolve_inference_input(args: argparse.Namespace) -> tuple[str, Path | list[Path]]:
    if args.source and args.video:
        raise CliError("Use either --source or --video, not both.")

    if args.video:
        video_path = ensure_exists(resolve_path(args.video), "Video source")
        if not video_path.is_file() or video_path.suffix.lower() not in VIDEO_SUFFIXES:
            raise CliError(f"Unsupported video source: {video_path}")
        return "video", video_path

    if not args.source:
        raise CliError("Pass --source or --video.")

    source_path = ensure_exists(resolve_path(args.source), "Prediction source")
    if source_path.is_file() and source_path.suffix.lower() in VIDEO_SUFFIXES:
        return "video", source_path
    return "images", collect_image_inputs(source_path)


def resolve_hosted_model_spec(args: argparse.Namespace) -> tuple[str, str, int]:
    workspace = getattr(args, "rf_model_workspace", None)
    project = getattr(args, "rf_model_project", None)
    version = getattr(args, "rf_model_version", None)
    model_id = getattr(args, "rf_model_id", None)

    if model_id:
        parts = [part for part in model_id.split("/") if part]
        if len(parts) == 2:
            project, version = parts
        elif len(parts) == 3:
            workspace, project, version = parts
        else:
            raise CliError("Hosted model ids must look like `project/version` or `workspace/project/version`.")

    if not workspace or not project or version is None:
        raise CliError(
            "A hosted Roboflow model could not be inferred. Pass --rf-model-id or use --preset lionfish."
        )

    try:
        version_number = int(str(version))
    except ValueError as exc:
        raise CliError("Hosted Roboflow model versions must be integers.") from exc

    return workspace, project, version_number


def load_hosted_model(args: argparse.Namespace):
    Roboflow = require_roboflow()
    api_key = resolve_api_key(args)
    workspace, project_name, version_number = resolve_hosted_model_spec(args)

    rf = Roboflow(api_key=api_key)
    project = rf.project(project_name, the_workspace=workspace)
    version = project.version(version_number)
    model = getattr(version, "model", None)
    if model is None:
        raise CliError(
            f"Roboflow project {workspace}/{project_name} version {version_number} does not have a hosted model attached."
        )

    return model, workspace, project_name, version_number


def format_confidence_label(confidence: Any) -> str:
    try:
        value = float(confidence)
    except (TypeError, ValueError):
        return ""

    if value <= 1.0:
        return f"{value:.2f}"
    return f"{value:.0f}%"


def draw_hosted_detections(frame, predictions: list[dict[str, Any]], stroke: int, font_scale: float):
    cv2 = require_cv2()

    annotated = frame.copy()
    box_color = (36, 255, 12)
    text_color = (0, 0, 0)

    for prediction in predictions:
        x = float(prediction.get("x", 0))
        y = float(prediction.get("y", 0))
        width = float(prediction.get("width", 0))
        height = float(prediction.get("height", 0))
        class_name = str(prediction.get("class", "object"))
        confidence_text = format_confidence_label(prediction.get("confidence"))
        label = f"{class_name} {confidence_text}".strip()

        x1 = max(int(x - width / 2), 0)
        y1 = max(int(y - height / 2), 0)
        x2 = max(int(x + width / 2), 0)
        y2 = max(int(y + height / 2), 0)

        cv2.rectangle(annotated, (x1, y1), (x2, y2), box_color, stroke)

        if label:
            (text_width, text_height), baseline = cv2.getTextSize(
                label,
                cv2.FONT_HERSHEY_SIMPLEX,
                font_scale,
                1,
            )
            text_top = max(y1 - text_height - baseline - 6, 0)
            text_bottom = text_top + text_height + baseline + 6
            text_right = min(x1 + text_width + 10, annotated.shape[1])
            cv2.rectangle(annotated, (x1, text_top), (text_right, text_bottom), box_color, -1)
            cv2.putText(
                annotated,
                label,
                (x1 + 5, text_bottom - baseline - 3),
                cv2.FONT_HERSHEY_SIMPLEX,
                font_scale,
                text_color,
                1,
                cv2.LINE_AA,
            )

    return annotated


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(to_jsonable(payload), indent=2), encoding="utf-8")


def run_hosted_image_predict(
    *,
    model,
    image_sources: list[Path],
    output_dir: Path,
    confidence: float,
    save_json_outputs: bool,
) -> dict[str, dict[str, str]]:
    outputs: dict[str, dict[str, str]] = {}

    for index, image_path in enumerate(image_sources, start=1):
        prediction = model.predict(str(image_path), confidence=int(confidence * 100))
        prediction_json = normalize_prediction_payload(prediction.json())
        basename = f"{index:04d}_{image_path.stem}" if len(image_sources) > 1 else image_path.stem
        image_output = output_dir / f"{basename}_pred.jpg"
        prediction.save(str(image_output))

        record = {"image": str(image_output.resolve())}
        if save_json_outputs:
            json_output = output_dir / f"{basename}.json"
            write_json(json_output, prediction_json)
            record["json"] = str(json_output.resolve())

        outputs[str(image_path.resolve())] = record

    return outputs


def run_hosted_video_predict(
    *,
    model,
    video_path: Path,
    output_dir: Path,
    confidence: float,
    stroke: int,
    font_scale: float,
    save_json_outputs: bool,
) -> dict[str, str]:
    cv2 = require_cv2()

    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        raise CliError(f"Could not open video source: {video_path}")

    fps = capture.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
    if width <= 0 or height <= 0:
        capture.release()
        raise CliError(f"Could not determine video dimensions for: {video_path}")

    video_output = output_dir / f"{video_path.stem}_pred.mp4"
    writer = cv2.VideoWriter(str(video_output), cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))
    if not writer.isOpened():
        capture.release()
        raise CliError(f"Could not create output video: {video_output}")

    frame_results: list[dict[str, Any]] = []
    frame_index = 0
    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                break

            frame_index += 1
            prediction = model.predict(frame, confidence=int(confidence * 100))
            prediction_json = normalize_prediction_payload(prediction.json())
            predictions = prediction_json.get("predictions", []) if isinstance(prediction_json, dict) else []
            annotated = draw_hosted_detections(frame, predictions, stroke=stroke, font_scale=font_scale)
            writer.write(annotated)

            if save_json_outputs:
                frame_results.append({"frame": frame_index, "predictions": predictions})

            if frame_index % 25 == 0:
                print(f"Processed {frame_index} frames...")
    finally:
        capture.release()
        writer.release()

    outputs = {"video": str(video_output.resolve())}
    if save_json_outputs:
        json_output = output_dir / f"{video_path.stem}.json"
        write_json(
            json_output,
            {
                "source": str(video_path.resolve()),
                "fps": fps,
                "width": width,
                "height": height,
                "frame_count": frame_index,
                "frames": frame_results,
            },
        )
        outputs["json"] = str(json_output.resolve())

    return outputs


def add_manifest_context(args: argparse.Namespace, manifest: dict[str, Any]) -> dict[str, Any]:
    if getattr(args, "preset", None):
        manifest = {"preset": args.preset, **manifest}
    return manifest


def handle_presets(args: argparse.Namespace) -> int:
    del args
    for name in preset_names():
        preset = MODEL_PRESETS[name]
        print(
            f"{name}: {preset['label']} | "
            f"hosted model: {preset['rf_model_workspace']}/{preset['rf_model_project']}/{preset['rf_model_version']}"
        )
    return 0


def handle_hosted_predict(args: argparse.Namespace) -> int:
    output_root = resolve_path(args.output_root)
    run_dir = output_root / args.run_name
    run_dir.mkdir(parents=True, exist_ok=True)

    model, workspace, project_name, version_number = load_hosted_model(args)
    input_kind, inference_input = resolve_inference_input(args)

    if input_kind == "video":
        assert isinstance(inference_input, Path)
        outputs = {
            str(inference_input.resolve()): run_hosted_video_predict(
                model=model,
                video_path=inference_input,
                output_dir=run_dir,
                confidence=args.conf,
                stroke=args.stroke,
                font_scale=args.font_scale,
                save_json_outputs=not args.no_json,
            )
        }
    else:
        assert isinstance(inference_input, list)
        outputs = run_hosted_image_predict(
            model=model,
            image_sources=inference_input,
            output_dir=run_dir,
            confidence=args.conf,
            save_json_outputs=not args.no_json,
        )

    manifest_path = save_run_manifest(
        output_root,
        add_manifest_context(
            args,
            {
                "command": args.command,
                "hosted_model": f"{workspace}/{project_name}/{version_number}",
                "prediction_outputs": outputs,
            },
        ),
    )
    print(json.dumps(outputs, indent=2))
    print(f"Manifest saved to: {manifest_path}")
    return 0


def add_preset_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--preset",
        choices=preset_names(),
        default="lionfish",
        help="Hosted model preset. Defaults to the Roboflow lionfish model you provided.",
    )


def add_roboflow_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--rf-api-key", help="Roboflow API key. Prefer the environment variable instead.")
    parser.add_argument(
        "--rf-api-key-env",
        default=DEFAULT_ROBOFLOW_KEY_ENV,
        help="Environment variable that stores the Roboflow API key.",
    )


def add_hosted_model_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--rf-model-id",
        help="Hosted Roboflow model id as `project/version` or `workspace/project/version`.",
    )
    parser.add_argument("--rf-model-workspace", help="Workspace slug for the hosted Roboflow model.")
    parser.add_argument("--rf-model-project", help="Project slug for the hosted Roboflow model.")
    parser.add_argument("--rf-model-version", help="Hosted Roboflow model version number.")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Hosted Roboflow lionfish inference for image folders, single images, and video."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    presets_parser = subparsers.add_parser("presets", help="Show built-in hosted model presets.")
    presets_parser.set_defaults(handler=handle_presets)

    hosted_parser = subparsers.add_parser(
        "hosted-predict",
        help="Run the hosted Roboflow detector on an image, image directory, or video.",
    )
    add_preset_args(hosted_parser)
    hosted_parser.add_argument("--source", help="Path to a single image, video, or a directory of images.")
    hosted_parser.add_argument("--video", help="Path to a video file.")
    hosted_parser.add_argument(
        "--output-root",
        default=str(DEFAULT_OUTPUT_ROOT),
        help="Directory that receives hosted prediction outputs and last_run.json.",
    )
    hosted_parser.add_argument(
        "--run-name",
        default="hosted-predict",
        help="Subdirectory under the output root that receives this inference run.",
    )
    hosted_parser.add_argument("--conf", type=float, default=DEFAULT_CONFIDENCE, help="Prediction confidence threshold.")
    hosted_parser.add_argument(
        "--stroke",
        type=int,
        default=DEFAULT_LABEL_STROKE,
        help="Bounding-box line thickness for video overlays.",
    )
    hosted_parser.add_argument(
        "--font-scale",
        type=float,
        default=DEFAULT_FONT_SCALE,
        help="Text scale for video overlay labels.",
    )
    hosted_parser.add_argument(
        "--no-json",
        action="store_true",
        help="Skip per-image or per-frame JSON sidecar outputs.",
    )
    add_roboflow_args(hosted_parser)
    add_hosted_model_args(hosted_parser)
    hosted_parser.set_defaults(handler=handle_hosted_predict)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    apply_preset_defaults(args)

    try:
        return args.handler(args)
    except CliError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
