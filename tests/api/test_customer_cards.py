"""Customer cards: a patient checks what they owe and promises a way to pay it back."""

from app.engines.patients import split

CODE = "GL-7KQM-4XPA"  # Customer 003, 6,500 since 1 Sep; the pharmacy's today is 16 Oct 2026
C = "/api/v1/cards"
P = "/api/v1/pharmacies/green-life"


def test_card_shows_amounts_only(anon):
    r = anon.get(f"{C}/{CODE}")
    assert r.status_code == 200, r.text
    card = r.json()
    assert set(card) == {"pharmacy_name", "city", "label", "amount", "since", "days_outstanding", "as_of",
                         "latest_first_on", "options", "plan"}
    assert (card["label"], card["amount"], card["days_outstanding"]) == ("Customer 003", 6500, 45)
    assert card["latest_first_on"] == "2026-10-30"
    assert [(o["parts"], o["part_amount"]) for o in card["options"]] == [(1, 6500), (2, 3250), (4, 1625)]
    assert card["plan"] is None
    assert r.headers["cache-control"] == "no-store"


def test_code_is_forgiving_about_case_and_dashes(anon):
    assert anon.get(f"{C}/gl 7kqm 4xpa").json()["label"] == "Customer 003"
    assert anon.get(f"{C}/GL7KQM4XPA").json()["label"] == "Customer 003"


def test_unknown_code(anon):
    r = anon.get(f"{C}/GL-AAAA-AAAA")
    assert r.status_code == 404
    assert "code" in r.json()["detail"]


def test_plan_in_four_weekly_parts(anon):
    r = anon.post(f"{C}/{CODE}/plan", json={"parts": 4, "first_on": "2026-10-20"})
    assert r.status_code == 200, r.text
    plan = r.json()["plan"]
    assert [(p["due_on"], p["amount"]) for p in plan["schedule"]] == [
        ("2026-10-20", 1625), ("2026-10-27", 1625), ("2026-11-03", 1625), ("2026-11-10", 1625)]
    assert anon.get(f"{C}/{CODE}").json()["plan"] == plan


def test_plan_tells_the_owner(client):
    client.post(f"{C}/{CODE}/plan", json={"parts": 2, "first_on": "2026-10-16"})
    events = client.get("/api/v1/logs").json()
    note = [e for e in events if e["event"] == "notify" and e["data"]["title"] == "Customer 003 set a payment plan"]
    assert note and note[-1]["data"]["body"] == "BDT 6,500 in 2 weekly parts, starting 16 Oct."
    [row] = [c for c in client.get(f"{P}/customers").json() if c["code"] == CODE]
    assert row["status"] == "planned" and row["plan"]["parts"] == 2


def test_plan_date_and_parts_are_checked(anon):
    assert anon.post(f"{C}/{CODE}/plan", json={"parts": 4, "first_on": "2026-10-15"}).status_code == 422
    assert anon.post(f"{C}/{CODE}/plan", json={"parts": 4, "first_on": "2026-10-31"}).status_code == 422
    assert anon.post(f"{C}/{CODE}/plan", json={"parts": 3, "first_on": "2026-10-20"}).status_code == 422


def test_owner_list_needs_the_pin(anon):
    assert anon.get(f"{P}/customers").status_code == 401


def test_owner_list_matches_patient_dues(client):
    rows = client.get(f"{P}/customers").json()
    assert len(rows) == 6
    assert sum(r["amount"] for r in rows) == client.get(f"{P}/accounts").json()["patient_dues"] == 38000
    assert rows[0]["label"] == "Customer 003"  # oldest debt first
    assert all(r["status"] == "no_plan" for r in rows)


def test_split_gives_the_remainder_to_the_last_part():
    assert split(7001, 4) == [1750, 1750, 1750, 1751]
    assert split(6500, 1) == [6500]
