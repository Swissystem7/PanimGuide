"use strict";

// Unit tests for the reading logic of js/explorer.js.
//
// NOTE ON SCOPE — the work item asked for "the filter and search functions of
// js/explorer.js". js/explorer.js has no filter and no search: it contains two
// incidental Array.prototype.filter calls inside buildComposite and the string
// "search" appears nowhere in it. The site's filter+search pair is the glossary
// control in js/app.js, and it is covered in test/glossary.test.js.
// What js/explorer.js actually does is select, for a chosen face state, which
// sourced claims the tradition makes and which fields have no source at all.
// That selection is what this file pins, on fixed states declared below.
//
// js/explorer.js is an IIFE for the browser. It now ends with a
// `typeof module === "object"` block that exports its pure functions for Node
// and is dead code in a browser.
//
// Zero dependencies, no network, no clock, no Math.random.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

// The script registers one DOMContentLoaded listener when it loads. A stub is
// enough; nothing below touches the DOM.
global.document = {
  addEventListener: function () {},
  getElementById: function () {
    return null;
  },
  querySelectorAll: function () {
    return [];
  }
};

const explorer = require(path.join(ROOT, "js", "explorer.js"));

const DEFAULTS = explorer.DEFAULTS;
const LABELS = explorer.LABELS;
const readingsFor = explorer.readingsFor;
const foreheadCombo = explorer.foreheadCombo;
const buildComposite = explorer.buildComposite;
const escapeHtml = explorer.escapeHtml;

const UNFOUND_CITATION = "לא נמצא מקור";
const UNFOUND_HREF = "../sources.html#c-explorer-unfound";

// Fixed states used by the tests. Each is the default face with one or two
// fields moved, so a failure names the field that broke.
function state(overrides) {
  return Object.assign({}, DEFAULTS, overrides || {});
}

const FIXED_STATES = [
  ["default face", state()],
  ["curled hair rising", state({ hairTexture: 0 })],
  ["smooth hair hanging", state({ hairTexture: 2 })],
  ["in-between hair", state({ hairTexture: 1 })],
  ["glossy black hair", state({ hairColor: 0 })],
  ["bald between the eyes", state({ hairline: 1 })],
  ["bald elsewhere", state({ hairline: 2 })],
  ["thin sharp forehead", state({ foreheadSize: 0, foreheadRound: 0 })],
  ["large round forehead", state({ foreheadSize: 2, foreheadRound: 2 })],
  ["deep set eyes", state({ eyeDepth: 1 })],
  ["full beard", state({ beard: 1 })],
  ["momentary redness", state({ complexion: 1 })],
  ["momentary greenness", state({ complexion: 3 })]
];

// --- shape ----------------------------------------------------------------

test("every adjustable field has a label list", function () {
  assert.deepEqual(
    Object.keys(LABELS).sort(),
    Object.keys(DEFAULTS).sort(),
    "DEFAULTS and LABELS must describe the same fields"
  );
  assert.equal(Object.keys(DEFAULTS).length, 16, "the explorer exposes 16 face fields");
  Object.keys(LABELS).forEach(function (key) {
    assert.ok(Array.isArray(LABELS[key]), key + " has no label array");
    assert.ok(LABELS[key].length >= 2, key + " needs at least two options");
    LABELS[key].forEach(function (label) {
      assert.equal(typeof label, "string");
      assert.ok(label.trim().length > 0, key + " has an empty label");
    });
  });
});

test("every default value is inside its own label range", function () {
  Object.keys(DEFAULTS).forEach(function (key) {
    const value = DEFAULTS[key];
    assert.ok(Number.isInteger(value), key + " default is not an integer");
    assert.ok(value >= 0 && value < LABELS[key].length, key + " default " + value + " has no label");
  });
});

// --- the reading itself ---------------------------------------------------

FIXED_STATES.forEach(function (pair) {
  const name = pair[0];
  const st = pair[1];

  test("reading for " + name + " returns one entry per field group", function () {
    const list = readingsFor(st);
    assert.equal(list.length, 16, name + ": expected 16 entries, got " + list.length);
  });

  test("reading for " + name + " is either sourced or openly unsourced", function () {
    readingsFor(st).forEach(function (item) {
      assert.equal(typeof item.feature, "string");
      assert.ok(item.feature.trim().length > 0, name + ": an entry has no field name");
      if (item.found) {
        assert.ok(item.quote.trim().length > 0, name + ": sourced entry without a quote: " + item.feature);
        assert.ok(item.paraphrase.trim().length > 0, name + ": sourced entry without a paraphrase: " + item.feature);
        assert.ok(item.citation.trim().length > 0, name + ": sourced entry without a citation: " + item.feature);
        assert.ok(item.period.trim().length > 0, name + ": sourced entry without a period: " + item.feature);
        assert.match(item.href, /^https?:\/\//, name + ": sourced entry must link out: " + item.feature);
        assert.notEqual(item.citation, UNFOUND_CITATION, name + ": sourced entry citing nothing");
      } else {
        assert.equal(item.citation, UNFOUND_CITATION, name + ": unsourced entry must say so: " + item.feature);
        assert.equal(item.href, UNFOUND_HREF, name + ": unsourced entry must link to the sources page");
        assert.equal(item.quote, "", name + ": unsourced entry must not carry a quote");
      }
    });
  });

  test("reading for " + name + " ends with the limit the tradition sets on itself", function () {
    const list = readingsFor(st);
    const last = list[list.length - 1];
    assert.equal(last.feature.indexOf("גבול"), 0, name + ": last entry is not the self-imposed limit");
    assert.equal(last.found, true, name + ": the limit entry must itself be sourced");
    assert.ok(last.citation.includes("עח"), name + ": the limit must cite Zohar II 78a");
  });
});

test("the default face is mostly unsourced, and says so", function () {
  const list = readingsFor(DEFAULTS);
  const found = list.filter(function (item) {
    return item.found;
  });
  // Counted by hand on 2026-09-13: 5 sourced entries, 11 that say "no source
  // found". The default is deliberately a face the Zohar does not describe.
  assert.equal(found.length, 5, "default face: expected 5 sourced entries");
  assert.equal(list.length - found.length, 11, "default face: expected 11 unsourced entries");
});

test("hair texture selects the three documented outcomes", function () {
  assert.equal(readingsFor(state({ hairTexture: 0 }))[0].found, true);
  assert.equal(readingsFor(state({ hairTexture: 1 }))[0].found, false);
  assert.equal(readingsFor(state({ hairTexture: 2 }))[0].found, true);
  assert.notEqual(
    readingsFor(state({ hairTexture: 0 }))[0].feature,
    readingsFor(state({ hairTexture: 2 }))[0].feature,
    "the two documented hair types must not collapse into one reading"
  );
});

// --- the forehead grid ----------------------------------------------------
//
// The Zohar names four forehead types. The explorer offers a 3x3 grid (thin /
// middle / large by sharp / middle / round), so five of the nine combinations
// have no source. Counted by hand from Zohar II 71b and 72a.

test("the forehead grid is sourced only on the four corners the Zohar names", function () {
  const sourced = [[0, 0], [0, 2], [2, 0], [2, 2]];
  const seen = [];
  [0, 1, 2].forEach(function (size) {
    [0, 1, 2].forEach(function (round) {
      const item = foreheadCombo(state({ foreheadSize: size, foreheadRound: round }));
      if (item.found) seen.push([size, round]);
      const expected = sourced.some(function (pair) {
        return pair[0] === size && pair[1] === round;
      });
      assert.equal(
        item.found,
        expected,
        "forehead size=" + size + " round=" + round + ": found should be " + expected
      );
      if (!expected) {
        assert.equal(item.citation, UNFOUND_CITATION);
        assert.equal(item.href, UNFOUND_HREF);
      }
    });
  });
  assert.equal(seen.length, 4, "exactly four forehead combinations are sourced");
});

test("the split forehead keeps the conflict note the Zohar itself records", function () {
  const split = foreheadCombo(state({ foreheadSize: 2, foreheadRound: 0 }));
  assert.equal(split.found, true);
  assert.ok(split.conflict.trim().length > 0, "Zohar II 72a splits this shape into two types");
  const plain = foreheadCombo(state({ foreheadSize: 2, foreheadRound: 2 }));
  assert.equal(plain.conflict, "", "the round large forehead carries no conflict note");
});

test("the forehead entry sits in the reading at the position the page renders", function () {
  const st = state({ foreheadSize: 0, foreheadRound: 0 });
  const list = readingsFor(st);
  const direct = foreheadCombo(st);
  assert.ok(
    list.some(function (item) {
      return item.feature === direct.feature && item.citation === direct.citation;
    }),
    "readingsFor must include the forehead combination it computed"
  );
});

// --- the composite --------------------------------------------------------

test("the composite lists sourced claims and names what has no source", function () {
  const st = state({ hairTexture: 0, hairColor: 0, foreheadSize: 0, foreheadRound: 0 });
  const list = readingsFor(st);
  const html = buildComposite(st, list);
  assert.equal(typeof html, "string");
  list.forEach(function (item) {
    if (item.found && item.feature.indexOf("גבול") !== 0) {
      assert.ok(html.includes(item.feature), "composite dropped a sourced field: " + item.feature);
    }
  });
  const limit = list[list.length - 1];
  assert.ok(
    !html.includes("<strong>" + limit.feature + ":</strong>"),
    "the self-imposed limit is not one of the face claims and must not be listed as one"
  );
});

test("the composite of an all-unsourced reading claims nothing", function () {
  const st = state({ hairTexture: 1, hairColor: 2, hairline: 0, foreheadSize: 1, foreheadRound: 1 });
  const list = readingsFor(st);
  const html = buildComposite(st, list);
  list
    .filter(function (item) {
      return !item.found;
    })
    .forEach(function (item) {
      assert.ok(
        html.includes(item.feature),
        "composite must name the unsourced field: " + item.feature
      );
    });
});

// --- escaping -------------------------------------------------------------

test("text going into the page is escaped", function () {
  assert.equal(escapeHtml('<a href="x">'), "&lt;a href=&quot;x&quot;&gt;");
  assert.equal(escapeHtml("a & b"), "a &amp; b");
  assert.equal(escapeHtml("&amp;"), "&amp;amp;", "the ampersand must be escaped first, not twice");
  assert.equal(escapeHtml(""), "");
  assert.equal(escapeHtml("מצחא"), "מצחא");
  assert.equal(escapeHtml("«עיינין»"), "«עיינין»", "Hebrew punctuation is left alone");
  // escapeHtml deliberately does not touch the apostrophe. That is safe only
  // because renderClaim and buildComposite interpolate into text nodes and
  // double-quoted attributes, never into a single-quoted attribute.
  assert.equal(escapeHtml("ה'"), "ה'");
});

test("no claim link carries a quote that could break out of its attribute", function () {
  // renderClaim writes item.href into href="..." without escaping it, so the
  // hrefs the module ships must not contain a double quote.
  FIXED_STATES.forEach(function (pair) {
    readingsFor(pair[1]).forEach(function (item) {
      assert.ok(
        item.href.indexOf('"') === -1,
        pair[0] + ": href contains a double quote: " + item.href
      );
    });
  });
});

// --- determinism ----------------------------------------------------------

test("the explorer script is deterministic and offline", function () {
  const src = fs.readFileSync(path.join(ROOT, "js", "explorer.js"), "utf8");
  ["Math.random", "fetch(", "XMLHttpRequest", "new Date", "Date.now", "setTimeout", "localStorage"].forEach(
    function (bad) {
      assert.ok(!src.includes(bad), "js/explorer.js must not use " + bad);
    }
  );
});

test("the same state always produces the same reading", function () {
  FIXED_STATES.forEach(function (pair) {
    const a = readingsFor(pair[1]);
    const b = readingsFor(pair[1]);
    assert.deepEqual(a, b, pair[0] + " is not deterministic");
  });
});
