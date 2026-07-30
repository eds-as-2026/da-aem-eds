/**
 * loads and decorates the gallery block
 * @param {Element} block The block element
 *
 * Expected structure, one row per image: a single cell containing a
 * picture/img (or a link to an external image URL). Renders as a carousel
 * showing two slides at a time (one on mobile). Hovering the left visible
 * image turns the cursor into a "back" chevron; hovering the right one
 * turns it into a "forward" chevron - clicking navigates accordingly. Dots
 * below jump to a given scroll position.
 */
export default function decorate(block) {
  const rows = Array.from(block.children);

  const slides = rows.map((row) => {
    const img = row.querySelector('img');
    if (img && img.src) {
      return { src: img.src, alt: img.alt || '' };
    }
    const link = row.querySelector('a');
    if (link && link.href) {
      return { src: link.href, alt: link.textContent.trim() };
    }
    return null;
  }).filter(Boolean);

  const total = slides.length;

  const carousel = document.createElement('div');
  carousel.className = 'gallery-carousel';

  const viewport = document.createElement('div');
  viewport.className = 'gallery-viewport';

  const track = document.createElement('div');
  track.className = 'gallery-track';

  const dots = document.createElement('div');
  dots.className = 'gallery-dots';

  const dotEls = [];

  slides.forEach((slide, index) => {
    const slideEl = document.createElement('div');
    slideEl.className = 'gallery-slide';
    slideEl.style.flexBasis = `${100 / total}%`;

    const img = document.createElement('img');
    img.src = slide.src;
    img.alt = slide.alt;
    img.loading = index < 2 ? 'eager' : 'lazy';
    slideEl.appendChild(img);
    track.appendChild(slideEl);
  });

  const prevNav = document.createElement('button');
  prevNav.type = 'button';
  prevNav.className = 'gallery-nav gallery-nav-prev';
  prevNav.setAttribute('aria-label', 'Previous image');

  const nextNav = document.createElement('button');
  nextNav.type = 'button';
  nextNav.className = 'gallery-nav gallery-nav-next';
  nextNav.setAttribute('aria-label', 'Next image');

  const mql = window.matchMedia('(min-width: 600px)');
  let visibleCount = mql.matches ? 2 : 1;
  let currentIndex = 0;

  const update = () => {
    const maxIndex = Math.max(0, total - visibleCount);
    currentIndex = Math.min(Math.max(currentIndex, 0), maxIndex);

    track.style.width = `${(total / visibleCount) * 100}%`;
    track.style.transform = `translateX(-${currentIndex * (100 / total)}%)`;

    prevNav.disabled = currentIndex === 0;
    nextNav.disabled = currentIndex === maxIndex;

    dotEls.forEach((dot, i) => dot.classList.toggle('gallery-dot-active', i === currentIndex));
  };

  const goTo = (index) => {
    currentIndex = index;
    update();
  };

  const buildDots = () => {
    dots.replaceChildren();
    dotEls.length = 0;
    const maxIndex = Math.max(0, total - visibleCount);
    for (let i = 0; i <= maxIndex; i += 1) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'gallery-dot';
      dot.setAttribute('aria-label', `Go to position ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dots.appendChild(dot);
      dotEls.push(dot);
    }
  };

  prevNav.addEventListener('click', () => goTo(currentIndex - 1));
  nextNav.addEventListener('click', () => goTo(currentIndex + 1));

  mql.addEventListener('change', (event) => {
    visibleCount = event.matches ? 2 : 1;
    buildDots();
    update();
  });

  if (total) {
    buildDots();
    update();
  }

  viewport.appendChild(track);
  viewport.appendChild(prevNav);
  viewport.appendChild(nextNav);
  carousel.appendChild(viewport);
  carousel.appendChild(dots);
  block.replaceChildren(carousel);
}
