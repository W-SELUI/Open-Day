/* Lightweight CCv2 renderer. No network requests, storage or third-party code. */
export const ICONS = {
  code: '<path d="m37 34-19 16 19 16m26-32 19 16-19 16M57 23 43 77"/>',
  chip: '<rect x="25" y="25" width="50" height="50" rx="9"/><rect x="39" y="39" width="22" height="22" rx="3"/><path d="M36 14v11m14-11v11m14-11v11M36 75v11m14-11v11m14-11v11M14 36h11m-11 14h11m-11 14h11m50-28h11m-11 14h11m-11 14h11"/>',
  shield: '<path d="m50 12 30 12v25c0 19-20 33-30 39-10-6-30-20-30-39V24z"/><path d="m34 49 12 12 23-25"/>',
  chart: '<path d="M20 18v62h65M35 65V48m18 17V36m18 29V23"/><path d="m31 32 20-13 16 3 13-12"/>',
  network: '<circle cx="50" cy="50" r="13"/><rect x="37" y="8" width="26" height="13" rx="3"/><rect x="9" y="72" width="26" height="17" rx="3"/><rect x="65" y="72" width="26" height="17" rx="3"/><path d="M50 21v16M42 61 26 72m32-11 16 11"/>',
  controller: '<path d="M31 33h38c18 0 26 37 18 43-9 7-18-8-25-9H38c-7 1-16 16-25 9-8-6 0-43 18-43Z"/><path d="M25 45v18m-9-9h18"/><circle cx="68" cy="48" r="3"/><circle cx="77" cy="59" r="3"/>',
  building: '<path d="M20 85V43l30-28 30 28v42M13 85h74M40 85V60h20v25M32 43h7m22 0h7"/><path d="M50 15V5"/>',
  bridge: '<path d="M10 68h80M23 85V26m54 59V26M10 42q40 38 80 0M37 58v10m13-7v7m13-10v10"/>',
  bolt: '<path d="M57 8 20 57h27l-4 35 37-51H53z"/>',
  gear: '<path d="m41 13-3 12-9 5-12-3-8 15 9 8v10l-8 9 8 14 12-3 9 5 3 11h17l3-12 9-5 12 3 8-15-9-8V49l8-9-8-14-12 3-9-5-3-11z" transform="translate(0 -5)"/><circle cx="50" cy="50" r="16"/>',
  sun: '<circle cx="50" cy="50" r="21"/><path d="M50 8v12m0 60v12M8 50h12m60 0h12M20 20l9 9m42 42 9 9M20 80l9-9m42-42 9-9"/>',
  robot: '<rect x="18" y="30" width="64" height="53" rx="14"/><path d="M50 30V17M8 47v22m84-22v22M36 68h28"/><circle cx="50" cy="12" r="5"/><circle cx="35" cy="49" r="4"/><circle cx="65" cy="49" r="4"/>',
  molecule: '<circle cx="50" cy="50" r="10"/><circle cx="25" cy="20" r="9"/><circle cx="82" cy="31" r="9"/><circle cx="71" cy="82" r="9"/><circle cx="17" cy="73" r="9"/><path d="m32 28 12 14m15 3 14-9M56 59l10 15M41 57 25 68"/>',
  flask: '<path d="M37 12h26M41 12v28L18 77q-7 12 9 12h46q16 0 9-12L59 40V12M31 59h38"/><circle cx="42" cy="72" r="3"/><circle cx="57" cy="80" r="2"/>',
  search: '<circle cx="43" cy="42" r="27"/><path d="m63 63 25 25M31 42h24m-12-12v24"/>',
  pulse: '<path d="M12 55h20l10-29 16 51 12-32 8 10h12M19 28h12m-6-6v12"/>',
  tooth: '<path d="M50 24C20 3 9 28 20 48c9 16 5 38 17 40 9 1 4-31 13-31s4 32 13 31c12-2 8-24 17-40C91 28 80 3 50 24Z"/>',
  capsule: '<path d="M23 77c-10-10-10-22 0-32l22-22c10-10 22-10 32 0s10 22 0 32L55 77c-10 10-22 10-32 0Z"/><path d="m34 34 32 32"/>',
  motion: '<circle cx="59" cy="18" r="9"/><path d="m32 40 18-8 13 18 18 5M49 33l-9 27 20 14 4 18M40 60 26 82H11"/>',
  paw: '<ellipse cx="50" cy="65" rx="23" ry="20"/><ellipse cx="23" cy="39" rx="8" ry="12" transform="rotate(-25 23 39)"/><ellipse cx="41" cy="24" rx="8" ry="12"/><ellipse cx="62" cy="25" rx="8" ry="12"/><ellipse cx="79" cy="42" rx="8" ry="12" transform="rotate(25 79 42)"/>',
  pen: '<path d="m50 12 30 40-12 32H32L20 52zM50 12v35M32 84h36"/><circle cx="50" cy="54" r="7"/>',
  spark: '<path d="m50 10 9 29 31 11-31 11-9 29-9-29L10 50l31-11zM80 10v16m-8-8h16"/>',
  scissors: '<circle cx="24" cy="70" r="13"/><circle cx="75" cy="70" r="13"/><path d="m32 59 42-46M66 59 25 13"/>',
  film: '<rect x="13" y="22" width="74" height="58" rx="7"/><path d="M28 22v58m44-58v58M14 36h14m-14 14h14m-14 15h14m44-29h14M72 50h14M72 65h14m-43-27 16 13-16 13z"/>',
  music: '<path d="M39 70V26l40-12v43M39 40l40-12"/><ellipse cx="26" cy="74" rx="13" ry="10"/><ellipse cx="66" cy="61" rx="13" ry="10"/>',
  camera: '<path d="M34 29l7-12h23l7 12h13q6 0 6 6v42q0 6-6 6H16q-6 0-6-6V35q0-6 6-6z"/><circle cx="51" cy="55" r="19"/><path d="M75 41h4"/>',
  layout: '<rect x="12" y="18" width="76" height="66" rx="7"/><path d="M12 35h76M23 27h1m8 0h1M25 47h23v24H25zm35 0h15M60 59h15M60 71h10"/>',
  rocket: '<path d="M38 63c-11-19 5-44 42-47 1 36-23 55-42 47Z"/><circle cx="61" cy="35" r="8"/><path d="m33 43-18 5-1 18 22-6m17 5-2 21-18 1-1-17M24 72 11 85"/>',
  megaphone: '<path d="m17 43 60-23v58L17 58zM30 64l6 22h14l-8-17M88 39l8-5m-8 18h8"/>',
  people: '<circle cx="36" cy="32" r="15"/><path d="M9 84V73c0-25 54-25 54 0v11M67 18c23 0 23 28 0 28m10 13c13 2 17 11 17 25"/>',
  chat: '<path d="M16 19h68v49H48L26 85V68H16zM30 35h41M30 48h29"/>',
  scales: '<path d="M50 12v70M31 85h38M20 30h60M22 30 8 59h28zM78 30 64 59h28z"/>',
  mic: '<rect x="36" y="10" width="28" height="49" rx="14"/><path d="M24 43v7a26 26 0 0 0 52 0v-7M50 76v13M36 90h28"/>',
  trophy: '<path d="M29 14h42v31a21 21 0 0 1-42 0zM29 25H12v14c0 12 10 17 20 17m39-31h17v14c0 12-10 17-20 17M50 66v17M30 90h40"/>',
  book: '<path d="M50 27c-14-12-29-12-39-6v58c14-6 27-3 39 6 12-9 25-12 39-6V21c-10-6-25-6-39 6v58M23 34l15 4m-15 12 15 4m24-16 15-4M62 54l15-4"/>',
  leaf: '<path d="M20 75C5 42 36 17 84 14c2 53-23 76-58 58M16 87l49-49M36 65V43m0 22h23"/>',
  fish: '<path d="M13 50c22-34 45-34 64-9l15-15v48L77 59C58 84 35 84 13 50Z"/><circle cx="34" cy="44" r="3"/><path d="M54 22v54"/>',
  plane: '<path d="m47 12 6 0 7 30 30 16v10L60 58l-4 22 12 8v6L50 88l-18 6v-6l12-8-4-22-30 10V58l30-16z"/>',
  compass: '<circle cx="50" cy="50" r="36"/><path d="m66 30-9 28-27 12 11-28zM50 7V2m0 96v-5M7 50H2m96 0h-5"/>',
  chef: '<path d="M28 61C5 58 10 29 30 29c5-23 36-23 42 0 20 0 25 29 2 32v24H28zM28 72h46M41 53v8m17-8v8"/>',
};

export function xml(value) {
  return String(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/[<>&"']/g, c => ({'<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&apos;'}[c]));
}

export function monogram(career) {
  return String(career).split(/[\s/]+/).filter(Boolean).map(w => w[0]).join('').slice(0, 3).toUpperCase();
}

// One illustration system, with different objects and scenery for each family.
export function sceneSVG(card) {
  const a = /^#[0-9a-f]{6}$/i.test(card.accent) ? card.accent : '#6ee7ff';
  const b = /^#[0-9a-f]{6}$/i.test(card.secondary) ? card.secondary : '#a89cff';
  const scenery = {
    tech: '<path d="M35 100h85v60h50M430 260h70v65h70M85 305v-65h70M460 90v60h75"/><circle cx="35" cy="100" r="5"/><circle cx="570" cy="325" r="5"/>',
    engineering: '<path d="M50 295h500M70 295V125h80v170m310 0V185h70v110M45 100h140M70 85v30m80-30v30M400 330h155"/>',
    science: '<circle cx="100" cy="118" r="18"/><circle cx="150" cy="80" r="10"/><path d="m114 106 28-20M445 298l55 30 35-40"/><circle cx="445" cy="298" r="11"/><circle cx="500" cy="328" r="17"/><circle cx="535" cy="288" r="10"/>',
    health: '<path d="M40 210h55l15-40 25 75 20-40h30m240 0h36l20-45 20 75 20-30h35M100 70h30m-15-15v30M495 315h30m-15-15v30"/>',
    creative: '<path d="m75 105 45-35 35 45-45 35zM440 290l35-40 30 45 30-40"/><circle cx="480" cy="100" r="25"/><path d="M55 305h70m-35-35v70"/>',
    business: '<path d="M55 285v-50h27v50m14 0v-85h27v85m14 0V165h27v120M440 112l32-27 33 11 38-37m-19 0h19v19"/>',
    community: '<circle cx="102" cy="105" r="15"/><path d="M72 151c0-38 60-38 60 0M460 285h70v45h-25l-22 17v-17h-23zM88 295h45m-22-22v45"/>',
    nature: '<path d="M35 298q40-32 80 0t80 0M405 115q40-32 80 0t80 0M80 170c-30-45 20-68 60-67 0 42-15 65-60 67l40-47"/>',
    adventure: '<path d="M35 290q95-140 165-25M410 120q70-90 145 35M454 87l23-7-12 22zM80 90h35m-17-17v35M500 300h35m-17-17v35"/>',
    food: '<path d="M68 267h85q-3 48-42 48t-43-48zM95 245q-14-15 0-30t0-30M124 245q-14-15 0-30M449 100h70m-35-35v70"/><circle cx="500" cy="290" r="25"/>',
  }[card.theme] || '';
  return `<svg xmlns="http://www.w3.org/2000/svg" class="cq-scene" viewBox="0 0 600 400" aria-hidden="true">
    <g fill="none" stroke="${a}" stroke-width="2" opacity=".36">${scenery}</g>
    <circle cx="300" cy="200" r="145" fill="${a}" fill-opacity=".035" stroke="${a}" stroke-opacity=".25"/>
    <g class="cq-orbit" fill="none" stroke="${a}" stroke-width="1.5" opacity=".6"><ellipse cx="300" cy="200" rx="182" ry="93" transform="rotate(-35 300 200)"/><circle cx="448" cy="110" r="7" fill="${b}" stroke="none"/></g>
    <path d="m300 69 114 65v132l-114 65-114-65V134z" fill="#14233d" stroke="${a}" stroke-opacity=".65" stroke-width="2"/>
    <path d="m300 83 102 59v116l-102 59-102-59V142z" fill="${a}" fill-opacity=".055"/>
    <g transform="translate(232 132) scale(1.36)" fill="none" stroke="${a}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${ICONS[card.icon] || ICONS.compass}</g>
    <g fill="${b}"><circle cx="160" cy="95" r="4"/><circle cx="444" cy="298" r="4"/><path d="m412 49 3 9 9 3-9 3-3 9-3-9-9-3 9-3z"/></g>
  </svg>`;
}

export function wrapWords(text, maxWidth, measure) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    if (line && measure(`${line} ${word}`) > maxWidth) { lines.push(line); line = ''; }
    // Also handle long nicknames/unknown labels without overflowing the card.
    let part = word;
    while (measure(part) > maxWidth && part.length > 1) {
      let cut = part.length - 1;
      while (cut > 1 && measure(part.slice(0, cut)) > maxWidth) cut--;
      if (line) { lines.push(line); line = ''; }
      lines.push(part.slice(0, cut)); part = part.slice(cut);
    }
    line = line ? `${line} ${part}` : part;
  }
  if (line) lines.push(line);
  return lines;
}

async function cardPNG(card, nickname, rank) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1350);
  gradient.addColorStop(0, '#172d4e'); gradient.addColorStop(1, '#080f22');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1350);
  ctx.strokeStyle = '#ffffff10'; ctx.lineWidth = 1;
  for (let x=0; x<1080; x+=72) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,1350); ctx.stroke(); }
  for (let y=0; y<1350; y+=72) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(1080,y); ctx.stroke(); }
  ctx.strokeStyle = card.accent; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(32, 32, 1016, 1286, 32); ctx.stroke();
  const text = (s, x, y, size, weight, color) => {
    ctx.font = `${weight} ${size}px Arial, sans-serif`; ctx.fillStyle = color; ctx.fillText(s, x, y);
  };
  text('NEUROVERSE / CAREER QUEST', 76, 105, 23, 700, '#dbe8f8');
  text(rank === 0 ? 'YOUR TOP PICK' : 'ANOTHER SIDE OF YOU', 76, 175, 22, 700, card.accent);
  let size = 88, lines;
  do {
    ctx.font = `800 ${size}px Arial, sans-serif`;
    lines = wrapWords(card.career, 922, s => ctx.measureText(s).width);
    if (lines.length <= 3 || size <= 42) break;
    size -= 4;
  } while (true);
  lines.forEach((line, i) => text(line, 76, 258 + i * (size + 2), size, 800, '#ffffff'));
  const art = new Image();
  // This SVG contains our local vector shapes only. No foreignObject or remote fonts.
  const svgURL = URL.createObjectURL(new Blob([sceneSVG(card)], {type:'image/svg+xml'}));
  try {
    await new Promise((resolve, reject) => { art.onload = resolve; art.onerror = reject; art.src = svgURL; });
    ctx.drawImage(art, 130, 470, 820, 547);
  } finally { URL.revokeObjectURL(svgURL); }
  const owner = nickname ? `${nickname}'s next chapter` : 'Your next chapter';
  let ownerSize = 31;
  ctx.font = `700 ${ownerSize}px Arial, sans-serif`;
  while (ctx.measureText(owner).width > 922 && ownerSize > 16) { ownerSize--; ctx.font = `700 ${ownerSize}px Arial, sans-serif`; }
  text(owner, 76, 1000, ownerSize, 700, card.accent);
  ctx.font = '400 32px Arial, sans-serif';
  const joke = wrapWords(card.line, 922, s => ctx.measureText(s).width);
  joke.forEach((line, i) => text(line, 76, 1057 + i * 45, 32, 400, '#edf1f8'));
  text('An interest-based suggestion, not a fixed future.', 76, 1242, 21, 400, '#b7c5da');
  text('TEAM NEXUS  /  OPEN DAY', 76, 1282, 17, 700, '#b7c5da');
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG unavailable')), 'image/png'));
}

export default function(component) {
  const {parentElement, data} = component;
  const root = parentElement.querySelector('.cq-root');
  if (!root || !data?.cards?.length) return;
  const old = root._cqSession;
  const same = old?.id === data.id;
  old?.dispose?.();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = {
    id: data.id, index: same ? old.index : 0,
    // Reduced motion removes movement, not the short suspense/readout sequence.
    revealed: same ? old.revealed : !data.animate,
    sound: same ? old.sound : false,
  };
  root._cqSession = state;
  root.innerHTML = '<div class="cq-dock"></div>';
  const dock = root.querySelector('.cq-dock');
  const stage = document.createElement('section');
  stage.className = 'cq-stage'; stage.setAttribute('aria-label', 'Career card');
  stage.innerHTML = `
    <header class="cq-top"><div class="cq-brand">NEURO<b>VERSE</b><small>CAREER QUEST / YOUR NEXT CHAPTER</small></div>
      <div class="cq-tools"><button class="cq-quiet cq-sound" type="button" aria-pressed="false">Sound off</button></div></header>
    <div class="cq-build"><div class="cq-pack" aria-hidden="true">✦</div><h2>Somewhere in your future…</h2><p class="cq-loading-label" aria-live="polite">Your interests. A new possibility.</p><div class="cq-chips"></div><div class="cq-progress" aria-hidden="true"></div><button class="cq-quiet cq-skip" type="button">Skip to my career</button></div>
    <div class="cq-result" hidden><div class="cq-copy"><p class="cq-eyebrow"></p><p class="cq-owner"></p><h2 class="cq-title" tabindex="-1"></h2><p class="cq-tag"></p><p class="cq-line"></p>
      <div class="cq-actions"><button class="cq-primary cq-download" type="button">Get my career card ↓</button><button class="cq-secondary cq-next" type="button">Another side of me ↗</button></div>
      <div class="cq-actions" style="margin-top:12px"><button class="cq-quiet cq-speak" type="button">Hear my reveal</button><button class="cq-quiet cq-stop" type="button" hidden>Stop voice</button><button class="cq-quiet cq-top-pick" type="button" hidden>Back to top pick</button></div>
      <p class="cq-status" role="status" aria-live="polite"></p></div>
      <div class="cq-art"><div class="cq-ticket"><div class="cq-ticket-head"><span class="cq-family"></span><span class="cq-ticket-number"></span></div><div class="cq-artwork"></div><div class="cq-ticket-foot"><div><strong class="cq-card-owner"></strong><small>NeuroVerse career collection</small></div><span class="cq-code"></span></div></div></div></div>
    <footer class="cq-bottom" hidden><p class="cq-disclaimer">An interest-based suggestion from our trained model—not a fixed future. You decide what comes next.</p><nav class="cq-switcher" aria-label="Your career suggestions"></nav></footer>`;
  dock.append(stage);
  const el = s => stage.querySelector(s);
  let alive = true, revealTimer, artTimer, scrollTimer, audioContext, utterance;
  const loadingTimers = [];
  const urls = new Set();
  const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  el('.cq-speak').disabled = !canSpeak;
  if (!canSpeak) el('.cq-speak').textContent = 'Voice unavailable';
  const status = text => { el('.cq-status').textContent = text; };
  const stopVoice = () => {
    if (utterance && canSpeak) { utterance.onend = null; utterance.onerror = null; window.speechSynthesis.cancel(); utterance = null; }
    el('.cq-stop').hidden = true;
  };
  function chime() {
    if (!state.sound || !audioContext || audioContext.state !== 'running') return;
    [392, 523.25, 659.25].forEach((f, i) => {
      const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      const t = audioContext.currentTime + i * .1;
      oscillator.frequency.value = f; oscillator.type = 'sine';
      gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(.035, t + .025); gain.gain.exponentialRampToValueAtTime(.001, t + .4);
      oscillator.connect(gain); gain.connect(audioContext.destination);
      oscillator.start(t); oscillator.stop(t + .45);
    });
  }
  function renderCard(focus = false) {
    const card = data.cards[state.index];
    stage.style.setProperty('--accent', card.accent);
    stage.style.setProperty('--secondary', card.secondary);
    stage.dataset.theme = card.theme;
    el('.cq-title').textContent = card.career;
    el('.cq-owner').textContent = data.nickname ? `${data.nickname}, meet a possible future you.` : 'Meet a possible future you.';
    el('.cq-eyebrow').textContent = state.index ? 'Plot twist. This could be you, too.' : 'Career unlocked / your top pick';
    el('.cq-tag').textContent = card.badge;
    el('.cq-line').textContent = card.line;
    el('.cq-family').textContent = card.family;
    el('.cq-ticket-number').textContent = `0${state.index + 1} / 0${data.cards.length}`;
    el('.cq-code').textContent = monogram(card.career);
    el('.cq-card-owner').textContent = data.nickname || 'Your future. Your call.';
    el('.cq-artwork').innerHTML = sceneSVG(card);
    el('.cq-next').hidden = data.cards.length < 2;
    el('.cq-next').textContent = state.index === data.cards.length - 1 ? 'Back to my top pick ↗' : state.index === 0 ? 'Another side of me ↗' : 'One more possibility ↗';
    el('.cq-top-pick').hidden = state.index === 0;
    const nav = el('.cq-switcher'); nav.replaceChildren();
    data.cards.forEach((_, i) => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = `${i + 1}`;
      button.setAttribute('aria-label', i === 0 ? 'Show top career' : `Reveal career suggestion ${i + 1}`);
      button.setAttribute('aria-current', String(i === state.index)); button.onclick = () => switchCard(i); nav.append(button);
    });
    if (focus) el('.cq-title').focus({preventScroll:true});
  }
  function reveal(focus = true) {
    clearTimeout(revealTimer); loadingTimers.forEach(clearTimeout); state.revealed = true;
    el('.cq-build').hidden = true; el('.cq-result').hidden = false; el('.cq-bottom').hidden = false;
    stage.classList.add('cq-ready'); renderCard(focus); chime();
    status('Career unlocked. Save your card or explore another possibility.');
  }
  function switchCard(index) {
    if (index === state.index) return;
    stopVoice(); state.index = index;
    stage.classList.remove('cq-ready', 'cq-swapping');
    renderCard(true); status(index ? 'Another suggestion from the same prediction—not a new random result.' : 'Back to your model’s top suggestion.');
    clearTimeout(artTimer); artTimer = setTimeout(() => stage.classList.add('cq-swapping'), 15);
    chime();
  }
  el('.cq-skip').onclick = () => reveal();
  el('.cq-next').onclick = () => switchCard((state.index + 1) % data.cards.length);
  el('.cq-top-pick').onclick = () => switchCard(0);
  el('.cq-stop').onclick = () => { stopVoice(); status('Voice stopped.'); };
  el('.cq-sound').setAttribute('aria-pressed', String(state.sound));
  el('.cq-sound').textContent = state.sound ? 'Sound on' : 'Sound off';
  el('.cq-sound').onclick = async () => {
    state.sound = !state.sound;
    try {
      if (state.sound) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) throw new Error('No audio');
        audioContext ||= new AC(); await audioContext.resume();
        if (alive) chime();
      } else if (audioContext) await audioContext.suspend();
    } catch { state.sound = false; }
    if (!alive) return;
    el('.cq-sound').setAttribute('aria-pressed', String(state.sound));
    el('.cq-sound').textContent = state.sound ? 'Sound on' : 'Sound off';
  };
  el('.cq-speak').onclick = () => {
    stopVoice();
    const card = data.cards[state.index];
    utterance = new SpeechSynthesisUtterance(`${data.nickname ? data.nickname + ', ' : ''}${state.index ? 'Another side of you.' : 'Career unlocked.'} ${card.career}! ${card.line}`);
    const voices = window.speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
    const voice = voices.find(v => /natural|neural|samantha|google|enhanced/i.test(v.name)) || voices.find(v => v.default) || voices[0];
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || 'en-US'; utterance.rate = 1.02; utterance.pitch = 1.03;
    utterance.onend = () => { if (alive) { el('.cq-stop').hidden = true; status('Your future. Your call.'); } };
    utterance.onerror = () => { if (alive) { el('.cq-stop').hidden = true; status('Voice isn’t available right now. Your card is ready to read.'); } };
    el('.cq-stop').hidden = false; status('Reading your career card…'); window.speechSynthesis.speak(utterance);
  };
  el('.cq-download').onclick = async () => {
    const button = el('.cq-download'); button.disabled = true;
    // Snapshot before awaiting: changing cards must not change the downloaded filename.
    const card = data.cards[state.index], rank = state.index;
    status('Making your card…');
    try {
      const blob = await cardPNG(card, data.nickname, rank);
      if (!alive) return;
      const url = URL.createObjectURL(blob); urls.add(url);
      const link = document.createElement('a'); link.href = url;
      link.download = `NeuroVerse-${card.career.replace(/[^a-z0-9]+/gi, '-')}.png`;
      stage.append(link); link.click(); link.remove();
      status('Card ready—check your browser downloads. Nothing was uploaded.');
      // Keep at most one previous download URL until unmount; releasing immediately
      // can race Safari's download handoff.
      if (urls.size > 2) { const first = urls.values().next().value; URL.revokeObjectURL(first); urls.delete(first); }
    } catch { if (alive) status('Couldn’t save the image. You can still take a screenshot of your card.'); }
    finally { if (alive) button.disabled = false; }
  };
  for (const [i, choice] of (data.choices || []).entries()) {
    const chip = document.createElement('span'); chip.textContent = choice; chip.style.setProperty('--i', i); el('.cq-chips').append(chip);
  }
  if (state.revealed) { reveal(false); stage.classList.remove('cq-ready'); }
  else {
    // Scroll within this page; never open another tab, modal or fullscreen view.
    scrollTimer = setTimeout(() => {
      if (alive) stage.scrollIntoView({behavior:reduced ? 'instant' : 'smooth', block:'start'});
    }, 0);
    for (const [delay, label] of [[900, 'Your next chapter is taking shape…'], [1900, 'Ready to meet a possible future you?']]) {
      loadingTimers.push(setTimeout(() => { if (alive) el('.cq-loading-label').textContent = label; }, delay));
    }
    revealTimer = setTimeout(() => { if (alive) reveal(); }, 2800);
  }
  const onVisibility = () => {
    if (document.hidden) { stopVoice(); audioContext?.suspend().catch(() => {}); }
    stage.querySelectorAll('.cq-orbit').forEach(node => { node.style.animationPlayState = document.hidden ? 'paused' : 'running'; });
  };
  document.addEventListener('visibilitychange', onVisibility);
  state.dispose = () => {
    if (!alive) return;
    alive = false; clearTimeout(revealTimer); clearTimeout(artTimer); clearTimeout(scrollTimer);
    loadingTimers.forEach(clearTimeout); stopVoice();
    audioContext?.close().catch(() => {});
    for (const url of urls) URL.revokeObjectURL(url);
    urls.clear(); document.removeEventListener('visibilitychange', onVisibility);
  };
  return state.dispose;
}
