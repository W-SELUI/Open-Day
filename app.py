import streamlit as st
from career_model import predict_career

# Sidebar navigation
option = st.sidebar.selectbox("Choose a module", ["Puzzle", "Career Prediction"])

if option == "Puzzle":
    st.title("Puzzle Module 🧩")
    st.write("This is where your MediaPipe puzzle logic will go.")

elif option == "Career Prediction":
    st.title("Career Prediction Game 🎓")
    name = st.text_input("Enter your name")
    subjects = st.text_input("Enter your subjects")
    hobbies = st.text_input("Enter your hobbies")

    if st.button("Predict Career"):
        career = predict_career(subjects, hobbies)
        st.success(f"{name}, we guess your future career is: {career} 🚀")