from pathlib import Path

import streamlit as st

from career_model import predict_careers
from ollama_explainer import generate_career_explanation
from UI_theme import apply_theme


st.set_page_config(page_title="Career Quest", page_icon="🎓")

apply_theme()

if "page" not in st.session_state:
    st.session_state.page = "home"

page = st.session_state.page

if page == "home":
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
                <h2>Hand Rush</h2>
                <p>
                    Pinch glowing targets as quickly as you can before the
                    30-second timer ends.
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        if st.button("Play Hand Rush", key="open_hand_rush"):
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

    puzzle_file = Path(__file__).with_name("Hand Puzzle.html")

    if not puzzle_file.exists():
        st.error("The Hand Puzzle.html file could not be found.")
    else:
        st.iframe(
            puzzle_file,
            height="stretch",
            tab_index=0,
        )

elif page == "hand_rush":
    # Hand Rush is another kiosk-style camera game, so it gets the same
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

    hand_rush_file = Path(__file__).with_name("Hand Rush.html")

    if not hand_rush_file.exists():
        st.error("The Hand Rush.html file could not be found.")
    else:
        st.iframe(
            hand_rush_file,
            height="stretch",
            tab_index=0,
        )

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
        st.iframe(
            vibe_link_file,
            height="stretch",
            tab_index=0,
        )

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
