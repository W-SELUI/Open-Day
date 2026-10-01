"""Presentation only: never changes the classifier's careers or ranking.

Edit CAREER_CARDS to change the one-liners, badges or visual families.
No names, choices or images are saved by this module.
"""

THEMES = {
    "tech": ("Digital world", "#6ee7ff", "#a89cff"),
    "engineering": ("Build tomorrow", "#80baff", "#f5db8e"),
    "science": ("Discovery mode", "#b9a1ff", "#6ef0d0"),
    "health": ("Human impact", "#75efd6", "#a2caff"),
    "creative": ("Create something", "#ffb3db", "#bfa2ff"),
    "business": ("Big idea energy", "#f5dc85", "#88dcff"),
    "community": ("People first", "#ffb698", "#f2df9c"),
    "nature": ("Beyond the classroom", "#a7f393", "#68ddeb"),
    "adventure": ("World unlocked", "#83d9ff", "#bcb2ff"),
    "food": ("Made from scratch", "#ffca85", "#f9a4b9"),
}

# career: (theme, illustration, badge, short joke)
CAREER_CARDS = {
    "Accountant": ("business", "chart", "Every dollar accounted for", "The group owes you $2 each. Yes, you made a spreadsheet."),
    "Agriculture Technologist": ("nature", "leaf", "Grow smarter", "Your plants get better tech support than the school computers."),
    "AI Engineer": ("tech", "chip", "Teach the machines", "You teach computers to learn. Your printer still refuses."),
    "Animator": ("creative", "spark", "Bring ideas to life", "You spent three hours making a character blink. Worth it."),
    "Architect": ("engineering", "building", "Imagine. Sketch. Build.", "You don't doodle in class. You design the next campus."),
    "Biomedical Scientist": ("science", "molecule", "Small clues. Big discoveries.", "Everyone sees a tiny sample. You see a whole investigation."),
    "Chef": ("food", "chef", "Taste has entered the chat", "Your friends say 'just a bite.' There goes your entire dish."),
    "Civil Engineer": ("engineering", "bridge", "Make the world work", "You build bridges. The group chat can sort out its own drama."),
    "Cybersecurity Analyst": ("tech", "shield", "Protect the digital world", "Your first case: finding out who still uses password123."),
    "Data Analyst": ("tech", "chart", "Find the hidden pattern", "You brought charts to an argument. Honestly, fair enough."),
    "Dentist": ("health", "tooth", "A reason to smile", "Everyone suddenly remembers to floss when they see you."),
    "Digital Marketer": ("business", "megaphone", "Make them stop scrolling", "You know exactly why they clicked. Even if they won't admit it."),
    "Doctor": ("health", "pulse", "Make a difference", "Your relatives are already practising: 'Quick question, Doctor...'"),
    "Electrical Engineer": ("engineering", "bolt", "Power the possibilities", "You make circuits work. The group project is another story."),
    "Entrepreneur": ("business", "rocket", "Start something of your own", "You saw the lunch queue and immediately spotted a business idea."),
    "Environmental Scientist": ("nature", "leaf", "Think planet-sized", "You came for fresh air. You stayed to investigate its quality."),
    "Event Planner": ("business", "spark", "Turn plans into moments", "Six people, six excuses. Somehow you still organised the party."),
    "Fashion Designer": ("creative", "scissors", "Wear your imagination", "The dress code said 'be creative.' You took that personally."),
    "Film Editor": ("creative", "film", "Find the perfect cut", "You can fix awkward pauses. Just not the ones in real life."),
    "Forensic Scientist": ("science", "search", "Follow the evidence", "Someone took your lunch. Bad choice. You collect evidence."),
    "Game Developer": ("tech", "controller", "Build the next obsession", "Your game has bugs. Your friends call them secret features."),
    "Graphic Designer": ("creative", "pen", "Make ideas visible", "'Can you make the logo bigger?' Your future just said hello."),
    "Human Resources Manager": ("business", "people", "Build a better team", "The group chat needs a mediator. Everyone just looked at you."),
    "Journalist": ("community", "mic", "Ask the next question", "'Who said that?' isn't gossip when you check your sources."),
    "Language Specialist": ("community", "chat", "Connect across languages", "You switch languages mid-sentence. Everyone else is buffering."),
    "Lawyer": ("community", "scales", "Make your case", "You brought evidence to a family argument. Bold move."),
    "Marine Biologist": ("nature", "fish", "An ocean of questions", "Everyone's looking at the beach. You're looking at the tide pool."),
    "Mechanical Engineer": ("engineering", "gear", "Make things move", "You took it apart to see how it works. Now for the fun part."),
    "Music Producer": ("creative", "music", "Make the room feel it", "Your friends hear a song. You hear what you'd change in the mix."),
    "Network Engineer": ("tech", "network", "Keep the world connected", "The Wi-Fi goes down. Suddenly everybody knows your name."),
    "Nurse": ("health", "pulse", "Care that makes a difference", "You packed the first-aid kit. Your friends packed only snacks."),
    "Pharmacist": ("health", "capsule", "Precision meets care", "You actually read the tiny instructions. All of them."),
    "Photographer": ("creative", "camera", "Catch the moment", "'One more photo.' Famous last words. You're on photo 47."),
    "Physiotherapist": ("health", "motion", "Help people move forward", "Your friends see a chair. You see everyone's terrible posture."),
    "Pilot": ("adventure", "plane", "Take the long way up", "Your future commute has a much better view than the bus."),
    "Psychologist": ("health", "chat", "Listen. Understand. Support.", "Everyone tells you the full story. Even when you only asked 'hi'."),
    "Renewable Energy Engineer": ("engineering", "sun", "Power a brighter tomorrow", "Everyone checks the weather for a picnic. You check the power potential."),
    "Robotics Engineer": ("engineering", "robot", "Ideas with moving parts", "You built a robot helper. It also needs help. Classic."),
    "Social Worker": ("community", "people", "Be in someone's corner", "You asked 'are you okay?' and actually waited for the answer."),
    "Software Developer": ("tech", "code", "Turn ideas into apps", "You build apps. That doesn't mean you can fix everyone's printer."),
    "Sports Coach": ("community", "trophy", "Bring out their best", "You said 'one last lap.' Nobody believes you anymore."),
    "Teacher": ("community", "book", "Start a lightbulb moment", "You explained it once. Then again. Welcome to the profession."),
    "Tourism Manager": ("adventure", "compass", "Make the trip worth it", "Your friends brought a suitcase. You brought the entire itinerary."),
    "UI/UX Designer": ("creative", "layout", "Make it feel effortless", "You moved a button two pixels. Somehow it really is better."),
    "Veterinarian": ("health", "paw", "Care for every creature", "Your patients won't say thank you. Tail wags count though."),
}

# Older data.csv labels still receive intentional artwork and copy.
LEGACY_CARDS = {
    "Engineer": ("engineering", "gear", "Build tomorrow", "You took it apart. Now everyone wants to know if it'll work again."),
    "Scientist": ("science", "flask", "Stay curious", "Everyone asks 'why?' You actually set up the experiment."),
    "Musician": ("creative", "music", "Find your sound", "You called it practice. The neighbours called it a concert."),
    "Designer": ("creative", "pen", "Make something different", "You said 'quick sketch.' Three notebooks later, here we are."),
    "Mathematician": ("science", "chart", "See the pattern", "You solved for x. Your friends are still asking why it left."),
}


def career_card(career: str) -> dict:
    """A safe fallback also supports careers added to the dataset later."""
    theme, icon, badge, line = CAREER_CARDS.get(career, LEGACY_CARDS.get(career, (
        "adventure", "compass", "Keep exploring",
        "Your next chapter just got interesting. Keep your options open.",
    )))
    family, accent, secondary = THEMES[theme]
    return dict(career=career, theme=theme, icon=icon, badge=badge, line=line,
                family=family, accent=accent, secondary=secondary)


def build_reveal_payload(predictions, nickname="", choices=(), reveal_id="") -> dict:
    """Preserve model order; never invent confidence, skills or new predictions."""
    cards = [career_card(str(p["career"])) for p in predictions]
    return {
        "id": str(reveal_id),
        "nickname": str(nickname).strip()[:40],
        "choices": list(dict.fromkeys(str(c).strip()[:45] for c in choices if str(c).strip()))[:6],
        "cards": cards,
    }
