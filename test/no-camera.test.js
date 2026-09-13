const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

test('docs/NO_CAMERA.md exists and forever forbids webcam/upload/live face', () => {
  const p = path.join(ROOT, 'docs/NO_CAMERA.md');
  assert.ok(fs.existsSync(p), 'docs/NO_CAMERA.md missing');
  const md = fs.readFileSync(p, 'utf8');
  assert.match(md, /forever|לנצח|non-negotiable/i);
  assert.match(md, /webcam|camera|מצלמה/i);
  assert.match(md, /upload|העלאה/i);
  assert.match(md, /live.?face|פנים של אדם חי|living face/i);
});

test('README or NO_CAMERA doc contains camera refusal strings (מצלמה or camera)', () => {
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  const doc = fs.readFileSync(path.join(ROOT, 'docs/NO_CAMERA.md'), 'utf8');
  const blob = readme + '\n' + doc;
  assert.match(blob, /מצלמה|camera/i);
});
