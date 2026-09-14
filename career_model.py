"""Train and query the project's free-text career exploration model."""

from pathlib import Path
import re

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import FeatureUnion, Pipeline


DATA_PATH = Path(__file__).with_name("data_v3.csv")

if not DATA_PATH.exists():
    DATA_PATH = Path(__file__).with_name("data.csv")

TOKEN_PATTERN = re.compile(r"[a-zA-Z][a-zA-Z'-]*")


def build_profile_text(subjects, hobbies):
    """Combine a student's free-text answers into one model input."""
    return f"{subjects or ''} {hobbies or ''}".strip().lower()


def find_recognized_terms(profile_text, vocabulary):
    """Return words from the student's answer that occur in the training data."""
    return sorted(
        {
            token.lower()
            for token in TOKEN_PATTERN.findall(profile_text)
            if token.lower() in vocabulary
        }
    )


# The data remains fully editable: each row describes a student and a career.
df = pd.read_csv(DATA_PATH).fillna("")
training_text = [
    build_profile_text(subjects, hobbies)
    for subjects, hobbies in zip(df["subjects"], df["hobbies"])
]

# Word features learn meaningful terms such as "biology" and "coding". Character
# features also make the model more forgiving of spelling variations and word forms.
features = FeatureUnion(
    [
        (
            "words",
            TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True),
        ),
        (
            "characters",
            TfidfVectorizer(
                analyzer="char_wb",
                ngram_range=(3, 5),
                sublinear_tf=True,
            ),
        ),
    ]
)

model = Pipeline(
    [
        ("features", features),
        (
            "classifier",
            LogisticRegression(
                class_weight="balanced",
                max_iter=2_000,
                random_state=42,
            ),
        ),
    ]
)
model.fit(training_text, df["career"])

word_vectorizer = model.named_steps["features"].transformer_list[0][1]
known_words = set(word_vectorizer.vocabulary_)


def find_career_evidence(profile_text, career, limit=3):
    """
    Find the words or phrases that most positively influenced
    one career prediction.
    """
    word_features = word_vectorizer.transform([profile_text])
    classifier = model.named_steps["classifier"]

    career_index = list(classifier.classes_).index(career)
    word_feature_count = word_features.shape[1]

    # The first part of the classifier contains the word features.
    word_coefficients = classifier.coef_[
        career_index,
        :word_feature_count,
    ]

    contributions = word_features.multiply(
        word_coefficients
    ).toarray()[0]

    feature_names = word_vectorizer.get_feature_names_out()
    evidence = []

    for index in contributions.argsort()[::-1]:
        if contributions[index] <= 0:
            break

        feature = feature_names[index]

        if feature not in evidence:
            evidence.append(feature)

        if len(evidence) == limit:
            break

    return evidence


def predict_careers(subjects, hobbies, limit=3):
    """Return the strongest career matches for any free-text student response."""
    profile_text = build_profile_text(subjects, hobbies)
    recognized_terms = find_recognized_terms(profile_text, known_words)

    if not recognized_terms:
        return {
            "predictions": [],
            "recognized_terms": [],
        }

    probabilities = model.predict_proba([profile_text])[0]
    careers = model.named_steps["classifier"].classes_
    top_indices = probabilities.argsort()[::-1][:limit]
    top_probability_total = probabilities[top_indices].sum()

    predictions = []

    for index in top_indices:
        career = careers[index]
        match_score = (
            round(float(probabilities[index] / top_probability_total) * 100)
            if top_probability_total
            else 0
        )

        predictions.append(
            {
                "career": career,
                "score": match_score,
                "evidence": find_career_evidence(
                    profile_text,
                    career,
                ),
                "model_probability": round(float(probabilities[index]) * 100, 2),
            }
        )

    return {
        "predictions": predictions,
        "recognized_terms": recognized_terms,
    }
