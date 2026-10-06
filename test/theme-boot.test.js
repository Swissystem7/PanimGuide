"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { HTML_PAGES, read } = require("./helpers");

const boot = read("js/theme.js");
const app = read("js/app.js");

// Pulls the pure `savedTheme` helper out of the IIFE in js/theme.js without
// executing it (the file touches localStorage and document at load time).
// \r?\n so it passes on CRLF checkouts and LF CI.
function functionSource(src, name) {
  const re = new RegExp("\\r?\\n  function " + name + "\\([^)]*\\) \\{[\\s\\S]*?\\r?\\n  \\}\\r?\\n");
  const m = src.match(re);
  if (!m) throw new Error("function " + name + " not found");
  return m[0];
}

const savedTheme = new Function(functionSource(boot, "savedTheme") + "return savedTheme;")();

test("only the two known themes are restored from storage", () => {
  assert.equal(savedTheme("dark"), "dark");
  assert.equal(savedTheme("light"), "light");
});

test("nothing saved, or a stale value, leaves the system preference in charge", () => {
  assert.equal(savedTheme(null), null);
  assert.equal(savedTheme(undefined), null);
  assert.equal(savedTheme(""), null);
  assert.equal(savedTheme("auto"), null);
  assert.equal(savedTheme("DARK"), null);
  assert.equal(savedTheme("dark "), null);
});

test("the bootstrap and app.js agree on the storage key and the attribute", () => {
  const key = /var storageKey = "([^"]+)";/;
  const bootKey = boot.match(key);
  const appKey = app.match(key);
  assert.ok(bootKey && appKey, "both files declare storageKey");
  assert.equal(bootKey[1], appKey[1], "theme.js must read the key app.js writes");
  assert.ok(boot.includes('setAttribute("data-theme", saved)'), "theme.js sets the data-theme attribute the CSS keys on");
  assert.match(boot, /localStorage\.getItem\(storageKey\)/, "theme.js reads the saved choice");
  assert.doesNotMatch(boot, /localStorage\.setItem/, "theme.js only restores; app.js persists");
});

test("every page loads js/theme.js synchronously in <head>, before the stylesheet", () => {
  for (const page of HTML_PAGES) {
    const html = read(page);
    const head = html.slice(0, html.indexOf("</head>"));
    const rel = path.posix.relative(path.posix.dirname(page), "js/theme.js");
    const tag = '<script src="' + rel + '"></script>';
    const at = head.indexOf(tag);
    assert.ok(at !== -1, page + " must load " + rel + " in <head> without defer/async (" + tag + ")");
    const css = head.indexOf('<link rel="stylesheet"');
    assert.ok(css !== -1 && at < css, page + " must load theme.js before the stylesheet so the theme is set before the first paint");
    assert.equal(head.indexOf("<script"), head.lastIndexOf("<script"), page + " has exactly one script in <head>");
  }
});

test("the bootstrap stays tiny and self-contained", () => {
  assert.ok(boot.length < 1500, "theme.js blocks rendering, so it must stay small (" + boot.length + " bytes)");
  assert.doesNotMatch(boot, /getElementById|querySelector|addEventListener/, "no DOM work beyond <html> in the bootstrap");
});
