from pathlib import Path
from html import escape
from uuid import uuid4

import streamlit as st

from career_model import EXCLUDED_CAREERS, predict_careers
from career_cards import career_card
from career_reveal import REVEAL_ASSETS, render_future_reveal
from career_inputs import (
    COMMON_INTERESTS,
    COMMON_SUBJECTS,
    MORE_INTERESTS,
    MORE_SUBJECTS,
    build_career_answers,
)
from questpass_bridge import (
    render_gravity_thief_activity,
    render_hand_puzzle_activity,
    render_questpass_activity,
)
from UI_theme import apply_theme


st.set_page_config(page_title="NeuroVerse", page_icon="🧠")

apply_theme()

# Register in the app runtime (also works when AppTest creates a fresh runtime).
_career_future_reveal = st.components.v2.component(
    "neuroverse_career_reveal", **REVEAL_ASSETS,
)

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

_career_voice_input = st.components.v2.component(
    "career_voice_input",
    html="""
<section class="voice-card">
  <div class="voice-copy">
    <p>Optional voice mode</p>
    <h3>Got something else in mind?</h3>
    <span>Say your subjects or interests. They’ll be added alongside your tapped choices.</span>
  </div>
  <div class="voice-actions">
    <button id="subjectsBtn" type="button">🎙️ Speak subjects</button>
    <button id="hobbiesBtn" type="button">🎙️ Speak interests</button>
    <button id="stopBtn" type="button">Stop</button>
  </div>
  <div id="voiceStatus" class="voice-status">Optional: speak or type below. Your choices stay selected.</div>
</section>
""",
    css="""
:host {
  display: block;
  color: var(--st-text-color, #f7fbff);
  font-family: var(--st-font, Inter, system-ui, sans-serif);
}

.voice-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
  overflow: hidden;
  margin: 0.5rem 0 1rem;
  padding: 1rem;
  border: 1px solid rgba(103, 232, 249, 0.30);
  border-radius: 20px;
  background:
    radial-gradient(circle at 90% 12%, rgba(167, 139, 250, 0.22), transparent 32%),
    linear-gradient(135deg, rgba(8, 47, 73, 0.74), rgba(15, 23, 42, 0.78));
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.055), 0 18px 44px rgba(0, 0, 0, 0.20);
}

.voice-card::before {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: "";
  background: linear-gradient(90deg, transparent, rgba(103, 232, 249, 0.10), transparent);
  transform: translateX(-100%);
  animation: shimmer 3s ease-in-out infinite;
}

.voice-copy,
.voice-actions,
.voice-status {
  position: relative;
  z-index: 1;
}

.voice-copy p {
  margin: 0 0 0.3rem;
  color: #9be9ff;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.14rem;
  text-transform: uppercase;
}

.voice-copy h3 {
  margin: 0;
  color: #f8fbff;
  font-size: 1.35rem;
  letter-spacing: -0.035em;
}

.voice-copy span,
.voice-status {
  display: block;
  margin-top: 0.35rem;
  color: #b7c7df;
  font-size: 0.88rem;
  line-height: 1.5;
}

.voice-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
}

button {
  min-height: 42px;
  padding: 0.6rem 0.85rem;
  border: 1px solid rgba(125, 211, 252, 0.44);
  border-radius: 999px;
  background: rgba(15, 35, 72, 0.72);
  color: #f8fbff;
  cursor: pointer;
  font: inherit;
  font-weight: 850;
  transition: transform 160ms ease, border-color 160ms ease, filter 160ms ease;
}

button:hover:not(:disabled) {
  border-color: #cffafe;
  filter: brightness(1.12);
  transform: translateY(-2px);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

#subjectsBtn,
#hobbiesBtn {
  background: linear-gradient(120deg, #0e7490, #2563eb 58%, #4f46e5);
  box-shadow: 0 10px 23px rgba(37, 99, 235, 0.18);
}

#stopBtn {
  background: rgba(2, 6, 23, 0.42);
}

.voice-status {
  grid-column: 1 / -1;
  margin-top: 0;
  padding-top: 0.8rem;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
}

.voice-status.listening {
  color: #d9ff99;
}

.voice-status.error {
  color: #fecaca;
}

@keyframes shimmer {
  0%, 45% { transform: translateX(-100%); opacity: 0; }
  65% { opacity: 1; }
  100% { transform: translateX(100%); opacity: 0; }
}

@media (max-width: 720px) {
  .voice-card {
    grid-template-columns: 1fr;
  }

  .voice-actions {
    justify-content: flex-start;
  }
}
""",
    js="""
const activeRecognitions = new WeakMap();

export default function(component) {
  const { data, parentElement, setTriggerValue } = component;
  const subjectsBtn = parentElement.querySelector("#subjectsBtn");
  const hobbiesBtn = parentElement.querySelector("#hobbiesBtn");
  const stopBtn = parentElement.querySelector("#stopBtn");
  const status = parentElement.querySelector("#voiceStatus");
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!subjectsBtn || !hobbiesBtn || !stopBtn || !status) {
    return;
  }

  const setStatus = (message, kind = "") => {
    status.textContent = message;
    status.className = kind ? `voice-status ${kind}` : "voice-status";
  };

  const stopCurrent = () => {
    const current = activeRecognitions.get(parentElement);
    if (current) {
      current.abort();
      activeRecognitions.delete(parentElement);
    }
  };

  if (!Recognition) {
    subjectsBtn.disabled = true;
    hobbiesBtn.disabled = true;
    stopBtn.disabled = true;
    setStatus("Voice input is not supported in this browser. Typing still works.", "error");
    return;
  }

  const startListening = (field, label) => {
    stopCurrent();

    const recognition = new Recognition();
    activeRecognitions.set(parentElement, recognition);

    recognition.lang = data?.language || "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setStatus(`Listening for ${label}... speak naturally.`, "listening");
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let previewText = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript.trim();

        if (event.results[index].isFinal) {
          finalText += transcript;
        } else {
          previewText += transcript;
        }
      }

      const visibleText = finalText || previewText;
      if (visibleText) {
        setStatus(`Heard: “${visibleText}”`, "listening");
      }

      if (finalText.trim()) {
        setTriggerValue("transcript", {
          field,
          text: finalText.trim(),
          createdAt: Date.now(),
        });
      }
    };

    recognition.onerror = (event) => {
      const message = event?.error === "not-allowed"
        ? "Mic permission was blocked. Allow microphone access or type instead."
        : "Voice input had trouble hearing that. Try again or type it.";
      setStatus(message, "error");
      activeRecognitions.delete(parentElement);
    };

    recognition.onend = () => {
      activeRecognitions.delete(parentElement);
      if (status.classList.contains("listening")) {
        setStatus("Voice capture finished. You can edit the text below.");
      }
    };

    try {
      recognition.start();
    } catch (error) {
      setStatus("The mic is already starting. Wait a second and try again.", "error");
    }
  };

  subjectsBtn.onclick = () => startListening("subjects", "subjects");
  hobbiesBtn.onclick = () => startListening("hobbies", "hobbies or interests");
  stopBtn.onclick = () => {
    stopCurrent();
    setStatus("Voice capture stopped. Typing still works.");
  };

  return () => {
    stopCurrent();
  };
}
""",
)

_career_voice_reader = st.components.v2.component(
    "career_voice_reader",
    html="""
<section class="voice-reader">
  <button id="readBtn" type="button">🔊 Read prediction aloud</button>
  <button id="cancelBtn" type="button">Stop voice</button>
  <label class="voice-tone" for="voiceSelect">
    <span>Voice</span>
    <select id="voiceSelect">
      <option value="auto">Loading voices...</option>
    </select>
  </label>
  <label class="voice-tone" for="toneSelect">
    <span>Tone</span>
    <select id="toneSelect">
      <option value="human" selected>Cool human</option>
      <option value="hype">Hype announcer</option>
      <option value="chill">Chill guide</option>
      <option value="scanner">Robot scanner</option>
    </select>
  </label>
  <span id="readerStatus">Optional: let the app announce the result.</span>
</section>
""",
    css="""
:host {
  display: block;
  color: var(--st-text-color, #f7fbff);
  font-family: var(--st-font, Inter, system-ui, sans-serif);
}

.voice-reader {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  align-items: center;
  margin: 0.85rem 0 0;
  padding: 0.8rem;
  border: 1px solid rgba(103, 232, 249, 0.22);
  border-radius: 18px;
  background: rgba(2, 6, 23, 0.28);
}

button {
  min-height: 40px;
  padding: 0.55rem 0.82rem;
  border: 1px solid rgba(125, 211, 252, 0.42);
  border-radius: 999px;
  background: linear-gradient(120deg, #0e7490, #2563eb 58%, #4f46e5);
  color: #f8fbff;
  cursor: pointer;
  font: inherit;
  font-weight: 850;
  transition: transform 160ms ease, border-color 160ms ease, filter 160ms ease;
}

button:hover:not(:disabled) {
  border-color: #cffafe;
  filter: brightness(1.12);
  transform: translateY(-2px);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.voice-tone {
  display: inline-flex;
  gap: 0.45rem;
  align-items: center;
  max-width: 100%;
  color: #b7c7df;
  font-size: 0.82rem;
  font-weight: 800;
}

.voice-tone span {
  color: #9be9ff;
  font-size: 0.72rem;
  letter-spacing: 0.12rem;
  text-transform: uppercase;
}

select {
  max-width: min(290px, 72vw);
  min-height: 40px;
  padding: 0.5rem 0.8rem;
  border: 1px solid rgba(125, 211, 252, 0.34);
  border-radius: 999px;
  background: rgba(15, 35, 72, 0.72);
  color: #f8fbff;
  font: inherit;
  font-weight: 800;
  outline: none;
}

select:focus {
  border-color: #cffafe;
  box-shadow: 0 0 0 3px rgba(103, 232, 249, 0.12);
}

#cancelBtn {
  background: rgba(2, 6, 23, 0.45);
}

span {
  color: #b7c7df;
  font-size: 0.86rem;
}

span.error {
  color: #fecaca;
}

span.active {
  color: #d9ff99;
}
""",
    js="""
export default function(component) {
  const { data, parentElement } = component;
  const readBtn = parentElement.querySelector("#readBtn");
  const cancelBtn = parentElement.querySelector("#cancelBtn");
  const voiceSelect = parentElement.querySelector("#voiceSelect");
  const toneSelect = parentElement.querySelector("#toneSelect");
  const status = parentElement.querySelector("#readerStatus");

  if (!readBtn || !cancelBtn || !voiceSelect || !toneSelect || !status) {
    return;
  }

  const setStatus = (message, kind = "") => {
    status.textContent = message;
    status.className = kind;
  };

  const canSpeak = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

  if (!canSpeak) {
    readBtn.disabled = true;
    cancelBtn.disabled = true;
    voiceSelect.disabled = true;
    setStatus("Voice output is not supported in this browser.", "error");
    return;
  }

  let voices = [];

  const refreshVoices = () => {
    voices = window.speechSynthesis.getVoices();
  };

  const scoreVoice = (voice) => {
    const name = String(voice.name || "").toLowerCase();
    const lang = String(voice.lang || "").toLowerCase();
    let score = 0;

    if (lang.startsWith("en")) score += 25;
    if (/natural|neural|premium|enhanced/.test(name)) score += 35;
    if (/aria|jenny|samantha|sonia|zira|guy|google|microsoft|apple/.test(name)) score += 18;
    if (/female|woman/.test(name)) score += 6;
    if (voice.default) score += 8;

    return score;
  };

  const describeVoice = (voice) => {
    const name = String(voice.name || "Browser voice").replace(/\\s+/g, " ").trim();
    const lang = String(voice.lang || "unknown");
    return `${name} · ${lang}${voice.default ? " · default" : ""}`;
  };

  const populateVoiceOptions = () => {
    const previousValue = voiceSelect.value || "auto";
    refreshVoices();

    const englishVoices = voices.filter((voice) =>
      String(voice.lang || "").toLowerCase().startsWith("en")
    );
    const visibleVoices = englishVoices.length ? englishVoices : voices;

    voiceSelect.innerHTML = "";

    const autoOption = document.createElement("option");
    autoOption.value = "auto";
    autoOption.textContent = "Auto best voice";
    voiceSelect.appendChild(autoOption);

    if (!visibleVoices.length) {
      const loadingOption = document.createElement("option");
      loadingOption.value = "loading";
      loadingOption.textContent = "Loading browser voices...";
      loadingOption.disabled = true;
      voiceSelect.appendChild(loadingOption);
      voiceSelect.value = "auto";
      setStatus("Loading browser voices. If this stays empty, refresh once.");
      return;
    }

    visibleVoices.forEach((voice) => {
      const originalIndex = voices.indexOf(voice);
      const option = document.createElement("option");
      option.value = String(originalIndex);
      option.textContent = describeVoice(voice);
      voiceSelect.appendChild(option);
    });

    const stillHasPrevious = Array.from(voiceSelect.options).some(
      (option) => option.value === previousValue
    );
    voiceSelect.value = stillHasPrevious ? previousValue : "auto";

    if (status.className === "active") {
      return;
    }

    if (visibleVoices.length === 1) {
      setStatus(`Only one browser voice found: ${describeVoice(visibleVoices[0])}. Tone changes delivery, not speaker.`);
    } else {
      setStatus(`${visibleVoices.length} browser voices found. Pick a voice, then read the result.`);
    }
  };

  const pickBestVoice = () => {
    refreshVoices();
    return [...voices].sort((first, second) => scoreVoice(second) - scoreVoice(first))[0] || null;
  };

  const getSelectedVoice = () => {
    const selectedValue = voiceSelect.value;

    if (selectedValue && selectedValue !== "auto" && selectedValue !== "loading") {
      const index = Number(selectedValue);
      return Number.isInteger(index) ? voices[index] || null : null;
    }

    return pickBestVoice();
  };

  const getToneSettings = () => {
    const tone = toneSelect.value || "human";

    return {
      human: { rate: 0.91, pitch: 1.0 },
      hype: { rate: 1.12, pitch: 1.18 },
      chill: { rate: 0.78, pitch: 0.86 },
      scanner: { rate: 0.84, pitch: 0.55 },
    }[tone] || { rate: 0.91, pitch: 1.0 };
  };

  populateVoiceOptions();

  if ("onvoiceschanged" in window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = populateVoiceOptions;
  }

  window.setTimeout(populateVoiceOptions, 300);
  window.setTimeout(populateVoiceOptions, 1200);

  readBtn.onclick = () => {
    const text = String(data?.text || "").trim();

    if (!text) {
      setStatus("No result to read yet.", "error");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const toneSettings = getToneSettings();
    const voice = getSelectedVoice();

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || data?.language || "en-US";
    } else {
      utterance.lang = data?.language || "en-US";
    }

    utterance.rate = toneSettings.rate;
    utterance.pitch = toneSettings.pitch;
    utterance.volume = 1;
    utterance.onstart = () => setStatus("Reading prediction with selected tone...", "active");
    utterance.onend = () => setStatus("Done reading. You can run another prediction.");
    utterance.onerror = () => setStatus("Voice output had trouble reading that.", "error");

    window.speechSynthesis.speak(utterance);
  };

  cancelBtn.onclick = () => {
    window.speechSynthesis.cancel();
    setStatus("Voice stopped.");
  };
}
""",
)

QUEST_STAMPS = {
    "hand_puzzle": ("🧩", "Puzzle Solver"),
    "hand_rush": ("⚡", "Gravity Bender"),
    "slice_club": ("🍉", "Slice Champion"),
    "skyshot": ("🎯", "Sky Ace"),
    "career": ("🎓", "Future Explorer"),
    "vibe_link": ("✨", "Vibe Scanner"),
    "vibe_oracle": ("🔮", "Cosmic Forecaster"),
}

def render_career_voice_input() -> object | None:
    """Render optional browser speech-to-text controls for Career Quest."""
    voice_result = _career_voice_input(
        key="career_voice_input",
        data={"language": "en-US"},
        on_transcript_change=lambda: None,
    )

    return getattr(voice_result, "transcript", None)


def apply_career_voice_transcript(transcript: object) -> None:
    """Place a spoken transcript into the matching Streamlit text area."""
    if not isinstance(transcript, dict):
        return

    field = transcript.get("field")
    text = str(transcript.get("text", "")).strip()

    target = {
        "subjects": ("career_subjects", "subjects"),
        "hobbies": ("career_hobbies", "interests"),
    }.get(field)

    if not target or not text:
        return

    state_key, label = target
    current_text = st.session_state.get(state_key, "").strip()

    if current_text and text.lower() not in current_text.lower():
        st.session_state[state_key] = f"{current_text}, {text}"
    elif not current_text:
        st.session_state[state_key] = text

    st.toast(f"Voice added to {label}.", icon="🎙️")


def clear_career_choices() -> None:
    """Prepare the Career Quest form for another visitor, keeping earned stamps."""
    for key in (
        "career_subject_choices", "career_more_subject_choices",
        "career_interest_choices", "career_more_interest_choices",
    ):
        st.session_state[key] = []
    for key in ("career_name", "career_subjects", "career_hobbies"):
        st.session_state[key] = ""
    st.session_state.pop("career_result", None)


def build_career_spoken_result(student_name: str, predictions: list[dict]) -> str:
    """Create a short, informal text-to-speech prediction."""
    top_prediction = predictions[0]
    student_intro = f"{student_name}, " if student_name else ""
    return (
        f"{student_intro}career unlocked. {top_prediction['career']}! "
        f"{career_card(top_prediction['career'])['line']}"
    )


def render_career_voice_reader(spoken_result: str) -> None:
    """Render an optional browser text-to-speech button for Career Quest results."""
    _career_voice_reader(
        key="career_voice_reader",
        data={"text": spoken_result, "language": "en-US"},
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
            f"NeuroVerse QuestPass stamp collected: {st.session_state.quest_pass_notice}!",
            icon="✅",
        )
        del st.session_state.quest_pass_notice

    st.markdown(
        """
        <section class="hero">
            <div class="eyebrow">NEUROVERSE · OPEN DAY EXPERIENCE</div>
            <h1>Your mind. Your moves. Your universe.</h1>
            <p>
                Enter a universe of machine-learning predictions,
                hand-tracked challenges, and playful social experiences.
            </p>
        </section>
        """,
        unsafe_allow_html=True,
    )

    # QuestPass is a visible progress board, not a separate activity. Visitors
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

    if stamp_count >= total_stamps:
        quest_message = "Full collection unlocked: Master of the NeuroVerse."
    elif stamp_count >= 3:
        quest_message = "Explorer title unlocked: Certified NeuroVerse Navigator."
    else:
        stamps_needed = 3 - stamp_count
        quest_message = (
            f"Collect {stamps_needed} more stamp{'s' if stamps_needed != 1 else ''} "
            "to unlock your NeuroVerse Explorer title."
        )

    st.markdown(
        f"""
        <section class="questpass-card">
            <div class="questpass-copy">
                <p class="questpass-eyebrow">NEUROVERSE EXPERIENCE PASSPORT</p>
                <h2>NeuroVerse QuestPass</h2>
                <p>Explore the universe, collect stamps, and unlock a completely unnecessary title.</p>
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
                    Two strangers from different schools answer in secret.
                    VibeLink delivers the final verdict: match or no match.
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        if st.button("Start VibeLink", key="open_vibe_link"):
            st.session_state.page = "vibe_link"
            st.rerun()

    oracle_column, slice_column = st.columns(2, gap="large")

    with oracle_column:
        st.markdown(
            """
            <div class="mode-card">
                <div class="mode-icon">🔮</div>
                <h2>Vibe Oracle</h2>
                <p>
                    Raise one hand, awaken the crystal, and let the Oracle
                    reveal the harmless chaos hiding in your future.
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        if st.button("Ask the Vibe Oracle", key="open_vibe_oracle"):
            st.session_state.page = "vibe_oracle"
            st.rerun()

    with slice_column:
        st.markdown(
            """
            <div class="mode-card">
                <div class="mode-icon">🍉</div>
                <h2>Slice Club</h2>
                <p>
                    Turn your index finger into a blade, slice flying fruit,
                    dodge bombs, and chase the highest 30-second score.
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        if st.button("Enter Slice Club", key="open_slice_club"):
            st.session_state.page = "slice_club"
            st.rerun()

    sky_left, skyshot_column, sky_right = st.columns([1, 2, 1], gap="large")

    with skyshot_column:
        st.markdown(
            """
            <div class="mode-card">
                <div class="mode-icon">🎯</div>
                <h2>SkyShot</h2>
                <p>
                    Turn your hand into a steady arcade blaster, track flying
                    targets, dodge decoys, or challenge a friend side by side.
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        if st.button("Enter SkyShot", key="open_skyshot"):
            st.session_state.page = "skyshot"
            st.rerun()

    st.markdown(
        '<p class="small-note">NEUROVERSE · Built for Open Day · Designed for quick, private play.</p>',
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

    if st.button("← Back to NeuroVerse", key="back_from_puzzle"):
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

    if st.button("← Back to NeuroVerse", key="back_from_hand_rush"):
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

elif page == "slice_club":
    # Slice Club is served from Streamlit's static directory so its JavaScript,
    # artwork, MediaPipe model, worker, and WebAssembly files stay together.
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

            .st-key-back_from_slice_club,
            div[data-testid="stButton"] {
                position: fixed;
                top: 14px;
                left: 14px;
                z-index: 1000000;
                width: auto !important;
            }

            .st-key-back_from_slice_club button,
            div[data-testid="stButton"] > button {
                width: auto !important;
                border-radius: 999px !important;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25) !important;
            }

            [data-testid="stIFrame"],
            [data-testid="stIFrame"] iframe,
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

    if st.button("← Back to NeuroVerse", key="back_from_slice_club"):
        st.session_state.page = "home"
        st.rerun()

    slice_club_build = (
        Path(__file__).with_name("static") / "slice-club" / "index.html"
    )

    if not slice_club_build.exists():
        st.error("The Slice Club game build could not be found.")
    else:
        completion = render_questpass_activity(
            None,
            "slice_club",
            key="slice_club_activity",
            game_url="/app/static/slice-club/index.html",
        )
        if completion == "slice_club":
            award_questpass_stamp("slice_club")
            st.session_state.page = "home"
            st.rerun()

elif page == "skyshot":
    # SkyShot is a full-screen, camera-controlled arcade experience. Its
    # MediaPipe runtime is served locally with the game so Open Day play does
    # not depend on a third-party CDN.
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
                height: 100vh !important;
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

            .st-key-back_from_skyshot,
            div[data-testid="stButton"] {
                position: fixed;
                top: 14px;
                left: 14px;
                z-index: 1000000;
                width: auto !important;
            }

            .st-key-back_from_skyshot button,
            div[data-testid="stButton"] > button {
                width: auto !important;
                border-radius: 999px !important;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25) !important;
            }

            [data-testid="stIFrame"],
            [data-testid="stIFrame"] iframe,
            iframe[title="st.iframe"] {
                position: relative !important;
                inset: auto !important;
                z-index: 0 !important;
                display: block !important;
                width: 100vw !important;
                min-width: 100vw !important;
                min-height: 100vh !important;
                height: 100vh !important;
                margin: 0 !important;
                border: 0 !important;
            }
        </style>
        """,
        unsafe_allow_html=True,
    )

    if st.button("← Back to NeuroVerse", key="back_from_skyshot"):
        st.session_state.page = "home"
        st.rerun()

    skyshot_build = Path(__file__).with_name("static") / "skyshot" / "index.html"

    if not skyshot_build.exists():
        st.error("The SkyShot game build could not be found.")
    else:
        completion = render_questpass_activity(
            None,
            "skyshot",
            key="skyshot_activity",
            game_url="/app/static/skyshot/index.html",
        )
        if completion == "skyshot":
            award_questpass_stamp("skyshot")
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

    if st.button("← Back to NeuroVerse", key="back_from_vibe_link"):
        st.session_state.page = "home"
        st.rerun()

    # The rebuilt VibeLink experience lives separately so the previous
    # version remains available as a safe fallback while this one is tested.
    vibe_link_file = Path(__file__).with_name("VibeLink_Rebuilt.html")

    if not vibe_link_file.exists():
        st.error("The VibeLink_Rebuilt.html file could not be found.")
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
    # The rebuilt Oracle is a one-player, hand-controlled experience. It is
    # served from Streamlit's static directory so the MediaPipe worker, local
    # model, WASM runtime, styling, and interaction code stay together.
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

    if st.button("← Back to NeuroVerse", key="back_from_vibe_oracle"):
        st.session_state.page = "home"
        st.rerun()

    vibe_oracle_file = (
        Path(__file__).with_name("static") / "vibe-oracle" / "index.html"
    )

    if not vibe_oracle_file.exists():
        st.error("The rebuilt Vibe Oracle files could not be found.")
    else:
        st.iframe(
            "/app/static/vibe-oracle/index.html",
            height="stretch",
            width="stretch",
        )
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

    # Discard an obsolete preset from a browser session open during this update.
    if "Food Technology" in st.session_state.get("career_more_subject_choices", []):
        st.session_state.career_more_subject_choices = [
            subject for subject in st.session_state.career_more_subject_choices
            if subject != "Food Technology"
        ]

    if st.button("← Back to NeuroVerse", key="back_from_career"):
        st.session_state.page = "home"
        st.rerun()

    st.title("Career Quest 🎓")
    st.write("Tap what sounds like you. Let’s find your next direction.")
    st.caption("Pick as many as you like. Tap again to undo. No typing needed.")

    with st.container(key="career_picker"):
        subject_column, interest_column = st.columns(2, gap="medium")
        with subject_column, st.container(border=True, key="career_subject_panel"):
            st.subheader("01 · Your subjects")
            st.caption("Which classes do you enjoy?")
            chosen_subjects = st.pills(
                "Subjects you enjoy", COMMON_SUBJECTS,
                selection_mode="multi", key="career_subject_choices",
                label_visibility="collapsed", wrap=True,
            )
            with st.expander("More subjects"):
                more_subjects = st.pills(
                    "More subjects you enjoy", MORE_SUBJECTS,
                    selection_mode="multi", key="career_more_subject_choices",
                    label_visibility="collapsed", wrap=True,
                )

        with interest_column, st.container(border=True, key="career_interest_panel"):
            st.subheader("02 · Your interests")
            st.caption("What do you enjoy doing?")
            chosen_interests = st.pills(
                "Activities you enjoy", COMMON_INTERESTS,
                selection_mode="multi", key="career_interest_choices",
                label_visibility="collapsed", wrap=True,
            )
            with st.expander("More interests"):
                more_interests = st.pills(
                    "More activities you enjoy", MORE_INTERESTS,
                    selection_mode="multi", key="career_more_interest_choices",
                    label_visibility="collapsed", wrap=True,
                )

        with st.expander("Something else? Speak or type", key="career_extra_options"):
            voice_transcript = render_career_voice_input()
            apply_career_voice_transcript(voice_transcript)
            extra_subjects = st.text_area(
                "Other subjects (optional)",
                placeholder="Any subjects you couldn’t find above",
                key="career_subjects", height=80,
            )
            extra_interests = st.text_area(
                "Other interests (optional)",
                placeholder="Tell us in your own words, or use the microphone",
                key="career_hobbies", height=80,
            )
            name = st.text_input(
                "Nickname (optional)", placeholder="What should we call you?",
                key="career_name",
            )

        all_subjects = chosen_subjects + more_subjects
        all_interests = chosen_interests + more_interests
        subjects, hobbies = build_career_answers(
            all_subjects, all_interests, extra_subjects, extra_interests,
        )
        selection_count = len(all_subjects) + len(all_interests)
        if selection_count or subjects or hobbies:
            summary = f"{selection_count} selected" if selection_count else "Your own words added"
            if selection_count and (extra_subjects.strip() or extra_interests.strip()):
                summary += " · plus your own words"
            st.caption(f"{summary} · Ready when you are.")
        else:
            st.caption("Start with a subject or an interest—either works.")

        reveal_column, reset_column = st.columns([3, 1], gap="small")
        with reveal_column:
            reveal_requested = st.button(
                "Reveal my career", key="career_reveal", type="primary",
                icon=":material/auto_awesome:", width="stretch",
            )
        with reset_column:
            st.button(
                "Clear choices", key="career_clear", on_click=clear_career_choices,
                width="stretch",
            )

    # Retain the reveal during reader/component reruns, but never show stale results
    # after a student changes their choices, free text, or nickname.
    profile = (subjects, hobbies, name.strip())
    saved_result = st.session_state.get("career_result")
    if saved_result and (
        saved_result["profile"] != profile
        or any(p["career"] in EXCLUDED_CAREERS for p in saved_result["result"]["predictions"])
    ):
        st.session_state.pop("career_result", None)

    if reveal_requested:
        if not subjects.strip() and not hobbies.strip():
            st.warning("Tap at least one subject or interest, or add your own below ‘Something else?’.")
        else:
            result = predict_careers(subjects, hobbies)
            predictions = result["predictions"]

            if not predictions:
                st.info(
                    "I could not find a strong connection to the current training "
                    "data yet. Try choosing another subject or interest, or add "
                    "some detail under ‘Something else?’."
                )

            else:
                st.session_state.career_result = {
                    "profile": profile, "result": result,
                    "reveal_id": uuid4().hex,
                    "choices": (all_subjects + all_interests) or result["recognized_terms"][:6],
                }

                if "career" not in st.session_state.quest_stamps:
                    award_questpass_stamp("career")
                    st.toast("QuestPass stamp collected: Future Explorer!", icon="✅")

    saved_result = st.session_state.get("career_result")
    if saved_result:
        result = saved_result["result"]
        predictions = result["predictions"]
        render_future_reveal(
            predictions, renderer=_career_future_reveal, nickname=name.strip(),
            choices=saved_result.get("choices", []),
            reveal_id=saved_result.get("reveal_id", "existing-result"),
            animate=reveal_requested,
        )
        with st.expander("More voice options"):
            render_career_voice_reader(build_career_spoken_result(name.strip(), predictions))
