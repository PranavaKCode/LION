from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Iterable


DEFAULT_MODEL = "yolov8s.pt"
DEFAULT_OUTPUT_ROOT = Path("runs") / "paper"
DEFAULT_DATASET_ROOT = Path("datasets")
DEFAULT_EPOCHS = 75
DEFAULT_IMAGE_SIZE = 800
DEFAULT_CONFIDENCE = 0.25
DEFAULT_ROBOFLOW_KEY_ENV = "ROBOFLOW_API_KEY"
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
VIDEO_SUFFIXES = {".mp4", ".avi", ".mov", ".mkv", ".m4v"}
DATASET_PRESETS: dict[str, dict[str, Any]] = {
    "lionfish": {
        "label": "Lionfish (current Roboflow)",
        "rf_workspace": "su-eaelw",
        "rf_project": "lionfish-qs3tq-dbget",
        "rf_version": "latest",
        "dataset_dir": "lionfish-qs3tq-dbget",
        "hosted_model_workspace": "su-eaelw",
        "hosted_model_project": "lionfish-qs3tq",
        "hosted_model_version": 49,
        "source_repo": "roboflow",
    },
    "paper-lionfish": {
        "label": "Lionfish (paper dataset)",
        "rf_workspace": "hunter-gunter",
        "rf_project": "lionfish-sserd",
        "rf_version": 1,
        "dataset_dir": "lionfish-1",
        "source_repo": "kluless13/paper",
    },
    "cots": {
        "label": "COTS",
        "rf_workspace": "cots",
        "rf_project": "google-images-ztm4n",
        "rf_version": 2,
        "dataset_dir": "Google-Images-2",
        "source_repo": "kluless13/paper",
    },
}


class CliError(RuntimeError):
    """Raised when the command line input is incomplete or invalid."""


def require_ultralytics():
    try:
        from ultralytics import YOLO
    except ImportError as exc:
        raise CliError(
            "Ultralytics is not installed. Use Python 3.10-3.12 and run `pip install -e .` first."
        ) from exc
    return YOLO


def require_roboflow():
    try:
        from roboflow import Roboflow
    except ImportError as exc:
        raise CliError(
            "Roboflow is not installed. Use Python 3.10-3.12 and run `pip install -e .` first."
        ) from exc
    return Roboflow


def require_yaml():
    try:
        import yaml
    except ImportError as exc:
        raise CliError(
            "PyYAML is not installed. Use Python 3.10-3.12 and run `pip install -e .` first."
        ) from exc
    return yaml


def resolve_path(value: str | Path) -> Path:
    return Path(value).expanduser().resolve()


def ensure_exists(path: Path, description: str) -> Path:
    if not path.exists():
        raise CliError(f"{description} does not exist: {path}")
    return path


def resolve_device(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


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


def save_run_manifest(output_root: Path, manifest: dict[str, Any]) -> Path:
    output_root.mkdir(parents=True, exist_ok=True)
    manifest_path = output_root / "last_run.json"
    manifest_path.write_text(json.dumps(to_jsonable(manifest), indent=2), encoding="utf-8")
    return manifest_path


def preset_names() -> list[str]:
    return sorted(DATASET_PRESETS)


def get_preset(preset_name: str | None) -> dict[str, Any] | None:
    if not preset_name:
        return None
    return DATASET_PRESETS.get(preset_name)


def add_manifest_context(args: argparse.Namespace, manifest: dict[str, Any]) -> dict[str, Any]:
    if getattr(args, "preset", None):
        manifest = {"preset": args.preset, **manifest}
    return manifest


def apply_dataset_preset_defaults(args: argparse.Namespace) -> None:
    preset = get_preset(getattr(args, "preset", None))
    if not preset:
        return

    if hasattr(args, "rf_workspace") and not getattr(args, "rf_workspace", None):
        args.rf_workspace = preset.get("rf_workspace")
    if hasattr(args, "rf_project") and not getattr(args, "rf_project", None):
        args.rf_project = preset.get("rf_project")
    if hasattr(args, "rf_version") and getattr(args, "rf_version", None) is None:
        args.rf_version = preset.get("rf_version")
    if hasattr(args, "dataset_root") and not getattr(args, "dataset_root", None) and preset.get("dataset_dir"):
        args.dataset_root = str(DEFAULT_DATASET_ROOT / preset["dataset_dir"])
    if hasattr(args, "rf_model_workspace") and not getattr(args, "rf_model_workspace", None):
        args.rf_model_workspace = preset.get("hosted_model_workspace")
    if hasattr(args, "rf_model_project") and not getattr(args, "rf_model_project", None):
        args.rf_model_project = preset.get("hosted_model_project")
    if hasattr(args, "rf_model_version") and getattr(args, "rf_model_version", None) is None:
        args.rf_model_version = preset.get("hosted_model_version")
    if hasattr(args, "output_root") and getattr(args, "output_root", None) == str(DEFAULT_OUTPUT_ROOT):
        args.output_root = str(DEFAULT_OUTPUT_ROOT / getattr(args, "preset"))


def resolve_data_yaml_argument(path_text: str) -> Path:
    data_yaml = ensure_exists(resolve_path(path_text), "Dataset YAML")
    if data_yaml.is_dir():
        candidate = data_yaml / "data.yaml"
        return ensure_exists(candidate, "Dataset YAML")
    return data_yaml


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

    raise CliError(
        f"Roboflow API key is missing. Set {args.rf_api_key_env} or pass --rf-api-key."
    )


def resolve_dataset_root(args: argparse.Namespace) -> Path:
    if args.dataset_root:
        return resolve_path(args.dataset_root)

    if not args.rf_project or args.rf_version is None:
        raise CliError("A dataset root could not be inferred. Pass --dataset-root or use --preset.")

    return resolve_path(DEFAULT_DATASET_ROOT / f"{args.rf_project}-v{args.rf_version}")


def resolve_project_version(project: Any, requested_version: str | int | None) -> int:
    version_info = project.get_version_information()
    version_numbers = sorted(
        int(os.path.basename(str(version["id"])))
        for version in version_info
        if str(version.get("id", "")).split("/")[-1].isdigit()
    )
    if not version_numbers:
        raise CliError("No downloadable Roboflow versions were returned for this project.")

    if requested_version is None or str(requested_version).strip().lower() == "latest":
        return version_numbers[-1]

    try:
        version_number = int(str(requested_version).strip())
    except ValueError as exc:
        raise CliError("Roboflow versions must be integers or `latest`.") from exc

    if version_number not in version_numbers:
        raise CliError(
            f"Roboflow version {version_number} was not found. Available versions: {', '.join(map(str, version_numbers))}"
        )

    return version_number


def find_data_yaml(dataset_root: Path) -> Path | None:
    direct_match = dataset_root / "data.yaml"
    if direct_match.exists():
        return direct_match.resolve()

    if not dataset_root.exists():
        return None

    matches = sorted(dataset_root.rglob("data.yaml"), key=lambda path: (len(path.parts), str(path).lower()))
    if matches:
        return matches[0].resolve()

    return None


def normalize_split_entry(data_yaml: Path, split_value: Any) -> tuple[Any, bool]:
    if not isinstance(split_value, str) or not split_value.strip():
        return split_value, False

    dataset_root = data_yaml.parent
    as_path = Path(split_value)
    if as_path.is_absolute() and as_path.exists():
        return split_value, False

    direct_candidate = (dataset_root / as_path).resolve()
    if direct_candidate.exists():
        return split_value.replace('\\', '/'), False

    trimmed_parts = [part for part in as_path.parts if part not in ('.', '..')]
    if trimmed_parts:
        trimmed_candidate = (dataset_root.joinpath(*trimmed_parts)).resolve()
        if trimmed_candidate.exists():
            return trimmed_candidate.relative_to(dataset_root).as_posix(), True

        basename_candidate = next(dataset_root.rglob(trimmed_parts[-1]), None)
        if basename_candidate and basename_candidate.exists():
            return basename_candidate.relative_to(dataset_root).as_posix(), True

    return split_value, False


def normalize_data_yaml(data_yaml: Path) -> Path:
    yaml = require_yaml()
    data = yaml.safe_load(data_yaml.read_text(encoding="utf-8")) or {}
    if not isinstance(data, dict):
        raise CliError(f"Expected {data_yaml} to contain a YAML mapping.")

    changed = False
    for split_name in ("train", "val", "test"):
        new_value, split_changed = normalize_split_entry(data_yaml, data.get(split_name))
        if split_changed:
            data[split_name] = new_value
            changed = True

    if changed:
        data_yaml.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")

    return data_yaml.resolve()


def local_dataset_yaml(args: argparse.Namespace) -> Path | None:
    try:
        dataset_root = resolve_dataset_root(args)
    except CliError:
        return None

    data_yaml = find_data_yaml(dataset_root)
    if data_yaml:
        return normalize_data_yaml(data_yaml)
    return None


def download_dataset(args: argparse.Namespace) -> Path:
    missing = [
        flag
        for flag, value in (
            ("--rf-workspace", args.rf_workspace),
            ("--rf-project", args.rf_project),
            ("--rf-version", args.rf_version),
        )
        if value in (None, "")
    ]
    if missing:
        raise CliError(
            "Downloading from Roboflow needs " + ", ".join(missing) + ". You can also use --preset."
        )

    Roboflow = require_roboflow()
    api_key = resolve_api_key(args)
    dataset_root = resolve_dataset_root(args)
    dataset_root.parent.mkdir(parents=True, exist_ok=True)

    rf = Roboflow(api_key=api_key)
    project = rf.project(args.rf_project, the_workspace=args.rf_workspace)
    version_number = resolve_project_version(project, args.rf_version)
    dataset = project.version(version_number).download("yolov8", location=str(dataset_root), overwrite=True)

    data_yaml = find_data_yaml(Path(dataset.location))
    if data_yaml:
        return normalize_data_yaml(data_yaml)

    raise CliError(f"Downloaded dataset YAML does not exist anywhere under: {Path(dataset.location).resolve()}")


def resolve_data_yaml(args: argparse.Namespace, allow_download: bool) -> Path:
    if args.data:
        return normalize_data_yaml(resolve_data_yaml_argument(args.data))

    inferred_yaml = local_dataset_yaml(args)
    if inferred_yaml:
        return inferred_yaml

    if allow_download or getattr(args, "download_if_missing", False):
        return download_dataset(args)

    if getattr(args, "preset", None):
        dataset_root = resolve_dataset_root(args)
        raise CliError(
            f"The `{args.preset}` dataset is not present at {dataset_root}. "
            "Run `download-dataset --preset ...` first or add --download-if-missing."
        )

    raise CliError(
        "Pass --data, use --preset, or use the `download-dataset`/`all` command with Roboflow settings."
    )


def load_dataset_config(data_yaml: Path) -> dict[str, Any]:
    yaml = require_yaml()
    data = yaml.safe_load(data_yaml.read_text(encoding="utf-8")) or {}
    if not isinstance(data, dict):
        raise CliError(f"Expected {data_yaml} to contain a YAML mapping.")
    return data


def resolve_split_source(data_yaml: Path, split_name: str) -> Path | None:
    data_yaml = normalize_data_yaml(data_yaml)
    config = load_dataset_config(data_yaml)
    split_value = config.get(split_name)
    if not split_value:
        return None

    candidate = Path(split_value)
    if not candidate.is_absolute():
        candidate = (data_yaml.parent / candidate).resolve()

    return candidate if candidate.exists() else None


def require_dataset_splits(data_yaml: Path, split_names: Iterable[str], action: str) -> None:
    missing = [split_name for split_name in split_names if resolve_split_source(data_yaml, split_name) is None]
    if missing:
        raise CliError(
            f"{action} requires dataset split(s) {', '.join(missing)}, but they are missing under {data_yaml.parent}. "
            "If you only want inference, use `hosted-predict` with the Roboflow model instead."
        )


def run_train(
    *,
    data_yaml: Path,
    model_name: str,
    epochs: int,
    image_size: int,
    output_root: Path,
    run_name: str,
    device: str | None,
    exist_ok: bool,
    save_plots: bool,
) -> Path:
    YOLO = require_ultralytics()
    model = YOLO(model_name)
    model.train(
        data=str(data_yaml),
        epochs=epochs,
        imgsz=image_size,
        project=str(output_root),
        name=run_name,
        device=device,
        plots=save_plots,
        exist_ok=exist_ok,
    )

    trainer = getattr(model, "trainer", None)
    save_dir = Path(getattr(trainer, "save_dir", output_root / run_name))
    weights_dir = save_dir / "weights"
    for candidate_name in ("best.pt", "last.pt"):
        candidate = weights_dir / candidate_name
        if candidate.exists():
            return candidate.resolve()

    raise CliError(f"Training finished but no weights were found in {weights_dir}.")


def run_validate(
    *,
    data_yaml: Path,
    weights_path: Path,
    output_root: Path,
    run_name: str,
    device: str | None,
    exist_ok: bool,
    save_plots: bool,
) -> dict[str, Any]:
    YOLO = require_ultralytics()
    model = YOLO(str(weights_path))
    metrics = model.val(
        data=str(data_yaml),
        project=str(output_root),
        name=run_name,
        device=device,
        plots=save_plots,
        exist_ok=exist_ok,
    )
    return to_jsonable(getattr(metrics, "results_dict", {}))


def run_predict(
    *,
    weights_path: Path,
    source: Path,
    confidence: float,
    output_root: Path,
    run_name: str,
    device: str | None,
    exist_ok: bool,
) -> Path:
    YOLO = require_ultralytics()
    model = YOLO(str(weights_path))
    results = model.predict(
        source=str(source),
        conf=confidence,
        project=str(output_root),
        name=run_name,
        device=device,
        save=True,
        exist_ok=exist_ok,
    )

    if results:
        first = results[0]
        save_dir = getattr(first, "save_dir", None)
        if save_dir:
            return Path(save_dir).resolve()

    fallback_dir = (output_root / run_name).resolve()
    if fallback_dir.exists():
        return fallback_dir

    raise CliError(f"Prediction finished but output directory could not be located for {source}.")


def collect_image_inputs(source: Path) -> list[Path]:
    if not source.exists():
        raise CliError(f"Prediction source does not exist: {source}")

    if source.is_file():
        suffix = source.suffix.lower()
        if suffix in VIDEO_SUFFIXES:
            raise CliError("This source is a video file. Use hosted video prediction instead.")
        if suffix not in IMAGE_SUFFIXES:
            raise CliError(f"Unsupported image type for hosted inference: {source}")
        return [source]

    image_paths = sorted(path for path in source.rglob("*") if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES)
    if not image_paths:
        raise CliError(f"No images were found under {source}")
    return image_paths


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

    preset = get_preset(getattr(args, "preset", None)) or {}
    workspace = workspace or preset.get("hosted_model_workspace") or getattr(args, "rf_workspace", None)
    project = project or preset.get("hosted_model_project")
    version = version or preset.get("hosted_model_version")

    if not workspace or not project or version is None:
        raise CliError(
            "A hosted Roboflow model could not be inferred. Pass --rf-model-id or set a preset with hosted model info."
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


def resolve_hosted_inputs(args: argparse.Namespace) -> tuple[str, Path | list[Path]]:
    if args.video:
        video_path = ensure_exists(resolve_path(args.video), "Video source")
        if not video_path.is_file() or video_path.suffix.lower() not in VIDEO_SUFFIXES:
            raise CliError(f"Unsupported video source for hosted inference: {video_path}")
        return "video", video_path

    if args.source:
        source_path = ensure_exists(resolve_path(args.source), "Prediction source")
        if source_path.is_file() and source_path.suffix.lower() in VIDEO_SUFFIXES:
            return "video", source_path
        return "images", collect_image_inputs(source_path)

    data_yaml = resolve_data_yaml(args, allow_download=getattr(args, "download_if_missing", False))
    test_source = resolve_split_source(data_yaml, "test")
    if test_source is None:
        raise CliError("No hosted prediction source was found. Pass --source/--video or provide a dataset with a test split.")
    return "images", collect_image_inputs(test_source)


def format_confidence_label(confidence: Any) -> str:
    try:
        value = float(confidence)
    except (TypeError, ValueError):
        return ""

    if value <= 1.0:
        return f"{value:.2f}"
    return f"{value:.0f}%"


def draw_hosted_detections(frame, predictions: list[dict[str, Any]], stroke: int = 2):
    import cv2

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
            (text_width, text_height), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
            text_top = max(y1 - text_height - baseline - 6, 0)
            text_bottom = text_top + text_height + baseline + 6
            text_right = min(x1 + text_width + 10, annotated.shape[1])
            cv2.rectangle(annotated, (x1, text_top), (text_right, text_bottom), box_color, -1)
            cv2.putText(
                annotated,
                label,
                (x1 + 5, text_bottom - baseline - 3),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                text_color,
                1,
                cv2.LINE_AA,
            )

    return annotated


def run_hosted_video_predict(
    *,
    model,
    video_path: Path,
    output_dir: Path,
    confidence: float,
) -> dict[str, str]:
    import cv2

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
    json_output = output_dir / f"{video_path.stem}.json"
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
            prediction_json = to_jsonable(prediction.json())
            predictions = prediction_json.get("predictions", []) if isinstance(prediction_json, dict) else []
            frame_results.append({"frame": frame_index, "predictions": predictions})
            writer.write(draw_hosted_detections(frame, predictions))

            if frame_index % 25 == 0:
                print(f"Processed {frame_index} frames...")
    finally:
        capture.release()
        writer.release()

    json_output.write_text(
        json.dumps(
            {
                "source": str(video_path.resolve()),
                "fps": fps,
                "width": width,
                "height": height,
                "frame_count": frame_index,
                "frames": frame_results,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    return {
        "video": str(video_output.resolve()),
        "json": str(json_output.resolve()),
    }


def handle_hosted_predict(args: argparse.Namespace) -> int:
    output_root = resolve_path(args.output_root)
    run_dir = output_root / args.hosted_name
    run_dir.mkdir(parents=True, exist_ok=True)

    model, workspace, project_name, version_number = load_hosted_model(args)
    input_kind, hosted_input = resolve_hosted_inputs(args)

    outputs: dict[str, dict[str, str]] = {}
    if input_kind == "video":
        video_path = hosted_input
        assert isinstance(video_path, Path)
        outputs[str(video_path)] = run_hosted_video_predict(
            model=model,
            video_path=video_path,
            output_dir=run_dir,
            confidence=args.conf,
        )
    else:
        image_sources = hosted_input
        assert isinstance(image_sources, list)
        for index, image_path in enumerate(image_sources, start=1):
            prediction = model.predict(str(image_path), confidence=int(args.conf * 100))
            basename = f"{index:04d}_{image_path.stem}" if len(image_sources) > 1 else image_path.stem
            image_output = run_dir / f"{basename}_pred.jpg"
            json_output = run_dir / f"{basename}.json"
            prediction.save(str(image_output))
            json_output.write_text(json.dumps(to_jsonable(prediction.json()), indent=2), encoding="utf-8")
            outputs[str(image_path)] = {
                "image": str(image_output.resolve()),
                "json": str(json_output.resolve()),
            }

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


def default_weights_path(output_root: Path, run_name: str) -> Path:
    return output_root / run_name / "weights" / "best.pt"


def handle_presets(args: argparse.Namespace) -> int:
    for name in preset_names():
        preset = DATASET_PRESETS[name]
        dataset_text = (
            f"{preset['rf_workspace']}/{preset['rf_project']} v{preset['rf_version']}"
            if preset.get('rf_workspace') and preset.get('rf_project')
            else 'no dataset preset'
        )
        hosted_text = (
            f"{preset['hosted_model_workspace']}/{preset['hosted_model_project']}/{preset['hosted_model_version']}"
            if preset.get('hosted_model_workspace') and preset.get('hosted_model_project')
            else 'none'
        )
        print(
            f"{name}: {preset['label']} | dataset: {dataset_text} | "
            f"hosted model: {hosted_text} | local folder: {DEFAULT_DATASET_ROOT / preset['dataset_dir']}"
        )
    return 0


def handle_download_dataset(args: argparse.Namespace) -> int:
    output_root = resolve_path(args.output_root)
    data_yaml = download_dataset(args)
    manifest_path = save_run_manifest(
        output_root,
        add_manifest_context(
            args,
            {
                "command": args.command,
                "data_yaml": str(data_yaml),
            },
        ),
    )
    print(f"Dataset ready: {data_yaml}")
    print(f"Manifest saved to: {manifest_path}")
    return 0


def handle_train(args: argparse.Namespace) -> int:
    output_root = resolve_path(args.output_root)
    data_yaml = resolve_data_yaml(args, allow_download=False)
    require_dataset_splits(data_yaml, ("train", "val"), "Training")
    weights_path = run_train(
        data_yaml=data_yaml,
        model_name=args.model,
        epochs=args.epochs,
        image_size=args.imgsz,
        output_root=output_root,
        run_name=args.train_name,
        device=resolve_device(args.device),
        exist_ok=args.exist_ok,
        save_plots=not args.no_plots,
    )
    manifest_path = save_run_manifest(
        output_root,
        add_manifest_context(
            args,
            {
                "command": args.command,
                "data_yaml": str(data_yaml),
                "weights_path": str(weights_path),
            },
        ),
    )
    print(f"Training complete. Best weights: {weights_path}")
    print(f"Manifest saved to: {manifest_path}")
    return 0


def handle_validate(args: argparse.Namespace) -> int:
    output_root = resolve_path(args.output_root)
    data_yaml = resolve_data_yaml(args, allow_download=False)
    require_dataset_splits(data_yaml, ("val",), "Validation")
    weights_path = ensure_exists(
        resolve_path(args.weights or default_weights_path(output_root, args.train_name)),
        "Weights file",
    )
    metrics = run_validate(
        data_yaml=data_yaml,
        weights_path=weights_path,
        output_root=output_root,
        run_name=args.val_name,
        device=resolve_device(args.device),
        exist_ok=args.exist_ok,
        save_plots=not args.no_plots,
    )
    manifest_path = save_run_manifest(
        output_root,
        add_manifest_context(
            args,
            {
                "command": args.command,
                "data_yaml": str(data_yaml),
                "weights_path": str(weights_path),
                "validation_metrics": metrics,
            },
        ),
    )
    print(f"Validation complete for: {weights_path}")
    print(json.dumps(metrics, indent=2))
    print(f"Manifest saved to: {manifest_path}")
    return 0


def prediction_sources(args: argparse.Namespace, data_yaml: Path) -> list[tuple[str, Path]]:
    sources: list[tuple[str, Path]] = []
    if args.source:
        sources.append((args.predict_name, ensure_exists(resolve_path(args.source), "Prediction source")))
    else:
        test_source = resolve_split_source(data_yaml, "test")
        if test_source:
            sources.append((args.predict_name, test_source))

    if args.video:
        sources.append((args.video_name, ensure_exists(resolve_path(args.video), "Video source")))

    if not sources:
        raise CliError("No prediction source was found. Pass --source and/or --video.")

    return sources


def handle_predict(args: argparse.Namespace) -> int:
    output_root = resolve_path(args.output_root)
    data_yaml = resolve_data_yaml(args, allow_download=False)
    weights_path = ensure_exists(
        resolve_path(args.weights or default_weights_path(output_root, args.train_name)),
        "Weights file",
    )

    outputs: dict[str, str] = {}
    for run_name, source in prediction_sources(args, data_yaml):
        outputs[run_name] = str(
            run_predict(
                weights_path=weights_path,
                source=source,
                confidence=args.conf,
                output_root=output_root,
                run_name=run_name,
                device=resolve_device(args.device),
                exist_ok=args.exist_ok,
            )
        )

    manifest_path = save_run_manifest(
        output_root,
        add_manifest_context(
            args,
            {
                "command": args.command,
                "data_yaml": str(data_yaml),
                "weights_path": str(weights_path),
                "prediction_outputs": outputs,
            },
        ),
    )
    print(json.dumps(outputs, indent=2))
    print(f"Manifest saved to: {manifest_path}")
    return 0


def handle_all(args: argparse.Namespace) -> int:
    output_root = resolve_path(args.output_root)
    data_yaml = resolve_data_yaml(args, allow_download=True)
    require_dataset_splits(data_yaml, ("train", "val"), "Training")

    weights_path = run_train(
        data_yaml=data_yaml,
        model_name=args.model,
        epochs=args.epochs,
        image_size=args.imgsz,
        output_root=output_root,
        run_name=args.train_name,
        device=resolve_device(args.device),
        exist_ok=args.exist_ok,
        save_plots=not args.no_plots,
    )

    metrics = run_validate(
        data_yaml=data_yaml,
        weights_path=weights_path,
        output_root=output_root,
        run_name=args.val_name,
        device=resolve_device(args.device),
        exist_ok=args.exist_ok,
        save_plots=not args.no_plots,
    )

    outputs: dict[str, str] = {}
    for run_name, source in prediction_sources(args, data_yaml):
        outputs[run_name] = str(
            run_predict(
                weights_path=weights_path,
                source=source,
                confidence=args.conf,
                output_root=output_root,
                run_name=run_name,
                device=resolve_device(args.device),
                exist_ok=args.exist_ok,
            )
        )

    manifest_path = save_run_manifest(
        output_root,
        add_manifest_context(
            args,
            {
                "command": args.command,
                "data_yaml": str(data_yaml),
                "weights_path": str(weights_path),
                "validation_metrics": metrics,
                "prediction_outputs": outputs,
            },
        ),
    )
    print(f"Training weights: {weights_path}")
    print(json.dumps(metrics, indent=2))
    print(json.dumps(outputs, indent=2))
    print(f"Manifest saved to: {manifest_path}")
    return 0


def add_preset_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--preset",
        choices=preset_names(),
        help=(
            "Dataset/model preset. `lionfish` uses the newer Roboflow project and hosted model, "
            "`paper-lionfish` preserves the original paper dataset, and `cots` keeps the paper COTS dataset."
        ),
    )


def add_download_if_missing_arg(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--download-if-missing",
        action="store_true",
        help="If --data is omitted and the preset dataset is missing locally, download it from Roboflow first.",
    )


def add_shared_args(parser: argparse.ArgumentParser) -> None:
    add_preset_args(parser)
    parser.add_argument("--data", help="Path to a dataset directory or data.yaml file.")
    parser.add_argument(
        "--output-root",
        default=str(DEFAULT_OUTPUT_ROOT),
        help="Directory that receives train/val/predict outputs.",
    )
    parser.add_argument("--device", help="Torch device string, for example `0`, `cpu`, or `mps`.")
    parser.add_argument("--exist-ok", action="store_true", help="Allow reusing an existing run directory.")
    parser.add_argument("--no-plots", action="store_true", help="Disable Ultralytics plot generation.")
    parser.add_argument(
        "--train-name",
        default="train",
        help="Run name for the training step.",
    )
    parser.add_argument(
        "--val-name",
        default="val",
        help="Run name for the validation step.",
    )
    parser.add_argument(
        "--predict-name",
        default="predict",
        help="Run name for image or directory prediction output.",
    )
    parser.add_argument(
        "--video-name",
        default="predict-video",
        help="Run name for video prediction output.",
    )


def add_training_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Model checkpoint to fine-tune.")
    parser.add_argument("--epochs", type=int, default=DEFAULT_EPOCHS, help="Number of training epochs.")
    parser.add_argument("--imgsz", type=int, default=DEFAULT_IMAGE_SIZE, help="Image size used for train/val.")


def add_prediction_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--weights", help="Path to a trained `.pt` file. Defaults to the latest train output.")
    parser.add_argument(
        "--source",
        help="Image, video, folder, or glob for prediction. Defaults to the dataset test split when available.",
    )
    parser.add_argument("--video", help="Optional extra video source to score after the image prediction step.")
    parser.add_argument("--conf", type=float, default=DEFAULT_CONFIDENCE, help="Prediction confidence threshold.")


def add_hosted_model_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--rf-model-id",
        help="Hosted Roboflow model id as `project/version` or `workspace/project/version`.",
    )
    parser.add_argument("--rf-model-workspace", help="Workspace slug for the hosted Roboflow model.")
    parser.add_argument("--rf-model-project", help="Project slug for the hosted Roboflow model.")
    parser.add_argument("--rf-model-version", help="Hosted Roboflow model version number.")
    parser.add_argument(
        "--hosted-name",
        default="hosted-predict",
        help="Run name for hosted Roboflow inference outputs.",
    )


def add_roboflow_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--dataset-root", help="Directory used when downloading the Roboflow dataset.")
    parser.add_argument("--rf-workspace", help="Roboflow workspace slug.")
    parser.add_argument("--rf-project", help="Roboflow project slug.")
    parser.add_argument("--rf-version", help="Roboflow dataset version or `latest`.")
    parser.add_argument("--rf-api-key", help="Roboflow API key. Prefer the environment variable instead.")
    parser.add_argument(
        "--rf-api-key-env",
        default=DEFAULT_ROBOFLOW_KEY_ENV,
        help="Environment variable that stores the Roboflow API key.",
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Modernized YOLOv8 and Roboflow workflow for the marine-species projects referenced in kluless13/paper."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    presets_parser = subparsers.add_parser("presets", help="Show built-in dataset and hosted-model presets.")
    presets_parser.set_defaults(handler=handle_presets)

    download_parser = subparsers.add_parser(
        "download-dataset",
        help="Download a YOLOv8 dataset export from Roboflow.",
    )
    add_preset_args(download_parser)
    download_parser.add_argument(
        "--output-root",
        default=str(DEFAULT_OUTPUT_ROOT),
        help="Directory that receives the last_run.json manifest.",
    )
    add_roboflow_args(download_parser)
    download_parser.set_defaults(handler=handle_download_dataset)

    train_parser = subparsers.add_parser("train", help="Train a YOLOv8 model locally.")
    add_shared_args(train_parser)
    add_download_if_missing_arg(train_parser)
    add_roboflow_args(train_parser)
    add_training_args(train_parser)
    train_parser.set_defaults(handler=handle_train)

    validate_parser = subparsers.add_parser("validate", help="Validate a trained model.")
    add_shared_args(validate_parser)
    add_download_if_missing_arg(validate_parser)
    add_roboflow_args(validate_parser)
    add_prediction_args(validate_parser)
    validate_parser.set_defaults(handler=handle_validate)

    predict_parser = subparsers.add_parser("predict", help="Run local YOLOv8 image and video predictions.")
    add_shared_args(predict_parser)
    add_download_if_missing_arg(predict_parser)
    add_roboflow_args(predict_parser)
    add_prediction_args(predict_parser)
    predict_parser.set_defaults(handler=handle_predict)

    hosted_parser = subparsers.add_parser(
        "hosted-predict",
        help="Run inference with a hosted Roboflow model on images or directories.",
    )
    add_preset_args(hosted_parser)
    hosted_parser.add_argument("--data", help="Path to a dataset directory or data.yaml file.")
    hosted_parser.add_argument(
        "--output-root",
        default=str(DEFAULT_OUTPUT_ROOT),
        help="Directory that receives hosted prediction outputs.",
    )
    hosted_parser.add_argument(
        "--source",
        help="Image file or directory of images. Defaults to the dataset test split when available.",
    )
    hosted_parser.add_argument("--video", help="Optional video file for hosted Roboflow inference.")
    hosted_parser.add_argument("--conf", type=float, default=DEFAULT_CONFIDENCE, help="Prediction confidence threshold.")
    add_download_if_missing_arg(hosted_parser)
    add_roboflow_args(hosted_parser)
    add_hosted_model_args(hosted_parser)
    hosted_parser.set_defaults(handler=handle_hosted_predict)

    all_parser = subparsers.add_parser(
        "all",
        help="Optionally download the dataset, then train, validate, and predict in one run.",
    )
    add_shared_args(all_parser)
    add_download_if_missing_arg(all_parser)
    add_roboflow_args(all_parser)
    add_training_args(all_parser)
    add_prediction_args(all_parser)
    all_parser.set_defaults(handler=handle_all)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    apply_dataset_preset_defaults(args)

    try:
        return args.handler(args)
    except CliError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
