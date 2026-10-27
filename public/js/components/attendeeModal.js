// public/js/components/attendeeModal.js
import { api, showToast } from '../api.js';

export async function openAttendeeModal(eventId) {
  const existing = document.getElementById('attendee-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'attendee-modal';
  modal.className = 'modal-backdrop';

  modal.innerHTML = `
    <div class="modal-content-wrap glass-modal" style="max-width: 680px; padding: 28px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: #fff;">Registered Attendees Roster</h2>
          <p id="attendee-event-title" style="font-size: 0.85rem; color: #38bdf8;">Loading roster...</p>
        </div>
        <button id="modal-close-x" style="color: #94a3b8; font-size: 1.5rem; line-height: 1;">&times;</button>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <span id="attendee-count-badge" class="badge badge-Technical">0 Registered</span>
        <button id="export-csv-btn" class="btn-secondary" style="padding: 6px 14px; font-size: 0.8rem;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export CSV
        </button>
      </div>

      <div id="attendees-table-wrap" style="max-height: 380px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;">
        <div style="padding: 30px; text-align: center; color: #94a3b8;">Fetching attendees...</div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#modal-close-x').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  try {
    const data = await api.getEventAttendees(eventId);
    modal.querySelector('#attendee-event-title').textContent = data.eventTitle;
    modal.querySelector('#attendee-count-badge').textContent = `${data.count} Registered`;

    const tableWrap = modal.querySelector('#attendees-table-wrap');

    if (!data.attendees || data.attendees.length === 0) {
      tableWrap.innerHTML = `
        <div style="padding: 40px; text-align: center; color: #94a3b8;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 10px; display: block; opacity: 0.5;">
            <circle cx="12" cy="12" r="10"></circle><path d="M16 16s-1.5-2-4-2-4 2-4 2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line>
          </svg>
          No students have registered for this event yet.
        </div>
      `;
      return;
    }

    let rowsHtml = '';
    for (const a of data.attendees) {
      let regDate = a.registered_at;
      try {
        regDate = new Date(a.registered_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      } catch (e) {}

      rowsHtml += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); gap: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${a.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'}" alt="${a.full_name}" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover;" />
            <div>
              <div style="font-size: 0.88rem; font-weight: 700; color: #fff;">${a.full_name}</div>
              <div style="font-size: 0.75rem; color: #94a3b8;">${a.email} &bull; ${a.department || 'Student'} (${a.year_of_study || 'N/A'})</div>
            </div>
          </div>
          <div style="font-size: 0.75rem; color: #38bdf8; text-align: right;">
            <div>RSVP Confirmed</div>
            <div style="color: #64748b;">${regDate}</div>
          </div>
        </div>
      `;
    }

    tableWrap.innerHTML = rowsHtml;

    // CSV Export
    modal.querySelector('#export-csv-btn').addEventListener('click', () => {
      const headers = ['Full Name', 'Email', 'Department', 'Year', 'Registered At'];
      const csvRows = [headers.join(',')];

      for (const a of data.attendees) {
        csvRows.push([
          `"${a.full_name.replace(/"/g, '""')}"`,
          `"${a.email}"`,
          `"${(a.department || '').replace(/"/g, '""')}"`,
          `"${a.year_of_study || ''}"`,
          `"${a.registered_at}"`
        ].join(','));
      }

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_attendees.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Attendee roster exported as CSV', 'success');
    });

  } catch (err) {
    showToast(err.message, 'error');
    modal.remove();
  }
}
