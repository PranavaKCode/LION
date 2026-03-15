# L.I.O.N. Web App

Next.js homepage and live lab for the L.I.O.N. lionfish detection project.

## What is in this repo

- A long-scroll homepage styled around the L.I.O.N. Figma direction
- A `Live Lab` upload flow in the Next.js app
- A server route at `app/api/live-lab/detect/route.ts`
- The real Python detection CLI in `lionfish_yolo.py`

The Live Lab route shells out to the Python detector, runs hosted Roboflow inference, and returns annotated image or video output back into the web UI.

## Requirements for Live Lab

- Node.js for the Next.js app
- Python `3.10` to `3.12`
- A Roboflow API key in `ROBOFLOW_API_KEY`
- Python dependencies from `pyproject.toml`

The default `python` on this machine is Python `3.14`, which is not compatible with this detector setup. Point the app at a working Python `3.10` to `3.12` interpreter with `LIONFISH_PYTHON_BIN`.

## Setup

1. Install Node dependencies:

```bash
npm install
```

2. Create a local env file from the example:

```bash
copy .env.example .env.local
```

3. Edit `.env.local` and set:

- `ROBOFLOW_API_KEY`
- `LIONFISH_PYTHON_BIN`

4. Create a compatible Python environment and install the detector package:

```bash
py -3.11 -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -e .
```

5. Run the app:

```bash
npm run dev
```

6. Open `http://localhost:3000` and use the `Live Lab` section to upload an image or video.

## Environment variables

- `ROBOFLOW_API_KEY`: required for hosted inference
- `LIONFISH_PYTHON_BIN`: optional override for the Python executable used by the Next.js route

Example:

```env
ROBOFLOW_API_KEY=your_key_here
LIONFISH_PYTHON_BIN=C:\Users\goodp\Downloads\picoctf\pizzaroutes\.venv\Scripts\python.exe
```

## Detection flow

1. The browser uploads a file to `POST /api/live-lab/detect`
2. The server writes the upload to a temp directory
3. The route runs:

```bash
python lionfish_yolo.py hosted-predict --preset lionfish --source <file> --output-root <public output dir>
```

4. The CLI writes:

- annotated media
- frame or image JSON
- `last_run.json`

5. The route reads those files and returns URLs and summary metrics to the UI

## Notes

- Live Lab outputs are written under `public/live-lab-output/`
- That folder is ignored in git
- Analytics cards on the homepage still intentionally show `N/A` until evaluation exports are wired in
