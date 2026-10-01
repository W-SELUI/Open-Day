"""Run: python -m unittest discover -s tests -p test_career_inputs.py -v"""

from pathlib import Path
import sys
import unittest
from unittest.mock import patch

from streamlit.testing.v1 import AppTest

PROJECT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT))

from career_inputs import (
    COMMON_INTERESTS, COMMON_SUBJECTS, MORE_INTERESTS, MORE_SUBJECTS,
    build_career_answers,
)
from career_model import find_recognized_terms, known_words, predict_careers


class CareerChoicesTests(unittest.TestCase):
    def test_taps_and_own_words_are_combined_without_duplicate_phrases(self):
        self.assertEqual(
            build_career_answers(
                ["Biology", "Chemistry"], ["Drawing & design"],
                "biology; Marine science", "drawing\ncarving",
            ),
            ("Biology, Chemistry, Marine science", "drawing, designing, carving"),
        )
        self.assertEqual(build_career_answers([], []), ("", ""))

    def test_every_offered_choice_is_recognised_by_the_existing_model(self):
        for label in COMMON_SUBJECTS + MORE_SUBJECTS:
            with self.subTest(subject=label):
                subject, _ = build_career_answers([label], [])
                self.assertTrue(find_recognized_terms(subject, known_words))
        for label in COMMON_INTERESTS + MORE_INTERESTS:
            with self.subTest(interest=label):
                _, interest = build_career_answers([], [label])
                self.assertTrue(find_recognized_terms(interest, known_words))

    def start_career(self):
        app = AppTest.from_file(str(PROJECT / "app.py"), default_timeout=30)
        app.session_state.page = "career"
        app.run()
        self.assertFalse(app.exception)
        return app

    def test_taps_only_predict_and_remain_visible_until_choices_change(self):
        app = self.start_career()
        app.button(key="career_reveal").click().run()
        self.assertTrue(app.warning)
        self.assertNotIn("career", app.session_state.quest_stamps)
        app.button_group(key="career_subject_choices").set_value(["Biology", "Chemistry"])
        app.button_group(key="career_interest_choices").set_value(["Helping people"])
        app.button_group(key="career_more_interest_choices").set_value(["Science experiments"])
        app.run()
        with patch("career_model.predict_careers", wraps=predict_careers) as predict:
            app.button(key="career_reveal").click().run()
            self.assertFalse(app.exception)
            predict.assert_called_once_with("Biology, Chemistry", "Helping people, Science experiments")
        self.assertTrue(app.session_state.career_result["result"]["predictions"])
        self.assertIn("career", app.session_state.quest_stamps)
        app.run()
        self.assertFalse(app.exception)
        self.assertIn("career_result", app.session_state)
        app.button_group(key="career_subject_choices").unselect("Chemistry").run()
        self.assertFalse(app.exception)
        self.assertNotIn("career_result", app.session_state)
        app.button(key="career_clear").click().run()
        self.assertFalse(app.exception)
        for group in app.button_group:
            self.assertEqual(group.value, [])
        self.assertIn("career", app.session_state.quest_stamps)

    def test_free_text_and_spoken_field_values_still_work_with_or_without_taps(self):
        app = self.start_career()
        app.text_area(key="career_subjects").set_value("Computer Studies")
        app.text_area(key="career_hobbies").set_value("building websites")
        app.text_input(key="career_name").set_value("Test visitor")
        app.button(key="career_reveal").click().run()
        self.assertFalse(app.exception)
        self.assertEqual(
            app.session_state.career_result["profile"],
            ("Computer Studies", "building websites", "Test visitor"),
        )
        app.button_group(key="career_more_subject_choices").select("Technical Drawing").run()
        self.assertEqual(app.text_area(key="career_hobbies").value, "building websites")
        self.assertNotIn("career_result", app.session_state)
        app.button(key="career_clear").click().run()
        self.assertFalse(app.exception)
        self.assertEqual(app.text_area(key="career_subjects").value, "")
        self.assertEqual(app.text_area(key="career_hobbies").value, "")
        self.assertEqual(app.text_input(key="career_name").value, "")


if __name__ == "__main__":
    unittest.main()
