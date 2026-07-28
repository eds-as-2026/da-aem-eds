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
  // If a plain paragraph is present (besides the CTA one), it's treated as
  // a body paragraph, and any extra heading elements become a subheading
  // grouped tightly with the title (e.g. "Sustainability" / "Being
  // transparent with the facts" / body copy). If there's no such paragraph,
  // the extra heading elements are instead treated as a single description
  // line, matching the original two-line hero pattern (e.g. "Polestar 3" /
  // "The SUV others aspire to be...").
  let headingText = '';
  let subheadingText = '';
  let descriptionText = '';
  let bodyText = '';
  let ctaText = 'Discover';
  let ctaUrl = '#';

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
      if (bodyText) {
        subheadingText = headingParts.join(' ');
      } else {
        descriptionText = headingParts.join(' ');
      }
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
    ctaText = ctaRowLink.textContent.trim() || ctaText;
    ctaUrl = ctaRowLink.href;
  }

  // Clear the block
  block.textContent = '';

  // Create the hero banner structure
  const heroBannerDiv = document.createElement('div');
  heroBannerDiv.className = 'hero-banner-content';

  // Create background image element wrapper
  const backgroundDiv = document.createElement('div');
  backgroundDiv.className = 'hero-banner-background';

  // Add the image to the background
  if (imageSrc) {
    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = imageAlt;
    img.loading = 'eager';
    backgroundDiv.appendChild(img);
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

  // Create CTA button
  const ctaButton = document.createElement('a');
  ctaButton.className = 'hero-banner-cta';
  ctaButton.href = ctaUrl;
  ctaButton.setAttribute('aria-label', ctaText);

  // Create button text span
  const buttonTextSpan = document.createElement('span');
  buttonTextSpan.className = 'hero-banner-cta-text';
  buttonTextSpan.textContent = ctaText;

  ctaButton.appendChild(buttonTextSpan);

  // Assemble the text wrapper
  textWrapper.appendChild(heading);
  if (subheading) textWrapper.appendChild(subheading);
  if (description) textWrapper.appendChild(description);
  if (body) textWrapper.appendChild(body);
  textWrapper.appendChild(ctaButton);

  // Assemble the hero banner
  heroBannerDiv.appendChild(backgroundDiv);
  heroBannerDiv.appendChild(textWrapper);
  block.appendChild(heroBannerDiv);
}
