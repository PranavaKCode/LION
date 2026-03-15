# L.I.O.N. Web App

Next.js homepage and Live Lab for the L.I.O.N. lionfish detection project.

## What is in this repo

- A long-scroll homepage styled around the L.I.O.N. Figma direction
- A `Live Lab` upload flow in the Next.js app
- A hosted inference route at `app/api/live-lab/detect/route.ts`
- The original local Python CLI in `lionfish_yolo.py`

## How Live Lab works now

- Images are posted to the Next.js server route, which forwards them to Roboflow hosted inference.
- Videos do not pass through the serverless host anymore.
- The browser asks the server for a temporary Roboflow signed upload URL.
- The browser uploads the video directly to Roboflow storage.
- The server starts a Roboflow async video inference job.
- The browser polls the job and renders returned detections as overlays on top of the uploaded media.

This avoids trying to write annotated files to serverless disk and makes deployed video detection possible without a local Python runtime.

## Requirements

- Node.js for the Next.js app
- A Roboflow API key in `ROBOFLOW_API_KEY`

Optional model overrides:

- `ROBOFLOW_WORKSPACE`
- `ROBOFLOW_PROJECT`
- `ROBOFLOW_MODEL_VERSION`
- `ROBOFLOW_VIDEO_INFER_FPS`

The Python environment is no longer required for the deployed Live Lab flow. It is only needed if you want to run the standalone local CLI manually.

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

4. Run the app:

```bash
npm run dev
```

5. Open `http://localhost:3000` and use the `Live Lab` section to upload an image or video.

## Environment variables

```env
ROBOFLOW_API_KEY=your_key_here
ROBOFLOW_WORKSPACE=su-eaelw
ROBOFLOW_PROJECT=lionfish-qs3tq
ROBOFLOW_MODEL_VERSION=49
ROBOFLOW_VIDEO_INFER_FPS=5
```

## Notes

- Analytics cards on the homepage still intentionally show `N/A` until evaluation exports are wired in.
- The deployed app no longer depends on local Python or writable output folders for Live Lab video detection.
- The local Python detector remains available separately through `lionfish_yolo.py` if you want offline CLI runs.
