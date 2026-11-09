/* Latitude Marketing: GA4 click tracking (property 549454545, G-Q8HBWYGDDE). generate_lead stays in each page form handler.
   Events: click_to_call, click_email, social_click, gbp_click, cta_click,
   form_start, form_submit (attempt), generate_lead (on /thank-you after a real send). */
(function () {
  function track(name, params) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, Object.assign({ page_path: location.pathname }, params || {}));
  }
  function where(el) {
    if (el.closest('header, nav, .nav, .navbar')) return 'header';
    if (el.closest('footer')) return 'footer';
    if (el.closest('.callbar, .mobile-cta, .sticky-cta, [class*="sticky"]')) return 'sticky_bar';
    if (el.closest('#contact, .contact, form')) return 'contact';
    var sec = el.closest('section[id]');
    return sec ? sec.id : 'body';
  }
  function label(el) {
    return (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a, button');
    if (!a) return;
    var href = (a.getAttribute('href') || '').toLowerCase();
    var loc = where(a);
    if (href.indexOf('tel:') === 0) {
      track('click_to_call', { link_location: loc, link_text: label(a) });
    } else if (href.indexOf('mailto:') === 0) {
      track('click_email', { link_location: loc });
    } else if (/facebook\.com|instagram\.com/.test(href)) {
      track('social_click', { platform: href.indexOf('instagram') > -1 ? 'instagram' : 'facebook', link_location: loc });
    } else if (/google\.com\/maps|search\.google\.com\/local|g\.page/.test(href)) {
      track('gbp_click', { action: href.indexOf('writereview') > -1 ? 'write_review' : 'view_maps', link_location: loc });
    } else if (/quote|enquir|book|call|contact|get started|free homepage|mockup|concept/i.test(label(a)) || href.indexOf('#contact') > -1 || href.indexOf('#enquir') > -1) {
      track('cta_click', { link_location: loc, link_text: label(a) });
    }
  }, true);

  var started = false;
  document.addEventListener('focusin', function (e) {
    var f = e.target.closest && e.target.closest('form');
    if (!f || started) return;
    started = true;
    track('form_start', { form_id: f.id || 'form' });
  });

})();
