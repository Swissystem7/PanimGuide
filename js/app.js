(function () {
  "use strict";

  var root = document.documentElement;
  var storageKey = "panimguide-theme";

  function systemTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  // The browser chrome (Android address bar, iOS Safari tab bar) follows
  // <meta name="theme-color">. The HTML carries one tag per system scheme,
  // which is right until a theme is chosen by hand: from then on both tags
  // are pointed at the page background the CSS resolved for that theme, so
  // the chrome never stays light over a dark page or the other way round.
  // Pure apart from the document it is handed, so the node:test suite can
  // exercise it with a fake. An empty colour (no custom-property support)
  // leaves the tags alone.
  function syncThemeColor(doc, bg) {
    if (!bg) return 0;
    var metas = doc.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i += 1) metas[i].setAttribute("content", bg);
    return metas.length;
  }

  function applyTheme(theme, persist) {
    var next = theme === "dark" || theme === "light" ? theme : systemTheme();
    root.setAttribute("data-theme", next);
    var bg = "";
    try { bg = window.getComputedStyle(root).getPropertyValue("--bg").trim(); } catch (e) { bg = ""; }
    syncThemeColor(document, bg);
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

  function hasSavedTheme() {
    var saved = null;
    try { saved = localStorage.getItem(storageKey); } catch (e) { saved = null; }
    return saved === "dark" || saved === "light";
  }

  // Follow the operating system while no theme was chosen by hand. applyTheme
  // pins data-theme on <html>, which takes the CSS prefers-color-scheme rules
  // out of play, so without this an OS that switches to dark at sunset (or a
  // user flipping the setting) left the page in the scheme it loaded with.
  // Returns true when the change was applied, false when a saved choice wins.
  // Pure apart from the callbacks it is handed, so the node:test suite can
  // exercise it with fakes.
  function onSystemThemeChange(event, saved, apply) {
    if (saved()) return false;
    apply(event && event.matches ? "dark" : "light", false);
    return true;
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
    var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    if (!mq) return;
    var onChange = function (event) { onSystemThemeChange(event, hasSavedTheme, applyTheme); };
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(onChange); // Safari < 14
    }
  }

  // Pure apart from the two nodes it is handed: closes the mobile menu and
  // reports whether it was open, so callers only act (move focus) on a real
  // close. The desktop layout never has is-open, so there it is a no-op.
  function closeNav(nav, toggle) {
    if (!nav.classList.contains("is-open")) return false;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    return true;
  }

  // Pure: should a keydown close the menu? Only Escape, and only when the
  // menu is open, so the key keeps its meaning elsewhere (glossary search
  // clears on Escape too, and must not lose focus to the nav toggle).
  function isNavEscape(event, nav) {
    if (!event || !nav.classList.contains("is-open")) return false;
    var key = event.key || event.code;
    return key === "Escape" || key === "Esc" || event.keyCode === 27;
  }

  // Pure: a click outside the header (the toggle, the menu and the brand)
  // dismisses the menu, as a user expects of an overlay. Clicks inside leave
  // it to the toggle and the links.
  function isOutsideHeader(target, header) {
    if (!header || !target) return false;
    return typeof header.contains === "function" ? !header.contains(target) : false;
  }

  function initNav() {
    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;
    var header = toggle.closest ? toggle.closest(".site-header") : null;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        closeNav(nav, toggle);
      });
    });
    // Escape closes the open menu and hands focus back to the button that
    // opened it, so a keyboard user is not left on a hidden link. Focus that
    // was outside the header (the glossary search box, say) stays there.
    document.addEventListener("keydown", function (event) {
      if (!isNavEscape(event, nav)) return;
      closeNav(nav, toggle);
      if (!isOutsideHeader(document.activeElement, header)) toggle.focus();
    });
    // A tap or click anywhere outside the header closes the menu. Focus is
    // left where the user put it.
    document.addEventListener("click", function (event) {
      if (isOutsideHeader(event.target, header)) closeNav(nav, toggle);
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

  function initGlossary() {
    var search = document.getElementById("glossary-search");
    var filter = document.getElementById("glossary-filter");
    var terms = document.querySelectorAll("[data-term]");
    var status = document.getElementById("glossary-status");
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

    function update() {
      var rawQuery = search ? search.value : "";
      var q = normalize(rawQuery);
      var cat = filter ? filter.value : "all";
      syncUrl(rawQuery, cat);
      var shown = 0;
      terms.forEach(function (term) {
        var hay = normalize(term.getAttribute("data-term") + " " + term.textContent);
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
