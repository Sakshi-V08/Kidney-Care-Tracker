# Deployment Guide

## Prerequisites

- Docker & Docker Compose
- (Optional) OpenAI API key for richer AI summaries/chat
- (Optional) AWS S3 credentials for remote file storage

## Quick start (Docker)

```bash
cp backend/.env.example backend/.env
# edit OPENAI_API_KEY if available

docker compose up --build
```

Services:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger: http://localhost:8000/api/docs/
- Postgres: localhost:5432
- Redis: localhost:6379

Demo logins (after seed):

- `admin` / `admin123`
- `rahul` / `patient123`
- `sakshi` / `patient123`

## Local development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# set DATABASE_URL=sqlite:///db.sqlite3 for quick start
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

Install [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) and set `TESSERACT_CMD` if needed.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Production checklist

1. Set strong `SECRET_KEY` and `FIELD_ENCRYPTION_KEY`
2. Set `DEBUG=False`, configure `ALLOWED_HOSTS`
3. Use managed PostgreSQL
4. Enable HTTPS (`SECURE_SSL_REDIRECT=True`)
5. Configure S3 (`USE_S3=True`) for report files
6. Set `OPENAI_API_KEY` for LLM features
7. Run migrations and collectstatic
8. Restrict CORS to your frontend origin
9. Review audit logs regularly
10. Never commit `.env` or patient media

## Cloud targets

- **Render / Railway / Fly.io**: deploy `backend` web service + managed Postgres; static frontend or container
- **AWS**: ECS/Fargate + RDS Postgres + S3 + ALB
- **Azure**: App Service / Container Apps + Azure Database for PostgreSQL + Blob Storage

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs backend pytest and frontend build on push/PR.
