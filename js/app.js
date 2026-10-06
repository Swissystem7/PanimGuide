(function () {
  "use strict";

  var root = document.documentElement;
  var storageKey = "panimguide-theme";

  function systemTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(theme, persist) {
    var next = theme === "dark" || theme === "light" ? theme : systemTheme();
    root.setAttribute("data-theme", next);
    var btn = document.getElementById("theme-toggle");
    if (btn) {
      var isDark = next === "dark";
      btn.setAttribute("aria-pressed", isDark ? "true" : "false");
      btn.textContent = isDark ? "מצב בהיר" : "מצב כהה";
    }
    if (persist) {
      try { localStorage.setItem(storageKey, next); } catch (e) { /* ignore */ }
    }
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(storageKey); } catch (e) { saved = null; }
    applyTheme(saved || systemTheme(), false);
    var btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.addEventListener("click", function () {
        var current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
        applyTheme(current === "dark" ? "light" : "dark", true);
      });
    }
  }

  function initNav() {
    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Search folding for Hebrew text. A standard Hebrew keyboard types the ASCII
  // quote and hyphen, while the glossary uses the typographic gershayim (U+05F4),
  // geresh (U+05F3), maqaf (U+05BE) and the odd nikud mark. Without folding,
  // typing רמב"ן never finds הרמב״ן and פסאודו-מדע never finds פסאודו־מדע.
  // Pure (no DOM) so the node:test suite can exercise it directly.
  function normalize(value) {
    return (value || "")
      .toString()
      .toLowerCase()
      .replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, "") // nikud + cantillation (not maqaf)
      .replace(/[\u05F3\u05F4"'\u201C\u201D\u2018\u2019\u00AB\u00BB]/g, "") // geresh, gershayim, quotes
      .replace(/[\u05BE\u2010-\u2015\u2212-]/g, " ") // maqaf and every dash -> space
      .replace(/\s+/g, " ")
      .trim();
  }

  // Glossary URL state. ?q=<search>&cat=<filter> so a glossary search can be
  // shared or bookmarked, mirroring the explorer permalink. Pure (no DOM) so the
  // node:test suite can exercise them; the valid categories are read from the
  // <select> and passed in, so the HTML stays the single source of truth. Only
  // non-default values are written. An unknown category, a malformed
  // percent-encoding or an over-long query falls back to the default, so a
  // hostile link can never put anything but a short plain string in the box.
  function encodeGlossaryQuery(rawQuery, cat, cats) {
    var parts = [];
    var q = (rawQuery || "").toString().trim().slice(0, 80);
    if (q) parts.push("q=" + encodeURIComponent(q));
    if (cat && cat !== "all" && cats.indexOf(cat) !== -1) parts.push("cat=" + cat);
    return parts.length ? "?" + parts.join("&") : "";
  }

  function decodeGlossaryQuery(search, cats) {
    var out = { q: "", cat: "all" };
    var raw = (search || "").toString().replace(/^\?/, "");
    if (!raw) return out;
    raw.split("&").forEach(function (pair) {
      var eq = pair.indexOf("=");
      if (eq < 1) return;
      var key = pair.slice(0, eq);
      var value = pair.slice(eq + 1).replace(/\+/g, " ");
      try { value = decodeURIComponent(value); } catch (e) { return; }
      if (key === "q") {
        out.q = value.trim().slice(0, 80);
      } else if (key === "cat" && value !== "all" && cats.indexOf(value) !== -1) {
        out.cat = value;
      }
    });
    return out;
  }

  // Deep link to one term: glossary.html#term-<slug>. Pure (no DOM) so the
  // node:test suite can exercise it; the valid ids are read from the page and
  // passed in. Anything that is not exactly one known term id is ignored, so a
  // hostile hash can never select or scroll to anything else.
  function termFromHash(hash, termIds) {
    var raw = (hash || "").toString().replace(/^#/, "");
    if (!/^term-[a-z0-9-]{1,40}$/.test(raw)) return null;
    return termIds.indexOf(raw) !== -1 ? raw : null;
  }

  // Absolute direct link for one term: the page URL without its search and
  // hash, plus #<id>. The current ?q=&cat= state is dropped on purpose: the
  // copied link should open the term, not someone's filter. Pure (no DOM) so
  // the node:test suite can exercise it.
  function termPermalink(href, id) {
    var base = (href || "").toString().split("#")[0].split("?")[0];
    return base + "#" + id;
  }

  // Whether the glossary is narrowed at all: a non-blank search string or a
  // category other than «all». Drives the «clear search» button, which is shown
  // only while there is something to clear. Pure (no DOM) so the node:test
  // suite can exercise it.
  function glossaryIsFiltered(rawQuery, cat) {
    var q = (rawQuery || "").toString().trim();
    return !!(q || (cat && cat !== "all"));
  }

  function initGlossary() {
    var search = document.getElementById("glossary-search");
    var filter = document.getElementById("glossary-filter");
    var terms = document.querySelectorAll("[data-term]");
    var status = document.getElementById("glossary-status");
    var reset = document.getElementById("glossary-reset");
    if (!terms.length) return;

    var cats = filter
      ? Array.prototype.map.call(filter.options, function (o) { return o.value; })
      : ["all"];

    function syncUrl(rawQuery, cat) {
      if (!(window.history && typeof window.history.replaceState === "function")) return;
      var query = encodeGlossaryQuery(rawQuery, cat, cats);
      var current = window.location.search || "";
      if (current === query) return;
      try {
        window.history.replaceState(null, "", window.location.pathname + query + window.location.hash);
      } catch (e) { /* file:// or sandboxed page: the search still works */ }
    }

    // What the search compares against, folded once per card: the keywords plus
    // the card text minus the «direct link» caption, which is identical on every
    // term and would otherwise make a search for קישור match all of them.
    var hays = Array.prototype.map.call(terms, function (term) {
      var clone = term.cloneNode(true);
      Array.prototype.forEach.call(clone.querySelectorAll(".term-anchor"), function (el) {
        el.parentNode.removeChild(el);
      });
      return normalize(term.getAttribute("data-term") + " " + clone.textContent);
    });

    function update() {
      var rawQuery = search ? search.value : "";
      var q = normalize(rawQuery);
      var cat = filter ? filter.value : "all";
      syncUrl(rawQuery, cat);
      if (reset) reset.hidden = !glossaryIsFiltered(rawQuery, cat);
      var shown = 0;
      terms.forEach(function (term, i) {
        var hay = hays[i];
        var matchQ = !q || hay.indexOf(q) !== -1;
        var matchC = cat === "all" || term.getAttribute("data-cat") === cat;
        var visible = matchQ && matchC;
        term.hidden = !visible;
        if (visible) shown += 1;
      });
      if (status) {
        if (shown === 0) {
          status.textContent = "לא נמצא מושג מתאים. נסו מילה קצרה יותר או בחרו «כל המושגים».";
        } else if (shown === terms.length) {
          status.textContent = "מוצגים כל " + shown + " המושגים.";
        } else {
          status.textContent = "מוצגים " + shown + " מתוך " + terms.length + " מושגים.";
        }
      }
    }

    // Restore a shared or bookmarked search before the first render.
    var fromUrl = decodeGlossaryQuery(window.location.search, cats);
    if (search && fromUrl.q) search.value = fromUrl.q;
    if (filter && fromUrl.cat !== "all") filter.value = fromUrl.cat;

    if (search) search.addEventListener("input", update);
    if (filter) filter.addEventListener("change", update);
    update();

    // «Clear search»: every term again, a clean URL, and focus back in the box
    // so a keyboard user can type the next word at once. Escape inside the box
    // does the same: type=search clears only the text, only in some browsers,
    // and never the category.
    function resetGlossary() {
      if (search) search.value = "";
      if (filter) filter.value = "all";
      update();
      if (search && typeof search.focus === "function") search.focus();
    }
    if (reset) reset.addEventListener("click", resetGlossary);
    if (search) {
      search.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        if (!glossaryIsFiltered(search.value, filter ? filter.value : "all")) return;
        e.preventDefault();
        resetGlossary();
      });
    }

    // A shared link to one term (#term-...) must show that term even when the
    // restored search or filter would hide it: the hash wins, the filters reset,
    // and the <details> opens so the reader lands on the text, not a closed card.
    var termIds = Array.prototype.map.call(terms, function (t) { return t.id; });
    function revealHashTerm() {
      var id = termFromHash(window.location.hash, termIds);
      if (!id) return;
      var term = document.getElementById(id);
      if (!term) return;
      if (term.hidden) {
        if (search) search.value = "";
        if (filter) filter.value = "all";
        update();
      }
      var details = term.querySelector("details");
      if (details) details.open = true;
      if (typeof term.scrollIntoView === "function") term.scrollIntoView();
    }
    revealHashTerm();
    window.addEventListener("hashchange", revealHashTerm);

    // Copy button next to every direct link, added only when the async
    // Clipboard API exists, so browsers without it (or file:// pages that deny
    // it) keep just the plain link. The page only ever WRITES the term link to
    // the clipboard; it never reads the clipboard. The buttons live inside
    // .term-anchor, so they are not searchable text and are not printed.
    var copyStatusTimer = null;
    var copyStatusEl = null;

    function canCopy() {
      return !!(window.navigator && navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function");
    }

    function showCopyStatus(el, text) {
      if (copyStatusEl && copyStatusEl !== el) copyStatusEl.textContent = "";
      copyStatusEl = el;
      el.textContent = text;
      if (copyStatusTimer) clearTimeout(copyStatusTimer);
      copyStatusTimer = setTimeout(function () {
        el.textContent = "";
      }, 4000);
    }

    function initTermCopy() {
      if (!canCopy()) return;
      terms.forEach(function (term) {
        var anchor = term.querySelector(".term-anchor");
        if (!anchor || !term.id) return;
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "term-copy";
        btn.textContent = "העתקת הקישור";
        var copyStatus = document.createElement("span");
        copyStatus.className = "term-copy-status";
        copyStatus.setAttribute("role", "status");
        copyStatus.setAttribute("aria-live", "polite");
        anchor.appendChild(btn);
        anchor.appendChild(copyStatus);
        btn.addEventListener("click", function () {
          navigator.clipboard.writeText(termPermalink(window.location.href, term.id)).then(function () {
            showCopyStatus(copyStatus, "הקישור הועתק.");
          }, function () {
            showCopyStatus(copyStatus, "ההעתקה נכשלה. אפשר להעתיק את הקישור ידנית.");
          });
        });
      });
    }
    initTermCopy();
  }

  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initNav();
    initGlossary();
    initYear();
  });
})();
