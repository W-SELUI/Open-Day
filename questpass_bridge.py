"""A tiny Streamlit component used to receive real completion events from games.

The hand and camera activities are HTML pages inside Streamlit. A normal
``st.iframe`` can display those pages, but it cannot pass their completion
state back to Python. This bridge hosts the page and returns a completion ID
only when the page's final result button sends one.
"""

from pathlib import Path

import streamlit.components.v1 as components


_bridge = components.declare_component(
    "questpass_activity_bridge",
    path=str(Path(__file__).with_name("questpass_bridge")),
)


def render_questpass_activity(html_file: Path, activity: str, *, key: str):
    """Render one trusted local activity and return its completion ID, if any."""
    return _bridge(
        activity=activity,
        game_html=html_file.read_text(encoding="utf-8"),
        default=None,
        key=key,
    )
