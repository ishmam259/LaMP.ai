"""PDF uploads in Scan: each page becomes a photo-sized image (no OpenAI; replay mode)."""

import io

import pytest
from PIL import Image

from app.agents import llm

P = "/api/v1/pharmacies/green-life"


@pytest.fixture(autouse=True)
def replay(monkeypatch):
    monkeypatch.setattr(llm.settings, "llm_mode", "replay")


def make_pdf(pages: int, size=(1240, 1754)) -> bytes:
    """An A4-shaped PDF (150 dpi) with `pages` blank pages."""
    ims = [Image.new("RGB", size, "white") for _ in range(pages)]
    out = io.BytesIO()
    ims[0].save(out, format="PDF", save_all=True, append_images=ims[1:], resolution=150)
    return out.getvalue()


def test_pdf_pages_are_photo_sized_and_capped():
    pages = llm.pdf_pages(make_pdf(5))
    assert len(pages) == llm.MAX_PDF_PAGES
    for p in pages:
        with Image.open(io.BytesIO(p)) as im:
            assert im.format == "JPEG" and max(im.size) <= llm.MAX_SIDE


def test_is_pdf():
    assert llm.is_pdf(make_pdf(1))
    assert not llm.is_pdf(b"\xff\xd8\xff\xe0 a jpeg")


def test_several_pages_make_their_own_replay_key():
    one, two = llm.pdf_pages(make_pdf(2))
    k1 = llm.cache_key("m", "v", "t", one)
    assert k1 == llm.cache_key("m", "v", "t", [one])  # one page keys like a photo
    assert llm.cache_key("m", "v", "t", [one, two]) != k1


def test_pdf_upload_gives_a_draft_to_check(client):
    r = client.post(f"{P}/captures", files={"file": ("bill.pdf", make_pdf(2), "application/pdf")},
                    data={"kind": "invoice"})
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "needs_review"


def test_broken_pdf_is_refused_plainly(client):
    r = client.post(f"{P}/captures", files={"file": ("bill.pdf", b"%PDF-1.7 not really a pdf", "application/pdf")},
                    data={"kind": "invoice"})
    assert r.status_code == 400
    assert "couldn't open this PDF" in r.json()["detail"]
