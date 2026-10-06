"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { HTML_PAGES, read } = require("./helpers");

const css = read("css/style.css");
const app = read("js/app.js");

// The page background the CSS resolves for a theme, read from the block that
// starts with `selector {` so the stylesheet stays the single source of truth.
function cssBg(selector) {
  const start = css.indexOf(selector + " {");
  assert.ok(start !== -1, "style.css declares " + selector);
  const block = css.slice(start, css.indexOf("}", start));
  const m = block.match(/--bg:\s*(#[0-9a-f]{6});/i);
  assert.ok(m, selector + " sets --bg");
  return m[1].toLowerCase();
}

const LIGHT = cssBg(":root");
const DARK = cssBg(':root[data-theme="dark"]');

// Every <meta name="theme-color"> tag of a page as an attribute map. Located
// with indexOf, so no regular expression ever has to parse an HTML tag.
function themeColorMetas(html) {
  const out = [];
  let at = html.indexOf('name="theme-color"');
  while (at !== -1) {
    const open = html.lastIndexOf("<", at);
    const close = html.indexOf(">", at);
    const attrs = {};
    const re = /([a-z][a-z-]*)="([^"]*)"/g;
    let m;
    while ((m = re.exec(html.slice(open, close)))) attrs[m[1]] = m[2];
    out.push(attrs);
    at = html.indexOf('name="theme-color"', close);
  }
  return out;
}

test("the dark theme has one background, whether chosen by the system or by hand", () => {
  const start = css.indexOf("@media (prefers-color-scheme: dark)");
  assert.ok(start !== -1, "style.css has a prefers-color-scheme: dark block");
  const block = css.slice(start, css.indexOf("--bg-alt", start));
  assert.match(block, new RegExp("--bg:\\s*" + DARK + ";", "i"));
  assert.equal(cssBg(':root[data-theme="light"]'), LIGHT);
  assert.notEqual(LIGHT, DARK);
});

test("every page declares a theme-color per system scheme, matching the CSS backgrounds", () => {
  for (const page of HTML_PAGES) {
    const html = read(page);
    const head = html.slice(0, html.indexOf("</head>"));
    const metas = themeColorMetas(head);
    assert.equal(metas.length, 2, page + " has exactly two theme-color metas in <head>");
    // Light first: a browser that ignores the media attribute takes the first.
    assert.deepEqual(metas[0], { name: "theme-color", content: LIGHT, media: "(prefers-color-scheme: light)" }, page + " light meta");
    assert.deepEqual(metas[1], { name: "theme-color", content: DARK, media: "(prefers-color-scheme: dark)" }, page + " dark meta");
    assert.equal(themeColorMetas(html).length, 2, page + " has no theme-color meta outside <head>");
  }
});

// Pulls the pure helper out of the IIFE in js/app.js without executing it.
// \r?\n so it passes on CRLF checkouts and LF CI.
function functionSource(name) {
  const re = new RegExp("\\r?\\n  function " + name + "\\([^)]*\\) \\{[\\s\\S]*?\\r?\\n  \\}\\r?\\n");
  const m = app.match(re);
  if (!m) throw new Error("function " + name + " not found in app.js");
  return m[0];
}

const syncThemeColor = new Function(functionSource("syncThemeColor") + "return syncThemeColor;")();

function fakeDocument(contents) {
  const metas = contents.map((content) => ({
    attrs: { name: "theme-color", content },
    setAttribute(name, value) { this.attrs[name] = value; }
  }));
  return {
    selectors: [],
    metas,
    querySelectorAll(selector) { this.selectors.push(selector); return metas; }
  };
}

test("a hand-picked theme points every theme-color meta at the resolved background", () => {
  const doc = fakeDocument([LIGHT, DARK]);
  assert.equal(syncThemeColor(doc, DARK), 2);
  assert.deepEqual(doc.selectors, ['meta[name="theme-color"]']);
  assert.deepEqual(doc.metas.map((m) => m.attrs.content), [DARK, DARK]);
  assert.equal(syncThemeColor(doc, LIGHT), 2);
  assert.deepEqual(doc.metas.map((m) => m.attrs.content), [LIGHT, LIGHT]);
});

test("without a resolved background the metas are left alone", () => {
  const doc = fakeDocument([LIGHT, DARK]);
  assert.equal(syncThemeColor(doc, ""), 0);
  assert.equal(syncThemeColor(doc, undefined), 0);
  assert.deepEqual(doc.selectors, []);
  assert.deepEqual(doc.metas.map((m) => m.attrs.content), [LIGHT, DARK]);
});

test("a page without any theme-color meta is harmless", () => {
  assert.equal(syncThemeColor(fakeDocument([]), DARK), 0);
});

test("applyTheme resolves --bg from the CSS after setting data-theme and syncs the metas", () => {
  const src = functionSource("applyTheme");
  const set = src.indexOf('root.setAttribute("data-theme", next)');
  const read = src.indexOf('getComputedStyle(root).getPropertyValue("--bg")');
  const sync = src.indexOf("syncThemeColor(document, bg)");
  assert.ok(set !== -1 && read !== -1 && sync !== -1, "applyTheme sets the theme, reads --bg and syncs");
  assert.ok(set < read && read < sync, "the attribute is set before the computed colour is read");
  assert.match(src, /try \{[^}]*getComputedStyle/, "a browser without getComputedStyle must not break the toggle");
});

test("the 404 page, which never loads app.js, still has both system-scheme metas", () => {
  assert.doesNotMatch(read("404.html"), /app\.js/);
  assert.equal(themeColorMetas(read("404.html")).length, 2);
});
