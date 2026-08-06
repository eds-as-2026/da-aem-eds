import { createOptimizedPicture } from '../../scripts/aem.js';

const LABELS = {
  greeting: 'greeting',
  logo: 'logo',
  title: 'title',
  intro: 'intro',
};

const normalizeLabel = (label) => label.toLowerCase().trim();

const createTextBlock = (cell, className) => {
  const wrapper = document.createElement('div');
  wrapper.className = className;
  while (cell.firstChild) wrapper.append(cell.firstChild);
  return wrapper;
};

const syncScrollReveal = (panel) => {
  const heading = panel.querySelector('.brand-manifesto__heading');
  const body = panel.querySelector('.brand-manifesto__text');
  if (!heading || !body) return;

  let rafId = 0;

  const onScroll = () => {
    const maxScroll = Math.max(1, panel.scrollHeight - panel.clientHeight);
    const progress = Math.min(Math.max(panel.scrollTop / maxScroll, 0), 1);
    const slideUp = progress > 0.12;
    const bodyOpacity = Math.min(1, Math.max(0, (progress - 0.1) * 1.2));
    const bodyShift = Math.max(0, 24 - progress * 24);

    heading.classList.toggle('slide-up', slideUp);
    heading.style.opacity = slideUp ? 0 : 1;
    heading.style.transform = slideUp ? 'translate(-50%, -40vh)' : 'translate(-50%, -50%)';
    body.style.opacity = bodyOpacity;
    body.style.transform = `translateY(${bodyShift}px)`;
  };

  const refresh = () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(onScroll);
  };

  const trapWheel = (event) => {
    const deltaY = event.deltaY || 0;
    const maxScrollTop = panel.scrollHeight - panel.clientHeight;
    const atTop = panel.scrollTop <= 0;
    const atBottom = panel.scrollTop >= maxScrollTop;

    if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) {
      event.preventDefault();
      panel.scrollTop += deltaY;
      refresh();
    }
  };

  panel.addEventListener('scroll', onScroll, { passive: true });
  panel.addEventListener('wheel', trapWheel, { passive: false });

  const resizeObserver = new ResizeObserver(refresh);
  resizeObserver.observe(panel);
  resizeObserver.observe(heading);
  resizeObserver.observe(body);

  window.addEventListener('resize', refresh, { passive: true });
  window.addEventListener('load', refresh, { once: true });

  refresh();
};

const createMediaTileFromRow = (mediaCell, altCell, index) => {
  const tile = document.createElement('div');
  tile.className = 'brand-manifesto-tile';
  tile.style.setProperty('--tile-offset', `${index % 2 === 0 ? 0 : 36}px`);

  const picture = mediaCell.querySelector('picture');
  const img = mediaCell.querySelector('img');
  const link = mediaCell.querySelector('a');
  const altText = altCell?.textContent.trim() || img?.alt || '';

  if (picture) {
    const pictureClone = picture.cloneNode(true);
    const clonedImg = pictureClone.querySelector('img');
    if (clonedImg) clonedImg.alt = altText;
    tile.append(pictureClone);
  } else if (img) {
    tile.append(createOptimizedPicture(img.src, altText, index === 0, [{ width: '900' }]));
  } else if (link && link.href) {
    const linkedImg = link.querySelector('img');
    if (linkedImg) {
      tile.append(createOptimizedPicture(linkedImg.src, altText, index === 0, [{ width: '900' }]));
    }
  }

  return tile;
};

/**
 * Loads and decorates the brand-manifesto block.
 * Expected authored structure:
 * - row label/value pairs, where the label is the left table cell
 * - supported labels: Greeting, Logo, Title, Intro, Description 1+
 */
export default function decorate(block) {
  const rows = Array.from(block.children);
  if (!rows.length) return;

  const fields = new Map();
  const descriptions = [];
  const mediaRows = [];

  rows.forEach((row) => {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length < 2) return;

    const label = normalizeLabel(cells[0].textContent.trim());
    const value = cells[1];

    if (label === LABELS.logo) {
      fields.set(label, value);
      return;
    }

    if (label.startsWith('description')) {
      descriptions.push(value);
      return;
    }

    if (value.querySelector('picture, img, a img')) {
      mediaRows.push({ mediaCell: value, altCell: cells[0], label });
      return;
    }

    fields.set(label, value);
  });

  const intro = document.createElement('div');
  intro.className = 'brand-manifesto-intro';

  const greetingCell = fields.get(LABELS.greeting);
  const logoCell = fields.get(LABELS.logo);
  if (greetingCell || logoCell) {
    const eyebrow = document.createElement('div');
    eyebrow.className = 'brand-manifesto-eyebrow';

    if (greetingCell) {
      eyebrow.append(createTextBlock(greetingCell, 'brand-manifesto-kicker'));
    }

    if (logoCell) {
      const logo = document.createElement('div');
      logo.className = 'brand-manifesto-logo';

      const picture = logoCell.querySelector('picture');
      const img = logoCell.querySelector('img');
      const link = logoCell.querySelector('a');

      if (picture) {
        logo.append(picture);
      } else if (img) {
        logo.append(createOptimizedPicture(img.src, img.alt || '', true, [{ width: '900' }]));
      } else if (link && link.href) {
        const linkedImg = link.querySelector('img');
        if (linkedImg) {
          logo.append(createOptimizedPicture(linkedImg.src, linkedImg.alt || '', true, [{ width: '900' }]));
        }
      }

      eyebrow.append(logo);
    }

    intro.append(eyebrow);
  }

  const titleCell = fields.get(LABELS.title);
  if (titleCell) {
    const content = document.createElement('div');
    content.className = 'brand-manifesto__content';

    const scrollPanel = document.createElement('div');
    scrollPanel.className = 'brand-manifesto-scroll-panel';
    scrollPanel.tabIndex = 0;

    const scrollStage = document.createElement('div');
    scrollStage.className = 'brand-manifesto-scroll-stage';

    const headingWrap = document.createElement('div');
    headingWrap.className = 'brand-manifesto__heading';
    const title = document.createElement('h2');
    title.className = 'brand-manifesto__title brand-manifesto-headline-copy';
    title.append(...titleCell.childNodes);
    headingWrap.append(title);

    const bodyWrap = document.createElement('div');
    bodyWrap.className = 'brand-manifesto__text';

    const introCell = fields.get(LABELS.intro);
    if (introCell) {
      const introCopy = document.createElement('p');
      introCopy.className = 'brand-manifesto__intro brand-manifesto-intro-text';
      introCopy.append(...introCell.childNodes);
      bodyWrap.append(introCopy);
    }

    if (descriptions.length) {
      const descriptionList = document.createElement('div');
      descriptionList.className = 'brand-manifesto__desc brand-manifesto-descriptions';

      descriptions.forEach((cell) => {
        const paragraph = document.createElement('p');
        paragraph.className = 'brand-manifesto__desc-copy brand-manifesto-description-text';
        paragraph.append(...cell.childNodes);
        descriptionList.append(paragraph);
      });

      bodyWrap.append(descriptionList);
    }

    scrollStage.append(headingWrap, bodyWrap);
    scrollPanel.append(scrollStage);
    content.append(scrollPanel);
    intro.append(content);
    requestAnimationFrame(() => syncScrollReveal(scrollPanel));
  }

  if (mediaRows.length) {
    const media = document.createElement('div');
    media.className = 'gallery-wrapper';
    media.setAttribute('aria-label', 'Brand manifesto media');

    mediaRows.forEach(({ mediaCell, altCell }, index) => {
      const tile = createMediaTileFromRow(mediaCell, altCell, index);
      if (tile.childElementCount) media.append(tile);
    });

    if (media.childElementCount) intro.append(media);
  }

  block.replaceChildren(intro);
}
