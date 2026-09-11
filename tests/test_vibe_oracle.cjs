// Run: node --test test_vibe_oracle.cjs
// Also works from UI/tests/ after installation into the Streamlit project.
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const local = join(__dirname, 'Vibe Oracle.html');
const html = readFileSync(existsSync(local) ? local : join(__dirname, '..', 'Vibe Oracle.html'), 'utf8');
const source = html.match(/<script id="oracle-engine">([\s\S]*?)<\/script>/)[1];
const engine = vm.runInNewContext(source + '\nOracleEngine;');
const { SCENES, STYLES, INTERESTS, TONES } = engine;
const sample = [{ name:'Kai', style:'fast', interest:'food' }, { name:'Moon', style:'slow', interest:'music' }];
const seed = n => () => ((n = (Math.imul(1664525, n) + 1013904223) >>> 0) / 4294967296);

test('Every story has a complete, distinct pair of endings in all three tones', () => {
  assert.equal(SCENES.length, 24);
  assert.equal(new Set(SCENES.map(s=>s.id)).size, SCENES.length);
  const endings = new Set();
  for (const scene of SCENES) {
    assert.equal(scene.replies.length, Object.keys(STYLES).length, scene.id);
    assert.equal(scene.choices.length, 2, scene.id);
    assert.notEqual(scene.choices[0].label, scene.choices[1].label);
    assert.notEqual(scene.choices[0].reply, scene.choices[1].reply);
    for (const branch of scene.choices) {
      assert.equal(branch.verdict.length, 3, scene.id);
      for (const text of [scene.title, scene.setup, scene.opener, ...scene.replies, scene.twist, branch.label, branch.say, branch.reply, branch.followup, branch.title, ...branch.verdict, branch.receipt]) {
        assert.equal(typeof text, 'string'); assert.ok(text.trim().length > 0, scene.id);
        assert.doesNotMatch(text, /undefined|null|\{(?:time|peace|message|name)\}/, scene.id);
      }
      for (const verdict of branch.verdict) { assert.ok(!endings.has(verdict), `Repeated verdict: ${verdict}`); endings.add(verdict); }
    }
  }
  assert.equal(endings.size, 144);
});

test('All 4,608 story/style/tone/role/ending combinations have coherent timestamps and speaker roles', () => {
  let checked = 0;
  for (const scene of SCENES) for (const a of Object.keys(STYLES)) for (const b of Object.keys(STYLES)) for (const tone of Object.keys(TONES)) for (const lead of [0,1]) for (const choice of [0,1]) {
    const input = [{ ...sample[0], style:a }, { ...sample[1], style:b }];
    const episode = engine.createEpisode(input, tone, [], () => lead ? .9 : .1, scene.id);
    const result = engine.finishEpisode(episode, choice);
    const beats = [...episode.beats, ...result.beats];
    assert.equal(episode.a.name, input[lead].name);
    assert.equal(episode.b.name, input[1-lead].name);
    assert.equal(episode.beats[1].text, scene.replies[Object.keys(STYLES).indexOf(input[1-lead].style)]);
    assert.deepEqual(beats.map(b=>b.actor), ['a','b','a','b','a','b']);
    assert.equal(result.verdict, scene.choices[choice].verdict[Object.keys(TONES).indexOf(tone)]);
    beats.forEach((beat,index) => {
      assert.ok(Number.isFinite(beat.minute));
      if(index) assert.ok(beat.minute > beats[index-1].minute, scene.id);
      assert.match(engine.clock(beat.minute), /^(Next day · )?(1[0-2]|[1-9]):[0-5][0-9] (AM|PM)$/);
    });
    checked++;
  }
  assert.equal(checked, 4608);
});

test('Night scenes use night times, and midnight rolls over clearly', () => {
  for (const scene of SCENES.filter(s=>/night/i.test(s.setup))) assert.ok(scene.time >= 19*60 && scene.time < 1440, scene.id);
  assert.equal(engine.clock(1425), '11:45 PM');
  assert.equal(engine.clock(1445), 'Next day · 12:05 AM');
  assert.equal(engine.clock(720), '12:00 PM');
});

test('A slow-reply preference cannot break the deadlines in a live scenario', () => {
  const slow=sample.map(p=>({...p,style:'slow'}));
  for(const [id,deadline] of [['aux',5],['team-name',.5],['open-day',2],['battery',1]]) {
    const episode=engine.createEpisode(slow,'chaos',[],()=>.1,id);
    for(const choice of [0,1]) {
      const result=engine.finishEpisode(episode,choice);
      assert.ok(result.beats.at(-1).minute-episode.minute<deadline, `${id}: exchange outlasts its deadline`);
    }
  }
});

test('100 full decks have no repeated scenarios within a deck or across the deck boundary', () => {
  const rng=seed(14); let history=[],last=null;
  for(let deck=0;deck<100;deck++) {
    const seen=new Set();
    for(let i=0;i<SCENES.length;i++) {
      const story=engine.selectScene(sample,history,rng);
      assert.ok(!seen.has(story.id), `Repeated in deck ${deck}: ${story.id}`);
      assert.notEqual(story.id,last,'Repeated consecutive story at deck boundary');
      seen.add(story.id);history=engine.remember(history,story.id);last=story.id;
      assert.ok(history.length<=24);
    }
  }
});

test('Hangout choices meaningfully weight scenario selection', () => {
  const rng=seed(42), players=sample.map(p=>({...p,interest:'food'})); let food=0;
  for(let i=0;i<1000;i++) if(engine.selectScene(players,[],rng).category==='food')food++;
  assert.ok(food>500, `Expected a food preference to matter; got ${food}/1000 food stories`);
});

test('Story rotation stores only known scenario IDs and tolerates old IDs', () => {
  const history=engine.remember(['old-story',SCENES[0].id,SCENES[0].id],SCENES[1].id);
  assert.equal(JSON.stringify(history),JSON.stringify([SCENES[0].id,SCENES[1].id]));
  for(const id of history)assert.ok(SCENES.some(s=>s.id===id));
});

test('Profile input is bounded, optional photo data never enters an episode, and invalid branches fail', () => {
  const input=[{name:'X'.repeat(100),style:'unknown',interest:'unknown',photo:'PRIVATE_IMAGE'},sample[1]];
  const episode=engine.createEpisode(input,'unknown',[],()=>.1);
  assert.equal(episode.a.name.length,18);assert.equal(episode.a.style,'fast');assert.equal(episode.a.interest,'plans');assert.equal(episode.tone,'friendly');
  assert.ok(!JSON.stringify(episode).includes('PRIVATE_IMAGE'));
  assert.throws(()=>engine.finishEpisode(episode,5),/Unknown ending/);
  assert.throws(()=>engine.createEpisode([sample[0]]),/two players/);
});

test('Both browser scripts parse, including the independent camera and UI lifecycle code', () => {
  for(const match of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
});
