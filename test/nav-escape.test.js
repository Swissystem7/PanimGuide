"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { read, HTML_PAGES } = require("./helpers");

const app = read("js/app.js");

// Pulls a pure helper out of the IIFE in js/app.js without executing it
// (same trick as theme-follow-system.test.js). \r?\n so it passes on CRLF
// checkouts and LF CI alike.
function functionSource(name) {
  const re = new RegExp("\\r?\\n  function " + name + "\\([^)]*\\) \\{[\\s\\S]*?\\r?\\n  \\}\\r?\\n");
  const m = app.match(re);
  if (!m) throw new Error("function " + name + " not found in app.js");
  return m[0];
}

const { closeNav, isNavEscape, isOutsideHeader } = new Function(
  functionSource("closeNav") + functionSource("isNavEscape") + functionSource("isOutsideHeader") +
    "return { closeNav: closeNav, isNavEscape: isNavEscape, isOutsideHeader: isOutsideHeader };"
)();

// A <nav> with a real-enough classList and a toggle that records aria-expanded.
function fakeNav(open) {
  const classes = new Set(open ? ["site-nav", "is-open"] : ["site-nav"]);
  return {
    classList: {
      contains: (c) => classes.has(c),
      remove: (c) => classes.delete(c),
      add: (c) => classes.add(c)
    },
    isOpen: () => classes.has("is-open")
  };
}

function fakeToggle() {
  const attrs = { "aria-expanded": "true" };
  return { attrs, setAttribute(name, value) { attrs[name] = value; } };
}

// A header that "contains" exactly the nodes it was built with.
function fakeHeader(inside) {
  return { contains: (node) => inside.includes(node) };
}

test("closeNav closes an open menu, syncs aria-expanded, and reports the close", () => {
  const nav = fakeNav(true);
  const toggle = fakeToggle();
  assert.equal(closeNav(nav, toggle), true);
  assert.equal(nav.isOpen(), false);
  assert.equal(toggle.attrs["aria-expanded"], "false");
});

test("closeNav on a closed menu (the desktop layout) is a no-op and says so", () => {
  const nav = fakeNav(false);
  const toggle = fakeToggle();
  assert.equal(closeNav(nav, toggle), false);
  assert.equal(nav.isOpen(), false);
  assert.equal(toggle.attrs["aria-expanded"], "true", "nothing touched when there was nothing to close");
});

test("Escape counts only while the menu is open, under every name browsers give the key", () => {
  const open = fakeNav(true);
  assert.equal(isNavEscape({ key: "Escape" }, open), true);
  assert.equal(isNavEscape({ key: "Esc" }, open), true, "IE / old Edge spelling");
  assert.equal(isNavEscape({ keyCode: 27 }, open), true, "legacy keyCode only");
  assert.equal(isNavEscape({ code: "Escape" }, open), true);
  assert.equal(isNavEscape({ key: "Escape" }, fakeNav(false)), false, "a closed menu leaves Escape to the page");
});

test("other keys never close the menu, and a malformed event does not throw", () => {
  const open = fakeNav(true);
  for (const key of ["Enter", " ", "Tab", "ArrowDown", "e", "a"]) {
    assert.equal(isNavEscape({ key }, open), false, key + " must not close the menu");
  }
  assert.equal(isNavEscape(undefined, open), false);
  assert.equal(isNavEscape({}, open), false);
});

test("a click is outside the header only when the header does not contain it", () => {
  const toggle = {};
  const link = {};
  const main = {};
  const header = fakeHeader([toggle, link]);
  assert.equal(isOutsideHeader(main, header), true);
  assert.equal(isOutsideHeader(toggle, header), false);
  assert.equal(isOutsideHeader(link, header), false);
});

test("without a header (or a target) nothing is treated as outside, so the menu is never closed by mistake", () => {
  assert.equal(isOutsideHeader({}, null), false);
  assert.equal(isOutsideHeader(null, fakeHeader([])), false);
  assert.equal(isOutsideHeader({}, {}), false, "a header without contains() cannot decide, so it does not");
});

test("initNav wires Escape and outside clicks on the document, and only refocuses the toggle from inside the header", () => {
  const src = functionSource("initNav");
  assert.ok(src.includes('toggle.closest(".site-header")'), "the header is found from the toggle, not by a global query");
  assert.ok(src.includes('document.addEventListener("keydown"'), "Escape is listened for on the document");
  assert.ok(src.includes("if (!isNavEscape(event, nav)) return;"), "the pure helper decides");
  assert.ok(src.includes("if (!isOutsideHeader(document.activeElement, header)) toggle.focus();"), "focus returns to the toggle only when it was inside the header");
  assert.ok(src.includes('document.addEventListener("click"'), "outside clicks are listened for on the document");
  assert.ok(src.includes("if (isOutsideHeader(event.target, header)) closeNav(nav, toggle);"), "an outside click closes via the same helper");
  assert.ok(src.includes("closeNav(nav, toggle);"), "a link click closes via the same helper");
  const escape = src.indexOf('document.addEventListener("keydown"');
  const click = src.indexOf('document.addEventListener("click"');
  assert.ok(escape !== -1 && click !== -1 && escape < click, "keyboard first, pointer second");
});

test("every page with a menu toggle has it inside a .site-header, so the outside-click test has a boundary", () => {
  for (const page of HTML_PAGES) {
    const html = read(page);
    const toggle = html.indexOf('id="nav-toggle"');
    if (toggle === -1) continue;
    const header = html.indexOf('class="site-header"');
    const headerEnd = html.indexOf("</header>", header);
    assert.ok(header !== -1 && header < toggle && toggle < headerEnd, page + ": nav-toggle must sit inside .site-header");
    const nav = html.indexOf('id="site-nav"');
    assert.ok(nav !== -1 && header < nav && nav < headerEnd, page + ": site-nav must sit inside .site-header");
  }
});
