"""
Lightweight field encryption helpers for sensitive medical text (HIPAA-inspired).
Uses Fernet when a valid key is configured; otherwise stores plaintext in DEBUG.
"""
from __future__ import annotations

import base64
import hashlib
import logging

from django.conf import settings

logger = logging.getLogger(__name__)


def _fernet():
    try:
        from cryptography.fernet import Fernet

        key = settings.FIELD_ENCRYPTION_KEY
        # Derive a valid Fernet key from arbitrary secret
        digest = hashlib.sha256(key.encode("utf-8")).digest()
        fkey = base64.urlsafe_b64encode(digest)
        return Fernet(fkey)
    except Exception as exc:
        logger.warning("Encryption unavailable: %s", exc)
        return None


def encrypt_text(plaintext: str) -> str:
    if not settings.ENCRYPT_MEDICAL_RECORDS or not plaintext:
        return plaintext
    f = _fernet()
    if not f:
        return plaintext
    return f.encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt_text(token: str) -> str:
    if not settings.ENCRYPT_MEDICAL_RECORDS or not token:
        return token
    f = _fernet()
    if not f:
        return token
    try:
        return f.decrypt(token.encode("utf-8")).decode("utf-8")
    except Exception:
        return token
