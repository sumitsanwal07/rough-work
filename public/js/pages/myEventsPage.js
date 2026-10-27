// public/js/pages/myEventsPage.js
import { api, showToast } from '../api.js';
import { openEventDetailModal } from '../components/eventDetailModal.js';

export async function renderMyEventsPage(container) {
  const user = api.currentUser;
  if (!user) {
    showToast('Please sign in to view your registered events', 'info');
    window.location.hash = '#login';
    return;
  }

  container.innerHTML = `
    <div class="container" style="padding: 40px 20px 80px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span class="badge badge-Technical">Attendee Portal</span>
            <span style="font-size: 0.8rem; color: #38bdf8;">${user.full_name}</span>
          </div>
          <h1 style="font-size: 2.2rem; font-weight: 800; color: #fff;">My Campus Event Passes</h1>
          <p style="font-size: 0.92rem; color: #94a3b8;">Manage your registered activities, access ticket passes, or cancel bookings</p>
        </div>

        <a href="#events" class="btn-primary" style="padding: 10px 20px; font-size: 0.88rem;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Discover More Events
        </a>
      </div>

      <!-- Filter tabs: Upcoming vs Past vs Cancelled -->
      <div style="display: flex; gap: 10px; margin-bottom: 28px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px;">
        <button id="my-tab-upcoming" class="btn-primary" style="padding: 8px 18px; font-size: 0.85rem; border-radius: 8px;">
          Upcoming Events (<span id="count-upcoming">0</span>)
        </button>
        <button id="my-tab-past" class="btn-secondary" style="padding: 8px 18px; font-size: 0.85rem; border-radius: 8px; background: transparent; border: none;">
          Past Events (<span id="count-past">0</span>)
        </button>
        <button id="my-tab-all" class="btn-secondary" style="padding: 8px 18px; font-size: 0.85rem; border-radius: 8px; background: transparent; border: none;">
          Full History
        </button>
      </div>

      <!-- Passes List Container -->
      <div id="my-passes-container" style="display: flex; flex-direction: column; gap: 20px;">
        <div style="padding: 40px; text-align: center; color: #94a3b8;">Loading your events...</div>
      </div>
    </div>
  `;

  let activeFilter = 'upcoming'; // 'upcoming' | 'past' | 'all'
  let cachedRsvps = [];

  const passesContainer = container.querySelector('#my-passes-container');

  function renderList() {
    passesContainer.innerHTML = '';

    const todayStr = new Date().toISOString().split('T')[0];
    let filtered = [];

    if (activeFilter === 'upcoming') {
      filtered = cachedRsvps.filter(r => r.rsvp_status === 'confirmed' && r.event_date >= todayStr);
    } else if (activeFilter === 'past') {
      filtered = cachedRsvps.filter(r => r.event_date < todayStr);
    } else {
      filtered = cachedRsvps;
    }

    if (filtered.length === 0) {
      passesContainer.innerHTML = `
        <div class="glass-card" style="padding: 50px 20px; text-align: center; color: #94a3b8;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5" style="margin: 0 auto 12px; display: block;">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          </svg>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: #fff; margin-bottom: 6px;">No ${activeFilter} events registered</h3>
          <p style="font-size: 0.9rem; margin-bottom: 18px;">Check out what's coming up this week across engineering, arts, and athletics.</p>
          <a href="#events" class="btn-primary" style="padding: 9px 24px; font-size: 0.85rem;">Browse Campus Events</a>
        </div>
      `;
      return;
    }

    for (const item of filtered) {
      const card = document.createElement('div');
      card.className = 'glass-card';
      card.style.padding = '24px';
      card.style.display = 'flex';
      card.style.justifyContent = 'space-between';
      card.style.alignItems = 'center';
      card.style.flexWrap = 'wrap';
      card.style.gap = '20px';

      let dateFormatted = item.event_date;
      try {
        const d = new Date(item.event_date + 'T00:00:00');
        dateFormatted = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      } catch (e) {}

      const isCancelled = item.rsvp_status === 'cancelled';

      card.innerHTML = `
        <!-- Left: Image and details -->
        <div style="display: flex; gap: 20px; align-items: center; max-width: 680px;">
          <img src="${item.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200'}" alt="${item.title}" style="width: 100px; height: 100px; border-radius: 14px; object-fit: cover; border: 1px solid rgba(255,255,255,0.1);" />
          <div>
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
              <span class="badge badge-${item.category}">${item.category}</span>
              <span class="status-badge ${isCancelled ? 'status-cancelled' : 'status-approved'}">
                ${isCancelled ? 'RSVP Cancelled' : 'Pass Confirmed'}
              </span>
            </div>
            <h3 style="font-size: 1.3rem; font-weight: 700; color: #fff; margin-bottom: 6px;">${item.title}</h3>
            <div style="display: flex; gap: 16px; font-size: 0.85rem; color: #94a3b8; flex-wrap: wrap;">
              <span>📅 ${dateFormatted}</span>
              <span>⏰ ${item.start_time} - ${item.end_time}</span>
              <span>📍 ${item.venue}</span>
            </div>
          </div>
        </div>

        <!-- Right: Actions & QR Pass -->
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <a
            href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(item.title)}&dates=${item.event_date.replace(/-/g, '')}T${item.start_time.replace(/:/g, '')}00Z/${item.event_date.replace(/-/g, '')}T${item.end_time.replace(/:/g, '')}00Z&details=${encodeURIComponent(item.description)}&location=${encodeURIComponent(item.venue)}"
            target="_blank"
            class="btn-secondary"
            style="padding: 8px 14px; font-size: 0.82rem;"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Calendar
          </a>

          <button class="btn-secondary btn-view-event" style="padding: 8px 16px; font-size: 0.82rem;">
            Details
          </button>

          ${!isCancelled ? `
            <button class="btn-danger btn-cancel-rsvp" style="padding: 8px 16px; font-size: 0.82rem;">
              Cancel RSVP
            </button>
          ` : `
            <button class="btn-primary btn-rejoin-rsvp" style="padding: 8px 16px; font-size: 0.82rem;">
              Re-RSVP
            </button>
          `}
        </div>
      `;

      card.querySelector('.btn-view-event').addEventListener('click', () => {
        openEventDetailModal({ ...item, userRsvp: item.rsvp_status }, loadMyEventsData);
      });

      const cancelBtn = card.querySelector('.btn-cancel-rsvp');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', async () => {
          try {
            const res = await api.toggleRsvp(item.id);
            showToast(res.message, 'info');
            loadMyEventsData();
          } catch (err) { showToast(err.message, 'error'); }
        });
      }

      const rejoinBtn = card.querySelector('.btn-rejoin-rsvp');
      if (rejoinBtn) {
        rejoinBtn.addEventListener('click', async () => {
          try {
            const res = await api.toggleRsvp(item.id);
            showToast(res.message, 'success');
            loadMyEventsData();
          } catch (err) { showToast(err.message, 'error'); }
        });
      }

      passesContainer.appendChild(card);
    }
  }

  // Filter tabs click
  const tabUpcoming = container.querySelector('#my-tab-upcoming');
  const tabPast = container.querySelector('#my-tab-past');
  const tabAll = container.querySelector('#my-tab-all');

  function updateTabs(activeBtn, filter) {
    [tabUpcoming, tabPast, tabAll].forEach(t => {
      t.className = 'btn-secondary';
      t.style.background = 'transparent';
      t.style.border = 'none';
    });
    activeBtn.className = 'btn-primary';
    activeBtn.style.background = '';
    activeFilter = filter;
    renderList();
  }

  tabUpcoming.addEventListener('click', () => updateTabs(tabUpcoming, 'upcoming'));
  tabPast.addEventListener('click', () => updateTabs(tabPast, 'past'));
  tabAll.addEventListener('click', () => updateTabs(tabAll, 'all'));

  async function loadMyEventsData() {
    try {
      const res = await api.getMyRsvps('all');
      cachedRsvps = res.rsvps || [];

      const todayStr = new Date().toISOString().split('T')[0];
      const upcomingCount = cachedRsvps.filter(r => r.rsvp_status === 'confirmed' && r.event_date >= todayStr).length;
      const pastCount = cachedRsvps.filter(r => r.event_date < todayStr).length;

      container.querySelector('#count-upcoming').textContent = upcomingCount;
      container.querySelector('#count-past').textContent = pastCount;

      renderList();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  loadMyEventsData();
}
