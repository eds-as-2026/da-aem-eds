/**
 * loads and decorates the hero-banner block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
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
    console.log('Hero banner first row:', firstRow.innerHTML);
    
    // Try picture element first
    let imgElement = firstRow.querySelector('img');
    
    // If no img, try to get URL from link
    if (!imgElement) {
      const linkElement = firstRow.querySelector('a');
      if (linkElement && linkElement.href) {
        imageSrc = linkElement.href;
        console.log('Hero banner extracted image from link href:', imageSrc);
      }
    } else {
      // If img exists, get src from it
      if (imgElement.src) {
        imageSrc = imgElement.src;
        imageAlt = imgElement.alt || imageAlt;
        console.log('Hero banner extracted image src:', imageSrc);
        console.log('Hero banner extracted image alt:', imageAlt);
      }
    }
    
    if (!imageSrc) {
      console.warn('Hero banner: No image source found in first row');
    }
  }

  // Get heading
  const headingText = rows[1]?.textContent?.trim() || '';

  // Get description
  const descriptionCell = rows[2];
  let descriptionText = '';
  
  if (descriptionCell) {
    // Get all text content and preserve line breaks
    const paragraphs = descriptionCell.querySelectorAll('p');
    if (paragraphs.length > 0) {
      // Join multiple paragraphs with line breaks
      descriptionText = Array.from(paragraphs)
        .map(p => p.textContent.trim())
        .filter(text => text.length > 0)
        .join(' ');
    } else {
      // Fallback to all text content
      descriptionText = descriptionCell.textContent.trim();
    }
  }
  
  console.log('Hero banner description:', descriptionText);

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
    console.log('Creating image element with src:', imageSrc);
    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = imageAlt;
    img.loading = 'eager';
    img.onload = () => console.log('Hero banner image loaded successfully');
    img.onerror = (e) => console.error('Hero banner image failed to load:', e);
    backgroundDiv.appendChild(img);
  } else {
    console.warn('No image available for hero banner');
    console.warn('First row content:', firstRow?.innerHTML);
  }

  // Create overlay for text readability
  const overlay = document.createElement('div');
  overlay.className = 'hero-banner-overlay';
  backgroundDiv.appendChild(overlay);

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
  buttonTextSpan.textContent = ctaText + ' →';

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
