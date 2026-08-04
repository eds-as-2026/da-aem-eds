// Matches this project's CSS breakpoints (600/900/1200, see AGENTS.md), so
// each device tier requests an image sized close to what it'll actually
// display, instead of every screen loading the same one resolution.
const CUSTOM_HERO_BANNER_BREAKPOINTS = [
  { media: '(min-width: 1200px)', width: '2400' },
  { media: '(min-width: 900px)', width: '1800' },
  { media: '(min-width: 600px)', width: '1200' },
  { width: '750' },
];

// Used when authors provide separate art-directed images per device tier
// (see createArtDirectedPicture) instead of one photo resized for every
// screen. Only two conditional tiers plus the mobile fallback are needed
// here, since each tier gets its own distinct image rather than the same
// image at several resolutions.
const CUSTOM_HERO_BANNER_ART_DIRECTION_TIERS = [
  { media: '(min-width: 900px)', width: '2400' },
  { media: '(min-width: 600px)', width: '1200' },
  { width: '750' },
];

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
 * media gets a webp source plus an original-format fallback, matching
 * createOptimizedPicture's approach. External CDN images (e.g. an
 * author-pasted Polestar dato-assets/imgix URL) keep every existing query
 * param (fm, fit, q, dpr, ...) and only get the `w` value swapped, since
 * rebuilding their URL AEM-style (`?width=&format=&optimize=`) is a query
 * syntax external image services don't understand and will reject.
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
 * @param {boolean} eager whether to load eagerly
 * @param {Array<{media: string, width: string}>} breakpoints responsive widths
 * @returns {HTMLPictureElement} the picture element
 */
function createResponsivePicture(src, alt, eager, breakpoints) {
  const picture = document.createElement('picture');

  breakpoints.forEach((br, i) => {
    if (i < breakpoints.length - 1) {
      appendTierSources(picture, src, br.width, br.media);
    } else {
      const img = document.createElement('img');
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('alt', alt);
      img.setAttribute('src', buildImgSrc(src, br.width));
      picture.appendChild(img);
    }
  });

  return picture;
}

/**
 * builds a picture with a genuinely different source image per device tier
 * (true art direction), instead of the same photo resized for every screen.
 * Authors provide 2 or 3 images in the block's image row, in mobile-first
 * order (mobile[, tablet], desktop); the narrowest is reused for any tier
 * that isn't provided.
 * @param {Array<{src: string, alt: string}>} images ordered mobile-first
 * @param {boolean} eager whether to load eagerly
 * @returns {HTMLPictureElement} the picture element
 */
function createArtDirectedPicture(images, eager) {
  const mobile = images[0];
  const tablet = images.length >= 3 ? images[1] : null;
  const desktop = images[images.length - 1];
  const [desktopTier, tabletTier, mobileTier] = CUSTOM_HERO_BANNER_ART_DIRECTION_TIERS;

  const picture = document.createElement('picture');
  appendTierSources(picture, desktop.src, desktopTier.width, desktopTier.media);
  if (tablet) {
    appendTierSources(picture, tablet.src, tabletTier.width, tabletTier.media);
  }

  const img = document.createElement('img');
  img.setAttribute('loading', eager ? 'eager' : 'lazy');
  img.setAttribute('alt', mobile.alt);
  img.setAttribute('src', buildImgSrc(mobile.src, mobileTier.width));
  picture.appendChild(img);

  return picture;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * builds the CTA arrow icon
 * @returns {SVGElement} the arrow icon
 */
function createCtaArrowIcon() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('custom-hero-banner-cta-icon');

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M8 2 6.95 3.05l4.2 4.2H2v1.5h9.15l-4.2 4.2L8 14l6-6-6-6Z');
  path.setAttribute('fill', 'currentColor');

  svg.appendChild(path);
  return svg;
}

/**
 * loads and decorates the custom-hero-banner block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Ensure the block has the root class expected by the CSS
  block.classList.add('custom-hero-banner');
  // Expected structure:
  // Row 1: image row - either a single image (picture/img element) shown at
  //        every breakpoint, or 2-3 images for true art direction (a
  //        different photo per device tier, in mobile-first order: mobile[,
  //        tablet], desktop)
  // Row 2: a single cell containing, in order: a heading (h1/h2/h3) used as
  //        the title, any further heading elements used as description
  //        lines, and a trailing paragraph used as the CTA label (optionally
  //        wrapped in a link for the CTA URL)

  const rows = Array.from(block.children);

  // Get image(s) - each cell in the image row is checked independently,
  // and every <img> (or, failing that, every link) found in that cell is
  // used - not just the first - so it doesn't matter whether the author
  // put each image in its own cell or stacked multiple images (as real
  // inserted images or as pasted image URLs, which only become links, not
  // <img> elements) inside a single cell.
  const images = [];

  const firstRow = rows[0];
  if (firstRow) {
    Array.from(firstRow.children).forEach((cell) => {
      const cellImages = Array.from(cell.querySelectorAll('img'));
      if (cellImages.length) {
        cellImages.forEach((img) => {
          images.push({ src: img.src, alt: img.alt || 'Hero banner background' });
        });
        return;
      }
      Array.from(cell.querySelectorAll('a[href]')).forEach((link) => {
        images.push({ src: link.href, alt: 'Hero banner background' });
      });
    });
  }

  // Get heading, subheading, description, body and CTA. Authors place all of
  // this in the same cell of rows[1]: the first heading is the title, the
  // trailing paragraph is the CTA label (optionally wrapped in a link for
  // the CTA URL), and everything else in between is either further heading
  // elements or plain paragraphs.
  //
  // Any extra heading elements always become a subheading grouped tightly
  // with the title, rendered at the same large size (e.g. "Polestar 3" /
  // "The SUV others aspire to be..." or "Sustainability" / "Being
  // transparent with the facts"). A plain paragraph (besides the CTA one),
  // if present, is a separate smaller body copy below that.
  let headingText = '';
  let subheadingText = '';
  let descriptionText = '';
  let bodyText = '';
  let ctaText = 'Discover';
  let ctaUrl = '#';
  let hasCta = false;

  const contentRow = rows[1];
  if (contentRow) {
    const headingEl = contentRow.querySelector('h1, h2, h3');
    if (headingEl) {
      headingText = headingEl.textContent.trim();

      // Subheading, body and CTA live as siblings of the heading inside its
      // parent cell, not as direct children of the row.
      const cell = headingEl.parentElement;
      const cellChildren = Array.from(cell.children);

      const ctaPara = cellChildren.filter((child) => child.tagName === 'P').pop();
      if (ctaPara) {
        hasCta = true;
        const ctaLink = ctaPara.querySelector('a');
        if (ctaLink) {
          ctaText = ctaLink.textContent.trim() || ctaText;
          ctaUrl = ctaLink.href;
        } else {
          const t = ctaPara.textContent.trim();
          if (t) ctaText = t;
        }
      }

      const headingParts = [];
      const bodyParts = [];
      cellChildren.forEach((child) => {
        if (child === headingEl || child === ctaPara) return;
        const t = child.textContent.trim();
        if (!t) return;
        if (/^(H1|H2|H3)$/i.test(child.tagName)) {
          headingParts.push(t);
        } else if (child.tagName === 'P') {
          bodyParts.push(t);
        }
      });

      bodyText = bodyParts.join(' ');
      subheadingText = headingParts.join(' ');
    } else {
      // Fallback to previous paragraph/newline logic
      const paras = contentRow.querySelectorAll('p');
      if (paras.length >= 2) {
        headingText = paras[0].textContent.trim();
        descriptionText = Array.from(paras).slice(1)
          .map((p) => p.textContent.trim())
          .filter(Boolean)
          .join(' ');
      } else if (paras.length === 1) {
        headingText = paras[0].textContent.trim();
      } else {
        const lines = contentRow.textContent.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
        if (lines.length > 0) {
          headingText = lines.shift();
          descriptionText = lines.join(' ');
        }
        if (!headingText) headingText = contentRow.textContent.trim();
      }
    }
  }

  // Some authors instead use a dedicated fourth row for the CTA link.
  const ctaRowLink = rows[3]?.querySelector('a');
  if (ctaRowLink) {
    hasCta = true;
    ctaText = ctaRowLink.textContent.trim() || ctaText;
    ctaUrl = ctaRowLink.href;
  }

  // Apply the top hero style only for the Polestar 3 page.
  // This keeps other hero banner blocks unchanged.
  const isPolestar3 = window.location.pathname.toLowerCase().includes('polestar-3')
    || headingText.toLowerCase().includes('polestar 3');
  if (isPolestar3) {
    block.classList.add('top');
  }

  // The home page's Polestar 3 hero sits on a light marble background, so it
  // needs the dark-text modifier instead of the white-on-dark treatment
  // "top" assumes for the other (darker) Polestar 3 hero images.
  const isHome = window.location.pathname === '/' || window.location.pathname === '/index';
  if (isPolestar3 && isHome) {
    block.classList.add('dark-text');
  }

  // Clear the block
  block.textContent = '';

  // Create the hero banner structure
  const heroBannerDiv = document.createElement('div');
  heroBannerDiv.className = 'custom-hero-banner-content';

  // Create background image element wrapper
  const backgroundDiv = document.createElement('div');
  backgroundDiv.className = 'custom-hero-banner-background';

  // Add the image to the background as a responsive picture (eager-loaded:
  // this is the LCP-critical hero image), instead of one flat <img> that
  // would serve the same resolution to every screen size. 2-3 images means
  // the author wants true art direction (a different photo per device
  // tier) rather than one photo resized for every screen.
  if (images.length > 1) {
    const picture = createArtDirectedPicture(images, true);
    backgroundDiv.appendChild(picture);
  } else if (images.length === 1) {
    const [{ src, alt }] = images;
    const picture = createResponsivePicture(src, alt, true, CUSTOM_HERO_BANNER_BREAKPOINTS);
    backgroundDiv.appendChild(picture);
  }

  // The CSS uses a pseudo-element on `.custom-hero-banner` for the overlay,
  // so we do not create a separate overlay element here.

  const textWrapperParent = document.createElement('div');
  textWrapperParent.className = 'custom-hero-banner-text-parent';

  // Create text content wrapper
  const textWrapper = document.createElement('div');
  textWrapper.className = 'custom-hero-banner-text';

  // Create heading
  const heading = document.createElement('h1');
  heading.className = 'custom-hero-banner-heading';
  heading.textContent = headingText;

  // Create subheading, grouped tightly with the heading (only present when
  // there's also a body paragraph)
  let subheading = null;
  if (subheadingText) {
    heading.classList.add('custom-hero-banner-heading-grouped');
    subheading = document.createElement('p');
    subheading.className = 'custom-hero-banner-subheading';
    subheading.textContent = subheadingText;
  }

  // Create description - the original single small description line, used
  // when there's no separate body paragraph
  let description = null;
  if (descriptionText) {
    description = document.createElement('p');
    description.className = 'custom-hero-banner-description';
    description.textContent = descriptionText;
  }

  // Create body paragraph (only present when authored with a plain
  // paragraph alongside/instead of extra heading elements)
  let body = null;
  if (bodyText) {
    body = document.createElement('p');
    body.className = 'custom-hero-banner-body';
    body.textContent = bodyText;
  }

  // Create CTA button - only when the author actually provided one, instead
  // of always falling back to a "Discover" button pointing nowhere (href="#").
  let ctaButton = null;
  if (hasCta) {
    ctaButton = document.createElement('a');
    ctaButton.className = 'custom-hero-banner-cta';
    ctaButton.href = ctaUrl;
    ctaButton.setAttribute('aria-label', ctaText);

    const buttonTextSpan = document.createElement('span');
    buttonTextSpan.className = 'custom-hero-banner-cta-text';
    buttonTextSpan.textContent = ctaText;

    ctaButton.appendChild(buttonTextSpan);
    ctaButton.appendChild(createCtaArrowIcon());
  }

  // Assemble the text wrapper
  textWrapperParent.appendChild(textWrapper);
  textWrapper.appendChild(heading);
  if (subheading) textWrapper.appendChild(subheading);
  if (description) textWrapper.appendChild(description);
  if (body) textWrapper.appendChild(body);
  if (ctaButton) textWrapper.appendChild(ctaButton);

  // Assemble the hero banner
  heroBannerDiv.appendChild(backgroundDiv);
  heroBannerDiv.appendChild(textWrapperParent);
  block.appendChild(heroBannerDiv);
}
