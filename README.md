# Lionfish YOLOv8 Workflow

This repo now contains a local, script-based replacement for the older Colab notebook in `Copy_of_yolov8_LF.ipynb`.

The original notebook depended on:

- notebook shell magics like `!pip`, `%cd`, and `!yolo`
- a pinned 2023-era `ultralytics==8.0.20`
- manual output browsing inside `/content/runs`

The replacement in `lionfish_yolo.py` keeps the same high-level flow but uses a reusable CLI:

1. download the dataset from Roboflow if needed
2. train a YOLOv8 model
3. validate the trained weights
4. run predictions on the dataset test split and an optional video

## Recommended environment

Current Ultralytics releases are much happier on Python 3.10-3.12 than on Python 3.14.

```powershell
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e .
```

## Dataset download

If you already have a `data.yaml`, skip this section and pass `--data` directly to the commands below.

Set your Roboflow API key:

```powershell
$env:ROBOFLOW_API_KEY = "your-api-key"
```

Download the dataset:

```powershell
python .\lionfish_yolo.py download-dataset `
  --rf-workspace your-workspace `
  --rf-project your-project `
  --rf-version 1
```

## Training

```powershell
python .\lionfish_yolo.py train --data .\datasets\your-project-v1\data.yaml
```

Defaults are aligned with the notebook:

- `model=yolov8s.pt`
- `epochs=75`
- `imgsz=800`

## Validation

```powershell
python .\lionfish_yolo.py validate --data .\datasets\your-project-v1\data.yaml
```

By default this looks for weights in `runs\lionfish\train\weights\best.pt`.

## Prediction

Predict on the dataset test split:

```powershell
python .\lionfish_yolo.py predict --data .\datasets\your-project-v1\data.yaml
```

Predict on a specific video:

```powershell
python .\lionfish_yolo.py predict `
  --data .\datasets\your-project-v1\data.yaml `
  --video C:\path\to\LFclip.mp4
```

## One-shot workflow

This reproduces the whole notebook flow in one command:

```powershell
python .\lionfish_yolo.py all `
  --rf-workspace your-workspace `
  --rf-project your-project `
  --rf-version 1 `
  --video C:\path\to\LFclip.mp4
```

Each command writes a small manifest to `runs\lionfish\last_run.json` so the latest dataset path, weights path, metrics, and prediction directories are easy to find.
