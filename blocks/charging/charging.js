/**
 * loads and decorates the charging block
 * @param {Element} block The block element
 *
 * Expected structure:
 * Row 1: a heading paragraph, followed by a CTA paragraph containing a link
 * Row 2+: one row per stat - a single paragraph "<strong>value</strong><br>label"
 *   e.g. "<strong>800 V</strong><br>Battery architecture"
 */
export default function decorate(block) {
  const rows = Array.from(block.children);
  const [contentRow, ...statRows] = rows;

  const paragraphs = contentRow
    ? Array.from(contentRow.querySelectorAll('p, h1, h2, h3, h4, h5, h6'))
    : [];
  const ctaPara = paragraphs.find((p) => p.querySelector('a'));
  const headingPara = paragraphs.find((p) => p !== ctaPara);

  const content = document.createElement('div');
  content.className = 'charging-content';

  if (headingPara) {
    headingPara.classList.add('charging-heading');
    content.append(headingPara);
  }

  if (ctaPara) {
    const cta = ctaPara.querySelector('a');
    cta.classList.add('charging-cta');
    ctaPara.classList.add('charging-cta-wrapper');
    content.append(ctaPara);
  }

  const stats = document.createElement('div');
  stats.className = 'charging-stats';

  statRows.forEach((row) => {
    const p = row.querySelector('p, h1, h2, h3, h4, h5, h6');
    if (!p) return;
    const valueEl = p.querySelector('strong, b');
    const value = valueEl ? valueEl.textContent.trim() : '';
    const clone = p.cloneNode(true);
    const valueInClone = clone.querySelector('strong, b');
    if (valueInClone) valueInClone.remove();
    const label = clone.textContent.trim();
    if (!value && !label) return;

    const stat = document.createElement('div');
    stat.className = 'charging-stat';
    if (value) {
      const valueEl2 = document.createElement('p');
      valueEl2.className = 'charging-stat-value';
      valueEl2.textContent = value;
      stat.append(valueEl2);
    }
    const divider = document.createElement('span');
    divider.className = 'charging-stat-divider';
    stat.append(divider);
    if (label) {
      const labelEl = document.createElement('p');
      labelEl.className = 'charging-stat-label';
      labelEl.textContent = label;
      stat.append(labelEl);
    }
    stats.append(stat);
  });

  block.replaceChildren(content, stats);
}
