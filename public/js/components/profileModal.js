// public/js/components/profileModal.js
import { api, showToast } from '../api.js';

export function openProfileModal(onProfileUpdated = null) {
  const existing = document.getElementById('profile-modal');
  if (existing) existing.remove();

  const user = api.currentUser;
  if (!user) return;

  const modal = document.createElement('div');
  modal.id = 'profile-modal';
  modal.className = 'modal-backdrop';

  modal.innerHTML = `
    <div class="modal-content-wrap glass-modal" style="max-width: 600px; padding: 28px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="${user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}" alt="${user.full_name}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid #8b5cf6;" />
          <div>
            <h2 style="font-size: 1.4rem; font-weight: 800; color: #fff;">User Profile & Settings</h2>
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
              <span class="badge ${user.role === 'admin' ? 'badge-Hackathons' : user.role === 'organizer' ? 'badge-Workshops' : 'badge-Technical'}">${user.role}</span>
              <span style="font-size: 0.75rem; color: #94a3b8;">${user.email}</span>
            </div>
          </div>
        </div>
        <button id="modal-close-x" style="color: #94a3b8; font-size: 1.5rem; line-height: 1;">&times;</button>
      </div>

      <form id="profile-edit-form">
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input type="text" id="prof-name" class="form-control" value="${user.full_name || ''}" required />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div class="form-group">
            <label class="form-label">College / Official Email</label>
            <input type="email" id="prof-college-email" class="form-control" value="${user.college_email || user.email || ''}" />
          </div>

          <div class="form-group">
            <label class="form-label">Year of Study</label>
            <select id="prof-year" class="form-select">
              <option value="1st Year" ${user.year_of_study === '1st Year' ? 'selected' : ''}>1st Year</option>
              <option value="2nd Year" ${user.year_of_study === '2nd Year' ? 'selected' : ''}>2nd Year</option>
              <option value="3rd Year" ${user.year_of_study === '3rd Year' ? 'selected' : ''}>3rd Year</option>
              <option value="4th Year" ${user.year_of_study === '4th Year' ? 'selected' : ''}>4th Year</option>
              <option value="Postgraduate" ${user.year_of_study === 'Postgraduate' ? 'selected' : ''}>Postgraduate</option>
              <option value="Faculty" ${user.year_of_study === 'Faculty' ? 'selected' : ''}>Faculty</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Department / School</label>
          <input type="text" id="prof-dept" class="form-control" value="${user.department || ''}" placeholder="e.g. Computer Science, Mechanical, Media Arts" />
        </div>

        <div class="form-group">
          <label class="form-label">Avatar Image URL</label>
          <input type="url" id="prof-avatar" class="form-control" value="${user.avatar_url || ''}" placeholder="https://..." />
        </div>

        <div class="form-group">
          <label class="form-label">Bio & Campus Interests</label>
          <textarea id="prof-bio" class="form-control" rows="3" placeholder="Tell organizers and peers what you are passionate about...">${user.bio || ''}</textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
          <button type="submit" class="btn-primary" style="padding: 10px 24px;">Save Changes</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#modal-close-x').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelector('#profile-edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const updated = await api.updateProfile({
        fullName: modal.querySelector('#prof-name').value.trim(),
        collegeEmail: modal.querySelector('#prof-college-email').value.trim(),
        yearOfStudy: modal.querySelector('#prof-year').value,
        department: modal.querySelector('#prof-dept').value.trim(),
        avatarUrl: modal.querySelector('#prof-avatar').value.trim(),
        bio: modal.querySelector('#prof-bio').value.trim()
      });
      showToast('Profile updated successfully!', 'success');
      modal.remove();
      if (onProfileUpdated) onProfileUpdated(updated);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
