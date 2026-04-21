/* SMOrchestra — exit-intent popup.
 *
 * Self-contained: no GHL dependency, no external fetch. On mouseleave from
 * the top of the viewport (or fast scroll-up on mobile), renders a
 * one-time modal pointing the visitor at the scorecard with a UTM tag so
 * post-click attribution flows through the existing submit-scorecard
 * function (which already reads ?source=).
 *
 * Language is taken from <html lang> on the host page — AR shows Arabic
 * copy and routes to /ar/tools/ai-native-readiness/ with source=exit-intent-ar.
 * Anything else (including the default "en") shows English copy and
 * routes to /tools/ai-native-readiness/ with source=exit-intent-en.
 *
 * Frequency cap: sessionStorage flag. One popup per tab session. Cleared
 * when the tab closes.
 *
 * Excluded pages are handled at insertion time by scripts/insert-exit-popup.py
 * — the script isn't added to scorecard or report pages, so this file never
 * loads on them.
 */
(function () {
  'use strict';

  var SESSION_KEY = 'smo_exit_popup_shown';
  if (sessionStorage.getItem(SESSION_KEY) === '1') return;

  var isAR = document.documentElement.lang === 'ar';

  var copy = isAR
    ? {
        dir: 'rtl',
        headline: 'قبل ما تطلع — وين شركتك فعلياً؟',
        body:
          'خذ تقييم الجاهزية لـ AI-Native في ٨ دقائق. بدون تسجيل دخول. ' +
          'يقول لك بالضبط وش تثبّت أول.',
        cta: 'خذ التقييم ←',
        dismiss: 'لا شكراً',
        url: '/ar/tools/ai-native-readiness/?source=exit-intent-ar',
        font: '"IBM Plex Sans Arabic", "Inter", sans-serif',
      }
    : {
        dir: 'ltr',
        headline: 'Before you go — where does your org actually stand?',
        body:
          'Take the 8-min AI-Native Readiness Diagnostic. No signup gate ' +
          'to start. Tells you exactly what to install first.',
        cta: 'Take the Diagnostic →',
        dismiss: 'No thanks',
        url: '/tools/ai-native-readiness/?source=exit-intent-en',
        font: '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      };

  function renderPopup() {
    if (document.getElementById('smo-exit-popup')) return;
    sessionStorage.setItem(SESSION_KEY, '1');

    var overlay = document.createElement('div');
    overlay.id = 'smo-exit-popup';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'smo-exit-popup-h');
    overlay.setAttribute('dir', copy.dir);
    overlay.innerHTML =
      '<div class="smo-exit-popup-backdrop"></div>' +
      '<div class="smo-exit-popup-card" style="font-family:' + copy.font + '">' +
      '  <button type="button" class="smo-exit-popup-close" aria-label="Close">×</button>' +
      '  <div class="smo-exit-popup-eyebrow">SMOrchestra</div>' +
      '  <h2 id="smo-exit-popup-h" class="smo-exit-popup-h">' + copy.headline + '</h2>' +
      '  <p class="smo-exit-popup-body">' + copy.body + '</p>' +
      '  <div class="smo-exit-popup-row">' +
      '    <a class="smo-exit-popup-cta" href="' + copy.url + '">' + copy.cta + '</a>' +
      '    <button type="button" class="smo-exit-popup-dismiss">' + copy.dismiss + '</button>' +
      '  </div>' +
      '</div>';

    document.body.appendChild(overlay);
    // Force reflow then add "open" for the CSS transition to fire.
    overlay.offsetHeight;
    overlay.classList.add('open');

    function close() {
      overlay.classList.remove('open');
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 200);
      document.removeEventListener('keydown', onKey);
    }

    function onKey(e) {
      if (e.key === 'Escape') close();
    }

    overlay.querySelector('.smo-exit-popup-close').addEventListener('click', close);
    overlay.querySelector('.smo-exit-popup-dismiss').addEventListener('click', close);
    overlay.querySelector('.smo-exit-popup-backdrop').addEventListener('click', close);
    document.addEventListener('keydown', onKey);

    // Fire a Plausible event if Plausible is on the page. Non-blocking.
    if (typeof window.plausible === 'function') {
      try { window.plausible('exit_intent_popup_shown', { props: { locale: isAR ? 'ar' : 'en' } }); } catch (_) {}
    }
  }

  // Desktop/tablet: mouseleave out the top of the viewport. Phones (<=640px)
  // have no reliable exit-intent signal — scroll-up-fast is too noisy and
  // there's no mouseleave on touch. Chat widget + scorecard CTAs already
  // cover phone UX.
  var isPhone = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
  if (isPhone) return;

  var armed = false;
  // We listen on document.documentElement, not document, because
  // mouseleave doesn't fire reliably on the document node itself in some
  // browsers. The <html> element is the outermost element whose edge
  // coincides with the viewport edge — mouseleave on it = pointer left
  // the viewport.
  function onMouseLeave(e) {
    if (armed) return;
    if (e.clientY <= 0) {
      armed = true;
      renderPopup();
    }
  }

  // Delay arming so we don't fire on page-load if the user's cursor starts
  // outside the viewport (e.g., coming from a browser tab click).
  setTimeout(function () {
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
  }, 3000);
})();
