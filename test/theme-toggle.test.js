"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { read, HTML_PAGES } = require("./helpers");

const app = read("js/app.js");
const css = read("css/style.css");

const LABEL = "מצב כהה";

// Pulls a pure helper out of the IIFE in js/app.js without executing it
// (same trick as nav-escape.test.js). \r?\n so it passes on CRLF checkouts
// and LF CI alike.
function functionSource(name) {
  const re = new RegExp("\\r?\\n  function " + name + "\\([^)]*\\) \\{[\\s\\S]*?\\r?\\n  \\}\\r?\\n");
  const m = app.match(re);
  if (!m) throw new Error("function " + name + " not found in app.js");
  return m[0];
}

const { syncToggle } = new Function(functionSource("syncToggle") + "return { syncToggle: syncToggle };")();

// A button that records its attributes and would notice a label rewrite.
function fakeButton() {
  const attrs = { "aria-pressed": "false" };
  return {
    attrs,
    textContent: LABEL,
    setAttribute(name, value) { attrs[name] = value; }
  };
}

// The theme-toggle <button> of a page as { attrs, text }, located with
// indexOf so no regular expression ever has to parse an HTML tag.
function toggleOf(html) {
  const at = html.indexOf('id="theme-toggle"');
  if (at === -1) return null;
  const open = html.lastIndexOf("<", at);
  const close = html.indexOf(">", at);
  const end = html.indexOf("</button>", close);
  const attrs = {};
  const re = /([a-z][a-z-]*)="([^"]*)"/g;
  let m;
  while ((m = re.exec(html.slice(open, close)))) attrs[m[1]] = m[2];
  return { attrs, text: html.slice(close + 1, end).trim() };
}

test("syncToggle presses the button for dark, releases it for light, and never rewords it", () => {
  const btn = fakeButton();
  assert.equal(syncToggle(btn, true), true);
  assert.equal(btn.attrs["aria-pressed"], "true");
  assert.equal(btn.textContent, LABEL, "the label is the same with the dark theme on");
  assert.equal(syncToggle(btn, false), false);
  assert.equal(btn.attrs["aria-pressed"], "false");
  assert.equal(btn.textContent, LABEL, "and with it off");
  assert.deepEqual(Object.keys(btn.attrs), ["aria-pressed"], "aria-pressed is the only attribute touched");
});

test("applyTheme hands the toggle to syncToggle and never writes its text", () => {
  const src = functionSource("applyTheme");
  assert.ok(src.includes('syncToggle(btn, next === "dark")'), "the pure helper gets the resolved theme");
  assert.ok(!src.includes("textContent"), "a toggle button whose label flips along with aria-pressed reads as two contradicting states");
});

test("every page ships the toggle released, with the one stable label", () => {
  let seen = 0;
  for (const page of HTML_PAGES) {
    const toggle = toggleOf(read(page));
    if (!toggle) continue; // the 404 landing has no toggle on purpose
    seen += 1;
    assert.equal(toggle.attrs["aria-pressed"], "false", page + ": the HTML starts released; app.js presses it for a dark theme");
    assert.equal(toggle.attrs.type, "button", page + ": the toggle is a plain button");
    assert.equal(toggle.text, LABEL, page + ": the label is the stable one the CSS and the README describe");
    assert.ok(!("aria-label" in toggle.attrs), page + ": no aria-label may override the visible label");
  }
  assert.equal(seen, HTML_PAGES.length - 1, "every page but the 404 has the toggle");
});

test("the pressed state is visible: style.css styles [aria-pressed=true] on the toggle", () => {
  const rule = css.indexOf('.icon-btn[aria-pressed="true"] {');
  assert.ok(rule !== -1, "a pressed rule exists, so a sighted user sees the state the label no longer spells out");
  const block = css.slice(rule, css.indexOf("}", rule));
  assert.ok(/border-color:|background:/.test(block), "the pressed rule changes the button face, not only a glyph");
  assert.ok(css.includes('.icon-btn[aria-pressed="true"]::before'), "and adds a mark in front of the label");
});
