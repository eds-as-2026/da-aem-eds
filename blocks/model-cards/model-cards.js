// Matches this project's CSS breakpoints (see AGENTS.md). Cards only ever
// go 2-up at 900px+ (see model-cards.css), so only one larger tier beyond
// mobile is needed.
const MODEL_CARDS_BREAKPOINTS = [
  { media: '(min-width: 900px)', width: '1200' },
  { width: '900' },
];

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * whether an image URL is hosted on a different origin than the current
 * page (e.g. an author-pasted external CDN URL rather than AEM-hosted media)
 * @param {string} src the image URL
 * @returns {boolean} true if external
 */
function isExternalImage(src) {
  return new URL(src, window.location.href).origin !== window.location.origin;
}

/**
 * appends the <source>(s) for one responsive tier to a <picture>. AEM-hosted
 * media gets a webp source plus an original-format fallback. External CDN
 * images keep every existing query param (fm, fit, q, dpr, ...) and only
 * get the `w` value swapped, since rebuilding their URL AEM-style
 * (`?width=&format=&optimize=`) is a query syntax external image services
 * don't understand and will reject.
 * @param {HTMLPictureElement} picture the picture element to append to
 * @param {string} src the image URL for this tier
 * @param {string} width the requested width for this tier
 * @param {string} [media] the media condition for this tier
 */
function appendTierSources(picture, src, width, media) {
  const url = new URL(src, window.location.href);

  if (isExternalImage(src)) {
    url.searchParams.set('w', width);
    const source = document.createElement('source');
    if (media) source.setAttribute('media', media);
    source.setAttribute('srcset', url.href);
    picture.appendChild(source);
    return;
  }

  const ext = url.pathname.split('.').pop();
  const webpSource = document.createElement('source');
  if (media) webpSource.setAttribute('media', media);
  webpSource.setAttribute('type', 'image/webp');
  webpSource.setAttribute('srcset', `${url.origin}${url.pathname}?width=${width}&format=webply&optimize=medium`);
  picture.appendChild(webpSource);

  const fallbackSource = document.createElement('source');
  if (media) fallbackSource.setAttribute('media', media);
  fallbackSource.setAttribute('srcset', `${url.origin}${url.pathname}?width=${width}&format=${ext}&optimize=medium`);
  picture.appendChild(fallbackSource);
}

/**
 * builds the <img> fallback src for a given tier width
 * @param {string} src the image URL
 * @param {string} width the requested width
 * @returns {string} the resolved src
 */
function buildImgSrc(src, width) {
  const url = new URL(src, window.location.href);
  if (isExternalImage(src)) {
    url.searchParams.set('w', width);
    return url.href;
  }
  const ext = url.pathname.split('.').pop();
  return `${url.origin}${url.pathname}?width=${width}&format=${ext}&optimize=medium`;
}

/**
 * builds a responsive picture for a single image shown at every breakpoint
 * @param {string} src the image URL
 * @param {string} alt alt text
 * @param {Array<{media: string, width: string}>} breakpoints responsive widths
 * @returns {HTMLPictureElement} the picture element
 */
function createResponsivePicture(src, alt, breakpoints) {
  const picture = document.createElement('picture');

  breakpoints.forEach((br, i) => {
    if (i < breakpoints.length - 1) {
      appendTierSources(picture, src, br.width, br.media);
    } else {
      const img = document.createElement('img');
      img.setAttribute('loading', 'lazy');
      img.setAttribute('alt', alt);
      img.setAttribute('src', buildImgSrc(src, br.width));
      picture.appendChild(img);
    }
  });

  return picture;
}

/**
 * builds a picture with a genuinely different source image for mobile/
 * tablet vs desktop (true art direction), instead of the same photo
 * resized for every screen. Authors provide 2 images in the card's image
 * cell (mobile/tablet first, desktop second); if only 1 is given the
 * caller uses createResponsivePicture instead.
 * @param {Array<{src: string, alt: string}>} images ordered mobile-first
 * @returns {HTMLPictureElement} the picture element
 */
function createArtDirectedPicture(images) {
  const [mobileTablet, desktop] = images;
  const [desktopTier, mobileTier] = MODEL_CARDS_BREAKPOINTS;

  const picture = document.createElement('picture');
  appendTierSources(picture, desktop.src, desktopTier.width, desktopTier.media);

  const img = document.createElement('img');
  img.setAttribute('loading', 'lazy');
  img.setAttribute('alt', mobileTablet.alt);
  img.setAttribute('src', buildImgSrc(mobileTablet.src, mobileTier.width));
  picture.appendChild(img);

  return picture;
}

/**
 * builds the CTA arrow icon
 * @returns {SVGElement} the arrow icon
 */
function createCtaArrowIcon() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('model-cards-card-cta-icon');

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M8 2 6.95 3.05l4.2 4.2H2v1.5h9.15l-4.2 4.2L8 14l6-6-6-6Z');
  path.setAttribute('fill', 'currentColor');

  svg.appendChild(path);
  return svg;
}

/**
 * loads and decorates the model-cards block
 * @param {Element} block The block element
 *
 * Expected structure, one row per card:
 * Row: two cells - an image cell, and a text cell containing a heading
 * (model name) followed by a paragraph with a link (the CTA label and
 * URL). The image cell holds either one image (picture/img or a link to
 * an external image URL) shown at every breakpoint, or 2 images for true
 * art direction (mobile/tablet first, desktop second - cards only have
 * one breakpoint tier below 900px, see MODEL_CARDS_BREAKPOINTS). If the
 * CTA link is present the whole card becomes clickable. Cards render
 * text-first with the image as a subordinate strip below it, matching the
 * real site's portfolio grid rather than an image-background-with-text-
 * overlay card.
 */
export default function decorate(block) {
  const cardRows = Array.from(block.children);

  const list = document.createElement('ul');
  list.className = 'model-cards-list';

  cardRows.forEach((row) => {
    const [imageCell, textCell] = Array.from(row.children);

    let images = [];
    if (imageCell) {
      const imgElements = Array.from(imageCell.querySelectorAll('img'));
      if (imgElements.length) {
        images = imgElements.map((img) => ({ src: img.src, alt: img.alt || '' }));
      } else {
        images = Array.from(imageCell.querySelectorAll('a[href]')).map((a) => ({ src: a.href, alt: '' }));
      }
    }

    let title = '';
    let ctaText = '';
    let ctaUrl = '';
    if (textCell) {
      const headingEl = textCell.querySelector('h1, h2, h3, h4');
      if (headingEl) title = headingEl.textContent.trim();

      const ctaLink = textCell.querySelector('a');
      if (ctaLink) {
        ctaText = ctaLink.textContent.trim();
        ctaUrl = ctaLink.href;
      }
    }

    const item = document.createElement('li');
    item.className = 'model-cards-card';

    const cardLink = document.createElement(ctaUrl ? 'a' : 'div');
    cardLink.className = 'model-cards-card-link';
    if (ctaUrl) cardLink.href = ctaUrl;

    const body = document.createElement('div');
    body.className = 'model-cards-card-body';

    const heading = document.createElement('h3');
    heading.className = 'model-cards-card-title';
    heading.textContent = title;
    body.appendChild(heading);

    if (ctaText) {
      const cta = document.createElement('span');
      cta.className = 'model-cards-card-cta';

      const ctaTextSpan = document.createElement('span');
      ctaTextSpan.className = 'model-cards-card-cta-text';
      ctaTextSpan.textContent = ctaText;

      cta.appendChild(ctaTextSpan);
      cta.appendChild(createCtaArrowIcon());
      body.appendChild(cta);
    }

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'model-cards-card-image';
    if (images.length > 1) {
      imageWrapper.appendChild(createArtDirectedPicture(images));
    } else if (images.length === 1) {
      const [{ src, alt }] = images;
      imageWrapper.appendChild(createResponsivePicture(src, alt, MODEL_CARDS_BREAKPOINTS));
    }

    cardLink.appendChild(body);
    cardLink.appendChild(imageWrapper);
    item.appendChild(cardLink);
    list.appendChild(item);
  });

  block.replaceChildren(list);
}
