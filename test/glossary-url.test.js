"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { read } = require("./helpers");

const src = read("js/app.js");
const html = read("glossary.html");

// Pulls a pure top-level helper out of the IIFE in app.js (same trick as
// permalink.test.js and glossary.test.js). \r?\n so it passes on CRLF
// checkouts and LF CI alike.
function functionSource(name) {
  const re = new RegExp("\\r?\\n  function " + name + "\\([^)]*\\) \\{[\\s\\S]*?\\r?\\n  \\}\\r?\\n");
  const m = src.match(re);
  if (!m) throw new Error("function " + name + " not found in app.js");
  return m[0];
}

const { encodeGlossaryQuery, decodeGlossaryQuery } = new Function(
  functionSource("encodeGlossaryQuery") + functionSource("decodeGlossaryQuery") +
    "return { encodeGlossaryQuery: encodeGlossaryQuery, decodeGlossaryQuery: decodeGlossaryQuery };"
)();

// The categories exactly as the page's <select> offers them: the runtime reads
// the same list from filter.options, so the HTML is the single source of truth.
function selectValues() {
  const select = html.match(/<select id="glossary-filter">([\s\S]*?)<\/select>/);
  assert.ok(select, "glossary.html has the filter select");
  const out = [];
  const re = /<option value="([^"]+)"/g;
  let m;
  while ((m = re.exec(select[1]))) out.push(m[1]);
  return out;
}

const CATS = selectValues();

test("the filter offers 'all' first and at least one real category", () => {
  assert.equal(CATS[0], "all");
  assert.ok(CATS.length >= 2);
});

test("every data-cat used by a term is a filter option (no orphan category)", () => {
  const used = new Set();
  const re = /data-cat="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) used.add(m[1]);
  assert.ok(used.size > 0, "glossary has categorised terms");
  for (const cat of used) assert.ok(CATS.includes(cat), "data-cat " + cat + " is not in the <select>");
});

test("the default state encodes to an empty query (clean URL)", () => {
  assert.equal(encodeGlossaryQuery("", "all", CATS), "");
  assert.equal(encodeGlossaryQuery("   ", "all", CATS), "");
  assert.equal(encodeGlossaryQuery(undefined, undefined, CATS), "");
  assert.deepEqual(decodeGlossaryQuery("", CATS), { q: "", cat: "all" });
  assert.deepEqual(decodeGlossaryQuery("?", CATS), { q: "", cat: "all" });
  assert.deepEqual(decodeGlossaryQuery(undefined, CATS), { q: "", cat: "all" });
});

test("only the fields that differ from the defaults are written", () => {
  assert.equal(encodeGlossaryQuery("", "ideas", CATS), "?cat=ideas");
  assert.equal(encodeGlossaryQuery("פרצוף", "all", CATS), "?q=" + encodeURIComponent("פרצוף"));
  assert.equal(
    encodeGlossaryQuery("פרצוף", "ideas", CATS),
    "?q=" + encodeURIComponent("פרצוף") + "&cat=ideas"
  );
});

test("encode then decode round-trips Hebrew, spaces, quotes and every category", () => {
  const GERSHAYIM = String.fromCharCode(0x05f4);
  const queries = ["דיוקנא", "רמב" + GERSHAYIM + "ן", 'רמב"ן', "חכמת הפנים", "a&b=c", "100%"];
  for (const cat of CATS) {
    for (const q of queries) {
      const encoded = encodeGlossaryQuery(q, cat, CATS);
      assert.deepEqual(decodeGlossaryQuery(encoded, CATS), { q, cat });
    }
  }
});

test("a search typed with surrounding whitespace is trimmed before it reaches the URL", () => {
  assert.equal(encodeGlossaryQuery("  פרצוף  ", "all", CATS), "?q=" + encodeURIComponent("פרצוף"));
  assert.equal(decodeGlossaryQuery("?q=%20%D7%A4%20", CATS).q, "פ");
});

test("a plus sign in the query string is read as a space (form encoding)", () => {
  assert.equal(decodeGlossaryQuery("?q=חכמת+הפנים", CATS).q, "חכמת הפנים");
});

test("unknown keys, unknown categories and malformed encodings are ignored", () => {
  assert.deepEqual(decodeGlossaryQuery("?cat=nope", CATS), { q: "", cat: "all" });
  assert.deepEqual(decodeGlossaryQuery("?eyes=2&cat=", CATS), { q: "", cat: "all" });
  assert.deepEqual(decodeGlossaryQuery("?=ideas&cat", CATS), { q: "", cat: "all" });
  assert.deepEqual(decodeGlossaryQuery("?q=%E0%A4%A", CATS), { q: "", cat: "all" });
  assert.deepEqual(decodeGlossaryQuery("?q=%E0%A4%A&cat=names", CATS), { q: "", cat: "names" });
  assert.equal(encodeGlossaryQuery("", "nope", CATS), "");
});

test("the query is capped at 80 characters in both directions", () => {
  const long = "א".repeat(200);
  const encoded = encodeGlossaryQuery(long, "all", CATS);
  assert.equal(decodeURIComponent(encoded.slice(3)).length, 80);
  assert.equal(decodeGlossaryQuery("?q=" + encodeURIComponent(long), CATS).q.length, 80);
});

test("the glossary page restores from the URL and writes it back with replaceState only", () => {
  assert.ok(html.includes('<script src="js/app.js"'), "glossary.html loads app.js");
  const init = src.match(/\n  function initGlossary\(\) \{[\s\S]*?\n  \}\r?\n/);
  assert.ok(init, "initGlossary found");
  assert.ok(init[0].includes("decodeGlossaryQuery(window.location.search"), "reads the URL on load");
  assert.ok(init[0].includes("encodeGlossaryQuery("), "writes the URL on change");
  assert.ok(init[0].includes("history.replaceState("), "uses replaceState");
  assert.ok(!init[0].includes("pushState"), "never pushes history entries while typing");
  assert.ok(!src.includes("innerHTML"), "app.js never injects the query as HTML");
});
