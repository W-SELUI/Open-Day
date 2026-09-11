from pathlib import Path

import streamlit as st

from career_model import predict_careers
from ollama_explainer import generate_career_explanation
from questpass_bridge import (
    render_gravity_thief_activity,
    render_hand_puzzle_activity,
    render_questpass_activity,
)
from UI_theme import apply_theme


st.set_page_config(page_title="Career Quest", page_icon="🎓")

apply_theme()

QUEST_STAMPS = {
    "hand_puzzle": ("🧩", "Puzzle Solver"),
    "hand_rush": ("⚡", "Gravity Bender"),
    "career": ("🎓", "Future Explorer"),
    "vibe_link": ("✨", "Vibe Scanner"),
    "vibe_oracle": ("🔮", "Cosmic Forecaster"),
}


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
                    Tell our trained model what you enjoy, then see career
                    matches and an AI-powered explanation.
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
                height: 100vh !important;
                min-height: 100vh !important;
                width: 100vw !important;
                overflow: hidden !important;
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
                height: 100vh !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
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
        completion = render_questpass_activity(
            vibe_oracle_file,
            "vibe_oracle",
            key="vibe_oracle_bridge",
        )
        if completion == "vibe_oracle":
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
                explanation = None

                # Wait for Ollama before rendering any of the final results.
                try:
                    with st.spinner("Analysing your interests..."):
                        explanation = generate_career_explanation(
                            name,
                            subjects,
                            hobbies,
                            predictions,
                        )
                except Exception:
                    explanation = None

                student_name = name.strip()
                heading = (
                    f"{student_name}'s top career matches"
                    if student_name
                    else "Your top career matches"
                )

                st.success(heading)

                columns = st.columns(len(predictions))

                for column, prediction in zip(columns, predictions):
                    with column:
                        st.metric(
                            prediction["career"],
                            f"{prediction['score']}% match",
                        )

                recognized = ", ".join(result["recognized_terms"])
                st.caption(
                    f"Words recognised from your answer: {recognized}."
                )

                top_evidence = predictions[0]["evidence"]

                if top_evidence:
                    st.caption(
                        "Strongest model evidence: "
                        + ", ".join(top_evidence)
                        + "."
                    )

                st.caption(
                    "These are interest-based suggestions from this project's "
                    "training data, not a decision about your future."
                )

                if explanation:
                    st.subheader("Why this may suit you")
                    st.write(explanation)
                else:
                    st.info(
                        "Your model result is ready, but the local Ollama "
                        "explanation service is unavailable right now."
                    )

                if "career" not in st.session_state.quest_stamps:
                    award_questpass_stamp("career")
                    st.toast("QuestPass stamp collected: Future Explorer!", icon="✅")
