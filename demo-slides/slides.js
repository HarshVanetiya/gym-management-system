// Keyboard, swipe and button navigation between the slide pages.
// Each page declares its neighbours with <link rel="prev"> / <link rel="next"> in <head>.
(function () {
  var prev = document.querySelector('link[rel="prev"]');
  var next = document.querySelector('link[rel="next"]');
  function go(link) { if (link) window.location.href = link.getAttribute('href'); }

  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || /input|textarea|select/i.test(e.target.tagName)) return;
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].indexOf(e.key) >= 0) { e.preventDefault(); go(next); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].indexOf(e.key) >= 0) { e.preventDefault(); go(prev); }
    else if (e.key === 'Home') window.location.href = 'index.html';
    else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
  });

  var x0 = null, y0 = null;
  document.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) go(dx < 0 ? next : prev);
    x0 = null;
  }, { passive: true });

  function toggleFullscreen() {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {});
    } catch (err) { /* not available here */ }
  }
  var fs = document.querySelector('[data-fullscreen]');
  if (fs) fs.addEventListener('click', toggleFullscreen);
})();
