const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

test('docs/PAGES_URL.md exists with UNKNOWN and canonical placeholder', () => {
  const p = path.join(ROOT, 'docs/PAGES_URL.md');
  assert.ok(fs.existsSync(p), 'docs/PAGES_URL.md missing');
  const md = fs.readFileSync(p, 'utf8');
  assert.match(md, /UNKNOWN/);
  assert.match(md, /canonical/i);
  assert.match(md, /placeholder|EXAMPLE\.github\.io/i);
});
