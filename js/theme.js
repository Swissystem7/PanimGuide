// PanimGuide — theme bootstrap. Loaded synchronously in <head>, before the
// stylesheet, so a manually chosen theme is on <html> before the first paint
// and the page does not flash the system theme first. js/app.js (deferred)
// still owns the toggle button and persists the choice; this file only
// restores it as early as possible. No dependencies, no DOM access beyond
// the <html> element.
(function () {
  "use strict";

  var storageKey = "panimguide-theme";

  // Pure: a stored preference wins only when it is a known theme. Anything
  // else (nothing saved, a stale or tampered value) returns null so the CSS
  // prefers-color-scheme rules stay in charge until app.js runs.
  function savedTheme(value) {
    return value === "dark" || value === "light" ? value : null;
  }

  var saved = null;
  try { saved = savedTheme(localStorage.getItem(storageKey)); } catch (e) { saved = null; }
  if (saved) document.documentElement.setAttribute("data-theme", saved);
})();
