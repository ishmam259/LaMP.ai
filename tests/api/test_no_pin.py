"""With ASK_OWNER_PIN off (the shared demo): the owner's side opens without a PIN, and loan
approvals don't ask for one. Everything else stays closed as before."""

import pytest

from app.config import settings
from api_support import lender_headers

P = "/api/v1/pharmacies/green-life"


@pytest.fixture
def no_pin(monkeypatch):
    monkeypatch.setattr(settings, "ask_owner_pin", False)


def test_session_opens_without_a_pin(anon, no_pin):
    r = anon.post(f"{P}/session", json={})
    assert r.status_code == 200, r.text
    assert anon.get(f"{P}/passport").status_code == 200
    assert anon.get(P).json()["asks_pin"] is False


def test_still_closed_until_the_session_is_opened(anon, no_pin):
    assert anon.get(f"{P}/passport").status_code == 401
    assert anon.get(f"{P}/passport", headers=lender_headers()).status_code == 403


def test_loan_approval_needs_no_pin(anon, no_pin):
    anon.post(f"{P}/session", json={})
    anon.post(f"{P}/consents", json={"lender_id": "wallet-lender"})
    a = anon.post(f"{P}/actions", json={"kind": "loan_application", "payload": {
        "lender_id": "wallet-lender", "product_key": "wallet_loan", "amount": 8200}}).json()
    assert a["requires_pin"] is False
    r = anon.post(f"{P}/actions/{a['id']}/approve")
    assert r.status_code == 200, r.text
    assert anon.get(f"{P}/policy").json()["pin_required_for"] == []


def test_pin_on_reports_it(client):
    assert client.get(P).json()["asks_pin"] is True


def test_pin_on_a_missing_pin_is_not_a_wrong_try(anon, api_db):
    for _ in range(6):
        assert anon.post(f"{P}/session", json={}).status_code == 401
    from app.db import models as m
    api_db.expire_all()
    assert "pin_failures" not in (api_db.get(m.Pharmacy, "green-life").settings or {})
