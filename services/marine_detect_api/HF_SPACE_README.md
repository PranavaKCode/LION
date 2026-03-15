---
title: L.I.O.N. Marine Detect API
sdk: docker
app_port: 7860
---

This Space runs the remote FishInv + MegaFauna detection service for the L.I.O.N. web app.

Required Variables:
- `FISH_INV_MODEL_URL`
- `MEGA_FAUNA_MODEL_URL`
- `MODEL_STORAGE_DIR=/tmp/models`

Optional Secrets:
- `MARINE_DETECT_API_TOKEN`

Recommended Dropbox-style direct download URLs should end in `dl=1`.

Health endpoints:
- `/`
- `/health`

Inference endpoints:
- `POST /detect/upload`
- `POST /detect/url`