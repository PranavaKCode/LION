# Paper YOLOv8 Workflow

This workspace contains a modern local replacement for the older Colab YOLOv8 notebooks in the public `kluless13/paper` repo.

Instead of notebook magics like `!pip`, `%cd`, and `!yolo`, [`lionfish_yolo.py`](./lionfish_yolo.py) gives you a reusable CLI for the paper's YOLOv8 experiments.

Built-in dataset presets from the paper:

- `lionfish` -> Roboflow `hunter-gunter/lionfish-sserd` version `1`
- `cots` -> Roboflow `cots/google-images-ztm4n` version `2`

## Recommended environment

Current Ultralytics releases are much happier on Python 3.10-3.12 than on Python 3.14.

```powershell
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e .
```

## Show the built-in presets

```powershell
python .\lionfish_yolo.py presets
```

## Roboflow API key

The datasets in the paper came from Roboflow, so set an API key before download commands:

```powershell
$env:ROBOFLOW_API_KEY = "your-api-key"
```

## Reproduce the Lionfish YOLOv8 workflow

Download the paper dataset:

```powershell
python .\lionfish_yolo.py download-dataset --preset lionfish
```

Train:

```powershell
python .\lionfish_yolo.py train --preset lionfish
```

Or let the script download automatically if it is missing:

```powershell
python .\lionfish_yolo.py train --preset lionfish --download-if-missing
```

Run the whole flow from the paper in one command:

```powershell
python .\lionfish_yolo.py all --preset lionfish --download-if-missing
```

## Reproduce the COTS YOLOv8 workflow

```powershell
python .\lionfish_yolo.py all --preset cots --download-if-missing
```

## Predict on a paper video or your own clip

```powershell
python .\lionfish_yolo.py predict --preset lionfish --video C:\path\to\LFclip.mp4
python .\lionfish_yolo.py predict --preset cots --video C:\path\to\cotsclip1.mp4
```

## Use your own dataset instead

If you are not reproducing the paper datasets, pass a local `data.yaml` directly:

```powershell
python .\lionfish_yolo.py train --data .\datasets\my-dataset\data.yaml
```

## Outputs

By default the runs go to:

- `runs\paper\lionfish`
- `runs\paper\cots`

Each command writes `last_run.json` in the output root so the latest dataset path, weights path, metrics, and prediction directories are easy to find.
