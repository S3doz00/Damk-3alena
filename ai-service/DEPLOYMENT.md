# AI Service Deployment Guide

The dashboard's `VITE_AI_SERVICE_URL` defaults to `http://localhost:8000`.
That only resolves on the machine running `python main.py` — so when the Vercel-hosted
dashboard is opened from any other device, AI calls (forecast, shortage, donor recs) fail.

## Option A — Render.com (recommended, free tier)

1. Push `ai-service/` as-is (the `Dockerfile` is already correct).
2. Create a new **Web Service** on render.com, "Build from Dockerfile".
3. Root directory: `ai-service`. Environment: Docker. Health-check path: `/health`.
4. Free plan: service sleeps after 15 min of inactivity — first request after sleep takes ~30 s.
5. Render assigns a public HTTPS URL like `https://damk-ai-service.onrender.com`.

Then on Vercel, set the dashboard env var:

```
VITE_AI_SERVICE_URL=https://damk-ai-service.onrender.com
```

Redeploy the dashboard (or it auto-rebuilds on next push).

## Option B — Fly.io

```bash
cd ai-service
fly launch                # detects Dockerfile, generates fly.toml
fly deploy
```

Fly gives a public URL like `https://damk-ai-service.fly.dev`. Same Vercel env var update.

## Option C — Quick demo tunnel (no deploy)

For a one-off demo while `python main.py` runs locally:

```bash
npx localtunnel --port 8000          # or: ngrok http 8000
```

Copy the generated HTTPS URL into Vercel's `VITE_AI_SERVICE_URL`. Good for live demos, not for production.

## Verifying

After setting the env var and redeploying Vercel, open the dashboard from any
device/network and visit **Admin → System Settings**. The AI service status chip
should turn green (`checkAIService()` hits `/health`). If it stays red, check:

- CORS (`main.py` already has `allow_origins=["*"]`)
- HTTPS mixed content (Vercel is HTTPS — the AI URL must be HTTPS too)
- Service cold-start on Render free tier (wait ~30 s and retry)
