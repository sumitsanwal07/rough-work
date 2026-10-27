// public/js/pages/eventsPage.js
import { api, showToast } from '../api.js';
import { createEventCard } from '../components/eventCard.js';
import { openEventDetailModal } from '../components/eventDetailModal.js';
import { CalendarView } from '../components/calendarView.js';

export async function renderEventsPage(container) {
  // Parse query params (e.g. ?category=Cultural)
  const hash = window.location.hash;
  const queryStr = hash.includes('?') ? hash.split('?')[1] : '';
  const searchParams = new URLSearchParams(queryStr);
  const initialCategory = searchParams.get('category') || 'All';

  container.innerHTML = `
    <div class="container" style="padding: 40px 20px;">
      <!-- Page Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #22d3ee;"></span>
            <span style="font-size: 0.78rem; font-weight: 700; color: #22d3ee; text-transform: uppercase; letter-spacing: 0.08em;">Official Discovery Feed</span>
          </div>
          <h1 style="font-size: 2.4rem; font-weight: 800; color: #fff;">Explore Campus Events</h1>
        </div>

        <!-- View Mode Toggle: Grid vs Calendar -->
        <div style="display: flex; background: rgba(255,255,255,0.06); padding: 4px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
          <button id="view-grid-btn" class="btn-primary" style="padding: 8px 16px; font-size: 0.82rem; border-radius: 8px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            Grid View
          </button>
          <button id="view-calendar-btn" class="btn-secondary" style="padding: 8px 16px; font-size: 0.82rem; border-radius: 8px; border: none; background: transparent;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Calendar View
          </button>
        </div>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="glass-panel" style="padding: 20px; border-radius: 16px; margin-bottom: 32px;">
        <!-- Search bar -->
        <div style="position: relative; margin-bottom: 16px;">
          <input
            type="text"
            id="events-search-input"
            class="form-control"
            placeholder="Search by event title, speaker, department, or venue (e.g. Hackathon, Turing Lab, Amphitheatre)..."
            style="padding-left: 42px; font-size: 1rem; border-radius: 12px;"
          />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%);">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>

        <!-- Category Pills -->
        <div style="display: flex; align-items: center; gap: 8px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 14px;" id="category-pills-bar">
          ${['All', 'Technical', 'Cultural', 'Sports', 'Workshops', 'Seminars', 'Hackathons', 'Other'].map(cat => `
            <button class="category-filter-pill ${cat === initialCategory ? 'active' : ''}" data-category="${cat}" style="white-space: nowrap; padding: 6px 14px; border-radius: 9999px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: var(--transition-smooth); background: ${cat === initialCategory ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)'}; color: ${cat === initialCategory ? '#a78bfa' : '#cbd5e1'}; border: 1px solid ${cat === initialCategory ? '#8b5cf6' : 'rgba(255,255,255,0.08)'};">
              ${cat}
            </button>
          `).join('')}
        </div>

        <!-- Date Timing Filters -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; pt: 8px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px;">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span style="font-size: 0.8rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Timing:</span>
            ${[
              { label: 'Upcoming', val: 'upcoming' },
              { label: 'Today', val: 'today' },
              { label: 'This Week', val: 'this_week' },
              { label: 'This Month', val: 'this_month' },
              { label: 'All Dates', val: '' }
            ].map(df => `
              <button class="date-filter-pill ${df.val === 'upcoming' ? 'active' : ''}" data-date="${df.val}" style="padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: var(--transition-smooth); background: ${df.val === 'upcoming' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)'}; color: ${df.val === 'upcoming' ? '#38bdf8' : '#94a3b8'}; border: 1px solid ${df.val === 'upcoming' ? '#38bdf8' : 'transparent'};">
                ${df.label}
              </button>
            `).join('')}
          </div>

          <div id="events-count-display" style="font-size: 0.85rem; color: #94a3b8;">Loading events...</div>
        </div>
      </div>

      <!-- Main Event View Container: Grid or Calendar -->
      <div id="events-grid-view" class="grid-events"></div>
      <div id="events-calendar-view" style="display: none;"></div>
    </div>
  `;

  let currentCategory = initialCategory;
  let currentDateFilter = 'upcoming';
  let currentSearch = '';
  let activeView = 'grid'; // 'grid' | 'calendar'
  let cachedEvents = [];

  const gridView = container.querySelector('#events-grid-view');
  const calViewWrap = container.querySelector('#events-calendar-view');
  const countDisplay = container.querySelector('#events-count-display');
  const searchInput = container.querySelector('#events-search-input');

  const calendarComponent = new CalendarView(calViewWrap, [], (selected) => {
    openEventDetailModal(selected, fetchAndRender);
  });

  async function fetchAndRender() {
    try {
      countDisplay.textContent = 'Refreshing...';
      const res = await api.getEvents({
        search: currentSearch,
        category: currentCategory,
        dateFilter: currentDateFilter
      });

      cachedEvents = res.events || [];
      countDisplay.textContent = `Showing ${cachedEvents.length} verified events`;

      // Render Grid
      gridView.innerHTML = '';
      if (cachedEvents.length === 0) {
        gridView.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 60px 20px; text-align: center; color: #94a3b8;" class="glass-card">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5" style="margin: 0 auto 14px; display: block;">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: #fff; margin-bottom: 6px;">No events matched your filters</h3>
            <p style="font-size: 0.9rem;">Try searching with different keywords or choosing another category above.</p>
          </div>
        `;
      } else {
        for (const evt of cachedEvents) {
          const card = createEventCard(
            evt,
            (selected) => openEventDetailModal(selected, fetchAndRender),
            async (selected) => {
              if (!api.currentUser) {
                showToast('Please log in to RSVP for events', 'info');
                window.location.hash = '#login';
                return;
              }
              try {
                const rsvpRes = await api.toggleRsvp(selected.id);
                showToast(rsvpRes.message, rsvpRes.status === 'confirmed' ? 'success' : 'info');
                fetchAndRender();
              } catch (err) {
                showToast(err.message, 'error');
              }
            }
          );
          gridView.appendChild(card);
        }
      }

      // Update Calendar
      calendarComponent.setEvents(cachedEvents);

    } catch (err) {
      countDisplay.textContent = 'Error loading events';
      showToast(err.message, 'error');
    }
  }

  // Switch between Grid and Calendar Views
  const gridBtn = container.querySelector('#view-grid-btn');
  const calBtn = container.querySelector('#view-calendar-btn');

  gridBtn.addEventListener('click', () => {
    activeView = 'grid';
    gridBtn.className = 'btn-primary';
    gridBtn.style.background = '';
    calBtn.className = 'btn-secondary';
    calBtn.style.background = 'transparent';
    calBtn.style.border = 'none';
    gridView.style.display = 'grid';
    calViewWrap.style.display = 'none';
  });

  calBtn.addEventListener('click', () => {
    activeView = 'calendar';
    calBtn.className = 'btn-primary';
    calBtn.style.background = '';
    gridBtn.className = 'btn-secondary';
    gridBtn.style.background = 'transparent';
    gridBtn.style.border = 'none';
    gridView.style.display = 'none';
    calViewWrap.style.display = 'block';
    calendarComponent.render();
  });

  // Search input debounced
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentSearch = searchInput.value.trim();
      fetchAndRender();
    }, 250);
  });

  // Category filter pills
  const catPills = container.querySelectorAll('.category-filter-pill');
  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => {
        p.style.background = 'rgba(255,255,255,0.05)';
        p.style.color = '#cbd5e1';
        p.style.borderColor = 'rgba(255,255,255,0.08)';
      });
      pill.style.background = 'rgba(139,92,246,0.3)';
      pill.style.color = '#a78bfa';
      pill.style.borderColor = '#8b5cf6';

      currentCategory = pill.getAttribute('data-category');
      fetchAndRender();
    });
  });

  // Date filter pills
  const datePills = container.querySelectorAll('.date-filter-pill');
  datePills.forEach(pill => {
    pill.addEventListener('click', () => {
      datePills.forEach(p => {
        p.style.background = 'rgba(255,255,255,0.04)';
        p.style.color = '#94a3b8';
        p.style.borderColor = 'transparent';
      });
      pill.style.background = 'rgba(56,189,248,0.2)';
      pill.style.color = '#38bdf8';
      pill.style.borderColor = '#38bdf8';

      currentDateFilter = pill.getAttribute('data-date');
      fetchAndRender();
    });
  });

  // Initial load
  fetchAndRender();
}
