"""Shared test setup.

Tests run with DEV_MODE on (demo controls and the dev registry key); the test for
DEV_MODE off switches it off itself. Crash-alert email is off: tests never call Brevo.
The owner PIN is on, so the PIN tests run; tests/api/test_no_pin.py switches it off.
"""

import os

os.environ.setdefault("DEV_MODE", "true")
os.environ["BREVO_API_KEY"] = ""
os.environ["ASK_OWNER_PIN"] = "true"
