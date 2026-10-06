"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { read } = require("./helpers");

const src = read("js/app.js");
const html = read("glossary.html");

// Pulls the pure `normalize` helper out of the IIFE in app.js (same trick as
// permalink.test.js). \r?\n so it passes on CRLF checkouts and LF CI alike.
function functionSource(name) {
  const re = new RegExp("\\r?\\n  function " + name + "\\([^)]*\\) \\{[\\s\\S]*?\\r?\\n  \\}\\r?\\n");
  const m = src.match(re);
  if (!m) throw new Error("function " + name + " not found in app.js");
  return m[0];
}

const normalize = new Function(functionSource("normalize") + "return normalize;")();

// Typographic characters the glossary uses, spelled out so the intent is clear
// even where an editor renders them like their keyboard look-alikes.
const GERSHAYIM = String.fromCharCode(0x05f4); // ״
const GERESH = String.fromCharCode(0x05f3); // ׳
const MAQAF = String.fromCharCode(0x05be); // ־
const EN_DASH = String.fromCharCode(0x2013); // –

// What the glossary search compares against: the folded page text.
const hay = normalize(html);

test("keyboard quote finds typographic gershayim (רמב\"ן finds הרמב״ן)", () => {
  assert.ok(html.includes("רמב" + GERSHAYIM + "ן"), "glossary spells it with U+05F4");
  assert.ok(hay.includes(normalize('רמב"ן')));
  assert.ok(hay.includes(normalize("רמב" + GERSHAYIM + "ן")));
  assert.ok(hay.includes(normalize("רמבן")));
});

test("keyboard apostrophe finds geresh (ס' finds ס׳)", () => {
  assert.ok(html.includes("ס" + GERESH), "glossary uses U+05F3");
  assert.ok(hay.includes(normalize("ס'")));
  assert.equal(normalize("ס'"), normalize("ס" + GERESH));
});

test("hyphen finds maqaf (פסאודו-מדע finds פסאודו־מדע)", () => {
  assert.ok(html.includes("פסאודו" + MAQAF + "מדע"), "glossary uses U+05BE");
  assert.ok(hay.includes(normalize("פסאודו-מדע")));
  assert.ok(hay.includes(normalize("פסאודו מדע")));
  assert.equal(normalize("פנים" + EN_DASH + "מדריך"), normalize("פנים" + MAQAF + "מדריך"));
});

test("nikud and cantillation are ignored, letters are kept", () => {
  const shalomPointed = "ש" + String.fromCharCode(0x05b8, 0x05c1) + "ל" + "ו" + String.fromCharCode(0x05b9) + "ם";
  assert.equal(normalize(shalomPointed), "שלום");
  const alphabet = "אבגדהוזחטיכךלמםנןסעפףצץקרשת";
  assert.equal(normalize(alphabet), alphabet);
});

test("case and whitespace are folded; empty input stays empty", () => {
  assert.equal(normalize("  Lombroso   Cesare "), "lombroso cesare");
  assert.equal(normalize(""), "");
  assert.equal(normalize(null), "");
  assert.equal(normalize(undefined), "");
});

test("every data-term keyword still finds its own article after folding", () => {
  const articles = [...html.matchAll(/<article[^>]*data-term="([^"]*)"[^>]*>([\s\S]*?)<\/article>/g)];
  assert.ok(articles.length >= 10, "glossary has articles");
  for (const [, term, body] of articles) {
    const folded = normalize(term + " " + body.replace(/<[^>]+>/g, " "));
    for (const word of term.split(/\s+/).filter(Boolean)) {
      assert.ok(folded.includes(normalize(word)), word + " must match its own article");
    }
  }
});

test("app.js keeps the folding as explicit escapes (no raw combining marks in source)", () => {
  assert.ok(src.includes("\\u0591-\\u05BD\\u05BF-\\u05C7"), "nikud range is written as escapes and skips maqaf");
  assert.ok(src.includes("\\u05F3\\u05F4"), "geresh/gershayim are written as escapes");
  assert.ok(src.includes("\\u05BE"), "maqaf is written as an escape");
});

test("the glossary announces an empty result through its live status line", () => {
  assert.match(html, /id="glossary-status"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.ok(src.includes("לא נמצא מושג מתאים"), "app.js has the zero-result message");
});
