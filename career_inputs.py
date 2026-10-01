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
    "Physical Education", "Music", "Hindi", "Vosa Vaka Viti (iTaukei)",
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

# Keep the visible choices short, but send the model a little more context.
# The training CSV contains descriptive phrases (for example, "solving bugs"
# and "working with circuits").  A checklist only gives us a label, so these
# phrases preserve the convenience of taps without throwing away meaning.
SUBJECT_TEXT = {
    "Maths": "Maths, mathematics, numbers, calculations, problem solving",
    "English": "English, communication, reading, writing, storytelling",
    "Biology": "Biology, living things, health, nature, science",
    "Chemistry": "Chemistry, laboratory work, experiments, science",
    "Physics": "Physics, mechanics, engineering, circuits, problem solving",
    "Computer Studies": "Computer Studies, computer science, computing, digital technology",
    "Business Studies": "Business Studies, business, entrepreneurship, management, marketing",
    "Accounting": "Accounting, budgets, finance, figures, spreadsheets",
    "Geography": "Geography, maps, environment, places, travel",
    "Agriculture": "Agriculture, farming, crops, soil, nature",
    "Basic Science": "Basic Science, science, experiments, research",
    "Art": "Art, drawing, visual design, creativity",
    "Economics": "Economics, money, markets, budgets, decision making",
    "Commercial Studies": "Commercial Studies, business, finance, communication",
    "History": "History, research, evidence, storytelling, communication",
    "Social Science": "Social Science, people, society, research, community",
    "Social Studies": "Social Studies, people, society, community, communication",
    "Technical Drawing": "Technical Drawing, design, drafting, building, engineering",
    "Basic Technology": "Basic Technology, tools, building, fixing, technology",
    "Applied Technology": "Applied Technology, design, building, fixing, technology",
    "Home Economics": "Home Economics, food, cooking, fashion, budgeting",
    "Physical Education": "Physical Education, sports, fitness, movement, coaching",
    "Music": "Music, sound, audio, performance, creativity",
    "Hindi": "Hindi, language, reading, writing, communication",
    "Vosa Vaka Viti (iTaukei)": "Vosa Vaka Viti, language, culture, communication",
    "French": "French, language, communication, cultures",
    "Japanese": "Japanese, language, communication, cultures",
    "Chinese": "Chinese, language, communication, cultures",
    "Office Technology": "Office Technology, computers, organisation, communication",
    "Design Technology": "Design Technology, design, digital technology, building, creativity",
    "Statistics": "Statistics, data, numbers, patterns, analysis",
    "English Literature": "English Literature, reading, writing, storytelling, analysis",
    "Health Science": "Health Science, biology, health, symptoms, helping people",
}
INTEREST_TEXT = {
    "Gaming": "gaming, game design, game development, interactive challenges",
    "Music": "music, sound, audio, performance, creativity",
    "Sports": "sports, fitness, movement, coaching, teamwork",
    "Drawing & design": "drawing, designing, visual design, creativity",
    "Helping people": "helping people, care, support, health, community",
    "Coding": "coding, programming, software, websites, solving bugs",
    "Cooking": "cooking, food, recipes, kitchen, creativity",
    "Fixing things": "fixing, repairing, building, tools, mechanics",
    "Outdoors & nature": "outdoors, nature, environment, wildlife",
    "Reading & writing": "reading, writing, journalism, storytelling",
    "Solving puzzles": "solving puzzles, problem solving, logic, analysis, investigation",
    "Running a business": "running a business, entrepreneurship, budgeting, marketing",
    "Singing": "singing, music, performance, sound",
    "Photography": "photography, taking photos, photos, editing images",
    "Making videos": "making videos, filming, editing, storytelling",
    "Sewing & fashion": "sewing, fashion, clothing, design, creativity",
    "Farming & gardening": "farming, gardening, crops, plants, nature",
    "Fishing": "fishing, fish, ocean, water, outdoors",
    "Caring for animals": "caring for animals, pets, wildlife, health",
    "Science experiments": "science experiments, research, laboratory work, testing",
    "Building things": "building things, construction, design, engineering",
    "Working with numbers": "working with numbers, figures, budgets, data, analysis",
    "Debating": "debating, communication, evidence, making a case",
    "Teaching others": "teaching others, explaining, education, helping people",
    "Volunteering": "volunteering, helping people, community, support",
    "Organising events": "organising events, planning, people, communication",
    "Travel & cultures": "travelling, learning about cultures, tourism, communication",
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
