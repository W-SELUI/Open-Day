import streamlit as st


def apply_theme():
    st.markdown(
        """
        <style>
        [data-testid="stAppViewContainer"] {
            background:
                radial-gradient(circle at 15% 10%, rgba(59, 130, 246, 0.25), transparent 30%),
                radial-gradient(circle at 85% 20%, rgba(139, 92, 246, 0.18), transparent 28%),
                #050816;
            color: #e5eefc;
        }

        [data-testid="stHeader"] {
            background: transparent;
        }

        [data-testid="stSidebar"] {
            display: none;
        }

        #MainMenu,
        footer {
            visibility: hidden;
        }

        .block-container {
            max-width: 1100px;
            padding-top: 2rem;
            padding-bottom: 3rem;
        }

        .hero {
            text-align: center;
            padding: 4rem 1rem 2.5rem;
        }

        .eyebrow {
            color: #67e8f9;
            font-size: 0.8rem;
            font-weight: 700;
            letter-spacing: 0.16rem;
            margin-bottom: 1rem;
        }

        .hero h1 {
            color: #f8fbff;
            font-size: clamp(2.8rem, 8vw, 5.5rem);
            line-height: 0.95;
            margin: 0;
        }

        .hero p {
            color: #a9b8d4;
            font-size: 1.1rem;
            line-height: 1.7;
            max-width: 620px;
            margin: 1.5rem auto 0;
        }

        .mode-card {
            min-height: 255px;
            padding: 2rem;
            border: 1px solid rgba(148, 163, 184, 0.22);
            border-radius: 22px;
            background: linear-gradient(
                145deg,
                rgba(30, 41, 59, 0.92),
                rgba(15, 23, 42, 0.78)
            );
            box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
        }

        .mode-icon {
            font-size: 3rem;
        }

        .mode-card h2 {
            color: #f8fbff;
            margin: 1rem 0 0.6rem;
        }

        .mode-card p {
            color: #a9b8d4;
            line-height: 1.6;
        }

        .stButton > button {
            width: 100%;
            min-height: 50px;
            border: 1px solid rgba(103, 232, 249, 0.65);
            border-radius: 12px;
            background: linear-gradient(135deg, #0e7490, #2563eb);
            color: white;
            font-weight: 700;
            transition: 0.2s ease;
        }

        .stButton > button:hover {
            border-color: #a5f3fc;
            background: linear-gradient(135deg, #0891b2, #4f46e5);
            transform: translateY(-2px);
        }

        div[data-testid="stTextInput"] input,
        div[data-testid="stTextArea"] textarea {
            border: 1px solid rgba(148, 163, 184, 0.35);
            border-radius: 12px;
            background: rgba(15, 23, 42, 0.82);
            color: #f8fbff;
        }

        div[data-testid="stMetric"] {
            border: 1px solid rgba(103, 232, 249, 0.25);
            border-radius: 14px;
            background: rgba(15, 23, 42, 0.7);
            padding: 1rem;
        }

        div[data-testid="stMetricLabel"] {
            color: #a5f3fc;
        }

        .small-note {
            color: #7184a8;
            text-align: center;
            margin-top: 2.5rem;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )