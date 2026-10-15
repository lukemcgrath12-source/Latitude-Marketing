/* Latitude Marketing: discovery call booking + conversion tracking (Oct 2026).
   - Any "Book a discovery call / Book a call" button goes straight to the Google Calendar booking page.
   - Booking clicks fire Meta Lead + Schedule and GA4 generate_lead, so ads optimising for leads get a signal.
   - Phone and email clicks fire Meta Contact. */
(function () {
  var BOOK = 'https://calendar.app.google/sny8ZdgEvymqWDHA6';
  function track(kind, label) {
    try {
      if (typeof fbq === 'function') {
        if (kind === 'book') { fbq('track', 'Lead', { content_name: 'book_call_click', content_category: label }); fbq('track', 'Schedule', { content_name: label }); }
        else fbq('track', 'Contact', { content_name: label });
      }
      if (typeof gtag === 'function') {
        gtag('event', kind === 'book' ? 'generate_lead' : 'contact', { form_name: kind === 'book' ? 'book_call_click' : label, link_text: label });
        if (kind === 'book') gtag('event', 'conversion', { send_to: 'AW-18508542142/01YOCPjNvp0dEL7hx_lE', value: 1.0, currency: 'AUD' });
      }
      if (typeof window.va === 'function') window.va('event', { name: kind === 'book' ? 'BookCallClick' : 'ContactClick', data: { label: label } });
    } catch (e) {}
  }
  function wire() {
    var links = document.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      var a = links[i], t = (a.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      var href = a.getAttribute('href') || '';
      if (/book (a )?(free )?(discovery )?call/.test(t) && /contact/.test(href)) {
        a.setAttribute('href', BOOK); a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener');
        href = BOOK;
      }
      if (href.indexOf('calendar.app.google') > -1) a.addEventListener('click', function (e) { track('book', (e.currentTarget.textContent || '').trim().slice(0, 40)); });
      else if (/^tel:/.test(href)) a.addEventListener('click', function () { track('contact', 'phone'); });
      else if (/^mailto:/.test(href)) a.addEventListener('click', function () { track('contact', 'email'); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
