// public/js/pages/landingPage.js
import { renderLandingHero } from '../components/landingHero.js';
import { createEventCard } from '../components/eventCard.js';
import { openEventDetailModal } from '../components/eventDetailModal.js';
import { api, showToast } from '../api.js';

export async function renderLandingPage(container) {
  container.innerHTML = `
    <div id="landing-hero-container"></div>

    <!-- Featured Events Showcase Section -->
    <section class="container" style="padding: 60px 20px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #ec4899;"></span>
            <span style="font-size: 0.8rem; font-weight: 700; color: #f472b6; text-transform: uppercase; letter-spacing: 0.08em;">Curated Highlights</span>
          </div>
          <h2 style="font-size: 2.2rem; font-weight: 800; color: #fff;">Featured Campus Events</h2>
        </div>
        <a href="#events" class="btn-secondary" style="font-size: 0.9rem;">
          View All Campus Events &rarr;
        </a>
      </div>

      <div id="landing-featured-grid" class="grid-events">
        <div style="padding: 40px; text-align: center; color: #94a3b8; grid-column: 1 / -1;">Loading approved events...</div>
      </div>
    </section>

    <!-- Campus Categories Explorer -->
    <section style="background: rgba(14, 18, 42, 0.4); border-top: 1px solid rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06); padding: 60px 20px;">
      <div class="container">
        <div style="text-align: center; max-width: 650px; margin: 0 auto 40px;">
          <h2 style="font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 10px;">Explore by Category</h2>
          <p style="color: #94a3b8; font-size: 1rem;">Discover events matched to your personal passions, academic track, and social life</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px;">
          ${[
            { name: 'Hackathons', icon: '💻', count: 'Competitive sprints', color: 'rgba(56, 189, 248, 0.15)', border: '#38bdf8' },
            { name: 'Technical', icon: '⚡', count: 'Robotics & Dev', color: 'rgba(59, 130, 246, 0.15)', border: '#60a5fa' },
            { name: 'Cultural', icon: '🎨', count: 'Music, Drama, Fests', color: 'rgba(236, 72, 153, 0.15)', border: '#f472b6' },
            { name: 'Workshops', icon: '🛠️', count: 'Hands-on learning', color: 'rgba(139, 92, 246, 0.15)', border: '#a78bfa' },
            { name: 'Sports', icon: '⚽', count: 'Varsity & Rec', color: 'rgba(16, 185, 129, 0.15)', border: '#34d399' },
            { name: 'Seminars', icon: '🎤', count: 'Guest Keynotes', color: 'rgba(245, 158, 11, 0.15)', border: '#fbbf24' }
          ].map(cat => `
            <a href="#events?category=${cat.name}" class="glass-card" style="padding: 24px 16px; text-align: center; text-decoration: none; border-color: ${cat.border}40;">
              <div style="font-size: 2.2rem; margin-bottom: 10px;">${cat.icon}</div>
              <div style="font-weight: 700; font-size: 1.05rem; color: #fff; margin-bottom: 4px;">${cat.name}</div>
              <div style="font-size: 0.75rem; color: #94a3b8;">${cat.count}</div>
            </a>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Why Campus Event Hub Platform Value -->
    <section class="container" style="padding: 80px 20px;">
      <div style="text-align: center; max-width: 650px; margin: 0 auto 50px;">
        <h2 style="font-size: 2.2rem; font-weight: 800; color: #fff; margin-bottom: 12px;">The Complete Campus Ecosystem</h2>
        <p style="color: #94a3b8; font-size: 1.05rem;">Engineered for university students, club organizers, and deans of student affairs</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
        <div class="glass-card" style="padding: 30px;">
          <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(139,92,246,0.2); border: 1px solid rgba(139,92,246,0.4); display: flex; align-items: center; justify-content: center; color: #a78bfa; margin-bottom: 20px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: #fff; margin-bottom: 10px;">One Centralized Feed</h3>
          <p style="color: #94a3b8; font-size: 0.92rem; line-height: 1.6;">No more scattered WhatsApp forwards, lost poster flyers, or Instagram stories. All authorized university activities in one unified place.</p>
        </div>

        <div class="glass-card" style="padding: 30px;">
          <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(56,189,248,0.2); border: 1px solid rgba(56,189,248,0.4); display: flex; align-items: center; justify-content: center; color: #38bdf8; margin-bottom: 20px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: #fff; margin-bottom: 10px;">Instant RSVPs & Reminders</h3>
          <p style="color: #94a3b8; font-size: 0.92rem; line-height: 1.6;">One-click RSVP with duplicate prevention. Automated 24h & 1h email and in-app reminders so you never miss an event.</p>
        </div>

        <div class="glass-card" style="padding: 30px;">
          <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(16,185,129,0.2); border: 1px solid rgba(16,185,129,0.4); display: flex; align-items: center; justify-content: center; color: #34d399; margin-bottom: 20px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: #fff; margin-bottom: 10px;">Dean & Admin Accreditation</h3>
          <p style="color: #94a3b8; font-size: 0.92rem; line-height: 1.6;">Every event undergoes institutional verification. Only accredited, safe, and scheduled events are published to the student body.</p>
        </div>
      </div>
    </section>

    <!-- Hackathon Call To Action Banner -->
    <section class="container" style="padding-bottom: 80px;">
      <div class="glass-panel" style="padding: 48px; border-radius: 24px; text-align: center; position: relative; overflow: hidden; background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.15)); border: 1px solid rgba(139,92,246,0.3);">
        <h2 style="font-size: 2.4rem; font-weight: 900; color: #fff; margin-bottom: 14px;">Ready to Experience Campus Life?</h2>
        <p style="font-size: 1.15rem; color: #cbd5e1; max-width: 600px; margin: 0 auto 30px;">Join thousands of students and club organizers connecting through Campus Event Hub.</p>
        <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
          <a href="#login" class="btn-primary" style="padding: 12px 30px; font-size: 1rem;">Sign In / Register Now</a>
          <a href="#events" class="btn-secondary" style="padding: 12px 28px; font-size: 1rem;">Explore Public Feed</a>
        </div>
      </div>
    </section>
  `;

  // Render hero video component
  const heroContainer = container.querySelector('#landing-hero-container');
  renderLandingHero(heroContainer);

  // Load featured events
  try {
    const res = await api.getEvents({ limit: 6 });
    const grid = container.querySelector('#landing-featured-grid');
    grid.innerHTML = '';

    if (!res.events || res.events.length === 0) {
      grid.innerHTML = '<div style="padding: 30px; text-align: center; color: #94a3b8; grid-column: 1 / -1;">No approved events found.</div>';
      return;
    }

    // Display first 6 events
    for (const evt of res.events.slice(0, 6)) {
      const card = createEventCard(
        evt,
        (selected) => openEventDetailModal(selected, () => renderLandingPage(container)),
        async (selected) => {
          if (!api.currentUser) {
            showToast('Please log in to RSVP for events', 'info');
            window.location.hash = '#login';
            return;
          }
          try {
            const rsvpRes = await api.toggleRsvp(selected.id);
            showToast(rsvpRes.message, rsvpRes.status === 'confirmed' ? 'success' : 'info');
            renderLandingPage(container);
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      );
      grid.appendChild(card);
    }
  } catch (err) {
    console.error('Error fetching landing events:', err);
  }
}
