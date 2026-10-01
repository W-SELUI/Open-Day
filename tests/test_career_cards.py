"""Run alongside test_career_inputs.py with unittest discovery."""
import csv
from pathlib import Path
import re
import sys
import unittest
from unittest.mock import patch

PROJECT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT))

from career_cards import CAREER_CARDS, LEGACY_CARDS, THEMES, build_reveal_payload, career_card
from career_inputs import MORE_SUBJECTS
from career_model import DATA_PATH, EXCLUDED_CAREERS, predict_careers
from streamlit.testing.v1 import AppTest


class CareerCardTests(unittest.TestCase):
    def test_every_trained_career_has_specific_content_and_valid_artwork(self):
        with DATA_PATH.open(encoding="utf-8-sig", newline="") as handle:
            labels = {row["career"] for row in csv.DictReader(handle)}
        self.assertTrue(labels - EXCLUDED_CAREERS <= CAREER_CARDS.keys() | LEGACY_CARDS.keys())
        js = (PROJECT / "static/career-quest/reveal.js").read_text(encoding="utf-8")
        icons = set(re.findall(r"^  (\w+): '<", js, flags=re.M))
        lines = []
        for label in labels:
            with self.subTest(career=label):
                card = career_card(label)
                self.assertIn(card["theme"], THEMES)
                self.assertIn(card["icon"], icons)
                self.assertLessEqual(len(card["line"]), 110)
                self.assertRegex(card["accent"], r"^#[\da-fA-F]{6}$")
                self.assertEqual(card["career"], label)
                lines.append(card["line"])
        self.assertEqual(len(lines), len(set(lines)), "Each career should have its own line")

    def test_presentation_preserves_real_model_order_and_does_not_claim_confidence(self):
        original = predict_careers("Biology, Chemistry", "Helping people, science experiments")
        payload = build_reveal_payload(original["predictions"], "  Bula  ", ["Biology"] * 2, "run-1")
        self.assertEqual([c["career"] for c in payload["cards"]], [p["career"] for p in original["predictions"]])
        self.assertEqual(payload["nickname"], "Bula")
        self.assertEqual(payload["choices"], ["Biology"])
        self.assertNotIn("score", payload["cards"][0])
        self.assertTrue(original["predictions"][0]["score"] >= 0)

    def test_new_careers_have_fallback_and_inputs_are_bounded(self):
        career = "A new career not in the catalogue"
        payload = build_reveal_payload([{"career": career}], "a" * 500, ["b" * 500] + list("123456789"))
        self.assertEqual(payload["cards"][0]["career"], career)
        self.assertEqual(payload["cards"][0]["icon"], "compass")
        self.assertEqual(len(payload["nickname"]), 40)
        self.assertEqual(len(payload["choices"]), 6)
        self.assertLessEqual(max(map(len, payload["choices"])), 45)
        self.assertEqual(build_reveal_payload([])["cards"], [])

    def test_removed_food_technologist_is_not_trained_or_predicted(self):
        self.assertNotIn("Food Technology", MORE_SUBJECTS)
        self.assertNotIn("Food Technologist", CAREER_CARDS)
        self.assertIn("Food Technologist", EXCLUDED_CAREERS)
        careers = {prediction["career"] for prediction in predict_careers("food technology", "food science")["predictions"]}
        self.assertNotIn("Food Technologist", careers)

    def test_app_reveals_once_retains_id_and_resets_for_the_next_visitor(self):
        app = AppTest.from_file(str(PROJECT / "app.py"), default_timeout=30)
        app.session_state.page = "career"
        app.run()
        app.button_group(key="career_subject_choices").set_value(["Computer Studies"])
        app.button_group(key="career_interest_choices").set_value(["Coding"])
        with patch("career_reveal.render_future_reveal") as render:
            app.button(key="career_reveal").click().run()
            self.assertFalse(app.exception)
            first_id = app.session_state.career_result["reveal_id"]
            self.assertTrue(render.call_args.kwargs["animate"])
            self.assertEqual(render.call_args.kwargs["choices"], ["Computer Studies", "Coding"])
            app.run()
            self.assertFalse(app.exception)
            self.assertFalse(render.call_args.kwargs["animate"])
            self.assertEqual(app.session_state.career_result["reveal_id"], first_id)
            app.button(key="career_reveal").click().run()
            self.assertNotEqual(app.session_state.career_result["reveal_id"], first_id)
            self.assertTrue(render.call_args.kwargs["animate"])
            app.button(key="career_clear").click().run()
            self.assertFalse(app.exception)
            self.assertNotIn("career_result", app.session_state)
            self.assertIn("career", app.session_state.quest_stamps)


if __name__ == "__main__":
    unittest.main()
