"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { read } = require("./helpers");

const app = read("js/app.js");

// Pulls a pure helper out of the IIFE in js/app.js without executing it.
// \r?\n so it passes on CRLF checkouts and LF CI.
function functionSource(name) {
  const re = new RegExp("\\r?\\n  function " + name + "\\([^)]*\\) \\{[\\s\\S]*?\\r?\\n  \\}\\r?\\n");
  const m = app.match(re);
  if (!m) throw new Error("function " + name + " not found in app.js");
  return m[0];
}

const onSystemThemeChange = new Function(functionSource("onSystemThemeChange") + "return onSystemThemeChange;")();

function recorder() {
  const calls = [];
  return { calls, apply(theme, persist) { calls.push([theme, persist]); } };
}

test("with nothing chosen by hand, the page follows the system to dark and back", () => {
  const rec = recorder();
  assert.equal(onSystemThemeChange({ matches: true }, () => false, rec.apply), true);
  assert.equal(onSystemThemeChange({ matches: false }, () => false, rec.apply), true);
  assert.deepEqual(rec.calls, [["dark", false], ["light", false]]);
});

test("a system change is never persisted, so the toggle still decides later", () => {
  const rec = recorder();
  onSystemThemeChange({ matches: true }, () => false, rec.apply);
  assert.ok(rec.calls.every(([, persist]) => persist === false));
});

test("a theme chosen by hand wins over the system for the rest of the session", () => {
  const rec = recorder();
  assert.equal(onSystemThemeChange({ matches: true }, () => true, rec.apply), false);
  assert.equal(onSystemThemeChange({ matches: false }, () => true, rec.apply), false);
  assert.deepEqual(rec.calls, []);
});

test("the saved choice is re-read on every change, so a toggle mid-session stops the following", () => {
  const rec = recorder();
  let chosen = false;
  const saved = () => chosen;
  assert.equal(onSystemThemeChange({ matches: true }, saved, rec.apply), true);
  chosen = true;
  assert.equal(onSystemThemeChange({ matches: false }, saved, rec.apply), false);
  chosen = false;
  assert.equal(onSystemThemeChange({ matches: false }, saved, rec.apply), true);
  assert.deepEqual(rec.calls, [["dark", false], ["light", false]]);
});

test("a malformed event falls back to light rather than throwing", () => {
  const rec = recorder();
  assert.equal(onSystemThemeChange(undefined, () => false, rec.apply), true);
  assert.equal(onSystemThemeChange({}, () => false, rec.apply), true);
  assert.deepEqual(rec.calls, [["light", false], ["light", false]]);
});

test("hasSavedTheme only counts the two known themes, like the bootstrap does", () => {
  const src = functionSource("hasSavedTheme");
  assert.match(src, /localStorage\.getItem\(storageKey\)/, "reads the key app.js persists");
  assert.match(src, /saved === "dark" \|\| saved === "light"/, "a stale or tampered value does not pin the theme");
  assert.match(src, /try \{[^}]*getItem/, "a browser without storage must not break the listener");
});

test("initTheme subscribes to the dark-scheme media query, with the legacy Safari fallback", () => {
  const src = functionSource("initTheme");
  assert.ok(src.includes('window.matchMedia("(prefers-color-scheme: dark)")'), "watches the same query systemTheme reads");
  assert.ok(src.includes("onSystemThemeChange(event, hasSavedTheme, applyTheme)"), "the listener re-checks storage on every change");
  const modern = src.indexOf('mq.addEventListener("change", onChange)');
  const legacy = src.indexOf("mq.addListener(onChange)");
  assert.ok(modern !== -1 && legacy !== -1, "both addEventListener and addListener are wired");
  assert.ok(modern < legacy, "the standard API is tried first");
  assert.ok(src.includes("if (!mq) return;"), "a browser without matchMedia still gets the toggle");
  const toggle = src.indexOf('getElementById("theme-toggle")');
  assert.ok(toggle !== -1 && toggle < src.indexOf("matchMedia"), "the toggle is wired before the media query, so it works even if matchMedia throws");
});
