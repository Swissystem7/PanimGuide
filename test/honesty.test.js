"use strict";

// Honesty guard for PanimGuide.
//
// The site is a guide to a textual tradition. The one failure mode that would
// destroy it is drifting into a diagnostic claim: telling a reader that a face
// reveals character, predicts behaviour, or that any of this is science.
//
// Two layers:
//   1. BANNED — claim-shaped wording that appears nowhere today and must stay
//      at zero.
//   2. FLAGGED — vocabulary the site legitimately uses while REFUSING it
//      ("it is not a diagnostic tool", "this is not a scientific method").
//      Such a word is allowed on a line that also carries a limiting word, and
//      only on a page that carries the three refusal banners. Lines that use a
//      flagged word with no limiting word are counted and capped at today's
//      measured number, so a new bare use fails the suite.
//
// Nothing here rewrites copy. A failure is a request for a human decision.
//
// Zero dependencies, no network, no clock, no Math.random.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

// The six real pages. 404.html is handled separately: it is a stub with no
// prose, no flagged vocabulary and no banner (reported to the owner).
const PAGES = [
  "index.html",
  "overview.html",
  "history.html",
  "glossary.html",
  "sources.html",
  "explorer/index.html"
];

const ALL_HTML = PAGES.concat(["404.html"]);

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function occurrences(haystack, needle) {
  let n = 0;
  let i = 0;
  for (;;) {
    const j = haystack.indexOf(needle, i);
    if (j === -1) return n;
    n += 1;
    i = j + 1;
  }
}

// --- layer 1: wording that must never appear ------------------------------
//
// Measured on 2026-09-13 against commit 5ab1998: every one of these is at zero
// occurrences in all seven HTML files.

const BANNED = [
  "מנבא",     // predicts
  "מגלה",     // reveals
  "מאבחן",    // diagnoses
  "מנחש",     // guesses
  "חוזה עתיד", // foretells the future
  "predicts",
  "diagnoses",
  "personality",
  "reveals"
];

// --- layer 2: vocabulary that is allowed only inside a refusal -------------

const FLAGGED = ["אופי", "אבחון", "מדעי"];

// Words that turn a sentence into a limit, a refusal or a historical framing.
const LIMITING = [
  "אינו", "אינה", "אינם", "אינן", "אין", "ללא", "לא ", " לא", "ולא",
  "פסאודו", "דחה", "דחיי", "דחייה", "נדח", "שולל", "חסום", "מסרב", "לסרב",
  "מיתוס", "שיבוש", "בשבוש", "בניגוד", "גזע", "נזק", "שקר", "בלי", "אבד",
  "סייג", "הטיי", "מול", "פסול"
];

// The three refusal banners every page must carry.
const BANNERS = [
  "מורשת, לא אבחון",
  "אינו כלי אבחון",
  "אין מצלמה, אין העלאת תמונה, אין זיהוי פנים"
];

// Bare uses measured by hand on 2026-09-13, page by page, line by line:
//   history.html line 78  — "אריסטו דן באפשרות להסיק אופי מסימנים…"
//                           (a historical description of Aristotle, not a claim)
//   glossary.html line 112 — an SVG <text> label reading only "אבחון", the
//                           target of the blocked arrow in the figure whose
//                           caption says the arrow is deliberately blocked.
// Both are reported to the owner in the pull request rather than deleted.
const BARE_USE_CEILING = {
  "index.html": {},
  "overview.html": {},
  "history.html": { "אופי": 1 },
  "glossary.html": { "אבחון": 1 },
  "sources.html": {},
  "explorer/index.html": {}
};

function isLimited(line) {
  return LIMITING.some(function (word) {
    return line.includes(word);
  });
}

function bareUses(file, phrase) {
  const out = [];
  read(file).split("\n").forEach(function (line, i) {
    if (!line.includes(phrase)) return;
    if (isLimited(line)) return;
    out.push(file + ":" + (i + 1) + " " + line.trim().slice(0, 120));
  });
  return out;
}

// --- tests ----------------------------------------------------------------

ALL_HTML.forEach(function (page) {
  test("no diagnostic claim wording in " + page, function () {
    const html = read(page);
    const hits = BANNED.filter(function (word) {
      return html.includes(word);
    });
    assert.deepEqual(
      hits,
      [],
      page + " must not claim to reveal, predict or diagnose; found: " + hits.join(", ")
    );
  });
});

PAGES.forEach(function (page) {
  test("refusal banners are present on " + page, function () {
    const html = read(page);
    const missing = BANNERS.filter(function (banner) {
      return !html.includes(banner);
    });
    assert.deepEqual(missing, [], page + " is missing refusal text: " + missing.join(" | "));
  });
});

PAGES.forEach(function (page) {
  test("flagged vocabulary on " + page + " stays inside a refusal", function () {
    const html = read(page);
    const ceiling = BARE_USE_CEILING[page];
    FLAGGED.forEach(function (phrase) {
      if (!html.includes(phrase)) return;
      // A page may only use this vocabulary at all if it also refuses it.
      assert.ok(
        html.includes("אינו כלי אבחון"),
        page + " uses " + phrase + " without carrying the refusal sentence"
      );
      const bare = bareUses(page, phrase);
      const allowed = ceiling[phrase] || 0;
      assert.ok(
        bare.length <= allowed,
        "new unqualified use of " + phrase + " in " + page +
          " (allowed " + allowed + ", found " + bare.length + "):\n  " + bare.join("\n  ")
      );
    });
  });
});

test("404.html carries no diagnostic vocabulary at all", function () {
  const html = read("404.html");
  FLAGGED.forEach(function (phrase) {
    assert.equal(
      occurrences(html, phrase),
      0,
      "404.html is a bare stub with no refusal banner, so it must not use " + phrase
    );
  });
});

test("the explorer script never turns a Zohar quotation into a claim about a person", function () {
  const js = read("js/explorer.js");
  // "מגלה" occurs three times, always inside the Proverbs phrase the Zohar
  // quotes ("הולך רכיל מגלה סוד" — a talebearer reveals a secret). It is never
  // used about a living reader. Measured 2026-09-13: 3 lines, all with "סוד".
  const lines = js.split("\n");
  const reveal = [];
  lines.forEach(function (line, i) {
    if (line.includes("מגלה")) reveal.push({ n: i + 1, line: line });
  });
  assert.ok(reveal.length > 0, "expected the quoted Proverbs phrase to still be present");
  reveal.forEach(function (hit) {
    assert.ok(
      hit.line.includes("סוד"),
      "js/explorer.js:" + hit.n + " uses מגלה outside the quoted phrase about a secret"
    );
    assert.ok(
      !hit.line.includes("אישיות"),
      "js/explorer.js:" + hit.n + " ties מגלה to personality"
    );
  });
});

test("the explorer output always carries the not-a-science line", function () {
  const js = read("js/explorer.js");
  assert.ok(
    js.includes("פיזיוגנומיה אינה שיטה מדעית"),
    "js/explorer.js must render the refusal line with every reading"
  );
  assert.ok(
    js.includes("לא על אדם חי") || js.includes("לא על אדם"),
    "js/explorer.js must say the reading is about the diagram, not a living person"
  );
});

test("no page invites a photo, a camera or a face upload", function () {
  const invitations = ["העלו תמונה", "פתחו מצלמה", "דרגו פנים", "צלמו את", "<input type=\"file\""];
  ALL_HTML.concat(["js/app.js", "js/explorer.js"]).forEach(function (file) {
    const text = read(file);
    invitations.forEach(function (bad) {
      assert.ok(!text.includes(bad), file + " invites face capture: " + bad);
    });
  });
});
