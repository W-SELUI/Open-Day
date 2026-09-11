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

# Hand Puzzle is a complete web build, rather than one self-contained HTML
# file.  Give it its own Streamlit component so it has a single iframe and
# can load its JavaScript modules, MediaPipe files, and model directly.
_hand_puzzle = components.declare_component(
    "hand_puzzle_activity",
    path=str(Path(__file__).with_name("questpass_bridge") / "hand-puzzle"),
)

_gravity_thief = components.declare_component(
    "gravity_thief_activity",
    path=str(Path(__file__).with_name("questpass_bridge") / "gravity-thief"),
)


def render_hand_puzzle_activity(*, key: str):
    """Render Hand Puzzle and return its completion ID, if it is completed."""
    return _hand_puzzle(default=None, key=key)


def render_gravity_thief_activity(*, key: str):
    """Render Gravity Thief and return its back/completion event."""
    return _gravity_thief(default=None, key=key)


def render_questpass_activity(
    html_file: Path | None,
    activity: str,
    *,
    key: str,
    game_url: str | None = None,
):
    """Render a trusted activity and return its completion ID, if any.

    The remaining activities are self-contained HTML files, so the bridge
    safely places their HTML inside one nested game frame.
    """
    if game_url:
        return _bridge(
            activity=activity,
            game_url=game_url,
            default=None,
            key=key,
        )

    if html_file is None:
        raise ValueError("html_file is required when game_url is not provided")

    return _bridge(
        activity=activity,
        game_html=html_file.read_text(encoding="utf-8"),
        default=None,
        key=key,
    )
