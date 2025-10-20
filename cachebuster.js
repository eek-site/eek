(function() {
  try {
    var ver = (window && window.SITE_VERSION) ? window.SITE_VERSION : null;
    if (!ver) return;
    var nodes = document.querySelectorAll('[data-cache-bust="true"]');
    nodes.forEach(function(node) {
      var attr = node.tagName.toLowerCase() === 'link' ? 'href' : 'src';
      var url = node.getAttribute(attr);
      if (!url) return;
      // Avoid double-busting if version already matches
      var hasQuery = url.indexOf('?') !== -1;
      var newUrl;
      if (hasQuery) {
        // replace existing v= or cachebust=
        var u = new URL(url, window.location.origin);
        u.searchParams.set('v', ver);
        newUrl = u.toString();
      } else {
        newUrl = url + '?v=' + ver;
      }
      node.setAttribute(attr, newUrl);
    });
  } catch (e) {
    console && console.warn && console.warn('Cachebuster error:', e);
  }
})();



