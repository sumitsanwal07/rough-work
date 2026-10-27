// public/js/components/navbar.js
import { api, showToast } from '../api.js';

export function renderNavbar(container) {
  const user = api.currentUser;

  const roleBadgeHtml = user ? `
    <span class="badge ${user.role === 'admin' ? 'badge-Hackathons' : user.role === 'organizer' ? 'badge-Workshops' : 'badge-Technical'}">
      ${user.role}
    </span>
  ` : '';

  const navLinks = `
    <a href="#events" class="nav-link">Explore Events</a>
    <a href="#calendar" class="nav-link">Calendar</a>
    ${user && user.role === 'student' ? '<a href="#my-events" class="nav-link">My Events</a>' : ''}
    ${user && (user.role === 'organizer' || user.role === 'admin') ? '<a href="#organizer-dashboard" class="nav-link">Organizer Studio</a>' : ''}
    ${user && user.role === 'admin' ? '<a href="#admin-dashboard" class="nav-link" style="color: #f472b6; font-weight: 700;">Admin Hub</a>' : ''}
  `;

  const authActions = user ? `
    <div style="display: flex; align-items: center; gap: 14px;">
      <!-- Notification Bell -->
      <a href="#notifications" style="position: relative; color: #cbd5e1; padding: 6px; border-radius: 8px; transition: var(--transition-smooth);" title="Notifications">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <span id="nav-notif-badge" style="display: none; position: absolute; top: 0; right: 0; background: #ec4899; color: #fff; font-size: 0.65rem; font-weight: 700; border-radius: 9999px; min-width: 16px; height: 16px; text-align: center; line-height: 16px; padding: 0 4px;">0</span>
      </a>

      <!-- Reminder Prefs Button -->
      <button id="nav-reminder-btn" style="color: #cbd5e1; padding: 6px; border-radius: 8px;" title="Reminder Settings">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </button>

      <!-- User Dropdown Trigger -->
      <div style="display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 4px 8px; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);" id="user-menu-btn">
        <img src="${user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}" alt="${user.full_name}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid #8b5cf6;" />
        <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.2;">
          <span style="font-size: 0.82rem; font-weight: 700; color: #f8fafc; max-width: 110px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.full_name}</span>
          <span style="font-size: 0.68rem; color: #94a3b8; text-transform: capitalize;">${user.role}</span>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>

      <!-- User Menu Dropdown -->
      <div id="user-dropdown" class="glass-modal" style="display: none; position: absolute; top: 64px; right: 20px; width: 220px; padding: 8px; z-index: 1000; border-radius: 12px;">
        <div style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 6px;">
          <div style="font-weight: 700; font-size: 0.85rem; color: #fff;">${user.full_name}</div>
          <div style="font-size: 0.72rem; color: #94a3b8;">${user.email}</div>
        </div>
        <a href="#profile" class="dropdown-item" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; font-size: 0.85rem; color: #cbd5e1; border-radius: 8px; transition: var(--transition-smooth);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          Edit Profile
        </a>
        <a href="#notifications" class="dropdown-item" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; font-size: 0.85rem; color: #cbd5e1; border-radius: 8px; transition: var(--transition-smooth);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          Notifications
        </a>
        <div style="border-top: 1px solid rgba(255,255,255,0.08); margin: 6px 0;"></div>
        <button id="dropdown-logout-btn" style="width: 100%; text-align: left; display: flex; align-items: center; gap: 8px; padding: 8px 12px; font-size: 0.85rem; color: #f87171; border-radius: 8px; transition: var(--transition-smooth);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Sign Out
        </button>
      </div>
    </div>
  ` : `
    <div style="display: flex; align-items: center; gap: 10px;">
      <a href="#login" class="btn-secondary" style="padding: 7px 16px; font-size: 0.85rem;">Sign In</a>
      <a href="#login" class="btn-primary" style="padding: 7px 18px; font-size: 0.85rem;">Get Started</a>
    </div>
  `;

  container.innerHTML = `
    <div class="glass-nav">
      <div class="container" style="display: flex; align-items: center; justify-content: space-between; height: 68px;">
        <!-- Brand Logo -->
        <a href="#" style="display: flex; align-items: center; gap: 12px; text-decoration: none;">
          <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #7c3aed, #06b6d4); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div style="display: flex; flex-direction: column;">
            <span style="font-weight: 800; font-size: 1.15rem; letter-spacing: -0.02em;" class="gradient-text">Campus Event Hub</span>
            <span style="font-size: 0.65rem; color: #94a3b8; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;">GRAPHITE 26 &bull; PS 18</span>
          </div>
        </a>

        <!-- Desktop Navigation Links -->
        <nav style="display: flex; align-items: center; gap: 24px;" class="desktop-nav">
          ${navLinks}
        </nav>

        <!-- Right Side: Auth / User Profile -->
        <div style="position: relative;">
          ${authActions}
        </div>
      </div>
    </div>
  `;

  // Attach navbar event listeners
  const menuBtn = document.getElementById('user-menu-btn');
  const dropdown = document.getElementById('user-dropdown');
  if (menuBtn && dropdown) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', () => {
      dropdown.style.display = 'none';
    });
  }

  const logoutBtn = document.getElementById('dropdown-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await api.logout();
      showToast('You have been signed out successfully.', 'info');
      window.location.hash = '#';
    });
  }

  const reminderBtn = document.getElementById('nav-reminder-btn');
  if (reminderBtn) {
    reminderBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('open-reminder-modal'));
    });
  }

  // Update notification count if logged in
  if (user) {
    api.getUnreadCount().then(data => {
      const badge = document.getElementById('nav-notif-badge');
      if (badge && data && data.count > 0) {
        badge.textContent = data.count > 9 ? '9+' : data.count;
        badge.style.display = 'inline-block';
      }
    }).catch(() => {});
  }
}
