// public/js/pages/studentDash.js
import { renderDashboardHero } from '../components/dashboardHero.js';
import { createEventCard } from '../components/eventCard.js';
import { openEventDetailModal } from '../components/eventDetailModal.js';
import { openProfileModal } from '../components/profileModal.js';
import { openReminderModal } from '../components/reminderModal.js';
import { api, showToast } from '../api.js';

export async function renderStudentDashboard(container) {
  const user = api.currentUser;
  if (!user) {
    window.location.hash = '#login';
    return;
  }

  container.innerHTML = `
    <div class="container" style="padding: 30px 20px 80px;">
      <!-- Section 4: Post-login Video Hero with personalized greeting -->
      <div id="student-hero-container"></div>

      <!-- Quick KPI & Profile Quick Bar -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; margin-bottom: 36px;">
        <div class="glass-card" style="padding: 20px; display: flex; align-items: center; gap: 14px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(56,189,248,0.15); border: 1px solid rgba(56,189,248,0.3); display: flex; align-items: center; justify-content: center; color: #38bdf8;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <div>
            <div style="font-size: 1.5rem; font-weight: 800; color: #fff;" id="kpi-my-rsvps">0</div>
            <div style="font-size: 0.78rem; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Events Joined</div>
          </div>
        </div>

        <div class="glass-card" style="padding: 20px; display: flex; align-items: center; gap: 14px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3); display: flex; align-items: center; justify-content: center; color: #a78bfa;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <div>
            <div style="font-size: 1.5rem; font-weight: 800; color: #fff;" id="kpi-upcoming-count">0</div>
            <div style="font-size: 0.78rem; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Upcoming On Campus</div>
          </div>
        </div>

        <div class="glass-card" style="padding: 20px; display: flex; align-items: center; gap: 14px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(236,72,153,0.15); border: 1px solid rgba(236,72,153,0.3); display: flex; align-items: center; justify-content: center; color: #f472b6;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </div>
          <div>
            <div style="font-size: 1.5rem; font-weight: 800; color: #fff;" id="kpi-unread-notifs">0</div>
            <div style="font-size: 0.78rem; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Unread Notices</div>
          </div>
        </div>

        <div class="glass-card" style="padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; border-color: rgba(139,92,246,0.3);">
          <div>
            <div style="font-size: 0.82rem; font-weight: 700; color: #fff;">${user.department || 'Computer Science'}</div>
            <div style="font-size: 0.75rem; color: #a78bfa;">${user.year_of_study || 'Student'} &bull; Verified</div>
          </div>
          <button id="btn-edit-student-profile" class="btn-secondary" style="padding: 6px 12px; font-size: 0.78rem;">
            Edit Profile
          </button>
        </div>
      </div>

      <!-- MY REGISTERED EVENTS (RSVPs) Section -->
      <section style="margin-bottom: 48px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 800; color: #fff;">My Upcoming Event Passes</h2>
            <p style="font-size: 0.85rem; color: #94a3b8;">Events you have confirmed attendance for</p>
          </div>
          <a href="#my-events" class="btn-secondary" style="font-size: 0.82rem; padding: 6px 14px;">
            Full RSVP History &rarr;
          </a>
        </div>

        <div id="student-my-rsvps-grid" class="grid-events">
          <div style="padding: 30px; text-align: center; color: #94a3b8; grid-column: 1 / -1;">Loading your passes...</div>
        </div>
      </section>

      <!-- RECOMMENDED & POPULAR CAMPUS EVENTS Section -->
      <section id="discover-feed-section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span class="badge badge-Technical" style="font-size: 0.7rem;">Live Campus Feed</span>
            </div>
            <h2 style="font-size: 1.6rem; font-weight: 800; color: #fff;">Discover Campus Happenings</h2>
          </div>

          <div style="display: flex; gap: 8px;">
            <button id="open-reminder-btn-dash" class="btn-secondary" style="font-size: 0.82rem; padding: 7px 14px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              Reminder Settings
            </button>
            <a href="#events" class="btn-primary" style="font-size: 0.82rem; padding: 7px 16px;">
              Full Calendar & Filters &rarr;
            </a>
          </div>
        </div>

        <div id="student-feed-grid" class="grid-events">
          <div style="padding: 30px; text-align: center; color: #94a3b8; grid-column: 1 / -1;">Loading events...</div>
        </div>
      </section>
    </div>
  `;

  // Render Post-Login Video Hero
  renderDashboardHero(container.querySelector('#student-hero-container'), user);

  // Edit profile button
  container.querySelector('#btn-edit-student-profile').addEventListener('click', () => {
    openProfileModal(() => renderStudentDashboard(container));
  });

  // Reminder settings button
  container.querySelector('#open-reminder-btn-dash').addEventListener('click', () => {
    openReminderModal();
  });

  // Smooth scroll to discover feed if "Discover Events" in hero is clicked
  const discoverBtn = container.querySelector('#btn-discover-events');
  if (discoverBtn) {
    discoverBtn.addEventListener('click', (e) => {
      e.preventDefault();
      container.querySelector('#discover-feed-section').scrollIntoView({ behavior: 'smooth' });
    });
  }

  async function loadDashboardData() {
    try {
      // 1. Fetch user RSVPs
      const rsvpData = await api.getMyRsvps('upcoming');
      const myRsvps = rsvpData.rsvps || [];
      container.querySelector('#kpi-my-rsvps').textContent = myRsvps.length;

      const rsvpGrid = container.querySelector('#student-my-rsvps-grid');
      rsvpGrid.innerHTML = '';

      if (myRsvps.length === 0) {
        rsvpGrid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: #94a3b8;" class="glass-card">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5" style="margin: 0 auto 10px; display: block;">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            </svg>
            <div style="font-weight: 700; color: #fff; margin-bottom: 4px;">No Upcoming Event RSVPs</div>
            <p style="font-size: 0.85rem; margin-bottom: 14px;">Browse the campus feed below and RSVP with 1 click!</p>
            <a href="#events" class="btn-primary" style="padding: 7px 18px; font-size: 0.82rem;">Explore Events</a>
          </div>
        `;
      } else {
        for (const evt of myRsvps) {
          const card = createEventCard(
            { ...evt, userRsvp: 'confirmed' },
            (selected) => openEventDetailModal(selected, loadDashboardData),
            async (selected) => {
              try {
                const res = await api.toggleRsvp(selected.id);
                showToast(res.message, 'info');
                loadDashboardData();
              } catch (err) { showToast(err.message, 'error'); }
            }
          );
          rsvpGrid.appendChild(card);
        }
      }

      // 2. Fetch approved feed events
      const allEventsData = await api.getEvents({ limit: 9 });
      const approvedEvents = allEventsData.events || [];
      container.querySelector('#kpi-upcoming-count').textContent = approvedEvents.length;

      const feedGrid = container.querySelector('#student-feed-grid');
      feedGrid.innerHTML = '';

      for (const evt of approvedEvents) {
        const isJoined = myRsvps.some(r => r.id === evt.id);
        const card = createEventCard(
          { ...evt, userRsvp: isJoined ? 'confirmed' : null },
          (selected) => openEventDetailModal(selected, loadDashboardData),
          async (selected) => {
            try {
              const res = await api.toggleRsvp(selected.id);
              showToast(res.message, res.status === 'confirmed' ? 'success' : 'info');
              loadDashboardData();
            } catch (err) { showToast(err.message, 'error'); }
          }
        );
        feedGrid.appendChild(card);
      }

      // 3. Unread notifications count
      const notifData = await api.getUnreadCount();
      container.querySelector('#kpi-unread-notifs').textContent = notifData.count;

    } catch (err) {
      console.error('Error loading student dashboard:', err);
    }
  }

  loadDashboardData();
}
