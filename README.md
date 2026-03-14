# Paper and Roboflow YOLO Workflow

This workspace now supports two lionfish paths:

- a current Roboflow-backed lionfish preset for local YOLOv8 training and hosted inference
- the original paper datasets under the `paper-lionfish` and `cots` presets

## Recommended Python

Use Python 3.11 on this machine, not the default 3.14 interpreter.

```powershell
py -3.11 -m pip install -e .
```

## Show presets

```powershell
py -3.11 .\lionfish_yolo.py presets
```

## Roboflow API key

```powershell
$env:ROBOFLOW_API_KEY = "your-api-key"
```

## Current lionfish workflow

Download the newer lionfish dataset:

```powershell
py -3.11 .\lionfish_yolo.py download-dataset --preset lionfish
```

Train locally on the newer lionfish dataset:

```powershell
py -3.11 .\lionfish_yolo.py train --preset lionfish --download-if-missing
```

Run the full local train/validate/predict flow:

```powershell
py -3.11 .\lionfish_yolo.py all --preset lionfish --download-if-missing
```

Run hosted Roboflow inference instead of local training:

```powershell
py -3.11 .\lionfish_yolo.py hosted-predict --preset lionfish --download-if-missing
```

Hosted inference on your own image or image directory:

```powershell
py -3.11 .\lionfish_yolo.py hosted-predict --preset lionfish --source C:\path\to\images
```

## Original paper datasets

Paper Lionfish:

```powershell
py -3.11 .\lionfish_yolo.py all --preset paper-lionfish --download-if-missing
```

Paper COTS:

```powershell
py -3.11 .\lionfish_yolo.py all --preset cots --download-if-missing
```

## Your own dataset

```powershell
py -3.11 .\lionfish_yolo.py train --data .\datasets\my-dataset\data.yaml
```

## Outputs

By default, each preset writes under `runs\paper\<preset>` and updates `last_run.json` with the latest dataset, weights, metrics, or hosted prediction outputs.
