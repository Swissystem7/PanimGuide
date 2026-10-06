"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { read } = require("./helpers");

const src = read("js/app.js");
const html = read("glossary.html");

// Pulls the pure `termFromHash` helper out of the IIFE in app.js (same trick as
// glossary-url.test.js). \r?\n so it passes on CRLF checkouts and LF CI alike.
function functionSource(name) {
  const re = new RegExp("\\r?\\n  function " + name + "\\([^)]*\\) \\{[\\s\\S]*?\\r?\\n  \\}\\r?\\n");
  const m = src.match(re);
  if (!m) throw new Error("function " + name + " not found in app.js");
  return m[0];
}

const termFromHash = new Function(functionSource("termFromHash") + "return termFromHash;")();

// Every glossary article with its id, exactly as the page has it.
const ARTICLES = [...html.matchAll(/<article class="term"([^>]*)>([\s\S]*?)<\/article>/g)].map(([, attrs, body]) => {
  const id = (attrs.match(/\sid="([^"]*)"/) || [])[1];
  return { id, attrs, body };
});
const IDS = ARTICLES.map((a) => a.id);

test("every glossary term has a unique ASCII id with the term- prefix", () => {
  assert.ok(ARTICLES.length >= 10, "glossary has articles");
  for (const { id, attrs } of ARTICLES) {
    assert.ok(id, "article without id: " + attrs.trim());
    assert.match(id, /^term-[a-z0-9-]{1,40}$/, id + " must be a short ASCII slug");
  }
  assert.equal(new Set(IDS).size, IDS.length, "term ids must be unique");
});

test("every term carries a direct link to its own id, right under the summary", () => {
  for (const { id, body } of ARTICLES) {
    const anchor = body.match(/<summary>[^<]*<\/summary>\s*<p class="term-anchor"><a href="#([^"]+)">/);
    assert.ok(anchor, id + " must have a .term-anchor right after its summary");
    assert.equal(anchor[1], id, id + " must link to itself");
  }
});

test("termFromHash accepts exactly one known term id and nothing else", () => {
  assert.ok(IDS.includes("term-diokna"), "the README example id exists");
  assert.equal(termFromHash("#term-diokna", IDS), "term-diokna");
  assert.equal(termFromHash("term-diokna", IDS), "term-diokna");
  assert.equal(termFromHash("#term-no-such-term", IDS), null, "unknown term");
  assert.equal(termFromHash("#main", IDS), null, "non-term fragment");
  assert.equal(termFromHash("#glossary-search", IDS), null, "control id");
  assert.equal(termFromHash("#TERM-DIOKNA", IDS), null, "ids are lower-case only");
  assert.equal(termFromHash("#term-" + "a".repeat(41), IDS), null, "over-long slug");
  assert.equal(termFromHash("#term-<script>", IDS), null, "markup never matches");
  assert.equal(termFromHash("", IDS), null);
  assert.equal(termFromHash(null, IDS), null);
  assert.equal(termFromHash(undefined, IDS), null);
});

test("app.js opens the targeted term, resets a hiding filter and follows hash changes", () => {
  assert.ok(src.includes("function revealHashTerm()"), "reveal helper exists");
  assert.ok(src.includes("details.open = true"), "the targeted <details> is opened");
  assert.ok(src.includes("if (term.hidden) {"), "a hidden target resets the filters");
  assert.ok(src.includes('window.addEventListener("hashchange", revealHashTerm)'), "in-page clicks on another term link are followed");
});

test("the direct-link caption is not searchable text", () => {
  assert.ok(src.includes('clone.querySelectorAll(".term-anchor")'), "the search haystack drops the .term-anchor caption");
  for (const { id, attrs } of ARTICLES) {
    const keywords = (attrs.match(/data-term="([^"]*)"/) || [])[1] || "";
    assert.ok(!keywords.includes("קישור"), id + " keywords must not contain the caption word");
  }
});

test("the targeted term is highlighted on screen and the anchors are not printed", () => {
  const css = read("css/style.css");
  assert.ok(css.includes(".term:target details {"), "a :target rule marks the shared term");
  const print = css.slice(css.indexOf("@media print"));
  assert.ok(print.includes(".term-anchor { display: none !important; }"), "anchors are hidden in print");
});
