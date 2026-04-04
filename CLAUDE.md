# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Damk 3alena** — AI-driven blood donation platform for Jordan. Four-tier architecture:
- `dashboard/` — React 19 + TypeScript + Vite web admin panel
- `mobile-expo/` — Expo (React Native) donor app (primary mobile app)
- `mobile/` — Flutter donor app (legacy, replaced by mobile-expo)
- `ai-service/` — FastAPI Python microservice for ML predictions
- `supabase/` — PostgreSQL schema, migrations, and RLS policies

## Commands

### Dashboard (React/Vite)
```bash
cd dashboard
npm run dev       # Dev server
npm run build     # Type-check + production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

### Mobile (Expo/React Native) — Primary
```bash
cd mobile-expo
npm install       # Install dependencies
npx expo start    # Dev server (Expo Go or simulator)
npx expo run:ios  # Build & run on iOS simulator
npx expo run:android  # Build & run on Android emulator
```

### Mobile (Flutter) — Legacy
```bash
cd mobile
flutter pub get   # Install dependencies
flutter run       # Run on connected device/emulator
```

### AI Service (FastAPI)
```bash
cd ai-service
pip install -r requirements.txt
python main.py    # Runs uvicorn on 0.0.0.0:8000

# Or via Docker:
docker build -t damk-ai-service .
docker run -p 8000:8000 damk-ai-service

# Generate synthetic training data:
python data/generate_synthetic.py
```

## Architecture

### Data Flow
Mobile app and dashboard both connect directly to **Supabase** for auth, real-time data, and CRUD. The **AI service** is a separate FastAPI microservice (port 8000) called by the dashboard for forecasting and recommendations — it does not connect to Supabase directly.

### AI Service Endpoints
- `POST /forecast` — Blood demand forecasting (scikit-learn)
- `POST /shortage-detect` — Shortage detection with urgency alerts
- `POST /recommend-donors` — Location + blood type based donor matching

### Database Schema (Supabase/PostgreSQL)
Core tables: `users`, `donors`, `facilities`, `staff`, `blood_requests`, `appointments`, `donations`, `facility_inventory`. Blood types are stored as enum: `A+, A-, B+, B-, AB+, AB-, O+, O-`. User roles: `donor`, `staff`, `admin`. Request urgency: `normal`, `urgent`, `critical`.

Row-level security (RLS) is enabled — see `supabase/migrations/002_rls_policies.sql` before writing queries or new tables.

### Dashboard Stack
React Router 7 for routing, Tailwind CSS for styling, Recharts for data visualization, Supabase JS client for database access.

### Mobile Stack (Expo)
Expo Router (file-based routing), React Context for state management, `@supabase/supabase-js` for auth/data, `react-native-maps` for mapping, `react-native-qrcode-svg` for appointment tickets. Auth uses email-password (phone as fake email). Data flows through `AppContext.tsx` which loads profile, appointments, donations, and notifications from Supabase on login.

## Environment
Dashboard requires `.env` with Supabase credentials — copy from `dashboard/.env.example`. The Supabase project ref is `llmsozcbogckiwpazvkv` (used in MCP config at `.mcp.json`).
