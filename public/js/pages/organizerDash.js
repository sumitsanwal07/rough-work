// public/js/pages/organizerDash.js
import { api, showToast } from '../api.js';
import { openSubmitEventModal } from '../components/submitEventModal.js';
import { openAttendeeModal } from '../components/attendeeModal.js';
import { openEventDetailModal } from '../components/eventDetailModal.js';

export async function renderOrganizerDashboard(container) {
  const user = api.currentUser;
  if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
    showToast('Organizer privileges required', 'error');
    window.location.hash = '#login';
    return;
  }

  container.innerHTML = `
    <div class="container" style="padding: 40px 20px 80px;">
      <!-- Dashboard Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span class="badge badge-Workshops">Organizer Studio</span>
            <span style="font-size: 0.8rem; color: #a78bfa;">${user.department || 'Club Lead'}</span>
          </div>
          <h1 style="font-size: 2.2rem; font-weight: 800; color: #fff;">Event Management Console</h1>
          <p style="font-size: 0.92rem; color: #94a3b8;">Create, monitor, and manage campus events and view student registrations</p>
        </div>

        <button id="btn-create-event" class="btn-primary" style="padding: 12px 24px; font-size: 0.95rem;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Submit New Event
        </button>
      </div>

      <!-- KPI Metrics -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 18px; margin-bottom: 36px;">
        <div class="glass-card" style="padding: 20px;">
          <div style="font-size: 1.8rem; font-weight: 800; color: #fff;" id="org-total-events">0</div>
          <div style="font-size: 0.78rem; font-weight: 600; color: #94a3b8; text-transform: uppercase;">Total Submissions</div>
        </div>

        <div class="glass-card" style="padding: 20px;">
          <div style="font-size: 1.8rem; font-weight: 800; color: #34d399;" id="org-approved-events">0</div>
          <div style="font-size: 0.78rem; font-weight: 600; color: #94a3b8; text-transform: uppercase;">Approved & Live</div>
        </div>

        <div class="glass-card" style="padding: 20px;">
          <div style="font-size: 1.8rem; font-weight: 800; color: #fbbf24;" id="org-pending-events">0</div>
          <div style="font-size: 0.78rem; font-weight: 600; color: #94a3b8; text-transform: uppercase;">Awaiting Admin Review</div>
        </div>

        <div class="glass-card" style="padding: 20px;">
          <div style="font-size: 1.8rem; font-weight: 800; color: #38bdf8;" id="org-total-rsvps">0</div>
          <div style="font-size: 0.78rem; font-weight: 600; color: #94a3b8; text-transform: uppercase;">Total Attendees Registered</div>
        </div>
      </div>

      <!-- Status Filter Tabs -->
      <div style="display: flex; gap: 8px; margin-bottom: 24px; overflow-x: auto; padding-bottom: 6px;">
        ${['All', 'approved', 'pending', 'draft', 'rejected', 'cancelled'].map(st => `
          <button class="org-status-tab ${st === 'All' ? 'active' : ''}" data-status="${st}" style="padding: 8px 18px; border-radius: 10px; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: var(--transition-smooth); background: ${st === 'All' ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.04)'}; color: ${st === 'All' ? '#fff' : '#94a3b8'}; border: 1px solid ${st === 'All' ? '#8b5cf6' : 'rgba(255,255,255,0.08)'}; text-transform: capitalize;">
            ${st}
          </button>
        `).join('')}
      </div>

      <!-- Events List / Cards -->
      <div id="org-events-container" style="display: flex; flex-direction: column; gap: 18px;">
        <div style="padding: 40px; text-align: center; color: #94a3b8;">Loading submissions...</div>
      </div>
    </div>
  `;

  let currentTab = 'All';
  let cachedEvents = [];

  container.querySelector('#btn-create-event').addEventListener('click', () => {
    openSubmitEventModal(null, loadOrganizerData);
  });

  const eventsContainer = container.querySelector('#org-events-container');

  function renderFilteredEvents() {
    eventsContainer.innerHTML = '';

    const filtered = cachedEvents.filter(e => currentTab === 'All' || e.status === currentTab);

    if (filtered.length === 0) {
      eventsContainer.innerHTML = `
        <div class="glass-card" style="padding: 50px 20px; text-align: center; color: #94a3b8;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5" style="margin: 0 auto 12px; display: block;">
            <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline>
          </svg>
          <h3 style="font-size: 1.2rem; font-weight: 700; color: #fff; margin-bottom: 6px;">No ${currentTab === 'All' ? '' : currentTab} events found</h3>
          <p style="font-size: 0.88rem; margin-bottom: 16px;">Create a new campus event or select a different filter.</p>
          <button id="empty-submit-btn" class="btn-primary" style="padding: 8px 20px; font-size: 0.85rem;">Submit New Event</button>
        </div>
      `;
      const emptyBtn = eventsContainer.querySelector('#empty-submit-btn');
      if (emptyBtn) emptyBtn.addEventListener('click', () => openSubmitEventModal(null, loadOrganizerData));
      return;
    }

    for (const evt of filtered) {
      const card = document.createElement('div');
      card.className = 'glass-card';
      card.style.padding = '22px 24px';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = '14px';

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; gap: 16px; align-items: center;">
            <img src="${evt.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=160'}" alt="${evt.title}" style="width: 80px; height: 80px; border-radius: 12px; object-fit: cover; border: 1px solid rgba(255,255,255,0.1);" />
            <div>
              <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                <span class="badge badge-${evt.category}">${evt.category}</span>
                <span class="status-badge status-${evt.status}">${evt.status}</span>
              </div>
              <h3 style="font-size: 1.25rem; font-weight: 700; color: #fff; margin-bottom: 4px;">${evt.title}</h3>
              <div style="font-size: 0.82rem; color: #94a3b8; display: flex; gap: 14px; flex-wrap: wrap;">
                <span>📅 ${evt.event_date}</span>
                <span>⏰ ${evt.start_time} - ${evt.end_time}</span>
                <span>📍 ${evt.venue}</span>
              </div>
            </div>
          </div>

          <!-- RSVP attendee count & Actions -->
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <div style="text-align: right; padding-right: 10px; border-right: 1px solid rgba(255,255,255,0.08);">
              <div style="font-size: 1.25rem; font-weight: 800; color: #38bdf8;">${evt.rsvp_count || 0}</div>
              <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase;">Registered (${evt.capacity || 100} Cap)</div>
            </div>

            <button class="btn-secondary btn-view-attendees" style="padding: 8px 14px; font-size: 0.82rem;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Roster
            </button>

            ${evt.status === 'draft' || evt.status === 'pending' || evt.status === 'rejected' ? `
              <button class="btn-secondary btn-edit-event" style="padding: 8px 14px; font-size: 0.82rem;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                Edit
              </button>
            ` : ''}

            ${evt.status === 'approved' ? `
              <button class="btn-danger btn-cancel-event" style="padding: 8px 14px; font-size: 0.82rem;">
                Cancel Event
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Rejection Feedback Alert (If Rejected by Admin) -->
        ${evt.status === 'rejected' && evt.rejection_reason ? `
          <div style="background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px; padding: 12px 16px; display: flex; align-items: flex-start; gap: 10px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" style="flex-shrink: 0; margin-top: 2px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <div>
              <div style="font-size: 0.82rem; font-weight: 700; color: #f87171; margin-bottom: 2px;">Administrator Rejection Feedback:</div>
              <div style="font-size: 0.85rem; color: #fca5a5;">${evt.rejection_reason}</div>
              <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 4px;">Click 'Edit' above to correct these issues and resubmit for approval.</div>
            </div>
          </div>
        ` : ''}
      `;

      // Attach button handlers
      card.querySelector('.btn-view-attendees').addEventListener('click', () => {
        openAttendeeModal(evt.id);
      });

      const editBtn = card.querySelector('.btn-edit-event');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          openSubmitEventModal(evt, loadOrganizerData);
        });
      }

      const cancelBtn = card.querySelector('.btn-cancel-event');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', async () => {
          if (confirm(`Are you sure you want to cancel "${evt.title}"? Confirmed attendees will be notified.`)) {
            try {
              await api.cancelEvent(evt.id);
              showToast('Event has been cancelled', 'info');
              loadOrganizerData();
            } catch (err) { showToast(err.message, 'error'); }
          }
        });
      }

      eventsContainer.appendChild(card);
    }
  }

  // Filter tabs
  container.querySelectorAll('.org-status-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.org-status-tab').forEach(t => {
        t.style.background = 'rgba(255,255,255,0.04)';
        t.style.color = '#94a3b8';
        t.style.borderColor = 'rgba(255,255,255,0.08)';
      });
      tab.style.background = 'rgba(139,92,246,0.3)';
      tab.style.color = '#fff';
      tab.style.borderColor = '#8b5cf6';

      currentTab = tab.getAttribute('data-status');
      renderFilteredEvents();
    });
  });

  async function loadOrganizerData() {
    try {
      const res = await api.getOrganizerEvents();
      cachedEvents = res.events || [];

      // Calculate KPI metrics
      const totalCount = cachedEvents.length;
      const approvedCount = cachedEvents.filter(e => e.status === 'approved').length;
      const pendingCount = cachedEvents.filter(e => e.status === 'pending').length;
      const totalRsvps = cachedEvents.reduce((acc, e) => acc + (e.rsvp_count || 0), 0);

      container.querySelector('#org-total-events').textContent = totalCount;
      container.querySelector('#org-approved-events').textContent = approvedCount;
      container.querySelector('#org-pending-events').textContent = pendingCount;
      container.querySelector('#org-total-rsvps').textContent = totalRsvps;

      renderFilteredEvents();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  loadOrganizerData();
}
