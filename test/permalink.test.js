"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { read, objectLiteral } = require("./helpers");

const src = read("js/explorer.js");
const html = read("explorer/index.html");
const DEFAULTS = objectLiteral(src, "DEFAULTS");
const LABELS = objectLiteral(src, "LABELS");

// Pulls a top-level `function NAME(...) { ... }` out of the IIFE. The helpers
// are written without DOM access so they can run here with the real
// DEFAULTS / LABELS tables.
function functionSource(name) {
  // \r?\n so the same test passes on an autocrlf (CRLF) checkout and in CI (LF).
  const re = new RegExp("\\r?\\n  function " + name + "\\([^)]*\\) \\{[\\s\\S]*?\\r?\\n  \\}\\r?\\n");
  const m = src.match(re);
  if (!m) throw new Error("function " + name + " not found in explorer.js");
  return m[0];
}

const { encodeState, decodeState } = new Function(
  "DEFAULTS",
  "LABELS",
  functionSource("encodeState") + functionSource("decodeState") +
    "return { encodeState: encodeState, decodeState: decodeState };"
)(DEFAULTS, LABELS);

test("the default state encodes to an empty query (clean URL)", () => {
  assert.equal(encodeState(DEFAULTS), "");
  assert.deepEqual(decodeState(""), {});
  assert.deepEqual(decodeState("?"), {});
});

test("only fields that differ from the defaults are written", () => {
  const state = Object.assign({}, DEFAULTS, { eyes: 2, lips: 3 });
  assert.equal(encodeState(state), "?eyes=2&lips=3");
});

test("encode then decode round-trips every reachable value of every field", () => {
  for (const key of Object.keys(DEFAULTS)) {
    for (let v = 0; v < LABELS[key].length; v++) {
      const state = Object.assign({}, DEFAULTS, { [key]: v });
      const decoded = decodeState(encodeState(state));
      const expected = v === DEFAULTS[key] ? {} : { [key]: v };
      assert.deepEqual(decoded, expected, key + "=" + v + " must round-trip");
    }
  }
});

test("unknown keys, out-of-range and non-integer values are ignored", () => {
  const maxEyes = LABELS.eyes.length; // one past the last label
  const decoded = decodeState(
    "?camera=1&eyes=" + maxEyes + "&lips=-1&chin=abc&nose=1.5&beard=1&=3&hairTexture="
  );
  assert.deepEqual(decoded, { beard: 1 });
});

test("decoded values never leave the label range (no undefined reading)", () => {
  const decoded = decodeState("?eyes=4&lips=3&brows=1&wrinkles=2");
  for (const key of Object.keys(decoded)) {
    assert.ok(LABELS[key][decoded[key]] !== undefined, key + " maps to a label");
  }
});

test("the explorer page exposes the permalink and restores from the URL", () => {
  assert.match(html, /id="explorer-permalink"/);
  assert.match(src, /decodeState\(window\.location\.search\)/);
  assert.match(src, /history\.replaceState/);
  // Shared links carry slider positions only: nothing else is ever serialised.
  assert.doesNotMatch(functionSource("encodeState"), /document|localStorage|navigator/);
});

test("the copy button is progressive: hidden in HTML, shown only behind a Clipboard API check", () => {
  assert.match(html, /<button[^>]*id="explorer-copy"[^>]*\shidden[\s>]/, "button ships hidden");
  assert.match(html, /id="explorer-copy-status"[^>]*role="status"/, "status region is announced");
  const initCopy = functionSource("initCopy");
  const canCopy = functionSource("canCopy");
  assert.match(canCopy, /navigator\.clipboard\.writeText/);
  assert.match(initCopy, /canCopy\(\)/, "button is only revealed after the feature check");
  assert.match(initCopy, /hidden = false/);
});

test("the copy button only writes the visible permalink; it never reads the clipboard", () => {
  const copy = functionSource("copyPermalink");
  assert.match(copy, /el\("explorer-permalink"\)/);
  assert.match(copy, /writeText\(link\.href\)/, "copies exactly the link the user sees");
  assert.doesNotMatch(src, /clipboard\.read|readText|execCommand/, "no clipboard reads, no legacy copy");
  assert.doesNotMatch(copy, /document\.title|location\.|localStorage/, "nothing but the link is copied");
});
