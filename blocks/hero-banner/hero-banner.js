/**
 * loads and decorates the hero-banner block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Ensure the block has the root class expected by the CSS
  block.classList.add('hero-banner');
  // Expected structure:
  // Row 1: image (picture/img element)
  // Row 2: heading
  // Row 3: description/subheading
  // Row 4: CTA button text

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

  // Get heading and description. Some authors place heading + description
  // in the same CMS row (rows[1]) — handle that case by splitting.
  let headingText = '';
  let descriptionText = '';

  const contentRow = rows[1];
  if (contentRow) {
    // Prefer authored heading tags if present (h1/h2/h3). Use the first
    // heading as the main title and remaining headings/paragraphs as the
    // description. This covers CMS content that outputs <h1>/<h2> tags.
    const headingEl = contentRow.querySelector('h1, h2, h3');
    if (headingEl) {
      headingText = headingEl.textContent.trim();
      // Collect subsequent headings and paragraphs in the same cell
      const descParts = [];
      Array.from(contentRow.children).forEach((child) => {
        if (child === headingEl) return;
        if (/(H1|H2|H3|P)/i.test(child.tagName)) {
          const t = child.textContent.trim();
          if (t) descParts.push(t);
        }
      });
      // If no description parts found in the same row, check the next row
      if (descParts.length === 0 && rows[2]) {
        const nextRow = rows[2];
        const nextParts = Array.from(nextRow.querySelectorAll('p, h1, h2, h3'))
          .map((el) => el.textContent.trim())
          .filter(Boolean);
        descriptionText = nextParts.join(' ');
      } else {
        descriptionText = descParts.join(' ');
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
        const descriptionCell = rows[2];
        if (descriptionCell) {
          const dparas = descriptionCell.querySelectorAll('p');
          if (dparas.length > 0) descriptionText = Array.from(dparas)
            .map((p) => p.textContent.trim())
            .filter(Boolean)
            .join(' ');
          else descriptionText = descriptionCell.textContent.trim();
        }
      } else {
        const lines = contentRow.textContent.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
        if (lines.length > 0) {
          headingText = lines.shift();
          descriptionText = lines.join(' ');
        }
        if (!headingText) headingText = contentRow.textContent.trim();
        if (!descriptionText && rows[2]) descriptionText = rows[2].textContent.trim();
      }
    }
  }

  // Heading and description extracted from CMS content

  // Get CTA link
  const ctaCell = rows[3]?.querySelector('a');
  const ctaText = ctaCell?.textContent?.trim() || 'Discover';
  const ctaUrl = ctaCell?.href || '#';

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
    img.addEventListener('load', function () {});
    img.addEventListener('error', function () {});
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

  // Create description
  const description = document.createElement('p');
  description.className = 'hero-banner-description';
  description.textContent = descriptionText;

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
  textWrapper.appendChild(description);
  textWrapper.appendChild(ctaButton);

  // Assemble the hero banner
  heroBannerDiv.appendChild(backgroundDiv);
  heroBannerDiv.appendChild(textWrapper);
  block.appendChild(heroBannerDiv);
}
