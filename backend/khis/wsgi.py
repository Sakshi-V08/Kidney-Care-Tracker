import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "khis.settings")

application = get_wsgi_application()
# Vercel Python runtime looks for `app` or `application`
app = application
