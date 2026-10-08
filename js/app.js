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

  function normalize(value) {
    return (value || "").toString().trim().toLowerCase();
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
      
      var emptyState = document.getElementById("glossary-empty");
      if (emptyState) {
        emptyState.hidden = shown > 0;
      }
      
      if (status) {
        if (shown === 0) {
          status.textContent = "לא נמצאו מושגים תואמים.";
        } else {
          status.textContent = shown === terms.length
            ? "מוצגים כל " + shown + " המושגים."
            : "מוצגים " + shown + " מתוך " + terms.length + " מושגים.";
        }
      }
    }

    if (search) search.addEventListener("input", update);
    if (filter) filter.addEventListener("change", update);
    
    var resetBtn = document.getElementById("glossary-reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", function() {
        if (search) search.value = "";
        if (filter) filter.value = "all";
        update();
      });
    }
    
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
