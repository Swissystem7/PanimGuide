const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

// Verified live on 2026-09-09: HTTP 200, and the Pages API reports status built.
const PAGES_URL = 'https://swissystem7.github.io/PanimGuide/';

test('docs/PAGES_URL.md pins the verified live Pages URL', () => {
  const p = path.join(ROOT, 'docs/PAGES_URL.md');
  assert.ok(fs.existsSync(p), 'docs/PAGES_URL.md missing');
  const md = fs.readFileSync(p, 'utf8');
  assert.ok(md.includes(PAGES_URL), 'docs/PAGES_URL.md must state the live URL ' + PAGES_URL);
  assert.match(md, /canonical/i);
  assert.match(md, /verified on 2026-\d{2}-\d{2}/i);
  assert.doesNotMatch(md, /UNKNOWN/, 'Pages URL is verified live; UNKNOWN must not remain');
  assert.doesNotMatch(md, /EXAMPLE\.github\.io/, 'the EXAMPLE placeholder host must be replaced');
});
