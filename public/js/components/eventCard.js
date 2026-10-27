// public/js/components/eventCard.js

export function createEventCard(event, onCardClick, onRsvpToggle) {
  const card = document.createElement('div');
  card.className = 'glass-card';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.cursor = 'pointer';

  // Format date: e.g. "Sat, Nov 1"
  let dateFormatted = event.event_date;
  try {
    const d = new Date(event.event_date + 'T00:00:00');
    dateFormatted = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {}

  const isFull = event.capacity && event.rsvp_count >= event.capacity;
  const isJoined = event.userRsvp === 'confirmed';

  card.innerHTML = `
    <!-- Image Banner -->
    <div style="position: relative; height: 180px; width: 100%; overflow: hidden;">
      <img
        src="${event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}"
        alt="${event.title}"
        style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;"
        class="event-card-img"
      />
      <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(7,8,20,0.1) 0%, rgba(7,8,20,0.85) 100%);"></div>

      <!-- Top Badges -->
      <div style="position: absolute; top: 12px; left: 12px; display: flex; gap: 6px;">
        <span class="badge badge-${event.category}">${event.category}</span>
        ${event.featured ? '<span class="badge badge-Hackathons" style="background: rgba(236,72,153,0.25); color: #f472b6; border-color: rgba(236,72,153,0.5);">Featured</span>' : ''}
      </div>

      <!-- Date Badge Overlay -->
      <div style="position: absolute; bottom: 12px; left: 12px; display: flex; align-items: center; gap: 8px;">
        <div style="background: rgba(14, 18, 42, 0.85); backdrop-filter: blur(8px); padding: 4px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); font-size: 0.78rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 5px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          ${dateFormatted}
        </div>
      </div>
    </div>

    <!-- Body Content -->
    <div style="padding: 18px 20px; display: flex; flex-direction: column; flex: 1;">
      <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff; margin-bottom: 8px; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
        ${event.title}
      </h3>

      <p style="font-size: 0.86rem; color: #94a3b8; margin-bottom: 16px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
        ${event.description}
      </p>

      <!-- Event Metadata: Venue & Time -->
      <div style="margin-top: auto; display: flex; flex-direction: column; gap: 8px; font-size: 0.82rem; color: #cbd5e1; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06);">
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${event.venue}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <span>${event.start_time} - ${event.end_time}</span>
        </div>
      </div>

      <!-- Footer: Organizer & Action -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 14px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <img src="${event.organizer_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'}" alt="${event.organizer_name || 'Organizer'}" style="width: 26px; height: 26px; border-radius: 50%; object-fit: cover;" />
          <span style="font-size: 0.78rem; color: #94a3b8; max-width: 110px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${event.organizer_name || 'Campus Club'}
          </span>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 0.78rem; color: #38bdf8; font-weight: 600; display: flex; align-items: center; gap: 4px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            ${event.rsvp_count || 0}${event.capacity ? ' / ' + event.capacity : ''}
          </span>

          <button class="event-rsvp-btn ${isJoined ? 'btn-danger' : 'btn-primary'}" style="padding: 6px 12px; font-size: 0.8rem; border-radius: 8px;">
            ${isJoined ? 'Cancel' : isFull ? 'Full' : 'RSVP'}
          </button>
        </div>
      </div>
    </div>
  `;

  // Attach card image zoom effect on hover
  const img = card.querySelector('.event-card-img');
  card.addEventListener('mouseenter', () => { if (img) img.style.transform = 'scale(1.06)'; });
  card.addEventListener('mouseleave', () => { if (img) img.style.transform = 'scale(1)'; });

  // Click card body to open details
  card.addEventListener('click', (e) => {
    // If clicked the RSVP button, don't trigger the modal open
    if (e.target.closest('.event-rsvp-btn')) return;
    if (onCardClick) onCardClick(event);
  });

  // Click RSVP button
  const rsvpBtn = card.querySelector('.event-rsvp-btn');
  if (rsvpBtn && onRsvpToggle) {
    rsvpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onRsvpToggle(event);
    });
  }

  return card;
}
