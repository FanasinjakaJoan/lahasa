import os
import sys

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services import duplicate_service  # noqa: E402


@pytest.fixture(autouse=True)
def clean_store():
    duplicate_service.clear_store()
    yield
    duplicate_service.clear_store()
