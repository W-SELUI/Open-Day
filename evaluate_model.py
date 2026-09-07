from pathlib import Path

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import FeatureUnion, Pipeline


DATA_PATH = Path(__file__).with_name("data.csv")


def build_model():
    features = FeatureUnion(
        [
            (
                "words",
                TfidfVectorizer(
                    ngram_range=(1, 2),
                    sublinear_tf=True,
                ),
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

    return Pipeline(
        [
            ("features", features),
            (
                "classifier",
                LogisticRegression(
                    class_weight="balanced",
                    max_iter=2000,
                    random_state=42,
                ),
            ),
        ]
    )


# 1. Load the data
df = pd.read_csv(DATA_PATH).fillna("")

# 2. Combine subjects and hobbies into the free-text input the model learns from
texts = (
    df["subjects"].astype(str)
    + " "
    + df["hobbies"].astype(str)
).str.lower()

labels = df["career"]

# 3. Keep 80% for learning and hide 20% for testing
X_train, X_test, y_train, y_test = train_test_split(
    texts,
    labels,
    test_size=0.20,
    random_state=42,
    stratify=labels,
)

# 4. Train a brand-new model only on the training portion
model = build_model()
model.fit(X_train, y_train)

# 5. Ask it to predict the hidden test portion
predictions = model.predict(X_test)

# 6. Print the results
accuracy = accuracy_score(y_test, predictions)

print("\n--- Model Evaluation ---")
print(f"Total samples: {len(df)}")
print(f"Training samples: {len(X_train)}")
print(f"Test samples: {len(X_test)}")
print(f"Accuracy: {accuracy:.1%}")

print("\n--- Career-by-career report ---")
print(
    classification_report(
        y_test,
        predictions,
        zero_division=0,
    )
)

# Save a confusion matrix as a CSV file you can inspect in Excel.
career_names = sorted(labels.unique())
confusion_matrix = pd.crosstab(
    y_test,
    predictions,
    rownames=["Actual career"],
    colnames=["Predicted career"],
).reindex(
    index=career_names,
    columns=career_names,
    fill_value=0,
)

output_path = Path(__file__).with_name("evaluation_confusion_matrix.csv")
confusion_matrix.to_csv(output_path)

print(f"Confusion matrix saved to: {output_path.name}")