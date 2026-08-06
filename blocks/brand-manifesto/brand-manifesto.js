import { createOptimizedPicture } from '../../scripts/aem.js';

const syncScrollReveal = (panel) => {
  const heading = panel.querySelector('.brand-manifesto__heading');
  const body = panel.querySelector('.brand-manifesto__text');
  if (!heading || !body) return;

  let rafId = 0;

  const onScroll = () => {
    const maxScroll = Math.max(1, panel.scrollHeight - panel.clientHeight);
    const progress = Math.min(Math.max(panel.scrollTop / maxScroll, 0), 1);
    const revealed = progress > 0.12;

    heading.classList.toggle('slide-up', revealed);
    body.classList.toggle('slide-up', revealed);
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

  // Guard against the browser silently shifting scrollTop (e.g. via scroll
  // anchoring, when web fonts swap in and reflow the heading/text) so the
  // reveal never starts in the wrong state before the user has scrolled.
  panel.scrollTop = 0;
  refresh();
};

// Splits a <p>'s content on <br> into trimmed, non-empty lines, e.g.
// "<br>Title<br>Intro line<br>Desc 1<br>Desc 2" -> ['Title', 'Intro line', 'Desc 1', 'Desc 2']
const splitLines = (p) => Array.from(p.childNodes)
  .reduce((lines, node) => {
    if (node.nodeName === 'BR') {
      lines.push('');
    } else {
      lines[lines.length - 1] += node.textContent || '';
    }
    return lines;
  }, [''])
  .map((line) => line.trim())
  .filter(Boolean);

// The first row is authored as a single cell holding "WELCOME TO", the logo image,
// and a title/intro/description block separated by line breaks, e.g.:
// <p>WELCOME TO</p><p><picture>…</picture></p><p><br>Title<br>Intro<br>Desc…</p>
const parseIntroCell = (cell) => {
  const data = {
    greeting: '', logo: null, title: '', intro: '', descriptions: [],
  };

  cell.querySelectorAll(':scope > p').forEach((p) => {
    const picture = p.querySelector('picture');
    if (picture) {
      data.logo = picture;
      return;
    }

    if (p.querySelector('br')) {
      const [title, intro, ...descriptions] = splitLines(p);
      data.title = title || '';
      data.intro = intro || '';
      data.descriptions = descriptions;
      return;
    }

    if (!data.greeting) data.greeting = p.textContent.trim();
  });

  if (!data.logo) {
    const img = cell.querySelector('img');
    if (img) data.logo = createOptimizedPicture(img.src, img.alt || '', true, [{ width: '900' }]);
  }

  return data;
};

// Every row after the first is a single gallery image, optionally followed by a
// caption paragraph used as the alt text, e.g. <picture>…</picture><p>Img 7</p>
const parseGalleryRow = (row, index) => {
  const cell = row.querySelector(':scope > div');
  if (!cell) return null;

  let picture = cell.querySelector('picture');
  if (!picture) {
    const img = cell.querySelector('img');
    if (!img) return null;
    picture = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '900' }]);
  }

  const caption = Array.from(cell.querySelectorAll(':scope > p'))
    .find((p) => !p.querySelector('picture'));
  const img = picture.querySelector('img');
  const alt = caption?.textContent.trim() || img?.alt || `Gallery image ${index + 1}`;
  if (img) img.alt = alt;

  const tile = document.createElement('div');
  tile.className = 'brand-manifesto-tile';
  tile.style.setProperty('--tile-offset', `${index % 2 === 0 ? 0 : 36}px`);
  tile.append(picture);
  return tile;
};

/**
 * Loads and decorates the brand-manifesto block.
 * Expected authored structure:
 * - row 1: single cell with "WELCOME TO" text, the logo image, and a
 *   title/intro/description paragraph separated by line breaks
 * - rows 2+: one gallery image per row, with an optional caption paragraph for alt text
 */
export default function decorate(block) {
  const [introRow, ...galleryRows] = Array.from(block.children);
  if (!introRow) return;

  const intro = document.createElement('div');
  intro.className = 'brand-manifesto__intro';

  const introCell = introRow.querySelector(':scope > div');
  if (introCell) {
    const data = parseIntroCell(introCell);

    if (data.greeting || data.logo) {
      const eyebrow = document.createElement('div');
      eyebrow.className = 'brand-manifesto__greeting';

      if (data.greeting) {
        const kicker = document.createElement('p');
        kicker.className = 'brand-manifesto-kicker';
        kicker.textContent = data.greeting;
        eyebrow.append(kicker);
      }

      if (data.logo) {
        const logo = document.createElement('div');
        logo.className = 'brand-manifesto__logo';
        logo.append(data.logo);
        eyebrow.append(logo);
      }

      intro.append(eyebrow);
    }

    if (data.title) {
      const content = document.createElement('div');
      content.className = 'brand-manifesto__content';

      const scrollPanel = document.createElement('div');
      scrollPanel.className = 'brand-manifesto-scroll-panel';
      scrollPanel.tabIndex = 0;

      const scrollStage = document.createElement('div');
      scrollStage.className = 'brand-manifesto-scroll-stage';

      const headingWrap = document.createElement('div');
      headingWrap.className = 'brand-manifesto__heading';
      const titleEl = document.createElement('h2');
      titleEl.className = 'brand-manifesto__title brand-manifesto-headline-copy';
      titleEl.textContent = data.title;
      headingWrap.append(titleEl);

      const bodyWrap = document.createElement('div');
      bodyWrap.className = 'brand-manifesto__text';

      if (data.intro) {
        const introCopy = document.createElement('p');
        introCopy.className = 'brand-manifesto-intro-text';
        introCopy.textContent = data.intro;
        bodyWrap.append(introCopy);
      }

      if (data.descriptions.length) {
        const descriptionList = document.createElement('div');
        descriptionList.className = 'brand-manifesto__desc brand-manifesto-descriptions';

        data.descriptions.forEach((line) => {
          const paragraph = document.createElement('p');
          paragraph.className = 'brand-manifesto__desc-copy brand-manifesto-description-text';
          paragraph.textContent = line;
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
  }

  const gallery = document.createElement('div');
  gallery.className = 'brand-manifesto__gallery gallery-wrapper';
  gallery.setAttribute('aria-label', 'Brand manifesto media');

  const track = document.createElement('div');
  track.className = 'brand-manifesto-track';

  galleryRows.forEach((row, index) => {
    const tile = parseGalleryRow(row, index);
    if (tile) track.append(tile);
  });

  if (track.childElementCount) {
    // Duplicate the tile set once so the marquee can loop seamlessly:
    // translateX(-50%) always lands exactly on the start of the clone.
    track.style.setProperty('--marquee-duration', `${track.childElementCount * 3.5}s`);
    Array.from(track.children).forEach((tile) => {
      const clone = tile.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.append(clone);
    });

    gallery.append(track);
    intro.append(gallery);
  }

  block.replaceChildren(intro);
}
