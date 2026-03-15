# L.I.O.N. Web App

Next.js homepage and Live Lab for a reef-health monitoring surface with hosted invasive-species detectors and a remote-capable Reef Health Suite.


## What is in this repo

- A long-scroll undersea homepage for the L.I.O.N. control surface
- A `Live Lab` upload flow with multiple detector lanes
- Hosted Roboflow inference for lionfish and crown-of-thorns detection
- A Reef Health Suite that can use FishInv and MegaFauna through either:
  - a remote Python service compatible with the app
  - a local Python fallback on your own machine
- A Vercel Blob upload route for large deployed video uploads
- The local Python inference CLI in `lionfish_yolo.py`
- A deployable FastAPI service in `services/marine_detect_api/main.py`
- A Docker image definition for that service in `services/marine_detect_api/Dockerfile`

## Detector lanes

- `Lionfish Watch`: hosted Roboflow detector for the existing lionfish workflow
- `Crown of Thorns`: hosted Roboflow detector for crown-of-thorns starfish
- `Reef Health Suite`: marine-detect-style paired-model lane for fish, invertebrates, megafauna, and rare species

The Reef Health Suite follows the paired-model idea from Orange OpenSource's marine-detect project:
[marine-detect](https://github.com/Orange-OpenSource/marine-detect?tab=readme-ov-file)

## How Live Lab works now

- Images sent to hosted lanes are forwarded to Roboflow inference.
- Hosted video lanes use Roboflow async video jobs and return browser overlays for playback.
- Large deployed video uploads can be staged in Vercel Blob first.
- Reef Health Suite requests now behave like this:
  - If `MARINE_DETECT_API_URL` is configured, the app sends uploads or blob URLs to the remote Python service.
  - If no remote service is configured, the app falls back to the local Python runner.

## What you need for real public website use

The FishInv and MegaFauna models cannot run on GitHub Pages, and they are not a good fit for Vercel serverless functions because they need a Python runtime, large YOLO weights, and longer inference time.

For website visitors to use the Reef Health Suite remotely, you need one extra service:

- a public Python web service for `services/marine_detect_api/main.py`

The simplest setup is:

1. Keep the Next.js site on Vercel.
2. Deploy the Python service separately using the Dockerfile in `services/marine_detect_api/Dockerfile`.
3. Point the Next app at that service with `MARINE_DETECT_API_URL`.

## Remote Reef Health Suite service

### Local test setup

From the repo root:

```bash
npm run dev:reef-service
```

That starts the service on:

```env
http://127.0.0.1:8000
```

The repo-local `.env.local` on this machine is already configured to use that localhost service.

### Public deployment setup

Deploy the Python service anywhere that can run a Docker container. Good fits are a dedicated Python/container host such as Hugging Face Docker Spaces, Render, Railway, Fly.io, or another Docker-capable VM/container service.

You will need to provide one of these for the model weights:

- `FISH_INV_MODEL_PATH` and `MEGA_FAUNA_MODEL_PATH` on the service host if the files already exist there
- or `FISH_INV_MODEL_URL` and `MEGA_FAUNA_MODEL_URL` so the service can download the `.pt` files on first use

Then configure the Next app with:

A Hugging Face Docker Space is a good free-first option for this service because it supports Docker and offers more memory than Render Free.


```env
MARINE_DETECT_API_URL=https://your-reef-service.example
MARINE_DETECT_API_TOKEN=your_shared_token
```

If the token is set on the service host, set the same token in the Next app.

### Running the service manually

```bash
.\.venv311\Scripts\python.exe -m uvicorn services.marine_detect_api.main:app --host 0.0.0.0 --port 8000
```

### Service health check

```bash
http://127.0.0.1:8000/health
```

## Requirements

- Node.js for the Next.js app
- `ROBOFLOW_API_KEY` for hosted detectors
- Optional `BLOB_READ_WRITE_TOKEN` for large deployed video uploads
- Python 3.10 to 3.12 with the project dependencies if you want the local fallback or the remote Reef Health Suite service

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

4. If you want the Reef Health Suite, configure either the remote service or the local fallback.

Remote service:

```env
MARINE_DETECT_API_URL=http://127.0.0.1:8000
MARINE_DETECT_API_TOKEN=
```

Local fallback:

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

## Python setup

```bash
py -3.11 -m venv .venv311
.\.venv311\Scripts\activate
pip install -e .
```

That installs `roboflow`, `opencv-python`, `ultralytics`, `fastapi`, `python-multipart`, and `uvicorn`.

## Environment variables

```env
ROBOFLOW_API_KEY=your_roboflow_api_key
ROBOFLOW_WORKSPACE=su-eaelw
ROBOFLOW_PROJECT=lionfish-qs3tq
ROBOFLOW_MODEL_VERSION=49
ROBOFLOW_VIDEO_INFER_FPS=5
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_for_large_deployed_video_uploads
MARINE_DETECT_API_URL=http://127.0.0.1:8000
MARINE_DETECT_API_TOKEN=
LION_PYTHON_BIN=C:\path\to\python.exe
FISH_INV_MODEL_PATH=C:\path\to\FishInv.pt
MEGA_FAUNA_MODEL_PATH=C:\path\to\MegaFauna.pt
FISH_INV_MODEL_URL=https://your-public-host.example/FishInv.pt
MEGA_FAUNA_MODEL_URL=https://your-public-host.example/MegaFauna.pt
MODEL_STORAGE_DIR=C:\path\to\model-cache
```

## Notes

- The gallery can now render actual species media where assets exist; the first lionfish slot is using a real media asset and the remaining slots stay clearly labeled.
- I could not automatically locate your attached species image files on disk from this environment, so additional gallery swaps still need exact local file paths.
- Analytics cards still show `N/A` until scored evaluation exports are connected.
- Hosted lanes work remotely with Roboflow configured.
- The Reef Health Suite is remote-capable now, but it still needs a separate Python service host for public website users.
