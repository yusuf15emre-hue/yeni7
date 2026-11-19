// Renders the guides list (/blog) and single guides (/blog/<slug>) from /_data/articles.json.
// Text fields are inserted as text; article bodies are sanitised with DOMPurify.
(function () {
  function slugify(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function safeImg(src) { return typeof src === 'string' && /^\/images\/[\w\-./]+$/.test(src) ? src : null; }

  fetch('/_data/articles.json', { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
    .then(function (data) {
      var list = Array.isArray(data) ? data : (data.articles || []);
      var listEl = document.getElementById('guide-list');
      if (listEl) {
        listEl.textContent = '';
        list.forEach(function (a) {
          var li = el('li'), link = el('a'), span = el('span');
          link.href = '/blog/' + slugify(a.title);
          link.appendChild(el('span', 'kind', a.tag || 'Guide'));
          span.appendChild(el('h3', null, a.title || ''));
          span.appendChild(el('p', null, (a.desc || '').trim()));
          link.appendChild(span); li.appendChild(link); listEl.appendChild(li);
        });
        if (!list.length) listEl.appendChild(el('li', null, 'New guides are on the way. In the meantime, see our questions page.'));
        return;
      }
      var slug = location.pathname.replace(/^\/blog\//, '').replace(/\/$/, '');
      var a = list.find(function (x) { return slugify(x.title) === slug; });
      var head = document.getElementById('guide-head'), body = document.getElementById('guide-body');
      if (!a) {
        head.textContent = ''; head.appendChild(el('h1', null, 'Guide not found'));
        body.textContent = ''; var p = el('p'), l = el('a', null, 'See all guides'); l.href = '/blog'; p.appendChild(l); body.appendChild(p);
        return;
      }
      document.title = (a.title || 'Guide') + ' | Lucera Global';
      head.textContent = '';
      head.appendChild(el('p', 'kind', a.tag || 'Guide'));
      head.appendChild(el('h1', null, a.title || ''));
      if (a.desc) head.appendChild(el('p', 'lead', a.desc.trim()));
      var img = safeImg(a.image);
      if (img) { var i = el('img', 'cover'); i.src = img; i.alt = ''; head.appendChild(i); }
      body.innerHTML = window.DOMPurify ? window.DOMPurify.sanitize(a.body || '', { FORBID_TAGS: ['style', 'form', 'input', 'iframe'] }) : '';
    })
    .catch(function () {
      var t = document.getElementById('guide-list') || document.getElementById('guide-body');
      if (t) t.textContent = 'Could not load guides. Refresh the page to try again.';
    });
})();
