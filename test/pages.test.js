"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { ROOT, HTML_PAGES, JS_FILES, read, exists, ids, localRefs } = require("./helpers");

test("every page is Hebrew and right-to-left", () => {
  for (const page of HTML_PAGES) {
    const head = read(page).slice(0, 400);
    assert.match(head, /<html[^>]*\slang="he"/, page + " must declare lang=he");
    assert.match(head, /<html[^>]*\sdir="rtl"/, page + " must declare dir=rtl");
  }
});

test("every page has a <main> landmark and a skip link (except 404)", () => {
  for (const page of HTML_PAGES) {
    const html = read(page);
    assert.match(html, /<main[\s>]/, page + " must have <main>");
    if (page !== "404.html") {
      assert.match(html, /href="#main"/, page + " must have a skip link to #main");
    }
  }
});

test("every local href/src resolves to a file in the repo", () => {
  for (const page of HTML_PAGES) {
    const dir = path.dirname(page);
    for (const ref of localRefs(read(page))) {
      const file = ref.split("#")[0];
      if (!file) continue; // same-page fragment
      const rel = path.normalize(path.join(dir, file));
      assert.ok(exists(rel), page + " links to missing file " + ref);
    }
  }
});

test("every fragment link points at an existing id", () => {
  const idCache = new Map();
  const idsOf = (rel) => {
    if (!idCache.has(rel)) idCache.set(rel, ids(read(rel)));
    return idCache.get(rel);
  };
  for (const page of HTML_PAGES) {
    const dir = path.dirname(page);
    for (const ref of localRefs(read(page))) {
      if (!ref.includes("#")) continue;
      const [file, frag] = ref.split("#");
      if (!frag) continue;
      const target = file ? path.normalize(path.join(dir, file)) : page;
      assert.ok(idsOf(target).has(frag), page + " links to " + ref + " but there is no such id in " + target);
    }
  }
});

test("site stays static: no camera, image upload, media or external scripts", () => {
  const forbidden = [
    /<img[\s>]/i,
    /<video[\s>]/i,
    /<canvas[\s>]/i,
    /getUserMedia/,
    /mediaDevices/,
    /type="file"/i,
    /\scapture=/i,
    /<script[^>]+src="https?:/i,
    /<link[^>]+href="https?:/i
  ];
  for (const file of HTML_PAGES.concat(JS_FILES)) {
    const text = read(file);
    for (const re of forbidden) {
      assert.doesNotMatch(text, re, file + " must not match " + re);
    }
  }
});

test("scripts parse with node --check", () => {
  for (const file of JS_FILES) {
    execFileSync(process.execPath, ["--check", path.join(ROOT, file)], { stdio: "pipe" });
  }
});
