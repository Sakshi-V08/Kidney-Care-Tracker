# KHIS API Documentation

Base URL: `http://localhost:8000/api/v1/`

Interactive Swagger UI: `http://localhost:8000/api/docs/`

OpenAPI schema: `http://localhost:8000/api/schema/`

Authentication: JWT Bearer token from `/auth/login/`.

## Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register/` | Register user |
| POST | `/auth/login/` | Obtain access + refresh JWT |
| POST | `/auth/refresh/` | Refresh access token |
| POST | `/auth/logout/` | Blacklist refresh token |
| GET | `/auth/me/` | Current user |
| GET/PATCH | `/auth/profile/` | Profile |

## Patients & Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/patients/` | List/create patients |
| GET/PATCH/DELETE | `/patients/{id}/` | Patient detail |
| GET | `/patients/{id}/folder/` | Patient storage folder files |
| GET | `/patients/{id}/dashboard/` | Patient dashboard payload |
| GET | `/dashboard/` | Dashboard for current patient |

## Reports

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/reports/` | List/upload single report |
| POST | `/reports/upload/` | Multi-file upload (`patient`, `files`) |
| GET | `/reports/{id}/` | Report + extracted results |
| POST | `/reports/{id}/reprocess/` | Re-run OCR pipeline |

## Analysis

| Method | Path | Description |
|--------|------|-------------|
| GET | `/analysis/?patient=` | Per-investigation AI analysis |
| GET/POST | `/summary/?patient=` | AI health summary + suggestions |
| GET | `/trends/?patient=&key=&period=` | Trend series (`monthly`/`yearly`/`all`) |

## Chat

| Method | Path | Description |
|--------|------|-------------|
| POST | `/chat/` | Ask assistant `{patient, message, session?}` |
| GET | `/chat/sessions/` | Prior chat sessions |

## Notifications, Trackers, Export, Audit

| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications/` | User alerts |
| POST | `/notifications/{id}/read/` | Mark read |
| CRUD | `/trackers/bp|weight|water|medicines|appointments|diet/` | Lifestyle trackers |
| GET | `/export/?patient=&format=pdf\|csv\|excel&doctor=true` | Downloads |
| GET | `/audit-logs/` | Admin audit trail |

## Medical disclaimer

All AI responses include:

> This application provides educational insights based on uploaded laboratory reports. It does not diagnose diseases or replace professional medical advice. Patients should always consult a qualified healthcare provider for diagnosis and treatment decisions.
