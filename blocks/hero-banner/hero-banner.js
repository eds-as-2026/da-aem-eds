import { createOptimizedPicture } from '../../scripts/aem.js';

// Matches this project's CSS breakpoints (600/900/1200, see AGENTS.md), so
// each device tier requests an image sized close to what it'll actually
// display, instead of every screen loading the same one resolution.
const HERO_BANNER_BREAKPOINTS = [
  { media: '(min-width: 1200px)', width: '2400' },
  { media: '(min-width: 900px)', width: '1800' },
  { media: '(min-width: 600px)', width: '1200' },
  { width: '750' },
];

/**
 * loads and decorates the hero-banner block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Ensure the block has the root class expected by the CSS
  block.classList.add('hero-banner');
  // Expected structure:
  // Row 1: image (picture/img element)
  // Row 2: a single cell containing, in order: a heading (h1/h2/h3) used as
  //        the title, any further heading elements used as description
  //        lines, and a trailing paragraph used as the CTA label (optionally
  //        wrapped in a link for the CTA URL)

  const rows = Array.from(block.children);

  // Get image - extract from picture element or link
  let imageSrc = null;
  let imageAlt = 'Hero banner background';

  const firstRow = rows[0];
  if (firstRow) {
    // Try picture element first
    const imgElement = firstRow.querySelector('img');
    if (imgElement && imgElement.src) {
      imageSrc = imgElement.src;
      imageAlt = imgElement.alt || imageAlt;
    } else {
      const linkElement = firstRow.querySelector('a');
      if (linkElement && linkElement.href) {
        imageSrc = linkElement.href;
      }
    }
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

  // Clear the block
  block.textContent = '';

  // Create the hero banner structure
  const heroBannerDiv = document.createElement('div');
  heroBannerDiv.className = 'hero-banner-content';

  // Create background image element wrapper
  const backgroundDiv = document.createElement('div');
  backgroundDiv.className = 'hero-banner-background';

  // Add the image to the background as a responsive picture (eager-loaded:
  // this is the LCP-critical hero image), instead of one flat <img> that
  // would serve the same resolution to every screen size.
  if (imageSrc) {
    const picture = createOptimizedPicture(imageSrc, imageAlt, true, HERO_BANNER_BREAKPOINTS);
    backgroundDiv.appendChild(picture);
  }

  // The CSS uses a pseudo-element on `.hero-banner` for the overlay,
  // so we do not create a separate overlay element here.

  // Create text content wrapper
  const textWrapper = document.createElement('div');
  textWrapper.className = 'hero-banner-text';

  // Create heading
  const heading = document.createElement('h1');
  heading.className = 'hero-banner-heading';
  heading.textContent = headingText;

  // Create subheading, grouped tightly with the heading (only present when
  // there's also a body paragraph)
  let subheading = null;
  if (subheadingText) {
    heading.classList.add('hero-banner-heading-grouped');
    subheading = document.createElement('p');
    subheading.className = 'hero-banner-subheading';
    subheading.textContent = subheadingText;
  }

  // Create description - the original single small description line, used
  // when there's no separate body paragraph
  let description = null;
  if (descriptionText) {
    description = document.createElement('p');
    description.className = 'hero-banner-description';
    description.textContent = descriptionText;
  }

  // Create body paragraph (only present when authored with a plain
  // paragraph alongside/instead of extra heading elements)
  let body = null;
  if (bodyText) {
    body = document.createElement('p');
    body.className = 'hero-banner-body';
    body.textContent = bodyText;
  }

  // Create CTA button - only when the author actually provided one, instead
  // of always falling back to a "Discover" button pointing nowhere (href="#").
  let ctaButton = null;
  if (hasCta) {
    ctaButton = document.createElement('a');
    ctaButton.className = 'hero-banner-cta';
    ctaButton.href = ctaUrl;
    ctaButton.setAttribute('aria-label', ctaText);

    const buttonTextSpan = document.createElement('span');
    buttonTextSpan.className = 'hero-banner-cta-text';
    buttonTextSpan.textContent = ctaText;

    ctaButton.appendChild(buttonTextSpan);
  }

  // Assemble the text wrapper
  textWrapper.appendChild(heading);
  if (subheading) textWrapper.appendChild(subheading);
  if (description) textWrapper.appendChild(description);
  if (body) textWrapper.appendChild(body);
  if (ctaButton) textWrapper.appendChild(ctaButton);

  // Assemble the hero banner
  heroBannerDiv.appendChild(backgroundDiv);
  heroBannerDiv.appendChild(textWrapper);
  block.appendChild(heroBannerDiv);
}
