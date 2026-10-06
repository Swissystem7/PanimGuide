"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { read } = require("./helpers");

const src = read("js/app.js");
const html = read("glossary.html");
const css = read("css/style.css");

// Pulls the pure `glossaryIsFiltered` helper out of the IIFE in app.js (same
// trick as glossary-copy.test.js). \r?\n so it passes on CRLF checkouts and LF CI.
function functionSource(name) {
  const re = new RegExp("\\r?\\n  function " + name + "\\([^)]*\\) \\{[\\s\\S]*?\\r?\\n  \\}\\r?\\n");
  const m = src.match(re);
  if (!m) throw new Error("function " + name + " not found in app.js");
  return m[0];
}

const glossaryIsFiltered = new Function(functionSource("glossaryIsFiltered") + "return glossaryIsFiltered;")();

test("the default state (blank search, every category) is not filtered", () => {
  assert.equal(glossaryIsFiltered("", "all"), false);
  assert.equal(glossaryIsFiltered("   ", "all"), false);
  assert.equal(glossaryIsFiltered(undefined, undefined), false);
  assert.equal(glossaryIsFiltered(null, ""), false);
});

test("a search string or a real category means there is something to clear", () => {
  assert.equal(glossaryIsFiltered("דיוקנא", "all"), true);
  assert.equal(glossaryIsFiltered(" ד ", "all"), true);
  assert.equal(glossaryIsFiltered("", "ideas"), true);
  assert.equal(glossaryIsFiltered("דיוקנא", "ideas"), true);
});

test("the clear button ships hidden in the HTML and is shown by the script only when filtered", () => {
  assert.match(html, /<button type="button" id="glossary-reset" class="glossary-reset" hidden>/, "a hidden, non-submit button inside the tools");
  const tools = html.slice(html.indexOf('<div class="glossary-tools">'), html.indexOf('<article class="term"'));
  assert.ok(tools.includes('id="glossary-reset"'), "the button sits inside .glossary-tools (so it is hidden in print with them)");
  assert.ok(src.includes("reset.hidden = !glossaryIsFiltered(rawQuery, cat);"), "update() toggles the button from the pure helper");
});

test("clearing resets the search, the category and the URL, then returns focus to the box", () => {
  const fn = src.slice(src.indexOf("function resetGlossary()"), src.indexOf('if (reset) reset.addEventListener("click", resetGlossary);'));
  assert.ok(fn.includes('search.value = ""'), "search cleared");
  assert.ok(fn.includes('filter.value = "all"'), "category back to all");
  assert.ok(fn.includes("update();"), "update() re-renders and rewrites the URL through syncUrl");
  assert.ok(fn.includes("search.focus()"), "focus returned to the search box");
  assert.ok(src.includes('if (e.key !== "Escape") return;'), "Escape in the box clears too");
  assert.ok(src.includes("if (!glossaryIsFiltered(search.value, filter ? filter.value : \"all\")) return;"), "Escape is left alone when there is nothing to clear");
});

test("the clear button is styled and hidden with the rest of the tools in print", () => {
  assert.ok(css.includes(".glossary-reset {"), "a .glossary-reset rule exists");
  assert.ok(css.includes(".glossary-reset[hidden] {"), "[hidden] still hides it even if a display rule is added later");
  const print = css.slice(css.indexOf("@media print"));
  assert.ok(/\.glossary-tools[^{]*\{ display: none !important; \}/.test(print), "the tools, button included, are hidden in print");
});
