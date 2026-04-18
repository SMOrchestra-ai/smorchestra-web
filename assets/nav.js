/* SMOrchestra — mobile nav enhancer
 * Progressive enhancement: finds any .nav-inner + .nav-links pair and injects
 * a hamburger button that toggles the nav open/closed at mobile widths.
 * Works across all pages with minimal per-page changes.
 * Sized for ~880px breakpoint (matches existing CSS media queries).
 */
(function () {
  "use strict";

  var MQ = "(max-width: 880px)";
  var OPEN_CLASS = "nav-open";

  function init() {
    var inners = document.querySelectorAll(".nav-inner");
    if (!inners.length) return;

    var dir = document.documentElement.getAttribute("dir") || "ltr";
    var isRtl = dir === "rtl";

    // Inject CSS once
    if (!document.getElementById("smo-nav-css")) {
      var css = [
        ".nav-toggle{display:none;background:none;border:0;color:#fff;cursor:pointer;padding:8px;margin:0;align-items:center;justify-content:center;border-radius:4px;transition:background .15s}",
        ".nav-toggle:focus-visible{outline:2px solid #ff6b35;outline-offset:2px}",
        ".nav-toggle:hover{background:rgba(255,255,255,.08)}",
        ".nav-toggle svg{width:24px;height:24px;display:block}",
        "@media " + MQ + "{.nav-toggle{display:inline-flex}}",
        "@media " +
          MQ +
          "{body." +
          OPEN_CLASS +
          " .nav-links{display:flex !important;flex-direction:column;gap:14px;position:absolute;top:100%;" +
          (isRtl ? "right:0;left:0" : "left:0;right:0") +
          ";background:#000;border-bottom:1px solid #1a1a1a;padding:18px 24px;z-index:100}}",
        "@media " +
          MQ +
          "{body." +
          OPEN_CLASS +
          " .nav-links a{padding:6px 0;font-size:16px}}",
        ".nav{position:relative}",
      ].join("\n");
      var style = document.createElement("style");
      style.id = "smo-nav-css";
      style.textContent = css;
      document.head.appendChild(style);
    }

    inners.forEach(function (inner, idx) {
      var links = inner.querySelector(".nav-links");
      if (!links) return;

      // Skip if toggle already exists for this nav
      if (inner.querySelector(".nav-toggle")) return;

      var id = links.id || "nav-links-" + idx;
      if (!links.id) links.id = id;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nav-toggle";
      btn.setAttribute("aria-controls", id);
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", isRtl ? "القائمة" : "Menu");
      btn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';

      // Insert the button as the first child of .nav-inner so it sits at the start
      // (left for LTR, right for RTL — CSS flex ordering handles the rest).
      inner.insertBefore(btn, inner.firstChild);

      btn.addEventListener("click", function () {
        var open = document.body.classList.toggle(OPEN_CLASS);
        btn.setAttribute("aria-expanded", String(open));
      });

      // Close on link click (user navigated)
      links.addEventListener("click", function (e) {
        if (e.target && e.target.tagName === "A") {
          document.body.classList.remove(OPEN_CLASS);
          btn.setAttribute("aria-expanded", "false");
        }
      });
    });

    // Close on resize above breakpoint
    var mql = window.matchMedia(MQ);
    var onChange = function () {
      if (!mql.matches) {
        document.body.classList.remove(OPEN_CLASS);
        document.querySelectorAll(".nav-toggle").forEach(function (b) {
          b.setAttribute("aria-expanded", "false");
        });
      }
    };
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else if (mql.addListener) mql.addListener(onChange);

    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains(OPEN_CLASS)) {
        document.body.classList.remove(OPEN_CLASS);
        var t = document.querySelector(".nav-toggle");
        if (t) {
          t.setAttribute("aria-expanded", "false");
          t.focus();
        }
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
