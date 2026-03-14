# Hosted Lionfish Detection

This repo is now focused on one workflow: running the hosted Roboflow lionfish detector on images and video.

## Python

Use Python 3.11 on this machine, not the default 3.14 interpreter.

```powershell
py -3.11 -m pip install -e .
```

## Roboflow API key

```powershell
$env:ROBOFLOW_API_KEY = "your-api-key"
```

## Show the preset

```powershell
py -3.11 .\lionfish_yolo.py presets
```

## Run on a video

```powershell
py -3.11 .\lionfish_yolo.py hosted-predict --video "C:\Users\goodp\Downloads\120391-720880500_small.mp4"
```

## Run on one image

```powershell
py -3.11 .\lionfish_yolo.py hosted-predict --source "C:\path\to\lionfish.jpg"
```

## Run on an image folder

```powershell
py -3.11 .\lionfish_yolo.py hosted-predict --source "C:\path\to\images"
```

## Override the model manually

```powershell
py -3.11 .\lionfish_yolo.py hosted-predict --rf-model-id "workspace/project/version" --video "C:\path\to\clip.mp4"
```

## Outputs

By default the script writes to `runs\lionfish\hosted-predict` and updates `runs\lionfish\last_run.json`.

Use `--no-json` if you only want rendered images or video without the sidecar JSON files.
