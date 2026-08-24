from datetime import date

from app.services.ocr_service import MOCK_DATA_POOL, ocr_engine

GENERIC_TEXT = """REPOBLIKAN'I MADAGASIKARA
KARA-PANONDRO
Anarana: RASOAMANANA
Fanampiny: Hery Tokiniaina
Teraka ny: 03/09/1991 tao Mahajanga
Laharana: 402 111 222 333
Nomena ny: 15-06-2020
"""


def test_parse_known_mock_sample_returns_full_record():
    sample = MOCK_DATA_POOL[0]
    fields = ocr_engine.parse_cin_fields(sample["raw"])
    assert fields["numero_cin"] == sample["numero_cin"]
    assert fields["nom"] == sample["nom"]
    assert fields["prenoms"] == sample["prenoms"]
    assert fields["date_naissance"] == sample["date_naissance"]
    assert fields["lieu_naissance"] == sample["lieu_naissance"]


def test_parse_known_mock_sample_ignores_spacing_differences():
    sample = MOCK_DATA_POOL[1]
    raw = sample["raw"].replace(sample["numero_cin"], sample["numero_cin"].replace(" ", ""))
    assert ocr_engine.parse_cin_fields(raw)["numero_cin"] == sample["numero_cin"]


def test_parse_generic_text_extracts_number_names_and_dates():
    fields = ocr_engine.parse_cin_fields(GENERIC_TEXT)
    assert fields["numero_cin"] == "402 111 222 333"
    assert fields["nom"] == "RASOAMANANA"
    assert fields["prenoms"] == "Hery Tokiniaina"
    assert fields["date_naissance"] == date(1991, 9, 3)
    # Second date uses the DD-MM-YYYY variant
    assert fields["date_emission"] == date(2020, 6, 15)
    assert fields["lieu_naissance"] == "Mahajanga"


def test_parse_generic_text_accepts_unspaced_12_digit_number():
    fields = ocr_engine.parse_cin_fields("Laharana: 402111222333\nTeraka ny: 03/09/1991")
    assert fields["numero_cin"] == "402111222333"


def test_parse_defaults_place_to_antananarivo_when_unknown():
    fields = ocr_engine.parse_cin_fields("Laharana: 402111222333")
    assert fields["lieu_naissance"] == "Antananarivo"
    assert fields["lieu_emission"] == "Antananarivo"


def test_parsed_fields_fit_schema_limits():
    long_text = "Anarana: " + "A" * 200 + "\nLaharana: 402111222333"
    fields = ocr_engine.parse_cin_fields(long_text)
    assert len(fields["nom"]) <= 50
    assert len(fields["prenoms"]) <= 100


def test_extract_with_mock_returns_parsable_fields_and_confidence():
    result = ocr_engine.extract(b"not-a-real-image", use_mock=True)
    assert set(result) == {"raw_text", "fields", "confidence"}
    fields = result["fields"]
    assert len(fields["numero_cin"].replace(" ", "")) == 12
    assert isinstance(fields["date_naissance"], date)
    assert 0 <= result["confidence"]["global"] <= 1
