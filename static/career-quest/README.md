# Career Quest: future-you cards

The existing TF-IDF + logistic regression model still supplies the careers and
their order. This component only presents them. It doesn't call Ollama, generate
photographs, re-score results or fetch outside assets.

- `career_cards.py`: copy, theme and illustration key for every current career.
  Older data.csv labels and newly added careers have fallbacks.
- `career_reveal.py`: small Streamlit Custom Components v2 wrapper.
- `reveal.js`: 2.8-second inline intro, skip, optional sound/voice, bonus cards,
  and 1080 x 1350 PNG export. The result stays until the student advances it.
- `reveal.css`: isolated styling, responsive layout, reduced-motion support.

Each prediction run gets a new ID; ordinary Streamlit reruns do not start a new
reveal. Loading and the card stay in the same section on the Career Quest page;
there is no modal, new tab or fullscreen takeover. Bonus cards are the existing
second/third model suggestions, not random jobs.

Sound is off until enabled. Voice availability depends on the browser and OS;
the existing voice picker remains under **More voice options**. No audio plays
automatically on entry. Motion-reduction preferences disable movement, while
keeping the short loading/readout sequence. **Skip to my career** bypasses it.

Food Technology is no longer a subject preset. Food Technologist is excluded
before training by `EXCLUDED_CAREERS` in `career_model.py`, so it cannot be a
prediction. The original CSV rows are preserved, not deleted. Old saved results
containing this career are discarded when Career Quest is opened again.

Cards download locally with the optional nickname. Nothing is uploaded by this
component and no personal data is put in browser storage. A downloaded card
remains on the user's device until they delete it. For a shared booth laptop,
use **Clear choices** between visitors and clear any downloaded cards afterwards.

Tests (from project root):

```text
python -m unittest discover -s tests -p "test_career_*.py" -v
node --test tests/test_career_reveal.mjs
```

The tests check every trained career's content/artwork and preserve real model
rankings. Browser checks are still needed for animation, speech, responsive layout
and downloads. These cards are interest-based suggestions, not promises or
validated assessments of a student's future.
