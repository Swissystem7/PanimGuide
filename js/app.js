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

  function initGlossary() {
    var search = document.getElementById("glossary-search");
    var filter = document.getElementById("glossary-filter");
    var terms = document.querySelectorAll("[data-term]");
    var status = document.getElementById("glossary-status");
    if (!terms.length) return;

    function update() {
      var q = search ? normalize(search.value) : "";
      var cat = filter ? filter.value : "all";
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
