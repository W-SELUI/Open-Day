from pathlib import Path

import streamlit as st

from career_model import predict_careers
from ollama_explainer import generate_career_explanation


st.set_page_config(page_title="Career Quest", page_icon="🎓")

# Sidebar navigation
option = st.sidebar.selectbox("Choose a module", ["Puzzle", "Career Prediction"])

if option == "Puzzle":
    st.title("Hand-Tracking Puzzle 🧩")
    st.caption(
        "Use two hands to measure the puzzle area. Then pinch and drag "
        "the tiles to solve your camera puzzle."
    )

    puzzle_file = Path(__file__).with_name("Hand Puzzle.html")

    if not puzzle_file.exists():
        st.error("The Hand Puzzle.html file could not be found.")
    else:
        st.iframe(
            puzzle_file,
            height=760,
            tab_index=0,
        )

elif option == "Career Prediction":
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