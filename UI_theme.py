import streamlit as st


def apply_theme():
    st.markdown(
        """
        <style>
        :root {
            --lab-ink: #f7fbff;
            --lab-muted: #aabbd4;
            --lab-cyan: #67e8f9;
            --lab-blue: #3b82f6;
            --lab-violet: #a78bfa;
            --lab-panel: rgba(10, 25, 56, 0.78);
            --lab-line: rgba(148, 163, 184, 0.22);
        }

        [data-testid="stAppViewContainer"] {
            background:
                radial-gradient(circle at 10% 6%, rgba(14, 165, 233, 0.22), transparent 25%),
                radial-gradient(circle at 88% 12%, rgba(139, 92, 246, 0.20), transparent 28%),
                radial-gradient(circle at 53% 88%, rgba(37, 99, 235, 0.15), transparent 30%),
                #030712;
            color: var(--lab-ink);
        }

        [data-testid="stAppViewContainer"]::before {
            position: fixed;
            inset: 0;
            z-index: 0;
            pointer-events: none;
            content: "";
            opacity: 0.32;
            background-image:
                linear-gradient(rgba(103, 232, 249, 0.045) 1px, transparent 1px),
                linear-gradient(90deg, rgba(103, 232, 249, 0.045) 1px, transparent 1px);
            background-size: 38px 38px;
            mask-image: radial-gradient(ellipse at top, black, transparent 72%);
        }

        [data-testid="stHeader"] { background: transparent; }
        [data-testid="stSidebar"] { display: none; }
        #MainMenu, footer { visibility: hidden; }

        .block-container {
            position: relative;
            z-index: 1;
            max-width: 1140px;
            padding-top: 1.35rem;
            padding-bottom: 4rem;
        }

        .hero {
            position: relative;
            overflow: hidden;
            margin: 0.7rem 0 1.25rem;
            padding: clamp(3rem, 7vw, 5.8rem) clamp(1.25rem, 5vw, 4.5rem);
            border: 1px solid rgba(125, 211, 252, 0.24);
            border-radius: 30px;
            background:
                linear-gradient(115deg, rgba(8, 47, 73, 0.69), rgba(15, 23, 42, 0.57) 58%, rgba(49, 46, 129, 0.46));
            box-shadow: 0 28px 75px rgba(0, 0, 0, 0.30), inset 0 1px rgba(255, 255, 255, 0.07);
            text-align: center;
        }

        .hero::before,
        .hero::after {
            position: absolute;
            border: 1px solid rgba(103, 232, 249, 0.23);
            border-radius: 50%;
            content: "";
        }

        .hero::before {
            top: -90px;
            left: -55px;
            width: 230px;
            height: 230px;
            box-shadow: 0 0 70px rgba(34, 211, 238, 0.20);
        }

        .hero::after {
            right: -65px;
            bottom: -115px;
            width: 270px;
            height: 270px;
            border-color: rgba(167, 139, 250, 0.25);
        }

        .eyebrow,
        .hero h1,
        .hero p { position: relative; z-index: 1; }

        .eyebrow {
            margin-bottom: 0.9rem;
            color: var(--lab-cyan);
            font-size: 0.75rem;
            font-weight: 850;
            letter-spacing: 0.18rem;
        }

        .hero h1 {
            margin: 0;
            color: var(--lab-ink);
            font-size: clamp(3rem, 8vw, 5.9rem);
            letter-spacing: -0.065em;
            line-height: 0.90;
            text-shadow: 0 8px 36px rgba(103, 232, 249, 0.14);
        }

        .hero p {
            max-width: 620px;
            margin: 1.35rem auto 0;
            color: #c5d5eb;
            font-size: 1.06rem;
            line-height: 1.72;
        }

        .mode-card {
            position: relative;
            min-height: 252px;
            overflow: hidden;
            padding: 1.85rem;
            border: 1px solid var(--lab-line);
            border-radius: 22px;
            background:
                linear-gradient(145deg, rgba(27, 49, 90, 0.86), rgba(9, 19, 42, 0.82));
            box-shadow: 0 16px 44px rgba(0, 0, 0, 0.24), inset 0 1px rgba(255, 255, 255, 0.045);
            transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }

        .mode-card::after {
            position: absolute;
            right: -38px;
            bottom: -48px;
            width: 130px;
            height: 130px;
            border: 1px solid rgba(103, 232, 249, 0.13);
            border-radius: 50%;
            content: "";
        }

        .mode-card:hover {
            border-color: rgba(103, 232, 249, 0.52);
            box-shadow: 0 23px 54px rgba(0, 0, 0, 0.34), 0 0 0 1px rgba(103, 232, 249, 0.06);
            transform: translateY(-5px);
        }

        .mode-icon {
            display: grid;
            width: 58px;
            height: 58px;
            border: 1px solid rgba(103, 232, 249, 0.28);
            border-radius: 18px;
            background: linear-gradient(145deg, rgba(14, 116, 144, 0.34), rgba(30, 41, 89, 0.52));
            box-shadow: 0 10px 24px rgba(6, 182, 212, 0.10);
            font-size: 2rem;
            place-items: center;
        }

        .mode-card h2 {
            margin: 1.15rem 0 0.55rem;
            color: var(--lab-ink);
            font-size: 1.48rem;
            letter-spacing: -0.025em;
        }

        .mode-card p {
            margin: 0;
            color: var(--lab-muted);
            line-height: 1.62;
        }

        .questpass-card {
            display: grid;
            grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.95fr);
            gap: 1.5rem 2rem;
            align-items: center;
            position: relative;
            overflow: hidden;
            margin: 1.35rem 0 2rem;
            padding: clamp(1.5rem, 4vw, 2.2rem);
            border: 1px solid rgba(103, 232, 249, 0.42);
            border-radius: 24px;
            background:
                radial-gradient(circle at 88% 20%, rgba(139, 92, 246, 0.28), transparent 34%),
                linear-gradient(135deg, rgba(8, 47, 73, 0.92), rgba(30, 41, 88, 0.88));
            box-shadow: 0 24px 62px rgba(0, 0, 0, 0.32), inset 0 1px rgba(255, 255, 255, 0.06);
        }

        .questpass-eyebrow {
            margin: 0 0 0.55rem;
            color: #67e8f9;
            font-size: 0.74rem;
            font-weight: 800;
            letter-spacing: 0.14rem;
        }

        .questpass-copy h2 {
            margin: 0;
            color: var(--lab-ink);
            font-size: clamp(2rem, 5vw, 3rem);
        }

        .questpass-copy p:not(.questpass-eyebrow),
        .questpass-progress-area p {
            margin: 0.65rem 0 0;
            color: #c7d7ee;
            line-height: 1.55;
        }

        .questpass-progress-area {
            padding: 1.15rem;
            border: 1px solid rgba(125, 211, 252, 0.22);
            border-radius: 18px;
            background: rgba(2, 6, 23, 0.46);
        }

        .questpass-count {
            color: #f8fbff;
            font-size: 2.05rem;
            font-weight: 850;
        }

        .questpass-count span {
            color: #a9c2de;
            font-size: 0.95rem;
            font-weight: 700;
        }

        .questpass-track {
            height: 11px;
            overflow: hidden;
            margin-top: 0.7rem;
            border-radius: 999px;
            border: 1px solid rgba(103, 232, 249, 0.10);
            background: rgba(2, 6, 23, 0.74);
        }

        .questpass-track div {
            height: 100%;
            min-width: 0;
            border-radius: inherit;
            background: linear-gradient(90deg, #22d3ee, #3b82f6, #a78bfa);
            box-shadow: 0 0 16px rgba(103, 232, 249, 0.45);
            transition: width 0.35s ease;
        }

        .quest-stamp-row {
            display: flex;
            grid-column: 1 / -1;
            flex-wrap: wrap;
            gap: 0.65rem;
        }

        .quest-stamp {
            display: inline-flex;
            gap: 0.45rem;
            align-items: center;
            padding: 0.6rem 0.8rem;
            border: 1px solid rgba(148, 163, 184, 0.22);
            border-radius: 999px;
            background: rgba(2, 6, 23, 0.32);
            color: #8ba1bf;
            font-size: 0.82rem;
            font-weight: 700;
        }

        .quest-stamp.collected {
            border-color: rgba(103, 232, 249, 0.52);
            background: rgba(8, 145, 178, 0.18);
            color: #e0f7ff;
        }

        .quest-stamp.collected span {
            font-size: 1rem;
        }

        @media (max-width: 700px) {
            .questpass-card {
                grid-template-columns: 1fr;
            }
        }

        .stButton > button {
            width: 100%;
            min-height: 53px;
            margin-top: 0.15rem;
            border: 1px solid rgba(125, 211, 252, 0.62);
            border-radius: 14px;
            background: linear-gradient(120deg, #0e7490, #2563eb 58%, #4f46e5);
            box-shadow: 0 10px 23px rgba(37, 99, 235, 0.20);
            color: white;
            font-weight: 800;
            letter-spacing: 0.01em;
            transition: transform 180ms ease, filter 180ms ease, box-shadow 180ms ease;
        }

        .stButton > button:hover {
            border-color: #cffafe;
            filter: brightness(1.12);
            box-shadow: 0 15px 30px rgba(37, 99, 235, 0.32);
            transform: translateY(-3px);
        }

        div[data-testid="stTextInput"] input,
        div[data-testid="stTextArea"] textarea {
            border: 1px solid rgba(148, 163, 184, 0.34);
            border-radius: 14px;
            background: rgba(7, 16, 37, 0.78);
            color: var(--lab-ink);
            box-shadow: inset 0 1px rgba(255, 255, 255, 0.03);
        }

        div[data-testid="stTextInput"] input:focus,
        div[data-testid="stTextArea"] textarea:focus {
            border-color: var(--lab-cyan);
            box-shadow: 0 0 0 3px rgba(103, 232, 249, 0.12);
        }

        div[data-testid="stMetric"] {
            border: 1px solid rgba(103, 232, 249, 0.25);
            border-radius: 16px;
            background: linear-gradient(145deg, rgba(15, 35, 72, 0.78), rgba(8, 16, 37, 0.76));
            padding: 1rem;
            box-shadow: inset 0 1px rgba(255, 255, 255, 0.04);
        }

        div[data-testid="stMetricLabel"] {
            color: #a5f3fc;
        }

        .small-note {
            color: #7890b3;
            text-align: center;
            margin-top: 2.5rem;
        }

        [data-testid="stCaptionContainer"],
        [data-testid="stMarkdownContainer"] code {
            color: #b9cae2;
        }

        @media (max-width: 700px) {
            .block-container { padding-top: 0.8rem; }
            .hero { border-radius: 23px; }
            .mode-card { min-height: 220px; }
        }

        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after { transition-duration: 0.01ms !important; }
        }
        </style>
        """,
        unsafe_allow_html=True,
    )
