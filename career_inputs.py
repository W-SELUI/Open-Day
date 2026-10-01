"""Translate Career Quest's tap choices into the existing model's text input."""

import re


# Labels remain interests and subjects, never career labels or model predictions.
COMMON_SUBJECTS = (
    "Maths", "English", "Biology", "Chemistry", "Physics", "Computer Studies",
    "Business Studies", "Accounting", "Geography", "Agriculture", "Basic Science", "Art",
)
MORE_SUBJECTS = (
    "Economics", "Commercial Studies", "History", "Social Science", "Social Studies",
    "Technical Drawing", "Basic Technology", "Applied Technology", "Home Economics",
    "Food Technology", "Physical Education", "Music", "Hindi", "Vosa Vaka Viti (iTaukei)",
    "French", "Japanese", "Chinese", "Office Technology", "Design Technology",
    "Statistics", "English Literature", "Health Science",
)
COMMON_INTERESTS = (
    "Gaming", "Music", "Sports", "Drawing & design", "Helping people", "Coding",
    "Cooking", "Fixing things", "Outdoors & nature", "Reading & writing",
    "Solving puzzles", "Running a business",
)
MORE_INTERESTS = (
    "Singing", "Photography", "Making videos", "Sewing & fashion", "Farming & gardening",
    "Fishing", "Caring for animals", "Science experiments", "Building things",
    "Working with numbers", "Debating", "Teaching others", "Volunteering",
    "Organising events", "Travel & cultures",
)

# Use familiar wording from the data, without adding assumed skills or careers.
SUBJECT_TEXT = {"Vosa Vaka Viti (iTaukei)": "Vosa Vaka Viti"}
INTEREST_TEXT = {
    "Photography": "taking photos",
    "Drawing & design": "drawing, designing",
    "Outdoors & nature": "outdoors, nature",
    "Reading & writing": "reading, writing",
    "Sewing & fashion": "sewing, fashion",
    "Farming & gardening": "farming, gardening",
    "Travel & cultures": "travelling, learning about cultures",
}


def combine_choices(choices, extra_text="", wording=None):
    """Keep all choices and free text, removing repeated comma-separated phrases."""
    wording = wording or {}
    phrases = [wording.get(choice, choice) for choice in choices]
    phrases.append(extra_text or "")
    combined = []
    seen = set()
    for phrase in phrases:
        for part in re.split(r"[,;\n]+", phrase):
            part = part.strip()
            if part and part.casefold() not in seen:
                combined.append(part)
                seen.add(part.casefold())
    return ", ".join(combined)


def build_career_answers(subjects, interests, extra_subjects="", extra_interests=""):
    """Produce the same two text fields used by typed and spoken predictions."""
    return (
        combine_choices(subjects, extra_subjects, SUBJECT_TEXT),
        combine_choices(interests, extra_interests, INTEREST_TEXT),
    )
