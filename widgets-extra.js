// AI Academy: more pictures you can poke, for the tracks added after the first three. Same rules as widgets.js:
// every one is a toy with hand-made numbers and scripted results, never a real model, never a network call.
// widgets.js must load first (it defines WIDGETS); this file adds to it.
(function () {
  'use strict';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $(s, r) { return r.querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call(r.querySelectorAll(s)); }
  function onClick(root, fn) { root.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b && root.contains(b)) fn(b.dataset, b); }); }
  // state that should survive a redraw of the lesson (not saved to disk)
  var MEM = {};
  function mem(key, init) { return MEM[key] || (MEM[key] = init); }
  // @@WIDGETS (new pictures are added above this line)
})();
