/**
 * loads and decorates the gallery block
 * @param {Element} block The block element
 *
 * Expected structure, one row per image: a single cell containing a
 * picture/img (or a link to an external image URL). Renders as a carousel
 * with one slide visible at a time and dot navigation to jump between them.
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

  const carousel = document.createElement('div');
  carousel.className = 'gallery-carousel';

  const track = document.createElement('div');
  track.className = 'gallery-track';

  const dots = document.createElement('div');
  dots.className = 'gallery-dots';

  const slideEls = [];
  const dotEls = [];

  const showSlide = (index) => {
    slideEls.forEach((slide, i) => slide.classList.toggle('gallery-slide-active', i === index));
    dotEls.forEach((dot, i) => dot.classList.toggle('gallery-dot-active', i === index));
  };

  slides.forEach((slide, index) => {
    const slideEl = document.createElement('div');
    slideEl.className = 'gallery-slide';

    const img = document.createElement('img');
    img.src = slide.src;
    img.alt = slide.alt;
    img.loading = index === 0 ? 'eager' : 'lazy';
    slideEl.appendChild(img);
    track.appendChild(slideEl);
    slideEls.push(slideEl);

    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'gallery-dot';
    dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
    dot.addEventListener('click', () => showSlide(index));
    dots.appendChild(dot);
    dotEls.push(dot);
  });

  if (slideEls.length) showSlide(0);

  carousel.appendChild(track);
  carousel.appendChild(dots);
  block.replaceChildren(carousel);
}
