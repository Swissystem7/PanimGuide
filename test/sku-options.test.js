const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

test('docs/SKU_OPTIONS.md exists with A portfolio / B workshop / C none', () => {
  const p = path.join(ROOT, 'docs/SKU_OPTIONS.md');
  assert.ok(fs.existsSync(p), 'docs/SKU_OPTIONS.md missing');
  const md = fs.readFileSync(p, 'utf8');
  assert.match(md, /\bA\b[\s\S]*portfolio/i);
  assert.match(md, /\bB\b[\s\S]*workshop/i);
  assert.match(md, /\bC\b[\s\S]*none/i);
  assert.match(md, /HOLD/i);
  assert.doesNotMatch(md, /face-analysis SKU to sell|sell.*face score/i);
});
