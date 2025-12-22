FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# System deps (kept minimal)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY alembic.ini /app/alembic.ini
COPY alembic /app/alembic
COPY app /app/app

EXPOSE 8000

# Wait for DB, run migrations, then start API
CMD ["sh", "-c", "python - <<'PY'\nimport os, time\nfrom sqlalchemy import create_engine, text\nurl = os.environ.get('DATABASE_URL')\nif not url:\n    raise SystemExit('DATABASE_URL missing')\nengine = create_engine(url, pool_pre_ping=True)\ndeadline = time.time() + 60\nwhile True:\n    try:\n        with engine.connect() as c:\n            c.execute(text('select 1'))\n        break\n    except Exception as e:\n        if time.time() > deadline:\n            raise\n        time.sleep(1)\nprint('db-ready')\nPY\nalembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
