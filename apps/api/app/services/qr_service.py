import qrcode
import base64
import io
import hashlib
import hmac
import random
import string
from datetime import datetime
from ..core.config import settings

def generate_lh_id() -> str:
    """Génère un identifiant unique Lahasa format LH-XXXX-XXXX"""
    # LH = Lahasa, puis 8 chars alphanum
    part1 = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    part2 = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"LH-{part1}-{part2}"

def generate_qr_payload(lh_id: str, numero_cin: str, nom: str) -> str:
    """Génère payload QR signé HMAC"""
    # Payload minimal + signature pour vérif offline
    timestamp = int(datetime.utcnow().timestamp())
    # Do not put the CIN or name in the QR payload. Sign the public identifier,
    # its one-way CIN hash, and timestamp so verification works offline.
    cin_hash = hashlib.sha256(''.join(c for c in numero_cin if c.isdigit()).encode()).hexdigest()[:8]
    data = f"{lh_id}|{cin_hash}|{timestamp}"
    sig = hmac.new(settings.QR_SECRET.encode(), data.encode(), hashlib.sha256).hexdigest()[:16]
    return f"LAHASA:v1:{lh_id}:{cin_hash}:{sig}:{timestamp}"

def generate_qr_base64(payload: str) -> str:
    """Génère QR code en base64 PNG"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(payload)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    b64 = base64.b64encode(buffer.read()).decode()
    return f"data:image/png;base64,{b64}"

def verify_qr_payload(payload: str) -> bool:
    """Vérifie réellement la signature HMAC du QR, sans révéler de PII."""
    try:
        parts = payload.split(":")
        if len(parts) != 6 or parts[0] != "LAHASA" or parts[1] != "v1":
            return False
        _, _, lh_id, cin_hash, signature, timestamp = parts
        if not lh_id.startswith("LH-") or len(cin_hash) != 8 or not timestamp.isdigit():
            return False
        data = f"{lh_id}|{cin_hash}|{timestamp}"
        expected = hmac.new(settings.QR_SECRET.encode(), data.encode(), hashlib.sha256).hexdigest()[:16]
        return hmac.compare_digest(signature, expected)
    except (TypeError, ValueError):
        return False
