# Django project package — Celery is optional (not used on Vercel serverless).
try:
    from .celery import app as celery_app
except ImportError:  # pragma: no cover
    celery_app = None

__all__ = ("celery_app",)
