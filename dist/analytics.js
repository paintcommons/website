// Public Google tag. Only the canonical production site sends website analytics.
(() => {
  if (location.origin !== 'https://paintcommons.org' || document.getElementById('paintcommons-google-tag')) return;
  const path = ['/catalogue/', '/privacy/'].includes(location.pathname) ? location.pathname : '/';
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  let referrer = '';
  try { referrer = new URL(document.referrer).origin + '/'; } catch { /* No referrer. */ }
  // Catalogue searches, selected paint IDs, and correction form values are not analytics data.
  window.gtag('set', {
    page_location: `https://paintcommons.org${path}`,
    page_referrer: referrer,
    page_title: path === '/catalogue/' ? 'Paint Commons catalogue' : path === '/privacy/' ? 'Paint Commons privacy' : 'Paint Commons',
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const campaign = {};
  const query = new URLSearchParams(location.search);
  for (const [param, field] of [['utm_source', 'campaign_source'], ['utm_medium', 'campaign_medium'], ['utm_campaign', 'campaign_name']]) {
    const value = query.get(param);
    if (value && /^[a-z0-9_-]{1,80}$/i.test(value)) campaign[field] = value;
  }
  window.gtag('set', campaign);
  window.gtag('js', new Date());
  const script = document.createElement('script');
  script.id = 'paintcommons-google-tag';
  script.async = true;
  script.referrerPolicy = 'no-referrer';
  script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-MNJQ6CND';
  document.head.appendChild(script);
})();
