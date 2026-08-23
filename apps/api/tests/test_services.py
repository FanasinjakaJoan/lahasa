from datetime import date

from app.services.duplicate_service import check_duplicate, clear_store, register_record
from app.services.qr_service import generate_qr_payload, verify_qr_payload


def setup_function():
    clear_store()


def test_duplicate_service_detects_exact_cin():
    register_record({"id": "1", "lh_id": "LH-AAAA-BBBB", "numero_cin": "101 234 567 890", "nom": "TEST", "prenoms": "Jean", "date_naissance": str(date(1990, 1, 1))})
    result = check_duplicate("101234567890", "Other", "Person", "1991-01-01")
    assert result["is_duplicate"] is True
    assert result["type"] == "exact_cin"


def test_qr_signature_is_verified_and_tampering_rejected():
    payload = generate_qr_payload("LH-AAAA-BBBB", "101234567890", "TEST")
    assert verify_qr_payload(payload) is True
    assert verify_qr_payload(payload.replace("LH-AAAA-BBBB", "LH-XXXX-YYYY")) is False
