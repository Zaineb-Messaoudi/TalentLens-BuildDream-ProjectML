# Deployment Guide

This project is easiest to deploy as two services:

- `talentlens-backend`: FastAPI API with the trained ML artifacts bundled in the repo
- `talentlens-frontend`: Vite app compiled to static files and served with Nginx

## Recommended Architecture

Deploy the backend and frontend separately.

- Backend:
  Build from `talentlens-backend/Dockerfile`
  Exposes FastAPI on the platform `PORT`
- Frontend:
  Build from `talentlens-frontend/Dockerfile`
  Pass `VITE_API_BASE_URL` at build time

## Required Frontend Environment Variable

The frontend needs the public backend URL:

```text
VITE_API_BASE_URL=https://your-backend-url
```

Example:

```text
VITE_API_BASE_URL=https://talentlens-api.onrender.com
```

## Backend Notes

The backend already includes:

- `ai_job_dataset.csv`
- serialized model artifacts in `talentlens-backend/models/`

So you do not need to retrain during deployment unless you want a fresh model build.

The container starts with:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Frontend Notes

The frontend is a static build.

It is served by Nginx with SPA routing enabled, so direct navigation to routes like:

- `/candidate`
- `/recruiter/market-pulse`
- `/admin`

will still work in production.

## Railway / Render / Any Docker Host

### Backend service

- Root directory: `talentlens-backend`
- Dockerfile: `talentlens-backend/Dockerfile`

### Frontend service

- Root directory: `talentlens-frontend`
- Dockerfile: `talentlens-frontend/Dockerfile`
- Build arg:

```text
VITE_API_BASE_URL=https://your-backend-url
```

## Smoke Test After Deploy

Check:

- Backend health: `https://your-backend-url/health`
- Frontend landing page loads
- Candidate and recruiter pages can fetch backend data

## Suggested Deployment Order

1. Deploy backend first
2. Copy the live backend URL
3. Deploy frontend with `VITE_API_BASE_URL` set to that backend URL
4. Open the frontend and verify API-powered pages
