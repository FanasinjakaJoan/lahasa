import base64
import re

from app.services.qr_service import (
    generate_lh_id,
    generate_qr_base64,
    generate_qr_payload,
    verify_qr_payload,
)


def test_generate_lh_id_format_and_uniqueness():
    ids = {generate_lh_id() for _ in range(50)}
    assert all(re.fullmatch(r"LH-[A-Z0-9]{4}-[A-Z0-9]{4}", i) for i in ids)
    assert len(ids) > 1


def test_qr_payload_structure_hides_raw_cin():
    payload = generate_qr_payload("LH-AAAA-1111", "101 234 567 890", "RAKOTONDRABE")
    prefix, version, lh_id, cin_hash, sig, ts = payload.split(":")
    assert (prefix, version, lh_id) == ("LAHASA", "v1", "LH-AAAA-1111")
    assert len(cin_hash) == 8 and len(sig) == 16
    assert ts.isdigit()
    assert "101234567890" not in payload and "101 234 567 890" not in payload


def test_qr_payload_signature_depends_on_record():
    a = generate_qr_payload("LH-AAAA-1111", "101234567890", "RAKOTONDRABE")
    b = generate_qr_payload("LH-BBBB-2222", "101234567890", "RAKOTONDRABE")
    c = generate_qr_payload("LH-AAAA-1111", "301123456789", "RAKOTONDRABE")
    assert a.split(":")[4] != b.split(":")[4]
    assert a.split(":")[3] != c.split(":")[3]


def test_verify_qr_payload_accepts_generated_and_rejects_malformed():
    assert verify_qr_payload(generate_qr_payload("LH-AAAA-1111", "101234567890", "NOM")) is True
    assert verify_qr_payload("LAHASA:v1:LH-AAAA-1111") is False
    assert verify_qr_payload("OTHER:v1:a:b:c:d") is False
    assert verify_qr_payload("") is False


def test_generate_qr_base64_returns_png_data_uri():
    uri = generate_qr_base64("LAHASA:v1:LH-AAAA-1111:deadbeef:0123456789abcdef:1700000000")
    assert uri.startswith("data:image/png;base64,")
    assert base64.b64decode(uri.split(",", 1)[1])[:8] == b"\x89PNG\r\n\x1a\n"
