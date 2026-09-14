from pathlib import Path
from html import escape
import time

import streamlit as st

from career_model import predict_careers
from questpass_bridge import (
    render_gravity_thief_activity,
    render_hand_puzzle_activity,
    render_questpass_activity,
)
from UI_theme import apply_theme


st.set_page_config(page_title="Career Quest", page_icon="🎓")

apply_theme()

_vibe_oracle_completion_listener = st.components.v2.component(
    "vibe_oracle_completion_listener",
    js="""
const listeners = new WeakMap();

export default function(component) {
  const { data, parentElement, setTriggerValue } = component;
  const activity = data?.activity || "";
  const previous = listeners.get(parentElement);

  if (previous) {
    window.removeEventListener("message", previous);
  }

  const onMessage = (event) => {
    const message = event.data;

    if (
      message &&
      message.type === "questpass:completed" &&
      message.activity === activity
    ) {
      setTriggerValue("completed", activity);
    }
  };

  listeners.set(parentElement, onMessage);
  window.addEventListener("message", onMessage);

  return () => {
    window.removeEventListener("message", onMessage);
    listeners.delete(parentElement);
  };
}
""",
)

QUEST_STAMPS = {
    "hand_puzzle": ("🧩", "Puzzle Solver"),
    "hand_rush": ("⚡", "Gravity Bender"),
    "career": ("🎓", "Future Explorer"),
    "vibe_link": ("✨", "Vibe Scanner"),
    "vibe_oracle": ("🔮", "Cosmic Forecaster"),
}

CAREER_SCAN_STEPS = (
    (12, "Powering up the career scanner..."),
    (29, "Reading subject energy..."),
    (46, "Checking interest patterns..."),
    (64, "Comparing 45 possible paths..."),
    (82, "Locking onto your strongest match..."),
    (100, "Prediction ready."),
)

CAREER_CLUE_STOP_WORDS = {
    "and",
    "are",
    "for",
    "how",
    "the",
    "to",
    "with",
    "your",
}


def render_career_scan() -> None:
    """Show a short theatrical loading moment before revealing predictions."""
    scan_slot = st.empty()
    progress_slot = st.empty()

    with scan_slot.container():
        st.markdown(
            """
            <section class="career-scan-panel">
                <div class="career-scan-orb">🎓</div>
                <div>
                    <p class="career-scan-eyebrow">Career Quest scanner</p>
                    <h3>Building your future signal...</h3>
                    <p>Subjects, hobbies and Open Day chaos are being matched.</p>
                </div>
                <div class="career-scan-beam"></div>
            </section>
            """,
            unsafe_allow_html=True,
        )

    for value, step in CAREER_SCAN_STEPS:
        progress_slot.progress(value, text=step)
        time.sleep(0.28)

    progress_slot.empty()
    scan_slot.empty()


def format_career_clue(clue: str) -> str:
    """Make model clue words look nicer for the visitor."""
    special_words = {
        "ai": "AI",
        "pe": "PE",
        "ui": "UI",
        "ux": "UX",
    }

    return " ".join(
        special_words.get(word, word.capitalize())
        for word in clue.split()
    )


def collect_career_clues(result: dict, predictions: list[dict], limit: int = 5) -> list[str]:
    """Pick a few clean clue words or phrases without showing a technical report."""
    clues = []

    def add_clue(term: str) -> None:
        cleaned = term.strip().lower()

        if (
            not cleaned
            or cleaned in CAREER_CLUE_STOP_WORDS
            or len(cleaned) < 3
            or cleaned in {clue.lower() for clue in clues}
        ):
            return

        clues.append(format_career_clue(cleaned))

    for prediction in predictions:
        for clue in prediction.get("evidence", []):
            add_clue(clue)

            if len(clues) >= limit:
                return clues

    for clue in result.get("recognized_terms", []):
        add_clue(clue)

        if len(clues) >= limit:
            break

    return clues


def render_career_reveal(student_name: str, predictions: list[dict], result: dict) -> None:
    """Render the final Career Quest result as a dramatic prediction card."""
    top_prediction = predictions[0]
    backup_predictions = predictions[1:]
    owner = (
        f"{escape(student_name)}'s strongest career signal"
        if student_name
        else "Your strongest career signal"
    )

    st.markdown(
        f"""
        <section class="career-result-stage">
            <p class="career-result-eyebrow">Prediction unlocked</p>
            <p class="career-result-owner">{owner}</p>
            <h2>{escape(top_prediction["career"])}</h2>
            <div class="career-match-score">
                <strong>{top_prediction["score"]}</strong>
                <span>% match</span>
            </div>
            <p class="career-result-tagline">
                Career Quest found this as your strongest match from the training data.
            </p>
        </section>
        """,
        unsafe_allow_html=True,
    )

    if backup_predictions:
        st.markdown(
            '<p class="career-backup-title">Also detected in your future timeline</p>',
            unsafe_allow_html=True,
        )

        columns = st.columns(len(backup_predictions), gap="medium")

        for rank, column, prediction in zip(
            range(2, len(backup_predictions) + 2),
            columns,
            backup_predictions,
        ):
            with column:
                st.markdown(
                    f"""
                    <div class="career-path-card">
                        <span>Option {rank}</span>
                        <h3>{escape(prediction["career"])}</h3>
                        <p>{prediction["score"]}% match</p>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

    clues = collect_career_clues(result, predictions)

    if clues:
        clue_markup = "".join(
            f"<span>{escape(clue)}</span>"
            for clue in clues
        )
        st.markdown(
            f"""
            <div class="career-clue-card">
                <p>Clues caught by the scanner</p>
                <div>{clue_markup}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.caption(
        "These are interest-based suggestions from this project's training data, "
        "not a decision about your future."
    )


def award_questpass_stamp(activity: str) -> None:
    """Record one genuinely completed experience for this browser session."""
    st.session_state.quest_stamps.add(activity)
    st.session_state.quest_pass_notice = QUEST_STAMPS[activity][1]

if "page" not in st.session_state:
    st.session_state.page = "home"

if "quest_stamps" not in st.session_state:
    st.session_state.quest_stamps = set()

page = st.session_state.page

if page == "home":
    if "quest_pass_notice" in st.session_state:
        st.toast(
            f"QuestPass stamp collected: {st.session_state.quest_pass_notice}!",
            icon="✅",
        )
        del st.session_state.quest_pass_notice

    st.markdown(
        """
        <section class="hero">
            <div class="eyebrow">OPEN DAY · AI EXPERIENCE</div>
            <h1>Discover how you think.</h1>
            <p>
                Try a hands-on puzzle challenge or explore career paths
                with a machine-learning model built for this project.
            </p>
        </section>
        """,
        unsafe_allow_html=True,
    )

    # QuestPass is a visible progress board, not a sixth activity. Visitors
    # can see their stamp hunt before choosing what to try next.
    stamp_count = len(st.session_state.quest_stamps)
    total_stamps = len(QUEST_STAMPS)
    progress_percent = round((stamp_count / total_stamps) * 100)
    stamp_markup = "".join(
        (
            f'<div class="quest-stamp collected"><span>{icon}</span>{title}</div>'
            if activity in st.session_state.quest_stamps
            else f'<div class="quest-stamp"><span>○</span>{title}</div>'
        )
        for activity, (icon, title) in QUEST_STAMPS.items()
    )

    if stamp_count >= 5:
        quest_message = "Full collection unlocked: Master of Open Day Chaos."
    elif stamp_count >= 3:
        quest_message = "Explorer title unlocked: Certified Open Day Chaos Engineer."
    else:
        stamps_needed = 3 - stamp_count
        quest_message = (
            f"Collect {stamps_needed} more stamp{'s' if stamps_needed != 1 else ''} "
            "to unlock your Explorer title."
        )

    st.markdown(
        f"""
        <section class="questpass-card">
            <div class="questpass-copy">
                <p class="questpass-eyebrow">OPEN DAY AI LAB PASSPORT</p>
                <h2>QuestPass</h2>
                <p>Try the experiences, collect stamps, and unlock a completely unnecessary title.</p>
            </div>
            <div class="questpass-progress-area">
                <div class="questpass-count">{stamp_count} <span>/ {total_stamps} stamps</span></div>
                <div class="questpass-track"><div style="width: {progress_percent}%"></div></div>
                <p>{quest_message}</p>
            </div>
            <div class="quest-stamp-row">{stamp_markup}</div>
        </section>
        """,
        unsafe_allow_html=True,
    )

    puzzle_column, rush_column = st.columns(2, gap="large")

    with puzzle_column:
        st.markdown(
            """
            <div class="mode-card">
                <div class="mode-icon">🧩</div>
                <h2>Hand Puzzle</h2>
                <p>
                    Use hand tracking and pinching gestures to solve a
                    live camera puzzle.
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        if st.button("Play the Hand Puzzle", key="open_puzzle"):
            st.session_state.page = "puzzle"
            st.rerun()

    with rush_column:
        st.markdown(
            """
            <div class="mode-card">
                <div class="mode-icon">⚡</div>
                <h2>Gravity Thief</h2>
                <p>
                    Use a hand-controlled gravity field to guide a stolen core
                    past security lasers and into the portal.
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        if st.button("Play Gravity Thief", key="open_hand_rush"):
            st.session_state.page = "hand_rush"
            st.rerun()

    career_column, vibe_link_column = st.columns(2, gap="large")

    with career_column:
        st.markdown(
            """
            <div class="mode-card">
                <div class="mode-icon">🎓</div>
                <h2>Career Quest</h2>
                <p>
                    Tell our trained model what you enjoy, then see simple
                    career matches from this project's training data.
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        if st.button("Explore Career Quest", key="open_career"):
            st.session_state.page = "career"
            st.rerun()

    with vibe_link_column:
        st.markdown(
            """
            <div class="mode-card">
                <div class="mode-icon">✨</div>
                <h2>VibeLink</h2>
                <p>
                    Take two temporary photos, answer quick questions, then
                    reveal a playful Open Day vibe match.
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        if st.button("Start VibeLink", key="open_vibe_link"):
            st.session_state.page = "vibe_link"
            st.rerun()

    oracle_column, _ = st.columns(2, gap="large")

    with oracle_column:
        st.markdown(
            """
            <div class="mode-card">
                <div class="mode-icon">🔮</div>
                <h2>Vibe Oracle</h2>
                <p>
                    Your future just texted. Create two profile cards,
                    watch a fictional chat unfold, and choose how it ends.
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        if st.button("Ask the Vibe Oracle", key="open_vibe_oracle"):
            st.session_state.page = "vibe_oracle"
            st.rerun()

    st.markdown(
        '<p class="small-note">Built for Open Day · Your answers stay in this session.</p>',
        unsafe_allow_html=True,
    )

elif page == "puzzle":
    # This route is intentionally a kiosk-style game screen. These rules are
    # added only while the puzzle is open, so the home and career pages keep
    # their normal Streamlit layout.
    st.markdown(
        """
        <style>
            header[data-testid="stHeader"] {
                display: none;
            }

            html,
            body,
            [data-testid="stAppViewContainer"],
            [data-testid="stMain"],
            .stMain,
            [data-testid="stAppViewContainer"] .main,
            section.main {
                min-height: 100vh !important;
                width: 100vw !important;
                height: auto !important;
                overflow-x: hidden !important;
                overflow-y: auto !important;
            }

            /* Overrides the 1100px max-width used by the normal app theme. */
            [data-testid="stMainBlockContainer"],
            .stMainBlockContainer,
            section.main > div.block-container,
            .block-container {
                max-width: none !important;
                width: 100vw !important;
                min-width: 100vw !important;
                min-height: 100vh !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
            }

            /* The only Streamlit button on this route floats over the game. */
            .st-key-back_from_puzzle,
            div[data-testid="stButton"] {
                position: fixed;
                top: 14px;
                left: 14px;
                z-index: 1000000;
                width: auto !important;
            }

            .st-key-back_from_puzzle button,
            div[data-testid="stButton"] > button {
                width: auto !important;
                border-radius: 999px !important;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25) !important;
            }

            /* Pin the game itself to the entire viewport, independent of
               Streamlit's normal content-column layout. */
            [data-testid="stIFrame"],
            [data-testid="stIFrame"] iframe,
            [data-testid="stCustomComponentV1"],
            [data-testid="stCustomComponentV1"] iframe,
            iframe[title="st.iframe"] {
                position: relative !important;
                inset: auto !important;
                z-index: 0 !important;
                display: block !important;
                width: 100vw !important;
                min-width: 100vw !important;
                min-height: 100vh !important;
                margin: 0 !important;
                border: 0 !important;
            }
        </style>
        """,
        unsafe_allow_html=True,
    )

    if st.button("← Back to AI Lab", key="back_from_puzzle"):
        st.session_state.page = "home"
        st.rerun()

    puzzle_build = Path(__file__).with_name("questpass_bridge") / "hand-puzzle" / "index.html"

    if not puzzle_build.exists():
        st.error("The Hand Puzzle game build could not be found.")
    else:
        completion = render_hand_puzzle_activity(key="hand_puzzle_component")
        if completion == "hand_puzzle":
            award_questpass_stamp("hand_puzzle")
            st.session_state.page = "home"
            st.rerun()

elif page == "hand_rush":
    # Gravity Thief is a kiosk-style camera game, so it gets the same
    # full-screen treatment as the Hand Puzzle.
    st.markdown(
        """
        <style>
            header[data-testid="stHeader"] {
                display: none;
            }

            html,
            body,
            [data-testid="stAppViewContainer"],
            [data-testid="stMain"],
            .stMain,
            [data-testid="stAppViewContainer"] .main,
            section.main {
                min-height: 100vh !important;
                width: 100vw !important;
                height: auto !important;
                overflow-x: hidden !important;
                overflow-y: auto !important;
            }

            [data-testid="stMainBlockContainer"],
            .stMainBlockContainer,
            section.main > div.block-container,
            .block-container {
                max-width: none !important;
                width: 100vw !important;
                min-width: 100vw !important;
                min-height: 100vh !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
            }

            .st-key-back_from_hand_rush,
            div[data-testid="stButton"] {
                position: fixed;
                top: 14px;
                left: 14px;
                z-index: 1000000;
                width: auto !important;
            }

            .st-key-back_from_hand_rush button,
            div[data-testid="stButton"] > button {
                width: auto !important;
                border-radius: 999px !important;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25) !important;
            }

            [data-testid="stIFrame"],
            [data-testid="stIFrame"] iframe,
            [data-testid="stCustomComponentV1"],
            [data-testid="stCustomComponentV1"] iframe,
            iframe[title="st.iframe"] {
                position: relative !important;
                inset: auto !important;
                z-index: 0 !important;
                display: block !important;
                width: 100vw !important;
                min-width: 100vw !important;
                min-height: 100vh !important;
                margin: 0 !important;
                border: 0 !important;
            }
        </style>
        """,
        unsafe_allow_html=True,
    )

    if st.button("← Back to AI Lab", key="back_from_hand_rush"):
        st.session_state.page = "home"
        st.rerun()

    gravity_thief_build = Path(__file__).with_name("questpass_bridge") / "gravity-thief" / "index.html"

    if not gravity_thief_build.exists():
        st.error("The Gravity Thief game build could not be found.")
    else:
        completion = render_gravity_thief_activity(key="gravity_thief_component")
        if completion == {"action": "completed"}:
            award_questpass_stamp("hand_rush")
            st.session_state.page = "home"
            st.rerun()
        if completion == {"action": "back"}:
            st.session_state.page = "home"
            st.rerun()

elif page == "vibe_link":
    # VibeLink is a full-screen camera experience, just like the two games.
    st.markdown(
        """
        <style>
            header[data-testid="stHeader"] {
                display: none;
            }

            html,
            body,
            [data-testid="stAppViewContainer"],
            [data-testid="stMain"],
            .stMain,
            [data-testid="stAppViewContainer"] .main,
            section.main {
                height: 100vh !important;
                min-height: 100vh !important;
                width: 100vw !important;
                overflow: hidden !important;
            }

            [data-testid="stMainBlockContainer"],
            .stMainBlockContainer,
            section.main > div.block-container,
            .block-container {
                max-width: none !important;
                width: 100vw !important;
                min-width: 100vw !important;
                min-height: 100vh !important;
                height: 100vh !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
            }

            .st-key-back_from_vibe_link,
            div[data-testid="stButton"] {
                position: fixed;
                top: 14px;
                left: 14px;
                z-index: 1000000;
                width: auto !important;
            }

            .st-key-back_from_vibe_link button,
            div[data-testid="stButton"] > button {
                width: auto !important;
                border-radius: 999px !important;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25) !important;
            }

            [data-testid="stIFrame"],
            [data-testid="stIFrame"] iframe,
            [data-testid="stCustomComponentV1"],
            [data-testid="stCustomComponentV1"] iframe,
            iframe[title="st.iframe"] {
                position: fixed !important;
                inset: 0 !important;
                z-index: 0 !important;
                display: block !important;
                width: 100vw !important;
                min-width: 100vw !important;
                height: 100vh !important;
                margin: 0 !important;
                border: 0 !important;
            }
        </style>
        """,
        unsafe_allow_html=True,
    )

    if st.button("← Back to AI Lab", key="back_from_vibe_link"):
        st.session_state.page = "home"
        st.rerun()

    vibe_link_file = Path(__file__).with_name("VibeLink.html")

    if not vibe_link_file.exists():
        st.error("The VibeLink.html file could not be found.")
    else:
        completion = render_questpass_activity(
            vibe_link_file,
            "vibe_link",
            key="vibe_link_bridge",
        )
        if completion == "vibe_link":
            award_questpass_stamp("vibe_link")
            st.session_state.page = "home"
            st.rerun()

elif page == "vibe_oracle":
    # The Oracle is a standalone full-screen camera experience. Its temporary
    # profile photos and random forecast live only inside this iframe session.
    st.markdown(
        """
        <style>
            header[data-testid="stHeader"] {
                display: none;
            }

            html,
            body,
            [data-testid="stAppViewContainer"],
            [data-testid="stMain"],
            .stMain,
            [data-testid="stAppViewContainer"] .main,
            section.main {
                height: 100vh !important;
                min-height: 100vh !important;
                width: 100vw !important;
                overflow: hidden !important;
            }

            [data-testid="stMainBlockContainer"],
            .stMainBlockContainer,
            section.main > div.block-container,
            .block-container {
                max-width: none !important;
                width: 100vw !important;
                min-width: 100vw !important;
                min-height: 100vh !important;
                height: 100vh !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
            }

            .st-key-back_from_vibe_oracle,
            div[data-testid="stButton"] {
                position: fixed;
                top: 14px;
                left: 14px;
                z-index: 1000000;
                width: auto !important;
            }

            .st-key-back_from_vibe_oracle button,
            div[data-testid="stButton"] > button {
                width: auto !important;
                border-radius: 999px !important;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25) !important;
            }

            [data-testid="stIFrame"],
            [data-testid="stIFrame"] iframe,
            [data-testid="stCustomComponentV1"],
            [data-testid="stCustomComponentV1"] iframe,
            iframe[title="st.iframe"] {
                position: fixed !important;
                inset: 0 !important;
                z-index: 0 !important;
                display: block !important;
                width: 100vw !important;
                min-width: 100vw !important;
                height: 100vh !important;
                margin: 0 !important;
                border: 0 !important;
            }
        </style>
        """,
        unsafe_allow_html=True,
    )

    if st.button("← Back to AI Lab", key="back_from_vibe_oracle"):
        st.session_state.page = "home"
        st.rerun()

    vibe_oracle_file = Path(__file__).with_name("Vibe Oracle.html")

    if not vibe_oracle_file.exists():
        st.error("The Vibe Oracle.html file could not be found.")
    else:
        st.iframe(vibe_oracle_file, height=760, width="stretch")
        completion = _vibe_oracle_completion_listener(
            data={"activity": "vibe_oracle"},
            default=None,
            height=1,
            key="vibe_oracle_completion_listener",
            on_completed_change=lambda: None,
        )
        if completion.completed == "vibe_oracle":
            award_questpass_stamp("vibe_oracle")
            st.session_state.page = "home"
            st.rerun()

elif page == "career":

    if st.button("← Back to AI Lab", key="back_from_career"):
        st.session_state.page = "home"
        st.rerun()

    st.title("Career Quest 🎓")
    st.write("Tell us about the subjects and activities you enjoy. Use your own words.")

    name = st.text_input("What is your name?", placeholder="e.g. Mary")
    subjects = st.text_area(
        "Which subjects do you enjoy?",
        placeholder="e.g. Chemistry, Biology, Maths",
    )
    hobbies = st.text_area(
        "What do you enjoy doing outside class?",
        placeholder="e.g. Adventure, reading about nature, doing experiments",
    )

    if st.button("Explore careers"):
        if not subjects.strip() and not hobbies.strip():
            st.warning("Tell us about at least one subject or activity first.")
        else:
            result = predict_careers(subjects, hobbies)
            predictions = result["predictions"]

            if not predictions:
                st.info(
                    "I could not find a strong connection to the current training "
                    "data yet. Add a little more detail about subjects or activities "
                    "you enjoy and try again."
                )

            else:
                student_name = name.strip()
                render_career_scan()
                render_career_reveal(student_name, predictions, result)

                if "career" not in st.session_state.quest_stamps:
                    award_questpass_stamp("career")
                    st.toast("QuestPass stamp collected: Future Explorer!", icon="✅")
