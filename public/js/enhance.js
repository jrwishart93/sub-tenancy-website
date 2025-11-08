(function(){
  const links = Array.from(document.querySelectorAll('.glass-nav a'));
  const sections = ['details','subtenants','signatures','preview']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  const spy = () => {
    const y = window.scrollY + 120;
    let active = sections[0] ? sections[0].id : undefined;
    for (const s of sections) if (s.offsetTop <= y) active = s.id;
    links.forEach(a => {
      const isActive = active && a.getAttribute('href') === `#${active}`;
      a.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  };
  if (sections.length && links.length) {
    document.addEventListener('scroll', spy, { passive:true });
    spy();
  }

  // Focus ring animation helper
  const focusables = Array.from(document.querySelectorAll('input, select, textarea, button'));
  focusables.forEach(el => {
    el.addEventListener('focus', () => el.style.boxShadow = '0 0 0 3px rgba(122,162,255,.30)');
    el.addEventListener('blur',  () => el.style.boxShadow = '');
  });

  // Optional: preview glow after Generate
  window.previewGlow = function(){
    const p = document.getElementById('preview') || document.getElementById('agreement');
    if (!p) return;
    p.style.boxShadow = '0 0 0 3px rgba(122,162,255,.45), 0 18px 40px rgba(0,0,0,.35)';
    setTimeout(() => p.style.boxShadow = '', 600);
  };
})();
