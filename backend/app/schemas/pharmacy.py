from .common import ISODate, Model


class PharmacySettings(Model):
    gross_margin_pct: float
    cash_buffer: float
    expiry_buffer_days: int
    as_of_date: ISODate


class PharmacyOut(Model):
    id: str
    name: str
    city: str
    settings: PharmacySettings
    asks_pin: bool = False  # the app asks the owner PIN (ASK_OWNER_PIN)
