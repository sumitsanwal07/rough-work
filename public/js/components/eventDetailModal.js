// public/js/components/eventDetailModal.js
import { api, showToast } from '../api.js';

export function openEventDetailModal(event, onUpdated = null) {
  const existing = document.getElementById('event-detail-modal');
  if (existing) existing.remove();

  const user = api.currentUser;
  const isJoined = event.userRsvp === 'confirmed';
  const isFull = event.capacity && event.rsvp_count >= event.capacity;
  const capacityPct = event.capacity ? Math.min(100, Math.round((event.rsvp_count / event.capacity) * 100)) : 0;

  let formattedDate = event.event_date;
  try {
    const d = new Date(event.event_date + 'T00:00:00');
    formattedDate = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } catch (e) {}

  const modal = document.createElement('div');
  modal.id = 'event-detail-modal';
  modal.className = 'modal-backdrop';

  modal.innerHTML = `
    <div class="modal-content-wrap glass-modal" style="max-width: 720px; overflow: hidden; border-radius: 20px;">
      <!-- Hero Banner -->
      <div style="position: relative; height: 260px; width: 100%;">
        <img
          src="${event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200'}"
          alt="${event.title}"
          style="width: 100%; height: 100%; object-fit: cover;"
        />
        <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(7,8,20,0.2) 0%, rgba(7,8,20,0.95) 100%);"></div>

        <button id="modal-close-btn" style="position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; border-radius: 50%; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.15); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition-smooth);">
          &times;
        </button>

        <!-- Category & Status Badge -->
        <div style="position: absolute; bottom: 16px; left: 24px; display: flex; gap: 8px; flex-wrap: wrap;">
          <span class="badge badge-${event.category}">${event.category}</span>
          ${event.status ? `<span class="status-badge status-${event.status}">${event.status}</span>` : ''}
          ${event.featured ? `<span class="badge badge-Hackathons" style="background: rgba(236,72,153,0.3); color: #f472b6;">Featured Event</span>` : ''}
        </div>
      </div>

      <!-- Modal Body -->
      <div style="padding: 24px 28px;">
        <h2 style="font-size: 1.75rem; font-weight: 800; color: #fff; line-height: 1.25; margin-bottom: 16px;">
          ${event.title}
        </h2>

        <!-- Event Details Matrix -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 16px; margin-bottom: 24px;">
          <div style="display: flex; align-items: flex-start; gap: 10px;">
            <div style="color: #a78bfa; padding: 6px; background: rgba(139,92,246,0.15); border-radius: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <div>
              <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Date & Schedule</div>
              <div style="font-size: 0.9rem; font-weight: 600; color: #fff;">${formattedDate}</div>
              <div style="font-size: 0.8rem; color: #38bdf8;">${event.start_time} - ${event.end_time}</div>
            </div>
          </div>

          <div style="display: flex; align-items: flex-start; gap: 10px;">
            <div style="color: #38bdf8; padding: 6px; background: rgba(56,189,248,0.15); border-radius: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </div>
            <div>
              <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Campus Location</div>
              <div style="font-size: 0.9rem; font-weight: 600; color: #fff;">${event.venue}</div>
              <div style="font-size: 0.8rem; color: #94a3b8;">Main Campus Ground</div>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div style="margin-bottom: 24px;">
          <h4 style="font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 8px; font-weight: 700;">About This Event</h4>
          <p style="font-size: 0.96rem; color: #cbd5e1; line-height: 1.7; white-space: pre-line;">
            ${event.description}
          </p>
        </div>

        <!-- Capacity & Attendee Stats -->
        <div style="background: rgba(14, 18, 42, 0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 16px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 0.85rem; font-weight: 600; color: #cbd5e1;">Attendee Registration</span>
            <span style="font-size: 0.85rem; font-weight: 700; color: #38bdf8;">${event.rsvp_count || 0} / ${event.capacity || 100} Registered (${capacityPct}%)</span>
          </div>
          <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.08); border-radius: 9999px; overflow: hidden;">
            <div style="width: ${capacityPct}%; height: 100%; background: linear-gradient(90deg, #7c3aed, #06b6d4); border-radius: 9999px; transition: width 0.4s ease;"></div>
          </div>
        </div>

        <!-- Organizer Profile Section -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${event.organizer_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}" alt="${event.organizer_name || 'Organizer'}" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 1px solid #8b5cf6;" />
            <div>
              <div style="font-size: 0.9rem; font-weight: 700; color: #fff;">${event.organizer_name || 'Campus Student Affairs'}</div>
              <div style="font-size: 0.78rem; color: #94a3b8;">${event.organizer_dept || 'Department Lead'} &bull; ${event.organizer_email || 'contact@campus.edu'}</div>
            </div>
          </div>
          <button id="modal-share-btn" class="btn-secondary" style="padding: 7px 14px; font-size: 0.8rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            Share Link
          </button>
        </div>

        <!-- Action Bar: RSVP / Join / Cancel / Add to Calendar -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; pt: 10px;">
          <a
            href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.event_date.replace(/-/g, '')}T${event.start_time.replace(/:/g, '')}00Z/${event.event_date.replace(/-/g, '')}T${event.end_time.replace(/:/g, '')}00Z&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.venue)}"
            target="_blank"
            class="btn-secondary"
            style="padding: 10px 18px; font-size: 0.88rem;"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Add to Calendar
          </a>

          <div>
            ${user ? `
              <button id="modal-rsvp-btn" class="${isJoined ? 'btn-danger' : 'btn-primary'}" style="padding: 12px 28px; font-size: 1rem;">
                ${isJoined ? 'Cancel My RSVP' : isFull ? 'Event Full (Waitlist)' : 'RSVP Now &bull; Free'}
              </button>
            ` : `
              <a href="#login" class="btn-primary" style="padding: 12px 28px; font-size: 1rem;">
                Sign In to RSVP
              </a>
            `}
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close listeners
  modal.querySelector('#modal-close-btn').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  // Share link
  modal.querySelector('#modal-share-btn').addEventListener('click', () => {
    const shareUrl = `${window.location.origin}/#event/${event.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('Event link copied to clipboard!', 'success');
    }).catch(() => {
      showToast(`Event link: ${shareUrl}`, 'info');
    });
  });

  // RSVP toggle action
  const rsvpBtn = modal.querySelector('#modal-rsvp-btn');
  if (rsvpBtn) {
    rsvpBtn.addEventListener('click', async () => {
      try {
        rsvpBtn.disabled = true;
        rsvpBtn.textContent = 'Processing...';
        const res = await api.toggleRsvp(event.id);
        showToast(res.message, res.status === 'confirmed' ? 'success' : 'info');
        modal.remove();
        if (onUpdated) onUpdated();
      } catch (err) {
        showToast(err.message, 'error');
        rsvpBtn.disabled = false;
        rsvpBtn.textContent = isJoined ? 'Cancel My RSVP' : 'RSVP Now';
      }
    });
  }
}
