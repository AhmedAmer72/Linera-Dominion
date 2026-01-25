# Linera Dominion Backend API

Simple Express.js backend for leaderboards and player data persistence.

## Local Development

```bash
npm install
npm run dev
```

The API will run on `http://localhost:3001`

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/leaderboard` | Get player leaderboard |
| GET | `/api/player/:address` | Get player data |
| POST | `/api/player/:address` | Save/update player data |
| GET | `/api/player/:address/rank` | Get player's rank |
| GET | `/api/galaxy/players` | Get all players for galaxy map |
| GET | `/api/galaxy/player/:address` | Get player for invasion |
| POST | `/api/galaxy/invade` | Execute invasion battle |

## Deploy to Render

### Option 1: Using render.yaml (Recommended)

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New" → "Blueprint"
4. Connect your GitHub repository
5. Render will auto-detect `render.yaml` and deploy

### Option 2: Manual Setup

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** `linera-dominion-api`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add environment variables:
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: `https://linera-dominion.vercel.app` (your frontend URL)
6. Add a Disk (for persistent storage):
   - **Name:** `data`
   - **Mount Path:** `/opt/render/project/src/data`
   - **Size:** 1 GB

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `CORS_ORIGIN` | Allowed origins (comma-separated) | `http://localhost:3000` |

## After Deployment

Update your frontend `.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://linera-dominion-api.onrender.com
```

Replace `linera-dominion-api` with your actual Render service name.
