"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { read, ids, objectLiteral } = require("./helpers");

const src = read("js/explorer.js");
const html = read("explorer/index.html");
const DEFAULTS = objectLiteral(src, "DEFAULTS");
const LABELS = objectLiteral(src, "LABELS");

function inputsFor(key) {
  const re = new RegExp("<input[^>]*\\sname=\"" + key + "\"[^>]*>", "g");
  return html.match(re) || [];
}

function attr(tag, name) {
  const m = tag.match(new RegExp("\\s" + name + "=\"([^\"]*)\""));
  return m ? m[1] : null;
}

test("DEFAULTS and LABELS describe the same feature keys", () => {
  assert.deepEqual(Object.keys(DEFAULTS).sort(), Object.keys(LABELS).sort());
});

test("every default value points at an existing label", () => {
  for (const key of Object.keys(DEFAULTS)) {
    const v = DEFAULTS[key];
    assert.ok(Number.isInteger(v) && v >= 0 && v < LABELS[key].length, key + " default " + v + " out of range");
  }
});

test("every feature has a control in explorer/index.html that matches its labels", () => {
  for (const key of Object.keys(DEFAULTS)) {
    const inputs = inputsFor(key);
    assert.ok(inputs.length > 0, "no input named " + key + " in explorer/index.html");
    const types = new Set(inputs.map((t) => attr(t, "type")));
    assert.equal(types.size, 1, key + " mixes input types");
    const type = [...types][0];
    if (type === "range") {
      assert.equal(inputs.length, 1, key + " must have a single range input");
      assert.equal(attr(inputs[0], "min"), "0", key + " range must start at 0");
      assert.equal(Number(attr(inputs[0], "max")), LABELS[key].length - 1, key + " range max must match labels");
      assert.equal(Number(attr(inputs[0], "value")), DEFAULTS[key], key + " range value must match DEFAULTS");
    } else if (type === "radio") {
      const values = inputs.map((t) => Number(attr(t, "value"))).sort((a, b) => a - b);
      assert.deepEqual(values, LABELS[key].map((_, i) => i), key + " radio values must be 0..n-1");
      const checked = inputs.filter((t) => /\schecked\b/.test(t));
      assert.equal(checked.length, 1, key + " must have exactly one checked radio");
      assert.equal(Number(attr(checked[0], "value")), DEFAULTS[key], key + " checked radio must match DEFAULTS");
    } else {
      assert.fail(key + " uses unsupported input type " + type);
    }
  }
});

test("no control in explorer/index.html is unknown to explorer.js", () => {
  const names = new Set();
  const re = /<input[^>]*\sname="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) names.add(m[1]);
  for (const name of names) {
    assert.ok(name in DEFAULTS, "input named " + name + " has no DEFAULTS entry");
  }
});

test("every sources.html anchor used by explorer.js exists", () => {
  const sourceIds = ids(read("sources.html"));
  const re = /"\.\.\/sources\.html#([^"]+)"/g;
  let m;
  let count = 0;
  while ((m = re.exec(src))) {
    count++;
    assert.ok(sourceIds.has(m[1]), "explorer.js cites missing sources.html#" + m[1]);
  }
  assert.ok(count > 0, "explorer.js should cite sources.html");
});

test("unfound claims always use the fixed Hebrew phrase from the README", () => {
  assert.match(src, /citation: "לא נמצא מקור"/);
  assert.match(src, /c-explorer-unfound/);
});
