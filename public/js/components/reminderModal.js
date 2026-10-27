// public/js/components/reminderModal.js
import { api, showToast } from '../api.js';

export async function openReminderModal() {
  const existing = document.getElementById('reminder-modal');
  if (existing) existing.remove();

  const user = api.currentUser;
  if (!user) {
    showToast('Please log in to customize reminder preferences', 'info');
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'reminder-modal';
  modal.className = 'modal-backdrop';

  modal.innerHTML = `
    <div class="modal-content-wrap glass-modal" style="max-width: 540px; padding: 28px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(56,189,248,0.15); border: 1px solid rgba(56,189,248,0.3); display: flex; align-items: center; justify-content: center; color: #38bdf8;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div>
            <h2 style="font-size: 1.3rem; font-weight: 800; color: #fff;">Event Reminder Preferences</h2>
            <p style="font-size: 0.8rem; color: #94a3b8;">Choose when and how you want to be notified</p>
          </div>
        </div>
        <button id="modal-close-x" style="color: #94a3b8; font-size: 1.5rem; line-height: 1;">&times;</button>
      </div>

      <div id="prefs-loader" style="text-align: center; padding: 20px; color: #94a3b8;">Loading settings...</div>

      <form id="reminder-prefs-form" style="display: none;">
        <!-- Email toggle -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; margin-bottom: 12px;">
          <div>
            <div style="font-size: 0.92rem; font-weight: 700; color: #fff;">Transactional Email Reminders</div>
            <div style="font-size: 0.78rem; color: #94a3b8;">Dispatch alerts to ${user.email}</div>
          </div>
          <input type="checkbox" id="pref-email" style="width: 20px; height: 20px; accent-color: #8b5cf6;" />
        </div>

        <!-- 24h prior toggle -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; margin-bottom: 12px;">
          <div>
            <div style="font-size: 0.92rem; font-weight: 700; color: #fff;">24 Hours Before Start</div>
            <div style="font-size: 0.78rem; color: #94a3b8;">Detailed schedule recap & check-in venue reminders</div>
          </div>
          <input type="checkbox" id="pref-24h" style="width: 20px; height: 20px; accent-color: #8b5cf6;" />
        </div>

        <!-- 1h prior toggle -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; margin-bottom: 20px;">
          <div>
            <div style="font-size: 0.92rem; font-weight: 700; color: #fff;">1 Hour Final Countdown</div>
            <div style="font-size: 0.78rem; color: #94a3b8;">Last-minute notice so you never miss doors opening</div>
          </div>
          <input type="checkbox" id="pref-1h" style="width: 20px; height: 20px; accent-color: #8b5cf6;" />
        </div>

        <div style="padding: 12px; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.25); border-radius: 10px; margin-bottom: 20px; font-size: 0.78rem; color: #cbd5e1; line-height: 1.5;">
          <strong>Scheduler Engine:</strong> The automated server background worker scans events every 5 minutes and uses strict duplicate-prevention logs before sending notifications.
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
          <button type="button" id="test-scan-btn" class="btn-secondary" style="font-size: 0.82rem; padding: 8px 14px;">
            Run Test Scan Now
          </button>

          <button type="submit" class="btn-primary" style="padding: 10px 24px;">
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#modal-close-x').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  try {
    const res = await api.getReminderPreferences();
    const prefs = res.preferences;

    const emailCheck = modal.querySelector('#pref-email');
    const check24 = modal.querySelector('#pref-24h');
    const check1h = modal.querySelector('#pref-1h');

    emailCheck.checked = !!prefs.email_enabled;
    check24.checked = !!prefs.remind_24h;
    check1h.checked = !!prefs.remind_1h;

    modal.querySelector('#prefs-loader').style.display = 'none';
    modal.querySelector('#reminder-prefs-form').style.display = 'block';

    // Submit save
    modal.querySelector('#reminder-prefs-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.updateReminderPreferences({
          emailEnabled: emailCheck.checked,
          remind24h: check24.checked,
          remind1h: check1h.checked
        });
        showToast('Reminder preferences updated successfully', 'success');
        modal.remove();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    // Test scan trigger
    modal.querySelector('#test-scan-btn').addEventListener('click', async () => {
      try {
        const scanRes = await api.runReminderScan();
        showToast(`Scan complete: ${scanRes.report.remindersDispatched} reminders dispatched.`, 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

  } catch (err) {
    showToast(err.message, 'error');
    modal.remove();
  }
}
