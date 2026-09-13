"use strict";

// The site's filter and search.
//
// The work item asked for "the filter and search functions of js/explorer.js".
// They are not there — js/explorer.js contains no search at all. The glossary
// control in js/app.js is the filter+search pair: a free-text box, a category
// select, and a live count. This file drives that real code against fixed
// glossary data declared here, through a minimal stand-in for the DOM.
//
// js/app.js is an IIFE for the browser. It now ends with a
// `typeof module === "object"` block that exports its pure functions for Node
// and is dead code in a browser.
//
// Zero dependencies, no network, no clock, no Math.random.

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

// js/app.js reads document.documentElement while it loads.
global.document = {
  documentElement: {
    setAttribute: function () {},
    getAttribute: function () {
      return null;
    }
  },
  addEventListener: function () {},
  getElementById: function () {
    return null;
  },
  querySelectorAll: function () {
    return [];
  }
};

const app = require(path.join(ROOT, "js", "app.js"));

// --- a stand-in for the parts of the DOM the glossary uses ----------------

function makeTerm(key, category, text) {
  return {
    hidden: false,
    textContent: text,
    attrs: { "data-term": key, "data-cat": category },
    getAttribute: function (name) {
      return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null;
    }
  };
}

function makeControl(value) {
  return {
    value: value,
    handlers: {},
    addEventListener: function (type, fn) {
      if (!this.handlers[type]) this.handlers[type] = [];
      this.handlers[type].push(fn);
    },
    fire: function (type) {
      (this.handlers[type] || []).forEach(function (fn) {
        fn();
      });
    }
  };
}

// Fixed glossary data. Deliberately mixed: Hebrew, Aramaic transliterated into
// Hebrew letters, Latin script and a manuscript siglum with a digit.
function fixture() {
  const terms = [
    makeTerm("מצחא", "zohar", "מצחא — המצח בלשון הזוהר"),
    makeTerm("עיינין", "zohar", "עיינין — העיניים, ארבעה גוונים"),
    makeTerm("Physiognomy", "history", "Physiognomy — פיזיוגנומיה, המונח הלועזי"),
    makeTerm("4Q186", "qumran", "4Q186 — שבר מקומראן")
  ];
  const search = makeControl("");
  const filter = makeControl("all");
  const status = { textContent: "" };
  const doc = {
    documentElement: global.document.documentElement,
    addEventListener: function () {},
    getElementById: function (id) {
      if (id === "glossary-search") return search;
      if (id === "glossary-filter") return filter;
      if (id === "glossary-status") return status;
      return null;
    },
    querySelectorAll: function (selector) {
      return selector === "[data-term]" ? terms : [];
    }
  };
  return { terms: terms, search: search, filter: filter, status: status, doc: doc };
}

// Runs the real initGlossary against the fixture, then applies a query and a
// category the way a reader would, and reports which terms stayed visible.
function run(query, category) {
  const f = fixture();
  global.document = f.doc;
  app.initGlossary();
  f.search.value = query;
  f.filter.value = category;
  f.search.fire("input");
  return {
    visible: f.terms
      .filter(function (t) {
        return !t.hidden;
      })
      .map(function (t) {
        return t.getAttribute("data-term");
      }),
    status: f.status.textContent,
    fixture: f
  };
}

// --- normalize ------------------------------------------------------------

test("normalize trims, lowercases and survives empty input", function () {
  assert.equal(app.normalize("  MiXeD  "), "mixed");
  assert.equal(app.normalize("PHYSIOGNOMY"), "physiognomy");
  assert.equal(app.normalize("מצחא"), "מצחא");
  assert.equal(app.normalize(""), "");
  assert.equal(app.normalize(null), "");
  assert.equal(app.normalize(undefined), "");
  assert.equal(app.normalize(4186), "4186");
});

// --- the initial state ----------------------------------------------------

test("with no query and no category every term is shown", function () {
  const r = run("", "all");
  assert.deepEqual(r.visible, ["מצחא", "עיינין", "Physiognomy", "4Q186"]);
  assert.equal(r.status, "מוצגים כל 4 המושגים.");
});

// --- search ---------------------------------------------------------------

test("search matches a Hebrew prefix of the term key", function () {
  const r = run("מצח", "all");
  assert.deepEqual(r.visible, ["מצחא"]);
  assert.equal(r.status, "מוצגים 1 מתוך 4 מושגים.");
});

test("search matches text inside the definition, not only the term", function () {
  const r = run("ארבעה גוונים", "all");
  assert.deepEqual(r.visible, ["עיינין"]);
});

test("search ignores letter case", function () {
  assert.deepEqual(run("PHYSIOG", "all").visible, ["Physiognomy"]);
  assert.deepEqual(run("physiognomy", "all").visible, ["Physiognomy"]);
});

test("search ignores surrounding whitespace", function () {
  assert.deepEqual(run("   4q186   ", "all").visible, ["4Q186"]);
});

test("a query that matches nothing hides every term and says so", function () {
  const r = run("אין כזה מושג", "all");
  assert.deepEqual(r.visible, []);
  assert.equal(r.status, "מוצגים 0 מתוך 4 מושגים.");
});

test("clearing the query brings every term back", function () {
  const f = fixture();
  global.document = f.doc;
  app.initGlossary();
  f.search.value = "מצח";
  f.search.fire("input");
  assert.equal(f.terms[1].hidden, true, "a non-matching term must be hidden");
  f.search.value = "";
  f.search.fire("input");
  assert.equal(
    f.terms.filter(function (t) {
      return t.hidden;
    }).length,
    0,
    "clearing the box must unhide everything"
  );
  assert.equal(f.status.textContent, "מוצגים כל 4 המושגים.");
});

// --- category filter ------------------------------------------------------

test("the category filter keeps only its own terms", function () {
  const r = run("", "zohar");
  assert.deepEqual(r.visible, ["מצחא", "עיינין"]);
  assert.equal(r.status, "מוצגים 2 מתוך 4 מושגים.");
});

test("a category with a single term narrows to that term", function () {
  assert.deepEqual(run("", "qumran").visible, ["4Q186"]);
  assert.deepEqual(run("", "history").visible, ["Physiognomy"]);
});

test("an unknown category shows nothing rather than everything", function () {
  const r = run("", "no-such-category");
  assert.deepEqual(r.visible, []);
  assert.equal(r.status, "מוצגים 0 מתוך 4 מושגים.");
});

// --- filter and search together -------------------------------------------

test("filter and search are combined with AND, not OR", function () {
  assert.deepEqual(run("עיינין", "zohar").visible, ["עיינין"]);
  // The term matches the query but sits in another category.
  assert.deepEqual(run("מצחא", "qumran").visible, []);
  // The term is in the category but does not match the query.
  assert.deepEqual(run("Physiognomy", "zohar").visible, []);
});

test("the category select re-runs the filter on change", function () {
  const f = fixture();
  global.document = f.doc;
  app.initGlossary();
  f.filter.value = "qumran";
  f.filter.fire("change");
  assert.deepEqual(
    f.terms
      .filter(function (t) {
        return !t.hidden;
      })
      .map(function (t) {
        return t.getAttribute("data-term");
      }),
    ["4Q186"]
  );
  assert.equal(f.status.textContent, "מוצגים 1 מתוך 4 מושגים.");
});

// --- degenerate input -----------------------------------------------------

test("a glossary with no terms is left alone instead of crashing", function () {
  const search = makeControl("");
  const status = { textContent: "untouched" };
  global.document = {
    documentElement: global.document.documentElement,
    addEventListener: function () {},
    getElementById: function (id) {
      if (id === "glossary-search") return search;
      if (id === "glossary-status") return status;
      return null;
    },
    querySelectorAll: function () {
      return [];
    }
  };
  app.initGlossary();
  assert.equal(status.textContent, "untouched", "no terms means no status line to write");
});

test("the glossary works with no search box and no category select", function () {
  const terms = [makeTerm("מצחא", "zohar", "מצחא")];
  const status = { textContent: "" };
  global.document = {
    documentElement: global.document.documentElement,
    addEventListener: function () {},
    getElementById: function (id) {
      return id === "glossary-status" ? status : null;
    },
    querySelectorAll: function (selector) {
      return selector === "[data-term]" ? terms : [];
    }
  };
  app.initGlossary();
  assert.equal(terms[0].hidden, false);
  assert.equal(status.textContent, "מוצגים כל 1 המושגים.");
});

// --- the markup the glossary page actually ships --------------------------

test("glossary.html supplies the elements this logic expects", function () {
  const fs = require("node:fs");
  const html = fs.readFileSync(path.join(ROOT, "glossary.html"), "utf8");
  ["glossary-search", "glossary-filter", "glossary-status"].forEach(function (id) {
    assert.ok(html.includes('id="' + id + '"'), "glossary.html is missing #" + id);
  });
  assert.ok(html.includes("data-term="), "glossary.html has no terms to filter");
  assert.ok(html.includes("data-cat="), "glossary.html has no categories to filter by");

  // Every category offered by the select must exist on at least one term, or
  // the reader gets an empty list.
  const select = /<select[^>]*id="glossary-filter"[\s\S]*?<\/select>/.exec(html);
  assert.ok(select, "glossary.html has no category select");
  const options = [];
  const re = /value="([^"]*)"/g;
  let m;
  while ((m = re.exec(select[0])) !== null) options.push(m[1]);
  const cats = new Set();
  const reCat = /data-cat="([^"]*)"/g;
  while ((m = reCat.exec(html)) !== null) cats.add(m[1]);
  const empty = options.filter(function (value) {
    return value !== "all" && !cats.has(value);
  });
  assert.deepEqual(empty, [], "category options with no terms behind them: " + empty.join(", "));
});
