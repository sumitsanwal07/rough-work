// public/js/pages/notFoundPage.js

export function renderNotFoundPage(container) {
  container.innerHTML = `
    <div class="container" style="padding: 100px 20px; text-align: center; max-width: 600px;">
      <div style="font-size: 5rem; font-weight: 900; line-height: 1; margin-bottom: 14px;" class="gradient-text">
        404
      </div>
      <h2 style="font-size: 1.8rem; font-weight: 800; color: #fff; margin-bottom: 12px;">
        Campus Coordinates Not Found
      </h2>
      <p style="font-size: 1rem; color: #94a3b8; line-height: 1.6; margin-bottom: 30px;">
        The event or page you requested might have been relocated, rescheduled, or concluded. Return to the discovery feed to check out what's currently happening.
      </p>
      <div style="display: flex; justify-content: center; gap: 14px;">
        <a href="#" class="btn-primary" style="padding: 12px 28px;">
          Return to Home
        </a>
        <a href="#events" class="btn-secondary" style="padding: 12px 24px;">
          Explore Events
        </a>
      </div>
    </div>
  `;
}
