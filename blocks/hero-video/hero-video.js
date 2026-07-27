/**
 * Hero Video block
 * Row 1: a link whose href is a background video URL (autoplaying, muted, looped)
 * Row 2: title (h1) + CTA button
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const mediaRow = rows[0];
  const contentRow = rows[1];

  // Build the background video from the row-1 link (or picture fallback)
  const mediaLink = mediaRow?.querySelector('a');
  const picture = mediaRow?.querySelector('picture');

  if (mediaLink && !picture) {
    const src = mediaLink.getAttribute('href');
    const video = document.createElement('video');
    video.className = 'hero-video-bg';
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('aria-hidden', 'true');
    video.setAttribute('tabindex', '-1');
    // Keep the heavy video out of the LCP critical path: don't preload or
    // autoplay via markup. The dark block background paints immediately, so
    // LCP falls to text; the video is attached + played after first paint.
    video.preload = 'none';

    mediaRow.textContent = '';
    mediaRow.classList.add('hero-video-media');
    mediaRow.append(video);

    // Autoplay once the video can play (only fires after we load it below).
    video.addEventListener('canplay', () => {
      const p = video.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    });

    // Defer loading the video source until the page is idle / painted so it
    // never competes with LCP. Falls back to a short timeout.
    const startVideo = () => {
      if (video.querySelector('source')) return;
      const source = document.createElement('source');
      source.src = src;
      source.type = 'video/mp4';
      video.append(source);
      video.preload = 'auto';
      video.autoplay = true;
      video.load();
    };
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(startVideo, { timeout: 3000 });
    } else {
      window.addEventListener('load', () => setTimeout(startVideo, 200), { once: true });
    }

    // Mute/unmute toggle — the video must start muted for autoplay, but the
    // source lets users click to hear the teaser audio. Mirror that here.
    const muteToggle = document.createElement('button');
    muteToggle.type = 'button';
    muteToggle.className = 'hero-video-mute is-muted';
    muteToggle.setAttribute('aria-label', 'Unmute video');
    muteToggle.setAttribute('aria-pressed', 'true');
    muteToggle.addEventListener('click', () => {
      // If the user interacts before the deferred load ran, load it now.
      startVideo();
      video.muted = !video.muted;
      const { muted } = video;
      muteToggle.classList.toggle('is-muted', muted);
      muteToggle.setAttribute('aria-pressed', String(muted));
      muteToggle.setAttribute('aria-label', muted ? 'Unmute video' : 'Mute video');
      // Unmuting is a user gesture, so it's safe to (re)play with sound.
      if (!muted) {
        const p = video.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      }
    });
    mediaRow.append(muteToggle);
  } else if (!picture) {
    block.classList.add('no-image');
  }

  if (contentRow) {
    contentRow.classList.add('hero-video-content');
    // The CTA is a plain <a> (no strong/em), so decorateButtons never adds
    // .button — tag it here so the CSS has a stable hook.
    const cta = contentRow.querySelector('p a');
    if (cta) {
      cta.classList.add('hero-video-cta');
      const p = cta.closest('p');
      if (p) p.classList.add('hero-video-cta-wrapper');
    }
  }
}
