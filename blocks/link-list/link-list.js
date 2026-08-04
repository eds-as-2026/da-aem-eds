const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * builds the chevron icon shown at the end of each link
 * @returns {SVGElement} the chevron icon
 */
function createChevronIcon() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 14 24');
  svg.setAttribute('role', 'presentation');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'm13.75 12-12-12L.693 1.058 11.635 12 .693 22.943 1.75 24z');
  path.setAttribute('fill', 'currentColor');
  svg.appendChild(path);
  return svg;
}

/**
 * loads and decorates the link-list block
 * @param {Element} block The block element
 *
 * Expected structure, one row per link: a single cell containing a
 * paragraph with a link (the link text is the label, its href the target).
 * Italicizing the link (e.g. authoring it as _About Polestar_) marks it as
 * muted, rendering it gray instead of black by default. A row authored
 * without a link yet (plain text) still renders, pointing at "#" until the
 * real URL is added later.
 */
export default function decorate(block) {
  const rows = Array.from(block.children);

  const list = document.createElement('ul');
  list.className = 'link-list-list';

  rows.forEach((row) => {
    const link = row.querySelector('a');
    const labelText = (link ? link.textContent : row.textContent).trim();
    if (!labelText) return;

    const isMuted = !!(link ? link.closest('em, i') : row.querySelector('em, i'));

    const item = document.createElement('li');
    item.className = 'link-list-item';
    if (isMuted) item.classList.add('link-list-item-muted');

    const anchor = document.createElement('a');
    anchor.className = 'link-list-link';
    anchor.href = link ? link.href : '#';

    const text = document.createElement('span');
    text.className = 'link-list-text';
    text.textContent = labelText;

    const chevron = document.createElement('span');
    chevron.className = 'link-list-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.appendChild(createChevronIcon());

    anchor.appendChild(text);
    anchor.appendChild(chevron);
    item.appendChild(anchor);
    list.appendChild(item);
  });

  block.replaceChildren(list);
}
