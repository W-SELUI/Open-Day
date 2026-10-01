"""Career Quest's inline, browser-rendered reveal. No popups or dependencies."""
from pathlib import Path

from career_cards import build_reveal_payload

_ASSETS = Path(__file__).parent / "static" / "career-quest"
REVEAL_ASSETS = dict(
    html='<div class="cq-root"></div>\n',
    css=_ASSETS.joinpath("reveal.css").read_text(encoding="utf-8"),
    js=_ASSETS.joinpath("reveal.js").read_text(encoding="utf-8"),
    isolate_styles=True,
)


def render_future_reveal(predictions, *, renderer, nickname="", choices=(), reveal_id="", animate=False):
    if not predictions:
        return
    payload = build_reveal_payload(predictions, nickname, choices, reveal_id)
    payload["animate"] = bool(animate)
    renderer(
        key="career_future_reveal",
        data=payload,
    )
