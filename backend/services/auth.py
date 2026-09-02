"""Simple JWT auth service for SafeSense AI."""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import json
import base64
import hmac
import hashlib

SECRET_KEY = "safesense-ai-secret-key-change-in-production"
ALGORITHM = "HS256"
EXPIRE_MINUTES = 480

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _b64url_decode(s: str) -> bytes:
    pad = 4 - len(s) % 4
    return base64.urlsafe_b64decode(s + "=" * pad)

def create_access_token(data: Dict[str, Any]) -> str:
    header = _b64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = data.copy()
    payload["exp"] = (datetime.utcnow() + timedelta(minutes=EXPIRE_MINUTES)).timestamp()
    payload_enc = _b64url_encode(json.dumps(payload).encode())
    sig_input = f"{header}.{payload_enc}".encode()
    sig = _b64url_encode(hmac.new(SECRET_KEY.encode(), sig_input, hashlib.sha256).digest())
    return f"{header}.{payload_enc}.{sig}"

def verify_token(token: str) -> Optional[Dict]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header, payload_enc, sig = parts
        sig_input = f"{header}.{payload_enc}".encode()
        expected = _b64url_encode(hmac.new(SECRET_KEY.encode(), sig_input, hashlib.sha256).digest())
        if sig != expected:
            return None
        payload = json.loads(_b64url_decode(payload_enc))
        if payload.get("exp", 0) < datetime.utcnow().timestamp():
            return None
        return payload
    except Exception:
        return None
