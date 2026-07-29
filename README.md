# Kidney Health Intelligence System (KHIS)

Production-ready AI-powered web application for securely storing, analyzing, and monitoring historical kidney laboratory reports.

> **Medical disclaimer:** This application provides educational insights based on uploaded laboratory reports. It does not diagnose diseases or replace professional medical advice. Patients should always consult a qualified healthcare provider for diagnosis and treatment decisions.

## Features

1. **JWT authentication** — Register/login, roles (Admin / Patient / Doctor / Caregiver)
2. **Patient folders** — Reports stored under `media/patients/<PatientName>/`
3. **Multi-file upload** — PDF & images with drag-and-drop (frontend)
4. **OCR pipeline** — Tesseract (+ optional Google Vision / LLM assist)
5. **Smart extraction** — Investigation, value, unit, reference range, date, hospital, doctor
6. **Unit normalization** — e.g. creatinine µmol/L ↔ mg/dL
7. **Historical comparison** — Trends, severity, rate of change
8. **AI medical analysis** — Status, meaning, causes, complications, urgency, confidence
9. **AI health summary** + evidence-labeled preventive suggestions
10. **Trend graphs** — Creatinine, eGFR, urea, electrolytes, Hb, BP (monthly/yearly)
11. **Dashboard** — CKD stage, risk, kidney score, abnormal labs, upcoming tests
12. **AI chat assistant** grounded in the patient’s report history
13. **Notifications** — Creatinine↑, eGFR↓, proteinuria, critical K⁺, follow-ups
14. **Export** — PDF summary, doctor report, CSV, Excel
15. **Security** — JWT, RBAC, encrypted fields helper, audit logs, HIPAA-inspired defaults
16. **Extras** — Dark mode, i18n, BP/weight/water trackers, medicine & appointment reminders, diet planner, duplicate detection, CKD staging

## Architecture

```
Kidney-Care-Tracker/
├── backend/                 # Django 5 + DRF + SimpleJWT
│   ├── apps/
│   │   ├── accounts/        # Users & auth
│   │   ├── patients/        # Patients & dashboard
│   │   ├── reports/         # Upload, OCR, lab results
│   │   ├── analysis/        # Trends, AI insights, scoring
│   │   ├── chat/            # AI assistant
│   │   ├── notifications/
│   │   ├── trackers/        # BP, weight, water, meds, diet
│   │   ├── exports/
│   │   └── audit/
│   ├── khis/                # Settings
│   └── tests/
├── frontend/                # React + TypeScript + MUI + Recharts
├── sample-data/             # Demo lab reports (Rahul, Sakshi)
├── docs/                    # API & deployment guides
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Quick start

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:8000/api/v1/ |
| Swagger | http://localhost:8000/api/docs/ |

**Demo accounts** (seeded automatically in Docker):

| User | Password | Role |
|------|----------|------|
| admin | admin123 | Admin |
| rahul | patient123 | Patient |
| sakshi | patient123 | Patient |

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Material UI, Recharts, i18next |
| Backend | Django, Django REST Framework, Celery |
| Database | PostgreSQL |
| Storage | Local media (S3-ready) |
| OCR | Tesseract (+ optional Vision/LLM) |
| AI | OpenAI GPT API (rule-based fallback) |
| Auth | JWT (SimpleJWT) |
| Deploy | Docker, GitHub Actions |

## Sample dataset

```
sample-data/
├── Rahul/
│   ├── Report_April_2025.txt
│   ├── Report_July_2025.txt
│   └── Report_Dec_2025.txt
└── Sakshi/
    ├── Report1.txt
    └── Report2.txt
```

Upload these via the UI or run `python manage.py seed_demo`.

## Documentation

- [API documentation](docs/API.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- Interactive OpenAPI: `/api/docs/`

## Tests

```bash
cd backend
pytest
```

## Security practices

- Role-based access to patient data
- JWT access/refresh with rotation & blacklist
- Audit logging for sensitive API actions
- Optional Fernet field encryption helper
- Secure cookie/HSTS settings when `DEBUG=False`
- Duplicate report detection via SHA-256 file hash

## License

Educational / demonstration project. Not a medical device.
