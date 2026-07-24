/**
 * loads and decorates the hero-banner block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Expected structure:
  // Row 1: image
  // Row 2: heading
  // Row 3: description/subheading
  // Row 4: CTA button text

  const rows = Array.from(block.children);

  // Get image
  const imageCell = rows[0]?.querySelector('img');
  const imageSrc = imageCell?.src;
  const imageAlt = imageCell?.alt || 'Hero banner background';

  // Get heading
  const headingText = rows[1]?.textContent?.trim() || '';

  // Get description
  const descriptionText = rows[2]?.textContent?.trim() || '';

  // Get CTA link
  const ctaCell = rows[3]?.querySelector('a');
  const ctaText = ctaCell?.textContent?.trim() || 'Discover';
  const ctaUrl = ctaCell?.href || '#';

  // Clear the block
  block.textContent = '';

  // Create the hero banner structure
  const heroBannerDiv = document.createElement('div');
  heroBannerDiv.className = 'hero-banner-content';

  // Create background image element
  const backgroundDiv = document.createElement('div');
  backgroundDiv.className = 'hero-banner-background';
  backgroundDiv.style.backgroundImage = `url('${imageSrc}')`;

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

  // Create arrow icon
  const arrowIcon = document.createElement('svg');
  arrowIcon.className = 'hero-banner-cta-icon';
  arrowIcon.setAttribute('viewBox', '0 0 24 24');
  arrowIcon.setAttribute('fill', 'currentColor');
  arrowIcon.setAttribute('aria-hidden', 'true');

  const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrowPath.setAttribute('d', 'M5 12h14M12 5l7 7-7 7');
  arrowIcon.appendChild(arrowPath);

  ctaButton.appendChild(buttonTextSpan);
  ctaButton.appendChild(arrowIcon);

  // Assemble the text wrapper
  textWrapper.appendChild(heading);
  textWrapper.appendChild(description);
  textWrapper.appendChild(ctaButton);

  // Assemble the hero banner
  heroBannerDiv.appendChild(backgroundDiv);
  heroBannerDiv.appendChild(textWrapper);
  block.appendChild(heroBannerDiv);
}
