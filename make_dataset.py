import csv
from itertools import product
from pathlib import Path


CAREER_PROFILES = {
    "Accountant": {
        "subjects": [
            "Mathematics, Economics, Accounting",
            "Statistics, Business Studies, Mathematics",
            "Economics, Computer Science, Accounting",
        ],
        "hobbies": [
            "budgeting, tracking expenses, working with spreadsheets",
            "solving number problems, planning costs, organising records",
            "analysing data, comparing prices, keeping things accurate",
        ],
        "strengths": [
            "careful with details and deadlines",
            "interested in responsible financial decisions",
            "enjoys finding patterns in numbers",
        ],
    },
    "Designer": {
        "subjects": [
            "Art, Design, Digital Technology",
            "Visual Arts, Media Studies, English",
            "Design, Mathematics, Computer Science",
        ],
        "hobbies": [
            "drawing, creating posters, experimenting with colours",
            "photography, editing videos, designing social media graphics",
            "sketching ideas, making models, improving how things look",
        ],
        "strengths": [
            "enjoys turning ideas into visuals",
            "likes creative problem solving",
            "notices colours, layouts and details",
        ],
    },
    "Doctor": {
        "subjects": [
            "Biology, Chemistry, Health Science",
            "Biology, Physics, Physical Education",
            "Chemistry, Mathematics, Health Education",
        ],
        "hobbies": [
            "learning about the human body, first aid, helping people",
            "reading about health, caring for others, solving medical puzzles",
            "wellbeing, volunteering, understanding how treatments work",
        ],
        "strengths": [
            "calm when people need support",
            "interested in improving people's health",
            "patient when solving difficult problems",
        ],
    },
    "Engineer": {
        "subjects": [
            "Mathematics, Physics, Design Technology",
            "Physics, Chemistry, Mathematics",
            "Computer Science, Mathematics, Design",
        ],
        "hobbies": [
            "building models, fixing things, robotics",
            "working out how machines work, designing solutions, making prototypes",
            "coding small projects, problem solving, testing ideas",
        ],
        "strengths": [
            "enjoys practical challenges",
            "likes improving how things work",
            "thinks carefully about systems and structures",
        ],
    },
    "Entrepreneur": {
        "subjects": [
            "Business Studies, Economics, Digital Technology",
            "Economics, Accounting, Mathematics",
            "Business Studies, Media Studies, English",
        ],
        "hobbies": [
            "coming up with ideas, planning events, selling things",
            "marketing, creating projects, organising teams",
            "learning how businesses work, budgeting, solving customer problems",
        ],
        "strengths": [
            "likes turning ideas into action",
            "comfortable taking initiative",
            "enjoys finding opportunities",
        ],
    },
    "Lawyer": {
        "subjects": [
            "English, History, Social Studies",
            "Law, Economics, English",
            "History, Politics, Debate",
        ],
        "hobbies": [
            "debating issues, reading about current events, public speaking",
            "solving arguments, researching rules, helping people understand choices",
            "writing persuasive points, analysing evidence, discussing fairness",
        ],
        "strengths": [
            "enjoys clear reasoning",
            "cares about fairness and justice",
            "confident explaining an argument",
        ],
    },
    "Musician": {
        "subjects": [
            "Music, Art, English",
            "Music, Media Studies, Digital Technology",
            "Music, Mathematics, Drama",
        ],
        "hobbies": [
            "playing instruments, writing songs, performing",
            "recording music, listening to different styles, practising rhythms",
            "singing, creating beats, collaborating with performers",
        ],
        "strengths": [
            "enjoys expressing ideas through sound",
            "patiently practises skills",
            "likes performing and working creatively with others",
        ],
    },
    "Scientist": {
        "subjects": [
            "Biology, Chemistry, Environmental Science",
            "Chemistry, Physics, Mathematics",
            "Biology, Geography, Computer Science",
        ],
        "hobbies": [
            "running experiments, asking why things happen, discovering new ideas",
            "adventure, hiking, exploring nature, learning about wildlife",
            "researching, analysing results, testing theories",
        ],
        "strengths": [
            "curious about how the world works",
            "enjoys careful investigation",
            "likes collecting evidence before making conclusions",
        ],
    },
    "Software Developer": {
        "subjects": [
            "Computer Science, Mathematics, Digital Technology",
            "Computer Science, Physics, Mathematics",
            "Digital Technology, Design, English",
        ],
        "hobbies": [
            "coding projects, making games, solving logic puzzles",
            "building websites, testing apps, learning new technology",
            "creating programs, debugging, designing user experiences",
        ],
        "strengths": [
            "enjoys breaking big problems into steps",
            "likes testing and improving ideas",
            "interested in how software works",
        ],
    },
    "Teacher": {
        "subjects": [
            "English, History, Social Studies",
            "Mathematics, Science, English",
            "Art, Music, English",
        ],
        "hobbies": [
            "explaining ideas, helping classmates, leading study groups",
            "creating lessons, mentoring younger students, public speaking",
            "reading, learning new topics, making difficult things easier",
        ],
        "strengths": [
            "patient when others are learning",
            "enjoys helping people grow",
            "communicates ideas clearly",
        ],
    },
    "Mathematician": {
        "subjects": [
            "Mathematics, Calculus, Statistics",
            "Algebra, Geometry, Mathematics",
            "Calculus, Physics, Mathematics",
        ],
        "hobbies": [
            "solving difficult equations, patterns, logical puzzles",
            "proofs, number theory, mathematical challenges",
            "probability, analysing data, finding patterns in numbers",
        ],
        "strengths": [
            "enjoys abstract thinking",
            "patiently works through complex problems",
            "likes using logic to find answers",
        ],
    },
}


rows = []
student_number = 1

for career, profile in CAREER_PROFILES.items():
    for subjects, hobbies, strength in product(
        profile["subjects"],
        profile["hobbies"],
        profile["strengths"],
    ):
        rows.append(
            {
                "name": f"Student_{student_number:03}",
                "subjects": subjects,
                "hobbies": f"{hobbies}, {strength}",
                "career": career,
            }
        )
        student_number += 1


assert len(rows) == 297

output_path = Path(__file__).with_name("data_v2.csv")

with output_path.open("w", newline="", encoding="utf-8") as file:
    writer = csv.DictWriter(
        file,
        fieldnames=["name", "subjects", "hobbies", "career"],
    )
    writer.writeheader()
    writer.writerows(rows)

print(f"Created {output_path.name} with {len(rows)} samples.")