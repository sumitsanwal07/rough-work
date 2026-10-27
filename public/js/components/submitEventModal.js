// public/js/components/submitEventModal.js
import { api, showToast } from '../api.js';

export function openSubmitEventModal(existingEvent = null, onSaved = null) {
  const existing = document.getElementById('submit-event-modal');
  if (existing) existing.remove();

  const isEdit = !!existingEvent;
  const modal = document.createElement('div');
  modal.id = 'submit-event-modal';
  modal.className = 'modal-backdrop';

  // Preset event banner images for quick organizer selection
  const presetImages = [
    { label: 'Hackathon / Tech', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1000' },
    { label: 'Concert / Fest', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1000' },
    { label: 'Workshop / AI', url: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1000' },
    { label: 'Sports Tourney', url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1000' },
    { label: 'Seminar / TEDx', url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1000' },
    { label: 'Robotics Arena', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1000' }
  ];

  modal.innerHTML = `
    <div class="modal-content-wrap glass-modal" style="max-width: 680px; padding: 28px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #fff;">
            ${isEdit ? 'Edit Event Details' : 'Submit Campus Event'}
          </h2>
          <p style="font-size: 0.85rem; color: #94a3b8;">
            ${isEdit ? 'Update details and resubmit for approval or save as draft' : 'Organizers submit events for administrative review & approval'}
          </p>
        </div>
        <button id="modal-close-x" style="color: #94a3b8; font-size: 1.5rem; line-height: 1; padding: 4px;">&times;</button>
      </div>

      <div id="form-error-alert" style="display: none; padding: 12px 16px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px; color: #f87171; font-size: 0.88rem; margin-bottom: 18px;"></div>

      <form id="event-submit-form">
        <!-- Title -->
        <div class="form-group">
          <label class="form-label">Event Title *</label>
          <input type="text" id="evt-title" class="form-control" placeholder="e.g. GRAPHITE 26 Hackathon: Code the Future" value="${existingEvent?.title || ''}" required />
        </div>

        <!-- Category & Capacity -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select id="evt-category" class="form-select" required>
              <option value="Technical" ${existingEvent?.category === 'Technical' ? 'selected' : ''}>Technical</option>
              <option value="Cultural" ${existingEvent?.category === 'Cultural' ? 'selected' : ''}>Cultural</option>
              <option value="Sports" ${existingEvent?.category === 'Sports' ? 'selected' : ''}>Sports</option>
              <option value="Workshops" ${existingEvent?.category === 'Workshops' ? 'selected' : ''}>Workshops</option>
              <option value="Seminars" ${existingEvent?.category === 'Seminars' ? 'selected' : ''}>Seminars</option>
              <option value="Hackathons" ${existingEvent?.category === 'Hackathons' ? 'selected' : ''}>Hackathons</option>
              <option value="Other" ${existingEvent?.category === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Attendee Capacity</label>
            <input type="number" id="evt-capacity" class="form-control" placeholder="100" min="1" max="5000" value="${existingEvent?.capacity || 100}" />
          </div>
        </div>

        <!-- Date & Times -->
        <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 14px;">
          <div class="form-group">
            <label class="form-label">Event Date *</label>
            <input type="date" id="evt-date" class="form-control" value="${existingEvent?.event_date || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Start Time *</label>
            <input type="time" id="evt-start" class="form-control" value="${existingEvent?.start_time || '10:00'}" required />
          </div>
          <div class="form-group">
            <label class="form-label">End Time *</label>
            <input type="time" id="evt-end" class="form-control" value="${existingEvent?.end_time || '17:00'}" required />
          </div>
        </div>

        <!-- Venue -->
        <div class="form-group">
          <label class="form-label">Campus Venue *</label>
          <input type="text" id="evt-venue" class="form-control" placeholder="e.g. Main Auditorium / Innovation Lab 3B" value="${existingEvent?.venue || ''}" required />
        </div>

        <!-- Description -->
        <div class="form-group">
          <label class="form-label">Description & Agenda *</label>
          <textarea id="evt-desc" class="form-control" rows="4" placeholder="Detailed schedule, speakers, prerequisites, and instructions for participants..." required>${existingEvent?.description || ''}</textarea>
        </div>

        <!-- Banner Image Presets or Custom URL -->
        <div class="form-group">
          <label class="form-label">Event Banner Image URL</label>
          <input type="url" id="evt-image" class="form-control" placeholder="https://images.unsplash.com/..." value="${existingEvent?.image_url || presetImages[0].url}" />
          <div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;">
            ${presetImages.map(img => `
              <button type="button" class="preset-img-btn" data-url="${img.url}" style="font-size: 0.72rem; padding: 3px 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #cbd5e1;">
                ${img.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Actions: Save as Draft vs Submit for Approval -->
        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08);">
          <button type="button" id="save-draft-btn" class="btn-secondary">
            Save as Draft
          </button>
          <button type="submit" id="submit-approval-btn" class="btn-primary">
            Submit for Approval
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Close listeners
  modal.querySelector('#modal-close-x').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  // Preset image buttons
  const presetBtns = modal.querySelectorAll('.preset-img-btn');
  const imgInput = modal.querySelector('#evt-image');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      imgInput.value = btn.getAttribute('data-url');
    });
  });

  const errorAlert = modal.querySelector('#form-error-alert');
  const form = modal.querySelector('#event-submit-form');

  async function handleSave(status) {
    errorAlert.style.display = 'none';

    const title = modal.querySelector('#evt-title').value.trim();
    const category = modal.querySelector('#evt-category').value;
    const capacity = modal.querySelector('#evt-capacity').value;
    const eventDate = modal.querySelector('#evt-date').value;
    const startTime = modal.querySelector('#evt-start').value;
    const endTime = modal.querySelector('#evt-end').value;
    const venue = modal.querySelector('#evt-venue').value.trim();
    const description = modal.querySelector('#evt-desc').value.trim();
    const imageUrl = modal.querySelector('#evt-image').value.trim();

    if (!title || !category || !eventDate || !startTime || !endTime || !venue || !description) {
      errorAlert.textContent = 'Please fill out all required fields with an asterisk (*)';
      errorAlert.style.display = 'block';
      return;
    }

    try {
      const payload = {
        title,
        category,
        capacity: parseInt(capacity, 10) || 100,
        eventDate,
        startTime,
        endTime,
        venue,
        description,
        imageUrl: imageUrl || presetImages[0].url,
        status // 'draft' or 'pending'
      };

      if (isEdit) {
        await api.updateEvent(existingEvent.id, payload);
        showToast(status === 'draft' ? 'Draft updated successfully' : 'Event resubmitted for admin review', 'success');
      } else {
        await api.createEvent(payload);
        showToast(status === 'draft' ? 'Event saved as draft' : 'Event submitted to admin approval queue!', 'success');
      }

      modal.remove();
      if (onSaved) onSaved();
    } catch (err) {
      errorAlert.textContent = err.message || 'Failed to submit event';
      errorAlert.style.display = 'block';
    }
  }

  modal.querySelector('#save-draft-btn').addEventListener('click', () => handleSave('draft'));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSave('pending');
  });
}
