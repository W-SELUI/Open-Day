from pathlib import Path

import pandas as pd
from sklearn.metrics import accuracy_score, classification_report

from career_model import build_profile_text, model


TEST_DATA_PATH = Path(__file__).with_name("unseen_test_data.csv")

# Load data that the model has never trained on.
test_df = pd.read_csv(TEST_DATA_PATH).fillna("")

# Turn each test row into the same free-text format used by the app.
test_texts = [
    build_profile_text(subjects, hobbies)
    for subjects, hobbies in zip(
        test_df["subjects"],
        test_df["hobbies"],
    )
]

# Predict careers using the model trained from data.csv.
predictions = model.predict(test_texts)
actual_careers = test_df["career"]

# Measure results.
accuracy = accuracy_score(actual_careers, predictions)

print("\n--- Unseen Data Evaluation ---")
print(f"Unseen test samples: {len(test_df)}")
print(f"Accuracy: {accuracy:.1%}")

print("\n--- Career-by-career report ---")
print(
    classification_report(
        actual_careers,
        predictions,
        zero_division=0,
    )
)

# Save every prediction so you can inspect mistakes in Excel.
results = test_df.copy()
results["predicted_career"] = predictions
results["correct"] = results["career"] == results["predicted_career"]

output_path = Path(__file__).with_name("unseen_test_results.csv")
results.to_csv(output_path, index=False)

print(f"Detailed results saved to: {output_path.name}")