# L.I.O.N. Web App

Next.js homepage and Live Lab for the L.I.O.N. lionfish detection project.

## What is in this repo

- A long-scroll homepage styled around the L.I.O.N. Figma direction
- A `Live Lab` upload flow in the Next.js app
- A hosted inference route at `app/api/live-lab/detect/route.ts`
- A Vercel Blob upload route at `app/api/live-lab/upload/route.ts` for large deployed video uploads
- The original local Python CLI in `lionfish_yolo.py`

## How Live Lab works now

- Images are posted to the Next.js server route, which forwards them to Roboflow hosted inference.
- Local video uploads can also go through the Next.js route directly, with no Python process involved.
- Small deployed video uploads can still be proxied through the server route.
- Large deployed video uploads should be staged in Vercel Blob first.
- After the upload is available at a public URL, the server starts a Roboflow async video inference job.
- The browser polls the job and renders returned detections as overlays on top of the uploaded media.

This avoids browser CORS issues with Roboflow signed storage URLs and avoids trying to push large files through a serverless function body.

## Requirements

- Node.js for the Next.js app
- A Roboflow API key in `ROBOFLOW_API_KEY`

Optional model overrides:

- `ROBOFLOW_WORKSPACE`
- `ROBOFLOW_PROJECT`
- `ROBOFLOW_MODEL_VERSION`
- `ROBOFLOW_VIDEO_INFER_FPS`

Optional for large deployed video uploads:

- `BLOB_READ_WRITE_TOKEN`

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

4. If you want large deployed video uploads, also configure Vercel Blob and add:

```env
BLOB_READ_WRITE_TOKEN=your_blob_token_here
```

5. Run the app:

```bash
npm run dev
```

6. Open `http://localhost:3000` and use the `Live Lab` section to upload an image or video.

## Environment variables

```env
ROBOFLOW_API_KEY=your_key_here
ROBOFLOW_WORKSPACE=su-eaelw
ROBOFLOW_PROJECT=lionfish-qs3tq
ROBOFLOW_MODEL_VERSION=49
ROBOFLOW_VIDEO_INFER_FPS=5
BLOB_READ_WRITE_TOKEN=your_blob_token_here
```

## Notes

- Analytics cards on the homepage still intentionally show `N/A` until evaluation exports are wired in.
- Local video uploads work with only `ROBOFLOW_API_KEY` configured.
- Large deployed video uploads need `BLOB_READ_WRITE_TOKEN` configured so the browser can stage the file in Vercel Blob before inference starts.
- The local Python detector remains available separately through `lionfish_yolo.py` if you want offline CLI runs.
