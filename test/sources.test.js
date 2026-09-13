"use strict";

// Citation integrity for PanimGuide.
//
// sources.html is the single bibliography page. Every claim anywhere on the
// site is supposed to be traceable to an entry there. This file checks the two
// directions of that promise, and freezes today's gaps as ceilings so they can
// only shrink.
//
// Zero dependencies, no network, no clock, no Math.random.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

const PAGES = [
  "index.html",
  "overview.html",
  "history.html",
  "glossary.html",
  "sources.html",
  "explorer/index.html",
  "404.html"
];

const CODE = ["js/app.js", "js/explorer.js"];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function all(text, re) {
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) out.push(m);
  return out;
}

// --- what sources.html defines -------------------------------------------

function definedIds() {
  return all(read("sources.html"), /id="(c-[a-z0-9-]+)"/g).map(function (m) {
    return m[1];
  });
}

function sourceUrls() {
  return all(read("sources.html"), /href="(https?:[^"]+)"/g).map(function (m) {
    return m[1];
  });
}

// --- what the rest of the site cites --------------------------------------

function citedIds() {
  const map = new Map();
  PAGES.concat(CODE).forEach(function (file) {
    all(read(file), /#(c-[a-z0-9-]+)/g).forEach(function (m) {
      if (!map.has(m[1])) map.set(m[1], []);
      map.get(m[1]).push(file);
    });
  });
  return map;
}

function externalUrlsOutsideSourcesPage() {
  const map = new Map();
  function add(url, where) {
    if (!map.has(url)) map.set(url, []);
    map.get(url).push(where);
  }
  PAGES.forEach(function (file) {
    if (file === "sources.html") return;
    all(read(file), /href="(https?:[^"]+)"/g).forEach(function (m) {
      add(m[1], file);
    });
  });
  CODE.forEach(function (file) {
    all(read(file), /"(https?:\/\/[^"]+)"/g).forEach(function (m) {
      add(m[1], file);
    });
  });
  return map;
}

// --- baselines measured on the merge of PR #1 and PR #2 --------------------
//
// Counted by hand on 2026-09-13 against commit 5ab1998 (master):
//   * sources.html defines 30 anchors of the form id="c-...".
//   * exactly one of them is ever linked to: c-explorer-unfound, from
//     js/explorer.js. The other 29 are landing anchors nothing points at.
//   * js/explorer.js cites two Zohar pages that sources.html does not list.
//   * sources.html lists two URLs that nothing else on the site cites.
// These are ceilings, not targets: the suite fails if a gap grows, and stays
// green if the owner closes one.

const ANCHORS_DEFINED_TODAY = 30;
const UNLINKED_ANCHOR_CEILING = 29;

const CLAIM_URLS_NOT_IN_SOURCES = [
  // Zohar II 73b — cited by the explorer for the eyes unit.
  "https://he.wikisource.org/wiki/%D7%96%D7%94%D7%A8_%D7%97%D7%9C%D7%A7_%D7%91_%D7%A2%D7%92_%D7%91",
  // Zohar II 74a — cited by the explorer for the lion/ox figures.
  "https://he.wikisource.org/wiki/%D7%96%D7%94%D7%A8_%D7%97%D7%9C%D7%A7_%D7%91_%D7%A2%D7%93_%D7%90"
];

const SOURCE_URLS_NOTHING_CITES = [
  "https://www.hebrewbooks.org/pdfpager.aspx?req=39080&amp;pgnum=1",
  "https://ethos.lps.library.cmu.edu/article/id/482/"
];

// --- tests ----------------------------------------------------------------

test("sources.html still defines every source anchor it had, and no id twice", function () {
  const ids = definedIds();
  assert.ok(
    ids.length >= ANCHORS_DEFINED_TODAY,
    "sources.html defined " + ANCHORS_DEFINED_TODAY + " c-* anchors; found " + ids.length
  );
  const seen = new Set();
  const dupes = [];
  ids.forEach(function (id) {
    if (seen.has(id)) dupes.push(id);
    seen.add(id);
  });
  assert.deepEqual(dupes, [], "duplicate source anchor ids in sources.html: " + dupes.join(", "));
});

test("every source id cited on the site exists in sources.html", function () {
  const defined = new Set(definedIds());
  const missing = [];
  citedIds().forEach(function (where, id) {
    if (!defined.has(id)) missing.push(id + " (cited from " + where.join(", ") + ")");
  });
  assert.deepEqual(missing, [], "citations point at anchors sources.html does not define: " + missing.join("; "));
});

test("the explorer's no-source-found link resolves to a real anchor", function () {
  const js = read("js/explorer.js");
  assert.ok(
    js.includes("../sources.html#c-explorer-unfound"),
    "js/explorer.js must send unsourced readings to the sources page"
  );
  assert.ok(
    definedIds().includes("c-explorer-unfound"),
    "sources.html must define id=\"c-explorer-unfound\" as the landing anchor"
  );
});

test("the number of source anchors nothing links to does not grow", function () {
  const cited = citedIds();
  const unlinked = definedIds().filter(function (id) {
    return !cited.has(id);
  });
  assert.ok(
    unlinked.length <= UNLINKED_ANCHOR_CEILING,
    "orphaned source anchors grew from " + UNLINKED_ANCHOR_CEILING + " to " + unlinked.length + ": " + unlinked.join(", ")
  );
});

test("every URL the pages and the explorer cite is listed in sources.html", function () {
  const listed = new Set(sourceUrls());
  const allowed = new Set(CLAIM_URLS_NOT_IN_SOURCES);
  const missing = [];
  externalUrlsOutsideSourcesPage().forEach(function (where, url) {
    if (!listed.has(url) && !allowed.has(url)) {
      missing.push(url + " (cited from " + where.join(", ") + ")");
    }
  });
  assert.deepEqual(
    missing,
    [],
    "these cited URLs are not listed on the sources page: " + missing.join("; ")
  );
});

test("sources.html does not accumulate entries nothing on the site cites", function () {
  const used = externalUrlsOutsideSourcesPage();
  const allowed = new Set(SOURCE_URLS_NOTHING_CITES);
  const orphans = sourceUrls().filter(function (url) {
    return !used.has(url) && !allowed.has(url);
  });
  assert.deepEqual(
    orphans,
    [],
    "sources.html lists URLs no page or script cites: " + orphans.join("; ")
  );
});

test("no citation points at a local file that does not exist", function () {
  const broken = [];
  PAGES.forEach(function (file) {
    const base = path.dirname(path.join(ROOT, file));
    all(read(file), /(?:href|src)="([^"]+)"/g).forEach(function (m) {
      const href = m[1];
      if (/^(?:https?:|mailto:|tel:|data:|#)/.test(href)) return;
      const target = path.resolve(base, href.split("#")[0]);
      if (!fs.existsSync(target)) broken.push(file + " -> " + href);
    });
  });
  assert.deepEqual(broken, [], "broken local references: " + broken.join("; "));
});
