/**
 * loads and decorates the model-cards block
 * @param {Element} block The block element
 *
 * Expected structure, one row per card:
 * Row: two cells - an image (picture/img or a link to an external image
 * URL), and a text cell containing a heading (model name) followed by a
 * paragraph with a link (the CTA label and URL). If the CTA link is
 * present the whole card becomes clickable.
 */
export default function decorate(block) {
  const cardRows = Array.from(block.children);

  const list = document.createElement('ul');
  list.className = 'model-cards-list';

  cardRows.forEach((row) => {
    const [imageCell, textCell] = Array.from(row.children);

    let imageSrc = null;
    let imageAlt = '';
    if (imageCell) {
      const img = imageCell.querySelector('img');
      if (img && img.src) {
        imageSrc = img.src;
        imageAlt = img.alt || '';
      } else {
        const link = imageCell.querySelector('a');
        if (link && link.href) imageSrc = link.href;
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

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'model-cards-card-image';
    if (imageSrc) {
      const img = document.createElement('img');
      img.src = imageSrc;
      img.alt = imageAlt;
      img.loading = 'lazy';
      imageWrapper.appendChild(img);
    }

    const body = document.createElement('div');
    body.className = 'model-cards-card-body';

    const heading = document.createElement('h3');
    heading.className = 'model-cards-card-title';
    heading.textContent = title;
    body.appendChild(heading);

    if (ctaText) {
      const cta = document.createElement('span');
      cta.className = 'model-cards-card-cta';
      cta.textContent = ctaText;
      body.appendChild(cta);
    }

    cardLink.appendChild(imageWrapper);
    cardLink.appendChild(body);
    item.appendChild(cardLink);
    list.appendChild(item);
  });

  block.replaceChildren(list);
}
