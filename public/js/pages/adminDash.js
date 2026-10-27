// public/js/pages/adminDash.js - Institutional Admin Dashboard & Approval Queue
import { api, showToast } from '../api.js';
import { openApprovalModal } from '../components/approvalModal.js';
import { openAttendeeModal } from '../components/attendeeModal.js';

export async function renderAdminDashboard(container) {
  const user = api.currentUser;
  if (!user || user.role !== 'admin') {
    showToast('Administrator security clearance required', 'error');
    window.location.hash = '#login';
    return;
  }

  container.innerHTML = `
    <div class="container" style="padding: 40px 20px 80px;">
      <!-- Admin Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span class="badge badge-Hackathons">Campus Administration</span>
            <span style="font-size: 0.8rem; color: #f472b6;">Dean of Student Affairs Office</span>
          </div>
          <h1 style="font-size: 2.2rem; font-weight: 800; color: #fff;">Institutional Governance Hub</h1>
          <p style="font-size: 0.92rem; color: #94a3b8;">Review event submissions, authorize student organizations, and monitor campus pulse</p>
        </div>

        <div style="display: flex; gap: 10px;">
          <button id="admin-manual-scan-btn" class="btn-secondary" style="padding: 10px 18px; font-size: 0.85rem;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Trigger Reminder Scan
          </button>
        </div>
      </div>

      <!-- KPI Statistics Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 36px;">
        <div class="glass-card" style="padding: 18px;">
          <div style="font-size: 1.8rem; font-weight: 800; color: #fff;" id="admin-stat-events">0</div>
          <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Total Events</div>
        </div>

        <div class="glass-card" style="padding: 18px; border-color: rgba(245,158,11,0.4);">
          <div style="font-size: 1.8rem; font-weight: 800; color: #fbbf24;" id="admin-stat-pending">0</div>
          <div style="font-size: 0.75rem; font-weight: 700; color: #fbbf24; text-transform: uppercase;">Pending Review Queue</div>
        </div>

        <div class="glass-card" style="padding: 18px;">
          <div style="font-size: 1.8rem; font-weight: 800; color: #34d399;" id="admin-stat-approved">0</div>
          <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Approved Events</div>
        </div>

        <div class="glass-card" style="padding: 18px;">
          <div style="font-size: 1.8rem; font-weight: 800; color: #38bdf8;" id="admin-stat-students">0</div>
          <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Registered Students</div>
        </div>

        <div class="glass-card" style="padding: 18px;">
          <div style="font-size: 1.8rem; font-weight: 800; color: #a78bfa;" id="admin-stat-rsvps">0</div>
          <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Total Active RSVPs</div>
        </div>

        <div class="glass-card" style="padding: 18px;">
          <div style="font-size: 1.8rem; font-weight: 800; color: #f472b6;" id="admin-stat-orgs">0</div>
          <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Authorized Clubs</div>
        </div>
      </div>

      <!-- Admin Primary Navigation Tabs -->
      <div style="display: flex; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 28px; overflow-x: auto; padding-bottom: 10px;">
        <button id="admin-tab-queue" class="btn-primary" style="padding: 9px 20px; font-size: 0.88rem; border-radius: 10px;">
          Pending Queue (<span id="queue-badge-count">0</span>)
        </button>
        <button id="admin-tab-events" class="btn-secondary" style="padding: 9px 20px; font-size: 0.88rem; border-radius: 10px; background: transparent; border: none;">
          All Campus Events Table
        </button>
        <button id="admin-tab-org-apps" class="btn-secondary" style="padding: 9px 20px; font-size: 0.88rem; border-radius: 10px; background: transparent; border: none;">
          Organizer Applications (<span id="apps-badge-count">0</span>)
        </button>
        <button id="admin-tab-users" class="btn-secondary" style="padding: 9px 20px; font-size: 0.88rem; border-radius: 10px; background: transparent; border: none;">
          User & Role Governance
        </button>
        <button id="admin-tab-audit" class="btn-secondary" style="padding: 9px 20px; font-size: 0.88rem; border-radius: 10px; background: transparent; border: none;">
          Audit Activity Trail
        </button>
      </div>

      <!-- VIEW 1: PENDING APPROVAL QUEUE -->
      <section id="view-admin-queue">
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 1.4rem; font-weight: 800; color: #fff;">Submissions Requiring Institutional Approval</h2>
          <p style="font-size: 0.85rem; color: #94a3b8;">Review event details, venue safety, and timing before publishing to student feeds</p>
        </div>

        <div id="pending-queue-list" style="display: flex; flex-direction: column; gap: 16px;">
          <div style="padding: 30px; text-align: center; color: #94a3b8;">Loading queue...</div>
        </div>
      </section>

      <!-- VIEW 2: ALL EVENTS TABLE -->
      <section id="view-admin-events" style="display: none;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 1.4rem; font-weight: 800; color: #fff;">Event Management Directory</h2>
            <p style="font-size: 0.85rem; color: #94a3b8;">Unpublish, cancel, or monitor any campus event across all organizers</p>
          </div>

          <div style="display: flex; gap: 8px;">
            <select id="admin-filter-status" class="form-select" style="width: auto; padding: 6px 12px; font-size: 0.82rem;">
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="draft">Draft</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div style="overflow-x: auto; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; background: var(--bg-card);">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); color: #94a3b8; font-size: 0.75rem; text-transform: uppercase;">
                <th style="padding: 14px 16px;">Event</th>
                <th style="padding: 14px 16px;">Organizer</th>
                <th style="padding: 14px 16px;">Date & Timing</th>
                <th style="padding: 14px 16px;">Venue</th>
                <th style="padding: 14px 16px;">RSVPs</th>
                <th style="padding: 14px 16px;">Status</th>
                <th style="padding: 14px 16px; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody id="all-events-table-body">
              <tr><td colspan="7" style="padding: 30px; text-align: center; color: #94a3b8;">Loading events...</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- VIEW 3: ORGANIZER APPLICATIONS QUEUE -->
      <section id="view-admin-org-apps" style="display: none;">
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 1.4rem; font-weight: 800; color: #fff;">Club Leadership & Organizer Applications</h2>
          <p style="font-size: 0.85rem; color: #94a3b8;">Students requesting official privileges to represent student societies and post events</p>
        </div>

        <div id="org-apps-list" style="display: flex; flex-direction: column; gap: 14px;">
          <div style="padding: 30px; text-align: center; color: #94a3b8;">Loading applications...</div>
        </div>
      </section>

      <!-- VIEW 4: USER & ROLE MANAGEMENT -->
      <section id="view-admin-users" style="display: none;">
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 1.4rem; font-weight: 800; color: #fff;">Campus User Directory & Access Control</h2>
          <p style="font-size: 0.85rem; color: #94a3b8;">Elevate or adjust role permissions (Student, Organizer, Admin)</p>
        </div>

        <div style="overflow-x: auto; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; background: var(--bg-card);">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); color: #94a3b8; font-size: 0.75rem; text-transform: uppercase;">
                <th style="padding: 14px 16px;">User</th>
                <th style="padding: 14px 16px;">Email</th>
                <th style="padding: 14px 16px;">Department</th>
                <th style="padding: 14px 16px;">Current Role</th>
                <th style="padding: 14px 16px; text-align: right;">Change Role</th>
              </tr>
            </thead>
            <tbody id="users-table-body">
              <tr><td colspan="5" style="padding: 30px; text-align: center; color: #94a3b8;">Loading users...</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- VIEW 5: AUDIT ACTIVITY TRAIL -->
      <section id="view-admin-audit" style="display: none;">
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 1.4rem; font-weight: 800; color: #fff;">Institutional Audit Trail Log</h2>
          <p style="font-size: 0.85rem; color: #94a3b8;">Cryptographically timestamped record of administrative and approval decisions</p>
        </div>

        <div id="audit-logs-container" style="display: flex; flex-direction: column; gap: 10px;">
          <div style="padding: 30px; text-align: center; color: #94a3b8;">Loading audit logs...</div>
        </div>
      </section>
    </div>
  `;

  // Tab switching logic
  const tabs = [
    { btn: '#admin-tab-queue', view: '#view-admin-queue' },
    { btn: '#admin-tab-events', view: '#view-admin-events' },
    { btn: '#admin-tab-org-apps', view: '#view-admin-org-apps' },
    { btn: '#admin-tab-users', view: '#view-admin-users' },
    { btn: '#admin-tab-audit', view: '#view-admin-audit' }
  ];

  tabs.forEach(t => {
    container.querySelector(t.btn).addEventListener('click', () => {
      tabs.forEach(other => {
        const b = container.querySelector(other.btn);
        b.className = 'btn-secondary';
        b.style.background = 'transparent';
        b.style.border = 'none';
        container.querySelector(other.view).style.display = 'none';
      });
      const activeB = container.querySelector(t.btn);
      activeB.className = 'btn-primary';
      activeB.style.background = '';
      container.querySelector(t.view).style.display = 'block';
    });
  });

  // Manual reminder scan trigger
  container.querySelector('#admin-manual-scan-btn').addEventListener('click', async () => {
    try {
      const res = await api.runReminderScan();
      showToast(`Reminder Scan Complete: ${res.report.remindersDispatched} reminders dispatched.`, 'success');
      loadAllAdminData();
    } catch (err) { showToast(err.message, 'error'); }
  });

  // Master Data Loader
  async function loadAllAdminData() {
    try {
      // 1. Stats
      const statsRes = await api.getAdminStats();
      const s = statsRes.stats;
      container.querySelector('#admin-stat-events').textContent = s.totalEvents;
      container.querySelector('#admin-stat-pending').textContent = s.pendingApprovals;
      container.querySelector('#admin-stat-approved').textContent = s.approvedEvents;
      container.querySelector('#admin-stat-students').textContent = s.totalStudents;
      container.querySelector('#admin-stat-rsvps').textContent = s.totalRsvps;
      container.querySelector('#admin-stat-orgs').textContent = s.totalOrganizers;
      container.querySelector('#queue-badge-count').textContent = s.pendingApprovals;

      // 2. Pending Approval Queue
      const queueRes = await api.getAdminPending();
      const queueContainer = container.querySelector('#pending-queue-list');
      queueContainer.innerHTML = '';

      if (!queueRes.events || queueRes.events.length === 0) {
        queueContainer.innerHTML = `
          <div class="glass-card" style="padding: 40px; text-align: center; color: #34d399;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" style="margin: 0 auto 10px; display: block;">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h3 style="font-size: 1.2rem; font-weight: 700; color: #fff; margin-bottom: 4px;">Approval Queue is Clear</h3>
            <p style="font-size: 0.85rem; color: #94a3b8;">All event submissions have been reviewed and accredited.</p>
          </div>
        `;
      } else {
        for (const evt of queueRes.events) {
          const item = document.createElement('div');
          item.className = 'glass-card';
          item.style.padding = '20px 24px';
          item.style.display = 'flex';
          item.style.justifyContent = 'space-between';
          item.style.alignItems = 'center';
          item.style.flexWrap = 'wrap';
          item.style.gap = '14px';

          item.innerHTML = `
            <div style="display: flex; gap: 16px; align-items: center; max-width: 650px;">
              <img src="${evt.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=160'}" alt="${evt.title}" style="width: 70px; height: 70px; border-radius: 10px; object-fit: cover;" />
              <div>
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                  <span class="badge badge-${evt.category}">${evt.category}</span>
                  <span style="font-size: 0.78rem; color: #94a3b8;">Organizer: <strong style="color: #cbd5e1;">${evt.organizer_name}</strong></span>
                </div>
                <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff; margin-bottom: 4px;">${evt.title}</h3>
                <div style="font-size: 0.8rem; color: #94a3b8; display: flex; gap: 12px; flex-wrap: wrap;">
                  <span>📅 ${evt.event_date}</span>
                  <span>⏰ ${evt.start_time} - ${evt.end_time}</span>
                  <span>📍 ${evt.venue}</span>
                  <span>👥 ${evt.capacity} seats</span>
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 10px;">
              <button class="btn-primary btn-review-queue" style="padding: 9px 20px; font-size: 0.85rem;">
                Review & Decide
              </button>
            </div>
          `;

          item.querySelector('.btn-review-queue').addEventListener('click', () => {
            openApprovalModal(evt, loadAllAdminData);
          });

          queueContainer.appendChild(item);
        }
      }

      // 3. All Campus Events Table
      const allEventsRes = await api.getAdminAllEvents();
      const tableBody = container.querySelector('#all-events-table-body');
      tableBody.innerHTML = '';

      for (const e of (allEventsRes.events || [])) {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

        tr.innerHTML = `
          <td style="padding: 14px 16px;">
            <div style="font-weight: 700; color: #fff;">${e.title}</div>
            <span class="badge badge-${e.category}" style="font-size: 0.65rem; margin-top: 4px;">${e.category}</span>
          </td>
          <td style="padding: 14px 16px; color: #cbd5e1;">${e.organizer_name}</td>
          <td style="padding: 14px 16px; color: #94a3b8;">
            <div>${e.event_date}</div>
            <div style="font-size: 0.75rem;">${e.start_time}</div>
          </td>
          <td style="padding: 14px 16px; color: #94a3b8;">${e.venue}</td>
          <td style="padding: 14px 16px; color: #38bdf8; font-weight: 700;">${e.rsvp_count || 0} / ${e.capacity || 100}</td>
          <td style="padding: 14px 16px;">
            <span class="status-badge status-${e.status}">${e.status}</span>
          </td>
          <td style="padding: 14px 16px; text-align: right;">
            <div style="display: flex; justify-content: flex-end; gap: 6px;">
              <button class="btn-secondary btn-admin-roster" style="padding: 5px 10px; font-size: 0.75rem;">Roster</button>
              ${e.status !== 'cancelled' ? `
                <button class="btn-danger btn-admin-cancel" style="padding: 5px 10px; font-size: 0.75rem;">Cancel</button>
              ` : ''}
            </div>
          </td>
        `;

        tr.querySelector('.btn-admin-roster').addEventListener('click', () => {
          openAttendeeModal(e.id);
        });

        const cancelBtn = tr.querySelector('.btn-admin-cancel');
        if (cancelBtn) {
          cancelBtn.addEventListener('click', async () => {
            if (confirm(`Admin Action: Cancel event "${e.title}"? Attendees will receive cancellation notices.`)) {
              try {
                await api.cancelEvent(e.id);
                showToast(`"${e.title}" has been cancelled.`, 'info');
                loadAllAdminData();
              } catch (err) { showToast(err.message, 'error'); }
            }
          });
        }

        tableBody.appendChild(tr);
      }

      // Filter status change in events table
      container.querySelector('#admin-filter-status').addEventListener('change', async (ev) => {
        const filteredRes = await api.getAdminAllEvents({ status: ev.target.value });
        tableBody.innerHTML = '';
        for (const e of (filteredRes.events || [])) {
          const tr = document.createElement('tr');
          tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
          tr.innerHTML = `
            <td style="padding: 14px 16px;">
              <div style="font-weight: 700; color: #fff;">${e.title}</div>
              <span class="badge badge-${e.category}" style="font-size: 0.65rem;">${e.category}</span>
            </td>
            <td style="padding: 14px 16px; color: #cbd5e1;">${e.organizer_name}</td>
            <td style="padding: 14px 16px; color: #94a3b8;">${e.event_date}</td>
            <td style="padding: 14px 16px; color: #94a3b8;">${e.venue}</td>
            <td style="padding: 14px 16px; color: #38bdf8; font-weight: 700;">${e.rsvp_count || 0}</td>
            <td style="padding: 14px 16px;"><span class="status-badge status-${e.status}">${e.status}</span></td>
            <td style="padding: 14px 16px; text-align: right;">
              <button class="btn-secondary btn-admin-roster" style="padding: 5px 10px; font-size: 0.75rem;">Roster</button>
            </td>
          `;
          tr.querySelector('.btn-admin-roster').addEventListener('click', () => openAttendeeModal(e.id));
          tableBody.appendChild(tr);
        }
      });

      // 4. Organizer Applications
      const appsRes = await api.getOrganizerApplications();
      const apps = appsRes.applications || [];
      const pendingApps = apps.filter(a => a.status === 'pending');
      container.querySelector('#apps-badge-count').textContent = pendingApps.length;

      const appsList = container.querySelector('#org-apps-list');
      appsList.innerHTML = '';

      if (apps.length === 0) {
        appsList.innerHTML = '<div style="padding: 30px; text-align: center; color: #94a3b8;">No applications found.</div>';
      } else {
        for (const app of apps) {
          const card = document.createElement('div');
          card.className = 'glass-card';
          card.style.padding = '18px 22px';
          card.style.display = 'flex';
          card.style.justifyContent = 'space-between';
          card.style.alignItems = 'center';
          card.style.flexWrap = 'wrap';
          card.style.gap = '12px';

          card.innerHTML = `
            <div>
              <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                <span class="badge badge-Workshops">${app.club_name}</span>
                <span class="status-badge status-${app.status}">${app.status}</span>
              </div>
              <div style="font-size: 1rem; font-weight: 700; color: #fff;">${app.applicant_name} (${app.applicant_email})</div>
              <div style="font-size: 0.85rem; color: #cbd5e1; margin-top: 4px;">Department: ${app.department}</div>
              <div style="font-size: 0.82rem; color: #94a3b8; margin-top: 2px;">Reason: "${app.reason}"</div>
            </div>

            ${app.status === 'pending' ? `
              <div style="display: flex; gap: 8px;">
                <button class="btn-danger btn-reject-app" style="padding: 7px 14px; font-size: 0.8rem;">Decline</button>
                <button class="btn-success btn-approve-app" style="padding: 7px 16px; font-size: 0.8rem;">Approve Organizer</button>
              </div>
            ` : `
              <div style="font-size: 0.78rem; color: #94a3b8;">Processed</div>
            `}
          `;

          const approveBtn = card.querySelector('.btn-approve-app');
          if (approveBtn) {
            approveBtn.addEventListener('click', async () => {
              try {
                await api.reviewOrganizerApp(app.id, 'approved');
                showToast(`Organizer privileges granted to ${app.applicant_name}!`, 'success');
                loadAllAdminData();
              } catch (err) { showToast(err.message, 'error'); }
            });
          }

          const rejectBtn = card.querySelector('.btn-reject-app');
          if (rejectBtn) {
            rejectBtn.addEventListener('click', async () => {
              try {
                await api.reviewOrganizerApp(app.id, 'rejected');
                showToast(`Application declined.`, 'info');
                loadAllAdminData();
              } catch (err) { showToast(err.message, 'error'); }
            });
          }

          appsList.appendChild(card);
        }
      }

      // 5. Users Governance
      const usersRes = await api.getUsers();
      const usersTableBody = container.querySelector('#users-table-body');
      usersTableBody.innerHTML = '';

      for (const u of (usersRes.users || [])) {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

        tr.innerHTML = `
          <td style="padding: 14px 16px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${u.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'}" alt="${u.full_name}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
              <div>
                <div style="font-weight: 700; color: #fff;">${u.full_name}</div>
                <div style="font-size: 0.75rem; color: #94a3b8;">${u.year_of_study || 'Campus Member'}</div>
              </div>
            </div>
          </td>
          <td style="padding: 14px 16px; color: #cbd5e1;">${u.email}</td>
          <td style="padding: 14px 16px; color: #94a3b8;">${u.department || 'General'}</td>
          <td style="padding: 14px 16px;">
            <span class="badge ${u.role === 'admin' ? 'badge-Hackathons' : u.role === 'organizer' ? 'badge-Workshops' : 'badge-Technical'}">${u.role}</span>
          </td>
          <td style="padding: 14px 16px; text-align: right;">
            <select class="form-select user-role-select" style="width: auto; padding: 4px 10px; font-size: 0.78rem; display: inline-block;">
              <option value="student" ${u.role === 'student' ? 'selected' : ''}>Student</option>
              <option value="organizer" ${u.role === 'organizer' ? 'selected' : ''}>Organizer</option>
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          </td>
        `;

        const select = tr.querySelector('.user-role-select');
        select.addEventListener('change', async () => {
          try {
            await api.updateUserRole(u.id, select.value);
            showToast(`Role updated for ${u.full_name} to ${select.value}`, 'success');
            loadAllAdminData();
          } catch (err) { showToast(err.message, 'error'); }
        });

        usersTableBody.appendChild(tr);
      }

      // 6. Audit Trail Logs
      const auditRes = await api.getAuditLogs(30);
      const auditContainer = container.querySelector('#audit-logs-container');
      auditContainer.innerHTML = '';

      for (const log of (auditRes.logs || [])) {
        const item = document.createElement('div');
        item.style.padding = '12px 18px';
        item.style.background = 'rgba(255,255,255,0.02)';
        item.style.border = '1px solid rgba(255,255,255,0.05)';
        item.style.borderRadius = '10px';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.fontSize = '0.85rem';

        let dateStr = log.created_at;
        try {
          dateStr = new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) {}

        item.innerHTML = `
          <div>
            <span style="font-weight: 700; color: #a78bfa; margin-right: 8px;">[${log.action}]</span>
            <span style="color: #fff;">${log.details}</span>
            <span style="color: #94a3b8; font-size: 0.78rem; margin-left: 8px;">by ${log.user_name || 'System'}</span>
          </div>
          <div style="color: #64748b; font-size: 0.75rem; white-space: nowrap;">${dateStr}</div>
        `;
        auditContainer.appendChild(item);
      }

    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  }

  loadAllAdminData();
}
