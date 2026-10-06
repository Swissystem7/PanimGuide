"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

const HTML_PAGES = [
  "404.html",
  "index.html",
  "overview.html",
  "glossary.html",
  "history.html",
  "sources.html",
  "explorer/index.html"
];

const JS_FILES = ["js/theme.js", "js/app.js", "js/explorer.js"];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function ids(html) {
  const out = new Set();
  const re = /\sid="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) out.add(m[1]);
  return out;
}

// Every href/src that is not an external URL.
function localRefs(html) {
  const out = [];
  const re = /\s(?:href|src)="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    const v = m[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(v)) continue;
    out.push(v);
  }
  return out;
}

// Pulls a `var NAME = {...};` object literal out of explorer.js without
// executing the IIFE (which needs a DOM).
function objectLiteral(src, name) {
  const re = new RegExp("var " + name + " = (\\{[\\s\\S]*?\\n  \\});");
  const m = src.match(re);
  if (!m) throw new Error("object literal " + name + " not found");
  return new Function("return (" + m[1] + ");")();
}

module.exports = { ROOT, HTML_PAGES, JS_FILES, read, exists, ids, localRefs, objectLiteral };
