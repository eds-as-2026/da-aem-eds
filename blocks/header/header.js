/* eslint-disable no-unused-vars */
// TODO: remove this disable once the header/nav is re-enabled (see decorate() below)
import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

const SVG_NS = 'http://www.w3.org/2000/svg';

function createChevronIcon() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 8 8');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('nav-drop-chevron-icon');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M1.53 1.88 4 4.36l2.47-2.48.88.88L4 6.12.65 2.76l.88-.88Z');
  path.setAttribute('fill', 'currentColor');
  svg.appendChild(path);
  return svg;
}

function createBackIcon() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M8 2 9.05 3.05l-4.2 4.2H14v1.5H4.85l4.2 4.2L8 14l-6-6 6-6Z');
  path.setAttribute('fill', 'currentColor');
  svg.appendChild(path);
  return svg;
}

function createPinIcon() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute(
    'd',
    'M8 1c-2.76 0-5 2.24-5 5 0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5Zm0 6.75A1.75 1.75 0 1 1 8 4.25a1.75 1.75 0 0 1 0 3.5Z',
  );
  path.setAttribute('fill', 'currentColor');
  svg.appendChild(path);
  return svg;
}

function createGlobeIcon() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.2"/>'
    + '<ellipse cx="8" cy="8" rx="2.6" ry="6.25" fill="none" stroke="currentColor" stroke-width="1.2"/>'
    + '<line x1="1.75" y1="8" x2="14.25" y2="8" stroke="currentColor" stroke-width="1.2"/>';
  return svg;
}

// keyword -> icon builder, matched against a tool link's own text
const TOOL_ICONS = [
  { test: /location/i, build: createPinIcon },
  { test: /market|language|region/i, build: createGlobeIcon },
];

/**
 * replaces a tools link's visible text with an icon, matched by keyword,
 * while keeping the original text for assistive tech.
 * @param {Element} link the tools <a> element
 */
function iconifyToolLink(link) {
  const match = TOOL_ICONS.find(({ test }) => test.test(link.textContent));
  if (!match) return;
  const label = link.textContent.trim();
  link.textContent = '';
  link.setAttribute('aria-label', label);
  link.appendChild(match.build());
  const srText = document.createElement('span');
  srText.className = 'nav-sr-only';
  srText.textContent = label;
  link.appendChild(srText);
}

/**
 * hides the header on scroll down, reveals it on scroll up. Only active at
 * desktop widths where the header is a slim sticky bar; mobile keeps the
 * header always visible since it's the anchor point for the hamburger.
 * @param {Element} navWrapper the fixed-position header wrapper
 */
function initScrollHide(navWrapper) {
  let lastY = window.scrollY;
  let ticking = false;

  const update = () => {
    const y = window.scrollY;
    if (isDesktop.matches && y > lastY && y > 80) {
      navWrapper.classList.add('nav-hidden');
    } else {
      navWrapper.classList.remove('nav-hidden');
    }
    lastY = y;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  });
}

/**
 * closes every open flyout/drawer panel
 * @param {Element} nav the nav element
 */
function closeAllPanels(nav) {
  nav.querySelectorAll('.nav-drop[aria-expanded="true"]').forEach((drop) => {
    drop.setAttribute('aria-expanded', 'false');
  });
  nav.querySelectorAll('.nav-drop-toggle[aria-expanded="true"]').forEach((toggle) => {
    toggle.setAttribute('aria-expanded', 'false');
  });
  nav.querySelectorAll('.nav-flyout-panel.active').forEach((panel) => {
    panel.classList.remove('active');
  });
  const flyout = nav.querySelector('.nav-flyout');
  if (flyout) flyout.classList.remove('open');
  nav.classList.remove('nav-drawer-sub-open');
}

/**
 * wires up one dual-target nav item: on mobile a chevron button opens
 * that item's sub-panel (tap target, no hover available); on desktop the
 * chevron is hidden and the panel opens on hover of the item itself, since
 * that matches the flat, icon-free desktop nav.
 * @param {Element} li the top-level nav item
 * @param {Element} nav the nav element
 * @param {number} index this item's index, used to pair it with its panel
 */
function wireNavDrop(li, nav, index) {
  li.classList.add('nav-drop');

  const link = li.querySelector(':scope > a');
  const subList = li.querySelector(':scope > ul');
  const image = li.querySelector(':scope > picture, :scope > p a[href*="."]');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-drop-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', `nav-flyout-panel-${index}`);
  toggle.setAttribute('aria-label', `${link ? link.textContent.trim() : 'Menu'} submenu`);
  toggle.appendChild(createChevronIcon());

  const itemRow = document.createElement('div');
  itemRow.className = 'nav-drop-row';
  if (link) itemRow.appendChild(link);
  itemRow.appendChild(toggle);
  li.replaceChildren(itemRow);
  li.setAttribute('aria-expanded', 'false');

  const panel = document.createElement('div');
  panel.className = 'nav-flyout-panel';
  panel.id = `nav-flyout-panel-${index}`;

  const mobileHeading = document.createElement('div');
  mobileHeading.className = 'nav-flyout-panel-heading';
  const backButton = document.createElement('button');
  backButton.type = 'button';
  backButton.className = 'nav-flyout-back';
  backButton.setAttribute('aria-label', 'Back to menu');
  backButton.appendChild(createBackIcon());
  mobileHeading.appendChild(backButton);
  const headingText = document.createElement('span');
  headingText.textContent = link ? link.textContent.trim() : '';
  mobileHeading.appendChild(headingText);
  panel.appendChild(mobileHeading);

  const panelBody = document.createElement('div');
  panelBody.className = 'nav-flyout-panel-body';

  const linksCol = document.createElement('div');
  linksCol.className = 'nav-flyout-links';
  if (subList) {
    subList.className = 'nav-flyout-links-list';
    linksCol.appendChild(subList);
  }
  panelBody.appendChild(linksCol);

  if (image) {
    const imageCol = document.createElement('div');
    imageCol.className = 'nav-flyout-image';
    imageCol.appendChild(image);
    panelBody.appendChild(imageCol);
  }

  panel.appendChild(panelBody);

  const closePanel = () => {
    toggle.setAttribute('aria-expanded', 'false');
    li.setAttribute('aria-expanded', 'false');
    panel.classList.remove('active');
    nav.querySelector('.nav-flyout')?.classList.remove('open');
    nav.classList.remove('nav-drawer-sub-open');
  };

  const openPanel = () => {
    const wasOpen = toggle.getAttribute('aria-expanded') === 'true';
    closeAllPanels(nav);
    if (wasOpen) return;
    toggle.setAttribute('aria-expanded', 'true');
    li.setAttribute('aria-expanded', 'true');
    panel.classList.add('active');
    nav.querySelector('.nav-flyout')?.classList.add('open');
    nav.classList.add('nav-drawer-sub-open');
  };

  // mobile: tap the chevron
  toggle.addEventListener('click', openPanel);
  backButton.addEventListener('click', closePanel);

  // desktop: hover the item, with a short close delay so moving the
  // pointer from the link down into the panel doesn't close it first
  let closeTimer;
  const cancelClose = () => clearTimeout(closeTimer);
  const scheduleClose = () => {
    cancelClose();
    closeTimer = setTimeout(() => {
      if (isDesktop.matches) closePanel();
    }, 150);
  };

  li.addEventListener('mouseenter', () => {
    if (isDesktop.matches) {
      cancelClose();
      openPanel();
    }
  });
  li.addEventListener('mouseleave', scheduleClose);
  panel.addEventListener('mouseenter', cancelClose);
  panel.addEventListener('mouseleave', scheduleClose);

  // keyboard: opening via focus keeps the flyout reachable without a mouse
  link?.addEventListener('focus', () => {
    if (isDesktop.matches) openPanel();
  });

  return panel;
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // TODO: re-enable once we proceed further with the header/nav work
  block.textContent = '';

  /*
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  if (fragment) {
    while (fragment.firstElementChild) nav.append(fragment.firstElementChild);
  }

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand?.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-wrapper')?.classList.remove('button-wrapper');
  }

  // tools: swap "Find our locations" / "Choose your market" style text
  // links for icons, keeping the text for screen readers
  const navTools = nav.querySelector('.nav-tools');
  navTools?.querySelectorAll('a').forEach(iconifyToolLink);

  // build the shared flyout: one panel per nav-drop item, stacked and
  // cross-faded rather than mounted/unmounted, so switching between two
  // items' panels doesn't flash empty content in between
  const flyout = document.createElement('div');
  flyout.className = 'nav-flyout';

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    const items = navSections.querySelectorAll(':scope .default-content-wrapper > ul > li');
    items.forEach((li, index) => {
      if (li.querySelector(':scope > ul')) {
        const panel = wireNavDrop(li, nav, index);
        flyout.appendChild(panel);
      }
    });
  }
  nav.appendChild(flyout);

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  const hamburgerButton = document.createElement('button');
  hamburgerButton.type = 'button';
  hamburgerButton.setAttribute('aria-controls', 'nav');
  hamburgerButton.setAttribute('aria-label', 'Open navigation');
  const hamburgerIcon = document.createElement('span');
  hamburgerIcon.className = 'nav-hamburger-icon';
  hamburgerButton.appendChild(hamburgerIcon);
  hamburger.appendChild(hamburgerButton);
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  const closeDrawer = () => {
    nav.setAttribute('aria-expanded', 'false');
    hamburgerButton.setAttribute('aria-label', 'Open navigation');
    document.body.style.overflowY = '';
    closeAllPanels(nav);
  };

  hamburgerButton.addEventListener('click', () => {
    const expanded = nav.getAttribute('aria-expanded') === 'true';
    if (expanded) {
      closeDrawer();
    } else {
      nav.setAttribute('aria-expanded', 'true');
      hamburgerButton.setAttribute('aria-label', 'Close navigation');
      document.body.style.overflowY = 'hidden';
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    if (!isDesktop.matches && nav.getAttribute('aria-expanded') === 'true') {
      if (nav.classList.contains('nav-drawer-sub-open')) {
        closeAllPanels(nav);
      } else {
        closeDrawer();
      }
    } else if (isDesktop.matches) {
      closeAllPanels(nav);
    }
  });

  document.addEventListener('click', (e) => {
    if (isDesktop.matches && !nav.contains(e.target)) {
      closeAllPanels(nav);
    }
  });

  isDesktop.addEventListener('change', () => {
    closeDrawer();
    closeAllPanels(nav);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  initScrollHide(navWrapper);
  */
}
