# L.I.O.N. Web App

Next.js homepage and Live Lab for a broader reef-health monitoring surface.

## What is in this repo

- A long-scroll undersea homepage for the L.I.O.N. control surface
- A `Live Lab` upload flow with multiple detector lanes
- Hosted Roboflow inference for lionfish and crown-of-thorns detection
- A local Reef Health Suite that can combine FishInv and MegaFauna YOLO weights
- A Vercel Blob upload route for large deployed video uploads
- The local Python inference CLI in `lionfish_yolo.py`

## Detector lanes

- `Lionfish Watch`: hosted Roboflow detector for the existing lionfish workflow
- `Crown of Thorns`: hosted Roboflow detector for crown-of-thorns starfish
- `Reef Health Suite`: local paired-model lane for fish, invertebrates, megafauna, and rare species

The local suite is inspired by the paired-model reef-health approach the user wanted, but it runs from your own machine because the YOLO weight files and Python runtime are not deployment-safe for a serverless host.

## How Live Lab works now

- Images sent to a hosted detector are posted to the Next.js route, which forwards them to Roboflow inference.
- Hosted video lanes use Roboflow async video jobs and return browser overlays for playback.
- Large deployed video uploads should be staged in Vercel Blob first.
- The local Reef Health Suite writes a temporary input, runs `lionfish_yolo.py local-predict`, and reads the generated JSON overlay payload back into the web UI.

## Requirements

- Node.js for the Next.js app
- `ROBOFLOW_API_KEY` for hosted detectors
- Optional `BLOB_READ_WRITE_TOKEN` for large deployed video uploads
- Python 3.10 to 3.12 with the project dependencies if you want the local Reef Health Suite

## Setup

1. Install Node dependencies:

```bash
npm install
```

2. Create a local env file from the example:

```bash
copy .env.example .env.local
```

3. Edit `.env.local` and set at least:

```env
ROBOFLOW_API_KEY=your_key_here
```

4. If you want the local Reef Health Suite, point the app at a working Python env and your two weight files:

```env
LION_PYTHON_BIN=C:\path\to\python.exe
FISH_INV_MODEL_PATH=C:\path\to\FishInv.pt
MEGA_FAUNA_MODEL_PATH=C:\path\to\MegaFauna.pt
```

5. If you want large deployed video uploads, also configure Vercel Blob:

```env
BLOB_READ_WRITE_TOKEN=your_blob_token_here
```

6. Run the app:

```bash
npm run dev
```

7. Open `http://localhost:3000` and use the `Live Lab` section.

## Python setup for the local suite

```bash
py -3.11 -m venv .venv311
.\.venv311\Scripts\activate
pip install -e .
```

That installs `roboflow`, `opencv-python`, and `ultralytics` from `pyproject.toml`.

## Environment variables

```env
ROBOFLOW_API_KEY=your_roboflow_api_key
ROBOFLOW_WORKSPACE=su-eaelw
ROBOFLOW_PROJECT=lionfish-qs3tq
ROBOFLOW_MODEL_VERSION=49
ROBOFLOW_VIDEO_INFER_FPS=5
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_for_large_deployed_video_uploads
LION_PYTHON_BIN=C:\path\to\python.exe
FISH_INV_MODEL_PATH=C:\path\to\FishInv.pt
MEGA_FAUNA_MODEL_PATH=C:\path\to\MegaFauna.pt
```

## Notes

- The gallery species cards are intentionally labeled as placeholders until each class has real footage wired into the app.
- Analytics cards still show `N/A` until scored evaluation exports are connected.
- Hosted lanes work remotely with Roboflow configured.
- The local Reef Health Suite is intended for your own machine, where the YOLO weights live.
