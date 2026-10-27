// public/js/components/dashboardHero.js
import { videoEngine } from './videoEngine.js';

export function renderDashboardHero(container, user) {
  const firstName = user ? user.full_name.split(' ')[0] : 'Student';

  container.innerHTML = `
    <div class="dashboard-welcome-hero">
      <!-- Fallback Cinematic Canvas -->
      <canvas id="dash-hero-canvas" class="hero-canvas-fallback"></canvas>

      <!-- Post-login montage video (distinct from landing video) -->
      <video
        id="dash-hero-video"
        class="dashboard-video-bg"
        autoplay
        loop
        muted
        playsinline
        poster="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=80"
      >
        <source src="https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screentime-4309-large.mp4" type="video/mp4">
        <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4" type="video/mp4">
      </video>

      <!-- Gradient Overlay -->
      <div class="dashboard-hero-overlay"></div>

      <!-- Content -->
      <div class="dashboard-hero-content">
        <div style="display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 9999px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); margin-bottom: 14px;">
          <span style="font-size: 0.75rem; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.05em;">
            Student Life &bull; Fall Semester 2026
          </span>
        </div>

        <h2 style="font-size: 2.2rem; font-weight: 800; line-height: 1.2; margin-bottom: 8px; color: #fff;">
          Welcome to Your <span class="gradient-text">Campus Event Hub!</span>
        </h2>

        <p style="font-size: 1.1rem; color: #cbd5e1; margin-bottom: 22px;">
          Great to have you here, <span style="font-weight: 700; color: #fff;">${user ? user.full_name : 'Explorer'}</span>. Discover trending tech hackathons, music showcases, and campus athletic tournaments curated for your department.
        </p>

        <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
          <a href="#events" class="btn-primary" id="btn-discover-events" style="padding: 10px 24px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Discover Events
          </a>

          ${user && user.role === 'student' ? `
            <a href="#my-events" class="btn-secondary" style="padding: 10px 20px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              My Joined Events
            </a>
          ` : ''}
        </div>
      </div>

      <!-- Sound Toggle -->
      <div style="position: absolute; bottom: 18px; right: 20px; z-index: 10;">
        <button id="dash-sound-btn" class="sound-toggle-btn" title="Toggle Sound">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
          </svg>
          <span>Sound Off</span>
        </button>
      </div>
    </div>
  `;

  setTimeout(() => {
    videoEngine.initDashboardHero({
      videoElementId: 'dash-hero-video',
      canvasElementId: 'dash-hero-canvas',
      soundButtonId: 'dash-sound-btn'
    });
  }, 50);
}
