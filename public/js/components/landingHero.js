// public/js/components/landingHero.js
import { videoEngine } from './videoEngine.js';

export function renderLandingHero(container) {
  // Respect reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  container.innerHTML = `
    <div class="hero-video-wrapper">
      <!-- Fallback Cinematic Canvas -->
      <canvas id="landing-hero-canvas" class="hero-canvas-fallback"></canvas>

      <!-- Video Element -->
      <video
        id="landing-hero-video"
        class="hero-video-bg"
        autoplay
        loop
        muted
        playsinline
        poster="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&auto=format&fit=crop&q=80"
        ${prefersReducedMotion ? 'style="display:none;"' : ''}
      >
        <source src="https://assets.mixkit.co/videos/preview/mixkit-university-students-in-a-hall-4474-large.mp4" type="video/mp4">
        <source src="https://assets.mixkit.co/videos/preview/mixkit-group-of-college-students-studying-in-a-hallway-4475-large.mp4" type="video/mp4">
      </video>

      <!-- Dark Cinematic Overlay -->
      <div class="hero-overlay"></div>

      <!-- Main Hero Content -->
      <div class="hero-content">
        <div style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 9999px; background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.35); margin-bottom: 24px; animation: pulseGlow 3s infinite;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: #22d3ee; box-shadow: 0 0 10px #22d3ee;"></span>
          <span style="font-size: 0.8rem; font-weight: 700; color: #cbd5e1; letter-spacing: 0.05em; text-transform: uppercase;">
            GRAPHITE 26 &bull; Central Campus Platform
          </span>
        </div>

        <h1 style="font-size: 3.5rem; font-weight: 900; line-height: 1.15; margin-bottom: 20px; letter-spacing: -0.03em;">
          Your Campus. <br />
          <span class="gradient-text">Your Events.</span> <br />
          Your Community.
        </h1>

        <p style="font-size: 1.25rem; color: #94a3b8; max-width: 650px; margin: 0 auto 36px; line-height: 1.6;">
          Discover what's happening around you. Never miss a campus moment. From flagship hackathons to cultural festivals, workshops, and sports showdowns.
        </p>

        <!-- Two Prominent Action Buttons -->
        <div style="display: flex; align-items: center; justify-content: center; gap: 18px; flex-wrap: wrap;">
          <a href="#events" class="btn-cyan" style="padding: 14px 32px; font-size: 1.05rem;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Explore Events
          </a>

          <a href="#login" class="btn-primary" style="padding: 14px 32px; font-size: 1.05rem;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            Get Started
          </a>
        </div>

        <!-- Campus Stats Bar -->
        <div style="display: flex; align-items: center; justify-content: center; gap: 40px; margin-top: 50px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap;">
          <div>
            <div style="font-size: 1.75rem; font-weight: 800; color: #fff;">2,500+</div>
            <div style="font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Active Students</div>
          </div>
          <div style="width: 1px; height: 35px; background: rgba(255,255,255,0.1);"></div>
          <div>
            <div style="font-size: 1.75rem; font-weight: 800; color: #38bdf8;">100%</div>
            <div style="font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Verified Events</div>
          </div>
          <div style="width: 1px; height: 35px; background: rgba(255,255,255,0.1);"></div>
          <div>
            <div style="font-size: 1.75rem; font-weight: 800; color: #a78bfa;">45+</div>
            <div style="font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Clubs & Societies</div>
          </div>
        </div>
      </div>

      <!-- Mute/Unmute Video Sound Control -->
      <div class="hero-video-controls">
        <button id="landing-sound-btn" class="sound-toggle-btn" title="Toggle Sound">
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

  // Start video engine
  setTimeout(() => {
    videoEngine.initLandingHero({
      videoElementId: 'landing-hero-video',
      canvasElementId: 'landing-hero-canvas',
      soundButtonId: 'landing-sound-btn'
    });
  }, 50);
}
