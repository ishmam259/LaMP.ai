"""Customer cards: a patient sees what they owe the pharmacy and picks a way to pay it back.

The customer opens /me/<code>. The code is the only key, so the card carries amounts only:
the pharmacy's alias for the customer, never a name or a medicine. A plan is a promise, not a
payment: no money moves until the customer pays at the counter.
"""

import math
import re
from datetime import date, timedelta

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import models as m
from app.schemas import PatientCardOut, PatientDueOut, PatientPlan, PlanOption, PlanPart

from .common import as_of, get_pharmacy, r2
from .logbus import log, notify

PLAN_PARTS = (1, 2, 4)
PART_GAP_DAYS = 7          # the parts of a plan fall due a week apart
FIRST_PART_WITHIN_DAYS = 14  # the first part must fall within two weeks of the pharmacy's today


def _bdt(x: float) -> str:
    return f"BDT {x:,.0f}"


def normalize_code(raw: str) -> str:
    """'gl7kqm4xpa', 'GL 7KQM 4XPA' and 'GL-7KQM-4XPA' are the same code."""
    s = re.sub(r"[^A-Z0-9]", "", raw.upper())
    return f"{s[:2]}-{s[2:6]}-{s[6:]}" if len(s) == 10 else s


def split(amount: float, parts: int) -> list[float]:
    """Equal whole-taka parts; the last part takes the remainder. 6,500 in 4 → 1,625 × 4."""
    base = math.floor(amount / parts)
    return [float(base)] * (parts - 1) + [r2(amount - base * (parts - 1))]


def schedule(amount: float, parts: int, first_on: date) -> list[PlanPart]:
    return [PlanPart(n=i + 1, due_on=first_on + timedelta(days=PART_GAP_DAYS * i), amount=a)
            for i, a in enumerate(split(amount, parts))]


def _plan(d: m.PatientDue) -> PatientPlan | None:
    if d.plan_parts is None or d.plan_first_on is None:
        return None
    return PatientPlan(parts=d.plan_parts, first_on=d.plan_first_on,
                       schedule=schedule(d.amount, d.plan_parts, d.plan_first_on))


def _by_code(db: Session, code: str) -> m.PatientDue:
    d = db.scalar(select(m.PatientDue).where(m.PatientDue.code == normalize_code(code)))
    if d is None:
        raise HTTPException(404, "No card with that code. Check the code on your slip from the pharmacy.")
    return d


def get_card(db: Session, code: str) -> PatientCardOut:
    d = _by_code(db, code)
    ph = get_pharmacy(db, d.pharmacy_id)
    today = as_of(ph)
    return PatientCardOut(
        pharmacy_name=ph.name, city=ph.city, label=d.label, amount=r2(d.amount), since=d.since,
        days_outstanding=(today - d.since).days, as_of=today,
        latest_first_on=today + timedelta(days=FIRST_PART_WITHIN_DAYS),
        options=[PlanOption(parts=n, part_amount=split(d.amount, n)[0]) for n in PLAN_PARTS],
        plan=_plan(d),
    )


def set_plan(db: Session, code: str, parts: int, first_on: date) -> PatientCardOut:
    """Record the customer's promise and tell the owner. Setting it again replaces it."""
    d = _by_code(db, code)
    today = as_of(get_pharmacy(db, d.pharmacy_id))
    if parts not in PLAN_PARTS:
        raise HTTPException(422, f"Choose {', '.join(map(str, PLAN_PARTS[:-1]))} or {PLAN_PARTS[-1]} parts.")
    if not today <= first_on <= today + timedelta(days=FIRST_PART_WITHIN_DAYS):
        raise HTTPException(422, f"Pick a first payment date within {FIRST_PART_WITHIN_DAYS} days")
    d.plan_parts, d.plan_first_on = parts, first_on
    log("T1", "PATIENT", "plan_set", db, customer=d.label, amount=r2(d.amount), parts=parts, first_on=first_on)
    how = "in one payment" if parts == 1 else f"in {parts} weekly parts"
    notify("owner", f"{d.label} set a payment plan",
           f"{_bdt(d.amount)} {how}, starting {first_on:%d %b}.", link="/customers", db=db)
    db.flush()
    return get_card(db, code)


def list_for_owner(db: Session, pid: str) -> list[PatientDueOut]:
    """Every customer who owes the pharmacy, oldest debt first."""
    today = as_of(get_pharmacy(db, pid))
    rows = db.scalars(select(m.PatientDue).where(m.PatientDue.pharmacy_id == pid)
                      .order_by(m.PatientDue.since, m.PatientDue.label))
    return [PatientDueOut(label=d.label, amount=r2(d.amount), since=d.since, days_outstanding=(today - d.since).days,
                          code=d.code, status="planned" if d.plan_parts else "no_plan", plan=_plan(d))
            for d in rows]
