/**
 * loads and decorates the feature-highlights block
 * @param {Element} block The block element
 *
 * Expected structure:
 * Row 1: the default image (picture/img, or a link to an external image URL)
 * Row 2: a heading
 * Row 3+: one row per feature - a description paragraph, and optionally a
 * second cell with an alternate image for that feature.
 *
 * Renders as one tall image (set via aspect-ratio, no scroll-jacking) with
 * the heading and feature captions positioned at fixed points down its
 * height, alternating left/right. As each caption scrolls into view it
 * fades in and, if that feature has its own image, the photo cross-fades
 * to it - driven by IntersectionObserver, so normal scrolling is untouched.
 */

function extractImage(cell) {
  if (!cell) return null;
  const img = cell.querySelector('img');
  if (img && img.src) return { src: img.src, alt: img.alt || '' };
  const link = cell.querySelector('a');
  if (link && link.href) return { src: link.href, alt: link.textContent.trim() };
  return null;
}

// vertical position (% down the visible, cropped media) for each caption slot
const CAPTION_POSITIONS = [15, 49, 58, 71, 89];

export default function decorate(block) {
  const rows = Array.from(block.children);
  const [imageRow, headingRow, ...featureRows] = rows;

  const defaultImage = extractImage(imageRow);
  const headingText = headingRow?.querySelector('h1, h2, h3, h4')?.textContent.trim()
    || headingRow?.textContent.trim() || '';

  const features = featureRows.map((row) => {
    const cells = Array.from(row.children);
    const description = cells[0]?.querySelector('p')?.textContent.trim()
      || cells[0]?.textContent.trim() || '';
    const image = extractImage(cells[1]);
    return { description, image };
  }).filter((feature) => feature.description);

  const media = document.createElement('div');
  media.className = 'feature-highlights-media';

  const baseImg = document.createElement('img');
  if (defaultImage) {
    baseImg.src = defaultImage.src;
    baseImg.alt = defaultImage.alt;
  }
  baseImg.className = 'feature-highlights-image feature-highlights-image-active';
  media.append(baseImg);

  const featureImgs = features.map((feature) => {
    if (!feature.image) return null;
    const img = document.createElement('img');
    img.src = feature.image.src;
    img.alt = feature.image.alt;
    img.loading = 'lazy';
    img.className = 'feature-highlights-image';
    media.append(img);
    return img;
  });

  if (headingText) {
    const headingOverlay = document.createElement('div');
    headingOverlay.className = 'feature-highlights-heading-overlay';
    const heading = document.createElement('h2');
    heading.textContent = headingText;
    headingOverlay.append(heading);
    media.append(headingOverlay);
  }

  const captionEls = features.map((feature, index) => {
    const side = index % 2 === 0 ? 'right' : 'left';
    const caption = document.createElement('div');
    caption.className = 'feature-highlights-caption';
    caption.dataset.side = side;
    caption.style.top = `${CAPTION_POSITIONS[index] ?? (10 + index * 14)}%`;

    const line = document.createElement('span');
    line.className = 'feature-highlights-caption-line';

    const text = document.createElement('p');
    text.textContent = feature.description;

    if (side === 'left') caption.append(text, line);
    else caption.append(line, text);

    media.append(caption);
    return caption;
  });

  block.replaceChildren(media);

  // up to two captions can be visible together, most-recently-entered first
  const activeIndices = new Set();
  const MAX_ACTIVE = 2;

  const applyActiveState = () => {
    captionEls.forEach((el, i) => el.classList.toggle('is-active', activeIndices.has(i)));
    const latestIndex = [...activeIndices].pop();
    const activeFeatureImg = latestIndex !== undefined ? featureImgs[latestIndex] : null;
    [baseImg, ...featureImgs].forEach((img) => {
      if (!img) return;
      img.classList.toggle('feature-highlights-image-active', img === (activeFeatureImg || baseImg));
    });
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const index = captionEls.indexOf(entry.target);
        if (entry.isIntersecting) {
          activeIndices.add(index);
          while (activeIndices.size > MAX_ACTIVE) {
            activeIndices.delete(activeIndices.values().next().value);
          }
        } else {
          activeIndices.delete(index);
        }
      });
      applyActiveState();
    }, { rootMargin: '-35% 0px -35% 0px', threshold: 0 });
    captionEls.forEach((el) => observer.observe(el));
  } else {
    // no IntersectionObserver support: just show the first feature
    activeIndices.add(0);
    applyActiveState();
  }
}
