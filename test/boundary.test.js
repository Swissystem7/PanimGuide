const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

test('COMMERCIAL_BOUNDARY.md forbids camera / upload / scoring living faces', () => {
  const md = read('docs/COMMERCIAL_BOUNDARY.md');
  assert.match(md, /camera|מצלמה/i);
  assert.match(md, /upload|העלאה/i);
  assert.match(md, /scoring|ניקוד/i);
  assert.match(md, /living faces|אדם חי|פנים/i);
});

test('README refusal strings: no camera, no upload', () => {
  const readme = read('README.md');
  assert.match(readme, /מצלמה/);
  assert.match(readme, /העלאה/);
  assert.match(readme, /אינו.*אבחון|אינו.*קורא פנים/);
  assert.doesNotMatch(readme, /העלו תמונה|פתחו מצלמה|דרגו פנים/);
});

test('MONETIZATION.md stubs HOLD commercial with portfolio/workshop/none', () => {
  const md = read('MONETIZATION.md');
  assert.match(md, /HOLD/);
  assert.match(md, /portfolio-only|portfolio/i);
  assert.match(md, /workshop/i);
  assert.match(md, /none/i);
});
