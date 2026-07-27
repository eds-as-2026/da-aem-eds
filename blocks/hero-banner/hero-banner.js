/**
 * Hero Banner Block
 *
 * Authoring
 *
 * Row 1
 * Image
 *
 * Row 2
 * # Heading
 *
 * Description
 *
 * [Discover](...)
 */

export default function decorate(block) {
  const [mediaRow, contentRow] = [...block.children];

  if (!mediaRow || !contentRow) return;

  /* -----------------------------
   * Background
   * ----------------------------- */

  mediaRow.classList.add('hero-banner-background');

  // Support both EDS picture and URL authoring
  const picture = mediaRow.querySelector('picture');
  const img = mediaRow.querySelector('img');
  const link = mediaRow.querySelector('a');

  if (!picture && !img && link) {
    const image = document.createElement('img');
    image.src = link.href;
    image.alt = '';
    image.loading = 'eager';

    mediaRow.replaceChildren(image);
  }

  /* -----------------------------
   * Content
   * ----------------------------- */

  contentRow.classList.add('hero-banner-content');

  const heading = contentRow.querySelector('h1');

  if (heading) {
    heading.classList.add('hero-banner-heading');
  }

  // Description = first paragraph WITHOUT a link
  const description = [...contentRow.querySelectorAll('p')]
    .find((p) => !p.querySelector('a'));

  if (description) {
    description.classList.add('hero-banner-description');
  }

  // CTA = first anchor
  const cta = contentRow.querySelector('a');

  if (cta) {
    cta.classList.add('hero-banner-cta');

    const wrapper = cta.closest('p');

    if (wrapper) {
      wrapper.classList.add('hero-banner-actions');
    }
  }
}