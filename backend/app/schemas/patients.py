from typing import Literal

from .common import ISODate, Model

PlanParts = Literal[1, 2, 4]


class PlanPart(Model):
    n: int
    due_on: ISODate
    amount: float


class PatientPlan(Model):
    parts: PlanParts
    first_on: ISODate
    schedule: list[PlanPart]


class PlanOption(Model):
    parts: PlanParts
    part_amount: float  # the first part; the last one takes any remainder


class PatientCardOut(Model):
    """What one customer sees on their own card. Amounts only: no names, no medicines."""

    pharmacy_name: str
    city: str
    label: str
    amount: float
    since: ISODate
    days_outstanding: int
    as_of: ISODate
    latest_first_on: ISODate
    options: list[PlanOption]
    plan: PatientPlan | None


class PatientPlanIn(Model):
    parts: PlanParts
    first_on: ISODate


class PatientDueOut(Model):
    """One row of the owner's list of customers who owe the pharmacy."""

    label: str
    amount: float
    since: ISODate
    days_outstanding: int
    code: str
    status: Literal["planned", "no_plan"]
    plan: PatientPlan | None
