// public/js/pages/notificationsPage.js
import { api, showToast } from '../api.js';

export async function renderNotificationsPage(container) {
  const user = api.currentUser;
  if (!user) {
    showToast('Please sign in to view notifications', 'info');
    window.location.hash = '#login';
    return;
  }

  container.innerHTML = `
    <div class="container" style="padding: 40px 20px 80px; max-width: 860px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px; flex-wrap: wrap; gap: 14px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span class="badge badge-Workshops">Alerts & Reminders</span>
          </div>
          <h1 style="font-size: 2.2rem; font-weight: 800; color: #fff;">Notifications Center</h1>
          <p style="font-size: 0.92rem; color: #94a3b8;">Stay up to date with registrations, admin accreditations, and schedule changes</p>
        </div>

        <div style="display: flex; gap: 10px;">
          <button id="btn-mark-all-read" class="btn-secondary" style="font-size: 0.82rem; padding: 8px 14px;">
            Mark All as Read
          </button>
          <button id="btn-clear-notifs" class="btn-danger" style="font-size: 0.82rem; padding: 8px 14px;">
            Clear All
          </button>
        </div>
      </div>

      <!-- Notifications List Container -->
      <div id="notifs-list-wrap" style="display: flex; flex-direction: column; gap: 12px;">
        <div style="padding: 30px; text-align: center; color: #94a3b8;">Loading notifications...</div>
      </div>
    </div>
  `;

  const listWrap = container.querySelector('#notifs-list-wrap');

  async function loadNotifications() {
    try {
      const res = await api.getNotifications();
      const notifs = res.notifications || [];
      listWrap.innerHTML = '';

      if (notifs.length === 0) {
        listWrap.innerHTML = `
          <div class="glass-card" style="padding: 50px 20px; text-align: center; color: #94a3b8;">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5" style="margin: 0 auto 12px; display: block;">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <h3 style="font-size: 1.2rem; font-weight: 700; color: #fff; margin-bottom: 4px;">All Caught Up!</h3>
            <p style="font-size: 0.88rem;">No unread notifications or event reminders at this time.</p>
          </div>
        `;
        return;
      }

      for (const n of notifs) {
        const item = document.createElement('div');
        item.className = 'glass-card';
        item.style.padding = '18px 22px';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'flex-start';
        item.style.gap = '16px';
        item.style.transition = 'var(--transition-smooth)';
        if (!n.is_read) {
          item.style.borderColor = 'rgba(139,92,246,0.4)';
          item.style.background = 'rgba(24, 30, 68, 0.75)';
        }

        let dateStr = n.created_at;
        try {
          dateStr = new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) {}

        let typeBadge = '';
        if (n.type === 'rsvp_confirm') {
          typeBadge = '<span class="badge badge-Technical" style="font-size: 0.68rem;">RSVP</span>';
        } else if (n.type === 'event_approved') {
          typeBadge = '<span class="badge badge-Sports" style="font-size: 0.68rem;">Approved</span>';
        } else if (n.type === 'event_rejected') {
          typeBadge = '<span class="badge" style="background: rgba(239,68,68,0.2); color: #f87171; border: 1px solid rgba(239,68,68,0.4); font-size: 0.68rem;">Update</span>';
        } else if (n.type === 'reminder') {
          typeBadge = '<span class="badge badge-Seminars" style="font-size: 0.68rem;">Reminder</span>';
        } else {
          typeBadge = '<span class="badge badge-Other" style="font-size: 0.68rem;">System</span>';
        }

        item.innerHTML = `
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              ${typeBadge}
              <span style="font-size: 0.75rem; color: #94a3b8;">${dateStr}</span>
              ${!n.is_read ? '<span style="width: 7px; height: 7px; border-radius: 50%; background: #ec4899;"></span>' : ''}
            </div>
            <h4 style="font-size: 1.05rem; font-weight: 700; color: #fff; margin-bottom: 4px;">${n.title}</h4>
            <p style="font-size: 0.88rem; color: #cbd5e1; line-height: 1.5; margin-bottom: 8px;">${n.message}</p>
            ${n.link ? `
              <a href="${n.link}" style="font-size: 0.8rem; color: #38bdf8; font-weight: 600; text-decoration: underline;">
                View Event Details &rarr;
              </a>
            ` : ''}
          </div>

          <div>
            ${!n.is_read ? `
              <button class="btn-secondary btn-mark-read" style="padding: 5px 10px; font-size: 0.72rem;">
                Mark Read
              </button>
            ` : ''}
          </div>
        `;

        const markReadBtn = item.querySelector('.btn-mark-read');
        if (markReadBtn) {
          markReadBtn.addEventListener('click', async () => {
            try {
              await api.markNotificationRead(n.id);
              loadNotifications();
            } catch (err) { showToast(err.message, 'error'); }
          });
        }

        listWrap.appendChild(item);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  container.querySelector('#btn-mark-all-read').addEventListener('click', async () => {
    try {
      await api.markAllNotificationsRead();
      showToast('All notifications marked as read', 'info');
      loadNotifications();
    } catch (err) { showToast(err.message, 'error'); }
  });

  container.querySelector('#btn-clear-notifs').addEventListener('click', async () => {
    if (confirm('Clear all notifications from your inbox?')) {
      try {
        await api.clearNotifications();
        showToast('Notifications cleared', 'info');
        loadNotifications();
      } catch (err) { showToast(err.message, 'error'); }
    }
  });

  loadNotifications();
}
