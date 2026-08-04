const SVG_NS = 'http://www.w3.org/2000/svg';

function normalizeText(value) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function firstImageSrc(cell) {
  return cell?.querySelector('picture img, img')?.src || '';
}

function firstLink(cell) {
  return cell?.querySelector('a[href]') || null;
}

function cellHref(cell) {
  return firstLink(cell)?.href || normalizeText(cell?.textContent);
}

function createIcon(viewBox, pathAttrs, className) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', className);

  const path = document.createElementNS(SVG_NS, 'path');
  Object.entries(pathAttrs).forEach(([name, value]) => path.setAttribute(name, value));
  svg.appendChild(path);
  return svg;
}

function createNavArrowIcon(direction = 'right') {
  return createIcon('0 0 23 17', {
    d: 'M.75 8.5h21.5m0 0L14.75 1m7.5 7.5-7.5 7.5',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.5',
  }, `product-showcase-arrow product-showcase-arrow-${direction}`);
}

function createDiagonalArrowIcon() {
  return createIcon('0 0 13 13', {
    'fill-rule': 'evenodd',
    fill: 'currentColor',
    d: 'M1.538 1.019c-.292.008-.671.016-.842.018l-.312.003.012.276c.014.339.06.5.154.545.118.055.326.067 1.476.081 2.054.025 8.003-.1 8.569-.18l.098-.014-1.829 1.84-5.177 5.204-3.348 3.365.345.346c.19.19.351.343.358.34a878 878 0 0 0 3.326-3.288c3.797-3.763 6.413-6.347 6.687-6.606.107-.101.2-.172.214-.164.017.011.022 1.346.016 4.916-.007 4.635-.005 4.903.03 4.958.047.07.124.093.443.127.292.031.355.014.404-.108.071-.177.124-.987.189-2.874.046-1.353.087-8.175.051-8.399-.012-.069-.027-.084-.125-.129a1 1 0 0 1-.227-.16l-.116-.108-4.933-.002c-2.712-.001-5.171.005-5.463.013',
  }, 'product-showcase-arrow product-showcase-arrow-diagonal');
}

function createDownloadIcon() {
  return createIcon('0 0 18 19', {
    fill: 'currentColor',
    d: 'M18 11.5v6a.75.75 0 0 1-.75.75H.75A.75.75 0 0 1 0 17.5v-6a.75.75 0 1 1 1.5 0v5.25h15V11.5a.75.75 0 1 1 1.5 0m-9.53.53a.75.75 0 0 0 1.06 0l3.75-3.75a.75.75 0 1 0-1.06-1.06L9.75 9.69V1a.75.75 0 0 0-1.5 0v8.69L5.78 7.22a.75.75 0 0 0-1.06 1.06z',
  }, 'product-showcase-arrow product-showcase-arrow-download');
}

function createThemeIcon(theme) {
  const icon = document.createElement('img');
  icon.src = `/icons/${theme}-toggle-icon.svg`;
  icon.alt = '';
  icon.setAttribute('aria-hidden', 'true');
  icon.className = `product-showcase-theme-icon product-showcase-theme-icon-${theme}`;
  return icon;
}

function parseBoolean(value) {
  return /^true$/i.test(normalizeText(value));
}

function parseDelay(value) {
  const delay = Number.parseInt(value, 10);
  return Number.isFinite(delay) ? delay : 4000;
}

function readConfigRow(row) {
  const label = normalizeText(row.children[0]?.textContent).toLowerCase();
  const valueCell = row.children[1];
  const valueText = normalizeText(valueCell?.textContent);

  return { label, valueCell, valueText };
}

function createImage(src, alt, className) {
  if (!src) return null;
  const image = document.createElement('img');
  image.src = src;
  image.alt = alt || '';
  image.loading = 'eager';
  image.decoding = 'async';
  image.className = className;
  return image;
}

export default function decorate(block) {
  const rows = Array.from(block.children).filter((row) => row.children.length);
  if (!rows.length) return;

  const configRows = rows.slice(0, 5);
  const headerRow = rows[5];
  const productRows = rows.slice(6);

  const config = {
    dayBackground: '',
    nightBackground: '',
    autoplay: false,
    delay: 4000,
    defaultTheme: 'day',
  };

  configRows.forEach((row) => {
    const { label, valueCell, valueText } = readConfigRow(row);
    if (label.includes('day background')) config.dayBackground = firstImageSrc(valueCell);
    if (label.includes('night background')) config.nightBackground = firstImageSrc(valueCell);
    if (label === 'autoplay') config.autoplay = parseBoolean(valueText);
    if (label === 'delay') config.delay = parseDelay(valueText);
    if (label.includes('default theme')) config.defaultTheme = /night/i.test(valueText) ? 'night' : 'day';
  });

  const headers = headerRow
    ? Array.from(headerRow.children).map((cell) => normalizeText(cell.textContent).toLowerCase())
    : [];
  const indexOf = (keywords) => headers.findIndex(
    (header) => keywords.some((keyword) => header.includes(keyword)),
  );

  const col = {
    productId: indexOf(['product id']),
    name: indexOf(['name']),
    description: indexOf(['description', 'desc']),
    dayImage: indexOf(['day image']),
    nightImage: indexOf(['night image']),
    exploreLabel: indexOf(['explore label']),
    exploreLink: indexOf(['explore link']),
    brochure: indexOf(['brochure']),
  };

  const products = productRows.map((row) => {
    const cells = Array.from(row.children);
    const productId = normalizeText(cells[col.productId]?.textContent);
    const name = normalizeText(cells[col.name]?.textContent);
    const description = normalizeText(cells[col.description]?.textContent);
    const dayImage = firstImageSrc(cells[col.dayImage]);
    const nightImage = firstImageSrc(cells[col.nightImage]);
    const exploreLabel = normalizeText(cells[col.exploreLabel]?.textContent) || 'Explore now';
    const exploreLink = cellHref(cells[col.exploreLink]) || firstLink(cells[col.exploreLabel])?.href || '';
    const brochureAnchor = firstLink(cells[col.brochure]);
    const brochureLabel = normalizeText(brochureAnchor?.textContent) || 'Download brochure';
    const brochureLink = cellHref(cells[col.brochure]);

    return {
      productId,
      name,
      description,
      dayImage,
      nightImage,
      exploreLabel,
      exploreLink,
      brochureLabel,
      brochureLink,
    };
  }).filter((product) => product.name || product.productId);

  if (!products.length) return;

  const root = document.createElement('section');
  root.className = 'product-showcase-root';
  root.dataset.theme = config.defaultTheme;

  const background = document.createElement('div');
  background.className = 'product-showcase-background';

  const dayLayer = document.createElement('div');
  dayLayer.className = 'product-showcase-background-layer product-showcase-background-day';
  const dayImage = createImage(config.dayBackground, 'Day background', 'product-showcase-background-image');
  if (dayImage) dayLayer.appendChild(dayImage);

  const nightLayer = document.createElement('div');
  nightLayer.className = 'product-showcase-background-layer product-showcase-background-night';
  const nightImage = createImage(config.nightBackground, 'Night background', 'product-showcase-background-image');
  if (nightImage) nightLayer.appendChild(nightImage);

  background.append(dayLayer, nightLayer);

  const main = document.createElement('div');
  main.className = 'product-showcase-main';

  const viewport = document.createElement('div');
  viewport.className = 'product-showcase-viewport';

  const track = document.createElement('div');
  track.className = 'product-showcase-track';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'product-showcase-arrow-button product-showcase-arrow-button-prev';
  prev.setAttribute('aria-label', 'Previous product');
  prev.appendChild(createNavArrowIcon('left'));

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'product-showcase-arrow-button product-showcase-arrow-button-next';
  next.setAttribute('aria-label', 'Next product');
  next.appendChild(createNavArrowIcon('right'));

  const pagination = document.createElement('div');
  pagination.className = 'product-showcase-pagination';

  const themeToggle = document.createElement('button');
  themeToggle.type = 'button';
  themeToggle.className = 'product-showcase-theme-toggle';
  themeToggle.appendChild(createThemeIcon('day'));
  themeToggle.appendChild(createThemeIcon('night'));

  const slidesMeta = [];

  products.forEach((product, index) => {
    const slide = document.createElement('div');
    slide.className = 'product-showcase-slide';
    slide.dataset.index = String(index);

    const dayCar = createImage(product.dayImage, product.name, 'product-showcase-slide-image product-showcase-slide-image-day');
    if (dayCar) slide.appendChild(dayCar);

    const nightCar = createImage(product.nightImage || product.dayImage, product.name, 'product-showcase-slide-image product-showcase-slide-image-night');
    if (nightCar) slide.appendChild(nightCar);

    track.appendChild(slide);

    const panel = document.createElement('article');
    panel.className = 'product-showcase-content-panel';
    panel.id = `product-showcase-panel-${index}`;
    panel.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');

    const title = document.createElement('h3');
    title.className = 'product-showcase-slide-title';
    title.textContent = product.name;
    panel.appendChild(title);

    if (product.description) {
      const description = document.createElement('p');
      description.className = 'product-showcase-slide-description';
      description.textContent = product.description;
      panel.appendChild(description);
    }

    const actions = document.createElement('div');
    actions.className = 'product-showcase-actions';

    if (product.exploreLink) {
      const explore = document.createElement('a');
      explore.href = product.exploreLink;
      explore.className = 'product-showcase-explore';
      const exploreLabel = document.createElement('span');
      exploreLabel.textContent = product.exploreLabel;
      explore.append(exploreLabel, createDiagonalArrowIcon());
      actions.appendChild(explore);
    }

    if (product.brochureLink) {
      const brochure = document.createElement('a');
      brochure.href = product.brochureLink;
      brochure.className = 'product-showcase-brochure';
      brochure.setAttribute('download', '');
      const brochureLabel = document.createElement('span');
      brochureLabel.textContent = product.brochureLabel;
      brochure.append(brochureLabel, createDownloadIcon());
      actions.appendChild(brochure);
    }

    panel.appendChild(actions);

    const bullet = document.createElement('button');
    bullet.type = 'button';
    bullet.className = 'product-showcase-pagination-bullet';
    bullet.setAttribute('aria-label', `Go to ${product.name}`);
    bullet.setAttribute('aria-controls', panel.id);
    bullet.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    pagination.appendChild(bullet);

    slidesMeta.push({ panel, bullet, product });
  });

  viewport.appendChild(track);
  main.append(viewport, prev, next, pagination, themeToggle);
  main.append(...slidesMeta.map(({ panel }) => panel));

  root.append(background, main);
  block.replaceChildren(root);

  let activeIndex = 0;
  let timer = null;
  let paused = false;

  const setTheme = (theme) => {
    root.dataset.theme = theme;
    const isNight = theme === 'night';
    themeToggle.setAttribute('aria-label', isNight ? 'Switch to day theme' : 'Switch to night theme');
    themeToggle.title = isNight ? 'Change to Day Theme' : 'Change to Night Theme';
  };

  const updateSlide = (index) => {
    slidesMeta.forEach(({ panel, bullet }, slideIndex) => {
      const selected = slideIndex === index;
      panel.classList.toggle('is-active', selected);
      panel.setAttribute('aria-hidden', selected ? 'false' : 'true');
      bullet.classList.toggle('is-active', selected);
      bullet.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
    track.style.transform = `translateX(-${index * 100}%)`;
    activeIndex = index;
  };

  function stopAutoplay() {
    window.clearInterval(timer);
    timer = null;
  }

  function goToSlide(index) {
    const nextIndex = (index + slidesMeta.length) % slidesMeta.length;
    updateSlide(nextIndex);
  }

  function startAutoplay() {
    if (!config.autoplay || slidesMeta.length < 2 || paused) return;
    window.clearInterval(timer);
    timer = window.setInterval(() => goToSlide(activeIndex + 1), config.delay);
  }

  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  slidesMeta.forEach(({ bullet }, index) => {
    bullet.addEventListener('click', () => {
      goToSlide(index);
      restartAutoplay();
    });
  });

  prev.addEventListener('click', () => {
    goToSlide(activeIndex - 1);
    restartAutoplay();
  });

  next.addEventListener('click', () => {
    goToSlide(activeIndex + 1);
    restartAutoplay();
  });

  themeToggle.addEventListener('click', () => {
    setTheme(root.dataset.theme === 'night' ? 'day' : 'night');
  });

  root.addEventListener('mouseenter', () => {
    paused = true;
    stopAutoplay();
  });

  root.addEventListener('mouseleave', () => {
    paused = false;
    startAutoplay();
  });

  setTheme(config.defaultTheme);
  updateSlide(0);
  startAutoplay();
}
