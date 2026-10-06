"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const { read, localRefs } = require("./helpers");

const html = read("404.html");

// The one inline script at the end of 404.html, located with indexOf so no
// regular expression ever has to parse an HTML tag.
function inlineScript() {
  const body = html.slice(html.indexOf("<body>"));
  const open = body.indexOf("<script>");
  assert.ok(open !== -1, "404.html has an inline script in <body>");
  const close = body.indexOf("</script>", open);
  assert.ok(close !== -1, "the inline script is closed");
  const src = body.slice(open + "<script>".length, close);
  assert.equal(body.indexOf("<script", open + 1), -1, "exactly one script in <body>");
  return src;
}

const script = inlineScript();

// The root-level names the script relies on, read back from the source.
function ownNames() {
  const start = script.indexOf("var own = [");
  assert.ok(start !== -1, "the script declares the root-level names");
  const end = script.indexOf("];", start);
  return JSON.parse(script.slice(start + "var own = ".length, end + 1));
}

function fakeElement(attrs, tag) {
  return {
    tag,
    attrs,
    textContent: "",
    getAttribute(name) { return name in attrs ? attrs[name] : null; },
    setAttribute(name, value) { attrs[name] = value; }
  };
}

// A minimal DOM: the page's own href-bearing nodes, a <head> that records what
// is appended, and the <code id="missing-path"> inside a hidden paragraph.
function run(location) {
  const nodes = localRefs(html)
    .filter((ref) => ref !== "js/theme.js")
    .map((ref) => fakeElement({ href: ref }, "a"));
  const head = { children: [], appendChild(el) { this.children.push(el); } };
  const missing = fakeElement({}, "code");
  missing.parentNode = { hidden: true };
  const document = {
    head,
    getElementById: (id) => (id === "missing-path" ? missing : null),
    querySelectorAll: () => nodes,
    createElement: (tag) => fakeElement({}, tag)
  };
  const window = { location };
  vm.runInNewContext(script, { window, document }, { filename: "404.html inline script" });
  return { nodes, head, missing };
}

const github = (pathname) => ({ protocol: "https:", hostname: "swissystem7.github.io", pathname });

test("the root-level names cover every reference a root page makes", () => {
  const own = ownNames();
  for (const ref of localRefs(read("index.html"))) {
    const first = ref.split("#")[0].split("/")[0];
    if (!first) continue;
    assert.ok(own.includes(first), "index.html refers to " + ref + " but " + first + " is not in the 404 root list");
  }
  assert.ok(own.includes("404.html"));
});

test("served from a nested path on a project site, every link and the stylesheet point at the site root", () => {
  const { nodes, head, missing } = run(github("/PanimGuide/explorer/typo/"));
  assert.ok(nodes.length >= 7, "the page links to every section plus the icon and stylesheet");
  for (const node of nodes) {
    assert.ok(node.attrs.href.startsWith("/PanimGuide/"), node.attrs.href + " must be rooted at /PanimGuide/");
    assert.ok(!node.attrs.href.includes("/PanimGuide//"), "no double slash in " + node.attrs.href);
  }
  assert.ok(nodes.some((n) => n.attrs.href === "/PanimGuide/css/style.css"));
  assert.ok(nodes.some((n) => n.attrs.href === "/PanimGuide/explorer/index.html"));
  assert.equal(head.children.length, 1, "the theme bootstrap is reloaded from the root");
  assert.equal(head.children[0].src, "/PanimGuide/js/theme.js");
  assert.equal(missing.textContent, "/PanimGuide/explorer/typo/");
  assert.equal(missing.parentNode.hidden, false);
});

test("served from the site root, nothing is rewritten and nothing is reloaded", () => {
  for (const pathname of ["/PanimGuide/404.html", "/PanimGuide/typo", "/PanimGuide/"]) {
    const { nodes, head } = run(github(pathname));
    for (const node of nodes) assert.ok(!node.attrs.href.startsWith("/"), pathname + ": " + node.attrs.href + " stays relative");
    assert.equal(head.children.length, 0, pathname + ": no extra script");
  }
});

test("a user site or a custom domain roots at /, recognising the site's own folders", () => {
  const cases = [
    github("/explorer/typo/"),
    { protocol: "https:", hostname: "panim.example", pathname: "/glossary/x/" },
    { protocol: "http:", hostname: "localhost", pathname: "/a/b/c" }
  ];
  for (const location of cases) {
    const { nodes, head } = run(location);
    for (const node of nodes) assert.ok(node.attrs.href.startsWith("/") && !node.attrs.href.startsWith("//"), location.hostname + ": " + node.attrs.href);
    assert.equal(head.children[0].src, "/js/theme.js");
  }
});

test("opened from disk, links are left alone but the path is still shown", () => {
  const { nodes, head, missing } = run({ protocol: "file:", hostname: "", pathname: "/C:/site/deep/404.html" });
  for (const node of nodes) assert.ok(!node.attrs.href.startsWith("/"), node.attrs.href + " stays relative on file://");
  assert.equal(head.children.length, 0);
  assert.equal(missing.textContent, "/C:/site/deep/404.html");
});

test("the shown path is text only and capped, so a hostile URL cannot inject markup or flood the page", () => {
  const long = "/PanimGuide/" + "x".repeat(500) + "<b>";
  const { missing } = run(github(long));
  assert.equal(missing.textContent.length, 200);
  assert.ok(!script.includes("innerHTML"), "the path is written with textContent only");
  assert.ok(!script.includes("document.write"));
});

test("the page is not indexed and has no theme toggle, so it stays a plain landing", () => {
  assert.ok(html.includes('<meta name="robots" content="noindex">'));
  assert.ok(!html.includes("theme-toggle"));
});
