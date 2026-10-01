import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source = await readFile(new URL('../static/career-quest/reveal.js', import.meta.url), 'utf8');
const {ICONS, xml, monogram, wrapWords, sceneSVG, default: mount} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('every artwork key produces a local SVG without external dependencies', () => {
  for (const icon of Object.keys(ICONS)) {
    const svg = sceneSVG({icon, accent:'#6ee7ff', secondary:'#bfa2ff', theme:'tech'});
    assert.ok(svg.includes(ICONS[icon]));
    assert.ok(svg.includes('viewBox="0 0 600 400"'));
    assert.ok(!/href=|foreignObject|<script|undefined/.test(svg));
  }
});
test('escaping and fallback do not turn user text into SVG markup', () => {
  assert.equal(xml('<script>"&\u0001'), '&lt;script&gt;&quot;&amp;');
  assert.ok(sceneSVG({accent:'" onload="alert(1)', icon:'unknown'}).includes('#6ee7ff'));
  assert.ok(!sceneSVG({accent:'" onload="alert(1)', icon:'unknown'}).includes('onload'));
});
test('PNG text wrapping retains words and fits long labels', () => {
  const measure = s => s.length * 10;
  for (const label of ['Renewable Energy Engineer', 'Human Resources Manager', 'a'.repeat(80)]) {
    const lines = wrapWords(label, 150, measure);
    assert.ok(lines.every(line => measure(line) <= 150));
    assert.equal(lines.join('').replace(/\s/g,''), label.replace(/\s/g,''));
  }
  assert.equal(monogram('UI/UX Designer'), 'UUD');
  assert.equal(monogram('Software Developer'), 'SD');
});
test('empty results mount safely without creating a modal', () => {
  assert.doesNotThrow(() => mount({parentElement:{querySelector:()=>({})}, data:{cards:[]}}));
});

// Exercise component timing without needing to change a visitor's OS motion
// setting. Actual layout/PNG rendering is checked in the running browser.
function fakeEnvironment(t, reduced = false) {
  class Element {
    constructor() {
      this.nodes = new Map(); this.children = []; this.hidden = false; this.open = false;
      this.style = {setProperty(){}}; this.attributes = new Map();
      this.classList = {add(){}, remove(){}}; this.dataset = {};
    }
    set innerHTML(_) { this.nodes.clear(); }
    querySelector(selector) {
      if (selector === '.cq-dialog') return null;
      if (!this.nodes.has(selector)) this.nodes.set(selector, new Element());
      return this.nodes.get(selector);
    }
    querySelectorAll() { return []; }
    append(node) { this.children.push(node); }
    replaceChildren() { this.children = []; }
    scrollIntoView() {}
    setAttribute(k, v) { this.attributes.set(k, v); }
    focus() {}
    close() { this.open = false; }
    showModal() { this.open = true; }
  }
  const parent = new Element();
  const originalWindow = globalThis.window, originalDocument = globalThis.document;
  globalThis.window = {matchMedia:()=>({matches:reduced})};
  globalThis.document = {createElement:()=>new Element(), addEventListener(){}, removeEventListener(){}};
  t.after(() => { globalThis.window = originalWindow; globalThis.document = originalDocument; });
  t.mock.timers.enable({apis:['setTimeout']});
  const card = {career:'Doctor', icon:'pulse', theme:'health', accent:'#75efd6', secondary:'#a2caff', line:'A line', badge:'A badge'};
  return {parent, data:{id:'test-1', cards:[card, {...card, career:'Nurse'}], choices:['Biology'], animate:true}};
}

test('normal reveal waits 2.8 seconds, and a rerun does not replay it', t => {
  const {parent, data} = fakeEnvironment(t);
  const cleanup = mount({parentElement:parent, data});
  const root = parent.querySelector('.cq-root');
  assert.equal(root._cqSession.revealed, false);
  t.mock.timers.tick(2799);
  assert.equal(root._cqSession.revealed, false);
  t.mock.timers.tick(1);
  assert.equal(root._cqSession.revealed, true);
  cleanup();
  const nextCleanup = mount({parentElement:parent, data:{...data, animate:false}});
  assert.equal(root._cqSession.revealed, true);
  nextCleanup();
});

test('skip immediately reveals, bonus stays in model order, and the result stays inline', t => {
  const {parent, data} = fakeEnvironment(t);
  const cleanup = mount({parentElement:parent, data});
  const root = parent.querySelector('.cq-root');
  const stage = root.querySelector('.cq-dock').children[0];
  stage.querySelector('.cq-skip').onclick();
  assert.equal(root._cqSession.revealed, true);
  assert.equal(stage.querySelector('.cq-title').textContent, 'Doctor');
  stage.querySelector('.cq-next').onclick();
  assert.equal(stage.querySelector('.cq-title').textContent, 'Nurse');
  assert.equal(root.querySelector('.cq-dialog'), null);
  assert.equal(root.querySelector('.cq-dock').children[0], stage);
  assert.equal(root._cqSession.revealed, true);
  cleanup();
});

test('reduced motion removes movement but keeps the short suspense beat', t => {
  const {parent, data} = fakeEnvironment(t, true);
  const cleanup = mount({parentElement:parent, data});
  const root = parent.querySelector('.cq-root');
  assert.equal(root._cqSession.revealed, false);
  t.mock.timers.tick(2800);
  assert.equal(root._cqSession.revealed, true);
  cleanup();
});

test('unmount cancels a pending reveal instead of changing the next screen', t => {
  const {parent, data} = fakeEnvironment(t);
  const cleanup = mount({parentElement:parent, data});
  cleanup();
  t.mock.timers.tick(5000);
  assert.equal(parent.querySelector('.cq-root')._cqSession.revealed, false);
});
