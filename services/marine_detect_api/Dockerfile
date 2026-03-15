FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    MODEL_STORAGE_DIR=/tmp/models \
    HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

RUN useradd -m -u 1000 user \
    && apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /tmp/models /home/user/app \
    && chown -R user:user /tmp/models /home/user

USER user
WORKDIR /home/user/app

COPY --chown=user:user pyproject.toml README.md lionfish_yolo.py ./
COPY --chown=user:user services ./services

RUN pip install -e .

EXPOSE 7860

CMD ["sh", "-c", "python -m uvicorn services.marine_detect_api.main:app --host 0.0.0.0 --port ${PORT:-7860}"]