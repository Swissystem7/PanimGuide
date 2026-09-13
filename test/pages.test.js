"use strict";

// Structural contract for every HTML page of PanimGuide.
//
// The site is Hebrew and right-to-left, it is static, and it is navigated only
// by its own links. This file holds that shape: language and direction, one
// document title per page, a route from every page to every other page, and no
// link that lands nowhere.
//
// Zero dependencies, no network, no clock, no Math.random.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

// The six pages a reader can reach from the navigation bar.
const PAGES = [
  "index.html",
  "overview.html",
  "history.html",
  "glossary.html",
  "sources.html",
  "explorer/index.html"
];

// 404.html is served by GitHub Pages for unknown paths. It has no <nav>, but it
// does link back to all six pages in prose, so it takes part in the routing
// check below.
const ALL_HTML = PAGES.concat(["404.html"]);

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function all(text, re) {
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) out.push(m);
  return out;
}

function htmlTag(html) {
  const m = /<html\b[^>]*>/i.exec(html);
  assert.ok(m, "no <html> tag");
  return m[0];
}

function attr(tag, name) {
  const m = new RegExp(name + '="([^"]*)"', "i").exec(tag);
  return m ? m[1] : null;
}

function localRefs(page) {
  const base = path.dirname(path.join(ROOT, page));
  return all(read(page), /(?:href|src)="([^"]+)"/g)
    .map(function (m) {
      return m[1];
    })
    .filter(function (href) {
      return !/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(href);
    })
    .map(function (href) {
      const hash = href.indexOf("#");
      const file = hash === -1 ? href : href.slice(0, hash);
      const frag = hash === -1 ? "" : href.slice(hash + 1);
      return {
        href: href,
        frag: frag,
        // an empty file part means "this page"
        target: file === "" ? path.join(ROOT, page) : path.resolve(base, file),
        rel: file === "" ? page : path.relative(ROOT, path.resolve(base, file)).split(path.sep).join("/")
      };
    });
}

// --- tests ----------------------------------------------------------------

ALL_HTML.forEach(function (page) {
  test(page + " declares Hebrew and right-to-left", function () {
    const tag = htmlTag(read(page));
    assert.equal(attr(tag, "lang"), "he", page + ": <html lang> must be he");
    assert.equal(attr(tag, "dir"), "rtl", page + ": <html dir> must be rtl");
  });

  test(page + " is UTF-8 and responsive", function () {
    const html = read(page);
    assert.match(html, /<meta\s+charset="utf-8">/i, page + ": missing utf-8 charset");
    assert.match(html, /name="viewport"/i, page + ": missing viewport meta");
  });

  test(page + " has exactly one h1 and a non-empty title", function () {
    const html = read(page);
    const h1 = all(html, /<h1[\s>]/gi);
    assert.equal(h1.length, 1, page + ": expected exactly one <h1>, found " + h1.length);
    const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
    assert.ok(title, page + ": missing <title>");
    assert.ok(title[1].trim().length > 0, page + ": empty <title>");
  });
});

ALL_HTML.forEach(function (page) {
  test(page + " links to every other page", function () {
    const reached = new Set(
      localRefs(page).map(function (ref) {
        return ref.rel;
      })
    );
    const missing = PAGES.filter(function (other) {
      return other !== page && !reached.has(other);
    });
    assert.deepEqual(missing, [], page + " cannot reach: " + missing.join(", "));
  });
});

PAGES.forEach(function (page) {
  test(page + " carries the shared navigation bar", function () {
    const html = read(page);
    const nav = /<nav[\s\S]*?<\/nav>/i.exec(html);
    assert.ok(nav, page + ": no <nav> element");
    const base = path.dirname(path.join(ROOT, page));
    const reached = new Set(
      all(nav[0], /href="([^"]+)"/g).map(function (m) {
        const file = m[1].split("#")[0];
        return path.relative(ROOT, path.resolve(base, file)).split(path.sep).join("/");
      })
    );
    const missing = PAGES.filter(function (other) {
      return !reached.has(other);
    });
    assert.deepEqual(missing, [], page + " nav is missing: " + missing.join(", "));
  });
});

ALL_HTML.forEach(function (page) {
  test(page + " has no broken internal link", function () {
    const broken = [];
    localRefs(page).forEach(function (ref) {
      if (!fs.existsSync(ref.target)) {
        broken.push(ref.href + " (no such file)");
        return;
      }
      if (!ref.frag) return;
      if (!/\.html$/i.test(ref.target)) return;
      const target = fs.readFileSync(ref.target, "utf8");
      if (!target.includes('id="' + ref.frag + '"')) {
        broken.push(ref.href + " (no id=\"" + ref.frag + '" in ' + ref.rel + ")");
      }
    });
    assert.deepEqual(broken, [], page + " has broken links: " + broken.join("; "));
  });
});

ALL_HTML.forEach(function (page) {
  test(page + " has a unique id for every element that declares one", function () {
    const ids = all(read(page), /\sid="([^"]+)"/g).map(function (m) {
      return m[1];
    });
    const seen = new Set();
    const dupes = [];
    ids.forEach(function (id) {
      if (seen.has(id)) dupes.push(id);
      seen.add(id);
    });
    assert.deepEqual(dupes, [], page + " repeats ids: " + dupes.join(", "));
  });
});

test("the site stays static: no page loads a remote script or stylesheet", function () {
  ALL_HTML.forEach(function (page) {
    const html = read(page);
    all(html, /<script[^>]*\ssrc="([^"]+)"/g).forEach(function (m) {
      assert.ok(!/^https?:/i.test(m[1]), page + " loads a remote script: " + m[1]);
    });
    all(html, /<link[^>]*\shref="([^"]+)"[^>]*>/g).forEach(function (m) {
      if (!/stylesheet/i.test(m[0])) return;
      assert.ok(!/^https?:/i.test(m[1]), page + " loads a remote stylesheet: " + m[1]);
    });
  });
});
