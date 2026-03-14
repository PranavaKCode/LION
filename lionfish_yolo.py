from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any


DEFAULT_MODEL = "yolov8s.pt"
DEFAULT_OUTPUT_ROOT = Path("runs") / "paper"
DEFAULT_DATASET_ROOT = Path("datasets")
DEFAULT_EPOCHS = 75
DEFAULT_IMAGE_SIZE = 800
DEFAULT_CONFIDENCE = 0.25
DEFAULT_ROBOFLOW_KEY_ENV = "ROBOFLOW_API_KEY"
DATASET_PRESETS: dict[str, dict[str, Any]] = {
    "lionfish": {
        "label": "Lionfish",
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


def add_manifest_context(args: argparse.Namespace, manifest: dict[str, Any]) -> dict[str, Any]:
    if getattr(args, "preset", None):
        manifest = {"preset": args.preset, **manifest}
    return manifest


def apply_dataset_preset_defaults(args: argparse.Namespace) -> None:
    preset_name = getattr(args, "preset", None)
    if not preset_name:
        return

    preset = DATASET_PRESETS[preset_name]
    if hasattr(args, "rf_workspace") and not getattr(args, "rf_workspace", None):
        args.rf_workspace = preset["rf_workspace"]
    if hasattr(args, "rf_project") and not getattr(args, "rf_project", None):
        args.rf_project = preset["rf_project"]
    if hasattr(args, "rf_version") and getattr(args, "rf_version", None) is None:
        args.rf_version = preset["rf_version"]
    if hasattr(args, "dataset_root") and not getattr(args, "dataset_root", None):
        args.dataset_root = str(DEFAULT_DATASET_ROOT / preset["dataset_dir"])
    if hasattr(args, "output_root") and getattr(args, "output_root", None) == str(DEFAULT_OUTPUT_ROOT):
        args.output_root = str(DEFAULT_OUTPUT_ROOT / preset_name)


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


def local_dataset_yaml(args: argparse.Namespace) -> Path | None:
    try:
        dataset_root = resolve_dataset_root(args)
    except CliError:
        return None

    candidate = dataset_root / "data.yaml"
    return candidate.resolve() if candidate.exists() else None


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
    dataset_root.mkdir(parents=True, exist_ok=True)

    rf = Roboflow(api_key=api_key)
    project = rf.workspace(args.rf_workspace).project(args.rf_project)
    version = project.version(args.rf_version)
    dataset = version.download("yolov8", location=str(dataset_root))

    data_yaml = ensure_exists(Path(dataset.location) / "data.yaml", "Downloaded dataset YAML")
    return data_yaml.resolve()


def resolve_data_yaml(args: argparse.Namespace, allow_download: bool) -> Path:
    if args.data:
        return resolve_data_yaml_argument(args.data)

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
    config = load_dataset_config(data_yaml)
    split_value = config.get(split_name)
    if not split_value:
        return None

    candidate = Path(split_value)
    if not candidate.is_absolute():
        candidate = (data_yaml.parent / candidate).resolve()

    return candidate if candidate.exists() else None


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


def default_weights_path(output_root: Path, run_name: str) -> Path:
    return output_root / run_name / "weights" / "best.pt"


def handle_presets(args: argparse.Namespace) -> int:
    for name in preset_names():
        preset = DATASET_PRESETS[name]
        print(
            f"{name}: {preset['label']} | "
            f"{preset['rf_workspace']}/{preset['rf_project']} v{preset['rf_version']} | "
            f"local folder: {DEFAULT_DATASET_ROOT / preset['dataset_dir']}"
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
        help="Paper dataset preset. `lionfish` maps to hunter-gunter/lionfish-sserd v1 and `cots` maps to cots/google-images-ztm4n v2.",
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


def add_roboflow_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--dataset-root", help="Directory used when downloading the Roboflow dataset.")
    parser.add_argument("--rf-workspace", help="Roboflow workspace slug.")
    parser.add_argument("--rf-project", help="Roboflow project slug.")
    parser.add_argument("--rf-version", type=int, help="Roboflow dataset version.")
    parser.add_argument("--rf-api-key", help="Roboflow API key. Prefer the environment variable instead.")
    parser.add_argument(
        "--rf-api-key-env",
        default=DEFAULT_ROBOFLOW_KEY_ENV,
        help="Environment variable that stores the Roboflow API key.",
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Modernized YOLOv8 workflow for the public datasets used in the kluless13/paper repo."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    presets_parser = subparsers.add_parser("presets", help="Show built-in dataset presets from the paper repo.")
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

    train_parser = subparsers.add_parser("train", help="Train a YOLOv8 model.")
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

    predict_parser = subparsers.add_parser("predict", help="Run image and video predictions.")
    add_shared_args(predict_parser)
    add_download_if_missing_arg(predict_parser)
    add_roboflow_args(predict_parser)
    add_prediction_args(predict_parser)
    predict_parser.set_defaults(handler=handle_predict)

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
