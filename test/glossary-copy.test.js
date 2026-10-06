"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { read } = require("./helpers");

const src = read("js/app.js");
const css = read("css/style.css");

// Pulls the pure `termPermalink` helper out of the IIFE in app.js (same trick
// as glossary-anchors.test.js). \r?\n so it passes on CRLF checkouts and LF CI.
function functionSource(name) {
  const re = new RegExp("\\r?\\n  function " + name + "\\([^)]*\\) \\{[\\s\\S]*?\\r?\\n  \\}\\r?\\n");
  const m = src.match(re);
  if (!m) throw new Error("function " + name + " not found in app.js");
  return m[0];
}

const termPermalink = new Function(functionSource("termPermalink") + "return termPermalink;")();

test("the copied link is the page URL plus the term hash, without the search state", () => {
  assert.equal(
    termPermalink("https://example.org/PanimGuide/glossary.html?q=%D7%93&cat=ideas#term-partzuf", "term-diokna"),
    "https://example.org/PanimGuide/glossary.html#term-diokna"
  );
  assert.equal(termPermalink("https://example.org/glossary.html", "term-diokna"), "https://example.org/glossary.html#term-diokna");
  assert.equal(termPermalink("https://example.org/glossary.html#term-x", "term-diokna"), "https://example.org/glossary.html#term-diokna");
  assert.equal(termPermalink("file:///C:/site/glossary.html?cat=names", "term-saara"), "file:///C:/site/glossary.html#term-saara");
  assert.equal(termPermalink("", "term-saara"), "#term-saara");
  assert.equal(termPermalink(null, "term-saara"), "#term-saara");
});

test("the copy buttons are progressive: created only behind a Clipboard API check, inside .term-anchor", () => {
  const init = src.slice(src.indexOf("function initTermCopy()"));
  assert.ok(init.includes("if (!canCopy()) return;"), "no Clipboard API, no buttons");
  assert.match(src, /navigator\.clipboard\.writeText/, "the check names the async writeText API");
  assert.ok(init.includes('term.querySelector(".term-anchor")'), "the button is appended to the existing .term-anchor caption");
  assert.ok(init.includes('btn.className = "term-copy"'), "button class for the CSS");
  assert.ok(init.includes('copyStatus.setAttribute("role", "status")'), "the result is announced to screen readers");
  assert.ok(!read("glossary.html").includes("term-copy"), "the HTML ships no button: it is added by the script only when copying can work");
});

test("the copy button only writes the term link; it never reads the clipboard", () => {
  assert.ok(src.includes("writeText(termPermalink(window.location.href, term.id))"), "what is written is the pure helper's output");
  assert.doesNotMatch(src, /clipboard\.read|readText|execCommand/, "no clipboard reads, no legacy copy");
});

test("the copy button is styled and shares the print rule of the direct links", () => {
  assert.ok(css.includes(".term-copy {"), "a .term-copy rule exists");
  assert.ok(css.includes(".term-copy-status {"), "a .term-copy-status rule exists");
  const print = css.slice(css.indexOf("@media print"));
  assert.ok(print.includes(".term-anchor { display: none !important; }"), "the whole caption, button included, is hidden in print");
});
