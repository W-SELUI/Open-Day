const fortune = (id, category, setup, twist, reaction) => ({
  id,
  category,
  lines: [setup, twist, reaction],
});

// Forty complete mini-stories, written as setup → twist → reaction.
// The final line is intentionally short because it lands as the visual punchline.
export const FORTUNES = [
  // CRUSH ALERT
  fortune(
    "crush-homework-message",
    "CRUSH ALERT",
    "Next week, your crush will finally message you first.",
    "You will open it. They need the answers for question four.",
    "EMOTIONAL DAMAGE",
  ),
  fortune(
    "crush-story-view",
    "CRUSH ALERT",
    "Tonight, you’ll post a story for one specific person.",
    "Everyone will view it—except them.",
    "DELUSION DETECTED",
  ),
  fortune(
    "crush-can-i-ask",
    "CRUSH ALERT",
    "At 11:48 PM, they’ll text, ‘Can I ask you something?’",
    "Then they will disappear for seventeen minutes.",
    "YOU’RE COOKED",
  ),
  fortune(
    "crush-old-photo",
    "CRUSH ALERT",
    "Very soon, you’ll accidentally like their photo from 2022.",
    "You can unlike it. The notification has already arrived.",
    "CAUGHT IN 4K",
  ),
  fortune(
    "crush-empty-seat",
    "CRUSH ALERT",
    "Tomorrow, your crush will choose the seat beside you.",
    "Only because every other seat is taken.",
    "STAY HUMBLE",
  ),

  // SCHOOL SURVIVAL
  fortune(
    "school-one-chapter",
    "SCHOOL SURVIVAL",
    "You’ll study every chapter for the next test except one.",
    "Guess which chapter is worth sixty marks.",
    "FINISHED",
  ),
  fortune(
    "school-data-bundle",
    "SCHOOL SURVIVAL",
    "At 11:59 PM, you’ll finally upload the assignment.",
    "Your data bundle will choose that moment to finish.",
    "CHARACTER DEVELOPMENT",
  ),
  fortune(
    "school-group-project",
    "SCHOOL SURVIVAL",
    "Your teammate will promise to finish their part tonight.",
    "Tomorrow morning they’ll ask, ‘Wait, what’s our topic?’",
    "GROUP PROJECT VICTIM",
  ),
  fortune(
    "school-wild-guess",
    "SCHOOL SURVIVAL",
    "The teacher will ask a question nobody understands.",
    "You’ll guess randomly—and somehow be correct.",
    "PLOT ARMOUR",
  ),
  fortune(
    "school-wrong-slide",
    "SCHOOL SURVIVAL",
    "Your presentation will open on the completely wrong slide.",
    "You’ll say, ‘As you can clearly see,’ and the teacher will nod.",
    "BLUFF SUCCESSFUL",
  ),

  // GROUP CHAT LEAK
  fortune(
    "chat-quick-plan",
    "GROUP CHAT LEAK",
    "Someone will type ‘quick plan’ in the group chat.",
    "Sixty-three messages later, there will still be no plan.",
    "NO PLAN DETECTED",
  ),
  fortune(
    "chat-five-minutes",
    "GROUP CHAT LEAK",
    "You’ll leave your phone alone for five minutes.",
    "You’ll return to forty messages and one unexplained argument.",
    "LORE MISSED",
  ),
  fortune(
    "chat-voice-note",
    "GROUP CHAT LEAK",
    "A seven-minute voice note is heading toward your phone.",
    "They’ll say ‘long story short’ at six minutes forty-five.",
    "PODCAST DETECTED",
  ),
  fortune(
    "chat-deleted-message",
    "GROUP CHAT LEAK",
    "Someone will send a message and delete it immediately.",
    "Six people will reply with the screenshot.",
    "TOO LATE",
  ),
  fortune(
    "chat-sticker-war",
    "GROUP CHAT LEAK",
    "One harmless sticker will start a war tonight.",
    "By sunrise, your worst photo will be public property.",
    "STICKER WAR",
  ),

  // FRIENDSHIP CRIME
  fortune(
    "friend-one-chip",
    "FRIENDSHIP CRIME",
    "At lunchtime, your friend will ask for one chip.",
    "The packet will return empty and somehow still in their hand.",
    "FRIENDSHIP TAX",
  ),
  fortune(
    "friend-im-outside",
    "FRIENDSHIP CRIME",
    "Friday after school, your friend will text, ‘I’m outside.’",
    "The Oracle checked. They haven’t even chosen an outfit.",
    "SEE YOU NEXT WEEK",
  ),
  fortune(
    "friend-camera",
    "FRIENDSHIP CRIME",
    "Your friend will take one photo without warning.",
    "By lunchtime, your face will be the group’s newest sticker.",
    "CAREER OVER",
  ),
  fortune(
    "friend-charger",
    "FRIENDSHIP CRIME",
    "Someone will borrow your charger for five minutes.",
    "It will begin a completely new life at their house.",
    "CHARGER KIDNAPPED",
  ),
  fortune(
    "friend-honest-opinion",
    "FRIENDSHIP CRIME",
    "You’ll ask your friend for one honest opinion.",
    "They’ll respond with evidence, witnesses and a full timeline.",
    "ASKED TOO MUCH",
  ),

  // PUBLIC DAMAGE
  fortune(
    "public-wrong-wave",
    "PUBLIC DAMAGE",
    "You’ll wave confidently at someone across the room.",
    "They’ll be waving at the person directly behind you.",
    "RECOVERY SUCCESSFUL",
  ),
  fortune(
    "public-front-camera",
    "PUBLIC DAMAGE",
    "Your front camera will open when you least expect it.",
    "You’ll meet yourself from an angle nobody approved.",
    "SURPRISE BOSS FIGHT",
  ),
  fortune(
    "public-you-too",
    "PUBLIC DAMAGE",
    "Someone will wish you happy birthday.",
    "Your mouth will automatically reply, ‘You too.’",
    "MOVE COUNTRIES",
  ),
  fortune(
    "public-push-door",
    "PUBLIC DAMAGE",
    "A door marked PUSH will challenge you personally.",
    "You’ll pull it twice, then look around for witnesses.",
    "DOOR: 2 · YOU: 0",
  ),
  fortune(
    "public-chair-noise",
    "PUBLIC DAMAGE",
    "Your chair will make one deeply suspicious noise.",
    "The room will go silent, so you’ll stare angrily at the chair.",
    "CASE CLOSED",
  ),

  // MAIN CHARACTER
  fortune(
    "main-class-answer",
    "MAIN CHARACTER EVENT",
    "The class genius won’t know the answer tomorrow.",
    "You will—and the whole room will turn toward you.",
    "MAIN CHARACTER",
  ),
  fortune(
    "main-save-project",
    "MAIN CHARACTER EVENT",
    "Your group presentation will start falling apart.",
    "You’ll fix everything with one sentence and a working cable.",
    "CARRIED THE TEAM",
  ),
  fortune(
    "main-comeback",
    "MAIN CHARACTER EVENT",
    "The perfect comeback is finally heading your way.",
    "For once, it will arrive during the actual conversation.",
    "LEGENDARY COMEBACK",
  ),
  fortune(
    "main-one-hand-catch",
    "MAIN CHARACTER EVENT",
    "Something will fly toward you without warning.",
    "You’ll catch it with one hand while barely looking.",
    "AURA +1000",
  ),
  fortune(
    "main-outfit",
    "MAIN CHARACTER EVENT",
    "Your outfit will receive compliments from three different people.",
    "You’ll act surprised while remembering every single word.",
    "CONFIDENCE UNLOCKED",
  ),

  // SUSPICIOUSLY LUCKY
  fortune(
    "luck-homework",
    "SUSPICIOUSLY LUCKY",
    "The teacher will forget to collect the homework tomorrow.",
    "The entire class will agree through silent eye contact.",
    "CLASS UNITY",
  ),
  fortune(
    "luck-bus",
    "SUSPICIOUSLY LUCKY",
    "The bus will arrive exactly as you reach the stop.",
    "You won’t even need to pretend you weren’t running.",
    "THE CHOSEN ONE",
  ),
  fortune(
    "luck-pocket-money",
    "SUSPICIOUSLY LUCKY",
    "You’ll find money in a pocket you forgot existed.",
    "It won’t change your life, but it will secure a snack.",
    "SMALL WIN",
  ),
  fortune(
    "luck-test-postponed",
    "SUSPICIOUSLY LUCKY",
    "The test you are not ready for will be postponed.",
    "You have one extra day. Do not waste this miracle.",
    "LOCK IN",
  ),
  fortune(
    "luck-last-serving",
    "SUSPICIOUSLY LUCKY",
    "Your favourite food will be the final serving available.",
    "The next person will arrive exactly two seconds too late.",
    "DESTINY",
  ),

  // OPEN DAY CHAOS
  fortune(
    "open-day-food",
    "OPEN DAY CHAOS",
    "You’ll tell everyone you came to explore your future.",
    "Ten minutes later, you’ll be following the smell of free food.",
    "PRIORITIES",
  ),
  fortune(
    "open-day-wrong-tour",
    "OPEN DAY CHAOS",
    "You’ll accidentally join the wrong campus tour.",
    "You’ll stay and discover you actually like the programme.",
    "PLOT TWIST",
  ),
  fortune(
    "open-day-high-score",
    "OPEN DAY CHAOS",
    "You’ll say, ‘I’m only trying this game once.’",
    "A stranger will beat your score while their friends celebrate.",
    "RUN IT BACK",
  ),
  fortune(
    "open-day-rival-school",
    "OPEN DAY CHAOS",
    "Someone from a rival school will challenge your group.",
    "The game will end, but the argument definitely will not.",
    "PEACE CANCELLED",
  ),
  fortune(
    "open-day-new-friend",
    "OPEN DAY CHAOS",
    "A stranger will laugh at the exact same ridiculous moment as you.",
    "Five minutes later, you’ll be talking like old friends.",
    "NEW FRIEND UNLOCKED",
  ),
];

export function selectFortune(history = [], random = Math.random) {
  const knownIds = new Set(FORTUNES.map((item) => item.id));
  const cleanHistory = history.filter((id) => knownIds.has(id));
  let candidates = FORTUNES.filter((item) => !cleanHistory.includes(item.id));

  if (!candidates.length) {
    const lastId = cleanHistory.at(-1);
    candidates = FORTUNES.filter((item) => item.id !== lastId);
  }

  const selected =
    candidates[Math.floor(random() * candidates.length)] || FORTUNES[0];
  const nextHistory = [
    ...cleanHistory.filter((id) => id !== selected.id),
    selected.id,
  ].slice(-FORTUNES.length);
  return { fortune: selected, history: nextHistory };
}
