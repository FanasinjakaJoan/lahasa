from app.services.duplicate_service import (
    check_duplicate,
    get_all_records,
    normalize_cin,
    normalize_name,
    register_record,
)

RECORD = {
    "id": "rec-1",
    "lh_id": "LH-AAAA-1111",
    "numero_cin": "101 234 567 890",
    "nom": "RAKOTONDRABE",
    "prenoms": "Fanasinjaka Joan",
    "date_naissance": "1998-05-14",
}


def test_normalize_cin_strips_non_digits():
    assert normalize_cin("101 234 567 890") == "101234567890"
    assert normalize_cin("101-234.567/890") == "101234567890"


def test_normalize_name_uppercases_and_collapses_spaces():
    assert normalize_name("  fanasinjaka   joan ") == "FANASINJAKA JOAN"


def test_no_duplicate_on_empty_store():
    result = check_duplicate("101234567890", "RAKOTONDRABE", "Fanasinjaka Joan", "1998-05-14")
    assert result["is_duplicate"] is False
    assert result["type"] == "none"
    assert result["existing_lh_id"] is None


def test_exact_cin_match_ignores_formatting():
    register_record(RECORD)
    result = check_duplicate("101-234-567-890", "AUTRE", "Personne", "2000-01-01")
    assert result["is_duplicate"] is True
    assert result["type"] == "exact_cin"
    assert result["score"] == 1.0
    assert result["existing_lh_id"] == "LH-AAAA-1111"


def test_fuzzy_match_on_similar_name_and_same_birth_date():
    register_record(RECORD)
    # Different CIN, slightly misspelled name, same date of birth
    result = check_duplicate("999 888 777 666", "RAKOTONDRABY", "Fanasinjaka Joan", "1998-05-14")
    assert result["is_duplicate"] is True
    assert result["type"] == "fuzzy_name"
    assert result["existing_id"] == "rec-1"
    assert result["score"] > 0.85


def test_different_person_is_not_a_duplicate():
    register_record(RECORD)
    result = check_duplicate("301 123 456 789", "RANDRIANARISOA", "Miora Lalaina", "1995-11-02")
    assert result["is_duplicate"] is False
    assert result["type"] == "none"


def test_register_record_deduplicates_by_normalized_cin():
    register_record(RECORD)
    register_record({**RECORD, "id": "rec-2", "numero_cin": "101234567890"})
    assert len(get_all_records()) == 1
    assert get_all_records()[0]["id"] == "rec-2"


def test_register_record_ignores_empty_cin():
    register_record({"id": "rec-3", "numero_cin": ""})
    assert get_all_records() == []
