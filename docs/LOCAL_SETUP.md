# Local machine setup status for KHIS (Windows)

## Already available / installed

| Component | Status | Notes |
|-----------|--------|-------|
| Python 3.14 | Installed | Use `py -3` or `backend\.venv` |
| Node.js 24 + npm | Installed | Frontend deps in `frontend/node_modules` |
| Git | Installed | |
| Backend venv + pip packages | Ready | `backend\.venv` |
| Tesseract OCR 5.4 | Installed | `C:\Program Files\Tesseract-OCR\tesseract.exe` |
| Poppler 25.07 | Installed | WinGet package (for PDF→image OCR) |
| Redis 3.0 (Windows) | Installed | Port 6379 — start with `redis-server` |
| PostgreSQL 17 | Installed | Optional; app currently uses SQLite |
| Docker Desktop 4.84 | Installed | May need a reboot / first-time launch |

## Quick run (current SQLite setup)

```powershell
# Terminal 1 — API
cd C:\Users\saksh\Kidney-Care-Tracker\backend
.\.venv\Scripts\Activate.ps1
$env:Path += ";C:\Users\saksh\AppData\Local\Microsoft\WinGet\Packages\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\poppler-25.07.0\Library\bin"
python manage.py runserver 8000

# Terminal 2 — UI
cd C:\Users\saksh\Kidney-Care-Tracker\frontend
npm run dev
```

Open http://localhost:5173 — login `rahul` / `patient123`

## Optional: use PostgreSQL instead of SQLite

1. Open **pgAdmin** or set a password during PostgreSQL setup
2. Create database `khis` and user
3. In `backend\.env` set:
   `DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/khis`
4. Install driver: `pip install "psycopg[binary]"` (if a wheel exists for your Python)
5. `python manage.py migrate && python manage.py seed_demo`

## After installing Docker / Postgres / Redis

**Restart your terminal** (or reboot once) so PATH updates apply, then verify:

```powershell
tesseract --version
docker --version
psql --version
redis-cli --version
```
