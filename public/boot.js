/* First visit only: a short "boot" screen. A tracker box hunts for the logo and
   locks on, terminal lines report the start-up, a counter runs to 100, then the
   screen lifts away. Kept outside React so it shows before the app loads.
   Returning visitors (or reduced motion) never see it. */
(function () {
  var KEY = 'vaultx:booted';
  var html = document.documentElement;
  var seen = false;
  try { seen = localStorage.getItem(KEY) === 'true'; } catch (e) { seen = true; }
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (seen || still) { html.classList.add('vx-booted'); return; }
  html.classList.add('vx-booting');

  function start() {
    var el = document.getElementById('vx-boot');
    if (!el) return;
    var pct = el.querySelector('.vxb__pct');
    var bar = el.querySelector('.vxb__bar i');
    var lines = el.querySelectorAll('.vxb__log li');
    var t0 = performance.now();
    var DUR = 1700; // whole thing: fade in, count, fade out = 2.5 s
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      try { localStorage.setItem(KEY, 'true'); } catch (e) {}
      el.classList.add('is-out');
      html.classList.remove('vx-booting');
      window.dispatchEvent(new Event('vx:booted'));
      setTimeout(function () { el.remove(); html.classList.add('vx-booted'); }, 650);
    }
    function tick(now) {
      var p = Math.min(1, (now - t0) / DUR);
      var eased = 1 - Math.pow(1 - p, 2.2);
      var n = Math.round(eased * 100);
      pct.textContent = (n < 10 ? '00' : n < 100 ? '0' : '') + n;
      bar.style.transform = 'scaleX(' + eased + ')';
      for (var i = 0; i < lines.length; i++) if (p > (i + 0.4) / (lines.length + 0.6)) lines[i].classList.add('on');
      if (p > 0.55) el.classList.add('is-locked');
      if (p < 1) requestAnimationFrame(tick); else setTimeout(finish, 150);
    }
    requestAnimationFrame(tick);
    el.addEventListener('click', finish);
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') finish(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
