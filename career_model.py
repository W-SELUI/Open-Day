import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import MultiLabelBinarizer
import numpy as np

# Load dataset
df = pd.read_csv("data.csv")

# Split subjects and hobbies into lists
df["subjects"] = df["subjects"].apply(lambda x: x.split(";"))
df["hobbies"] = df["hobbies"].apply(lambda x: x.split(";"))

# Encode with MultiLabelBinarizer
subject_encoder = MultiLabelBinarizer()
hobby_encoder = MultiLabelBinarizer()

subjects_encoded = subject_encoder.fit_transform(df["subjects"])
hobbies_encoded = hobby_encoder.fit_transform(df["hobbies"])

# Combine features
X = np.hstack([subjects_encoded, hobbies_encoded])
y = df["career"]

# Train model
model = DecisionTreeClassifier()
model.fit(X, y)

# --- Normalization helper ---
def normalize_input(user_input, known_labels):
    # Return all labels that contain the user_input (partial match)
    matches = [label for label in known_labels if user_input.lower() in label.lower()]
    return matches if matches else [user_input]

# --- Prediction function ---
def predict_career(subjects, hobbies):
    subjects_list = []
    for s in subjects.split(";"):
        subjects_list.extend(normalize_input(s.strip(), subject_encoder.classes_))

    hobbies_list = []
    for h in hobbies.split(";"):
        hobbies_list.extend(normalize_input(h.strip(), hobby_encoder.classes_))

    subjects_encoded = subject_encoder.transform([subjects_list])
    hobbies_encoded = hobby_encoder.transform([hobbies_list])

    data = np.hstack([subjects_encoded, hobbies_encoded])
    return model.predict(data)[0]
