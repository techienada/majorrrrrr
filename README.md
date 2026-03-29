# PulsePath API

## Run

```powershell
npm install
npm run dev:server
```

API base URL: `http://localhost:4000/api`

## Main endpoints

- `POST /api/auth/login`
- `GET /api/dashboard`
- `POST /api/dashboard/reset`
- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `GET /api/users/:id/analytics`
- `GET /api/activity`
- `POST /api/activity`
- `GET /api/reports`
- `POST /api/ml/predict-risk`
- `POST /api/dl/predict-trend`

## Storage

- Runtime store: `server/data/app-data.json`
- SQL schema: `server/database/schema.sql`
