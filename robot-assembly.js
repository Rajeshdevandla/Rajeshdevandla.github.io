(() => {
  const stage = document.querySelector('.hero-right');
  const source = document.querySelector('#hero-img');
  if (!stage || !source) return;
  const scene = document.createElement('div');
  scene.className = 'robot-assembly';
  scene.setAttribute('aria-hidden', 'true');
  const parts = Array.from({length: 5}, (_, index) => {
    const part = document.createElement('div');
    part.className = 'robot-part';
    part.style.top = index * 20 + '%';
    const face = document.createElement('div');
    face.className = 'robot-texture';
    face.style.top = -index * 100 + '%';
    face.style.backgroundImage = 'url("' + source.src + '")';
    face.style.backgroundPosition = getComputedStyle(stage).backgroundPosition;
    part.append(face);
    scene.append(part);
    return part;
  });
  stage.append(scene);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let pending = false;
  function render() {
    pending = false;
    const box = stage.getBoundingClientRect();
    const distance = Math.min(innerHeight * .36, 320);
    const start = box.top + window.scrollY - innerHeight * .55;
    let progress = Math.max(0, Math.min(1, (scrollY - Math.max(0,start)) / distance));
    progress = reduced.matches ? 0 : progress * progress * (3 - 2 * progress);
    stage.classList.toggle('robot-open', progress > 0);
    parts.forEach((part, index) => {
      const offset = index - 2;
      part.style.transform = 'translate3d(' + offset * progress * box.width * .065 + 'px,' +
        offset * progress * box.height * .048 + 'px,' + (2-index)*progress*22 +
        'px) rotateY(' + (-20 + index * 8)*progress + 'deg) rotateX(' + 13*progress + 'deg)';
    });
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(render); }
  }
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule);
  reduced.addEventListener('change',schedule);
  render();
})();