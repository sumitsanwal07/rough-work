// public/js/pages/authPage.js - Dual Authentication System
import { api, showToast } from '../api.js';

export function renderAuthPage(container) {
  // If user is already logged in, redirect to their role dashboard
  if (api.currentUser) {
    if (api.currentUser.role === 'admin') window.location.hash = '#admin-dashboard';
    else if (api.currentUser.role === 'organizer') window.location.hash = '#organizer-dashboard';
    else window.location.hash = '#student-dashboard';
    return;
  }

  container.innerHTML = `
    <div class="container" style="padding: 50px 20px; max-width: 960px;">
      <!-- Title & Branding -->
      <div style="text-align: center; margin-bottom: 36px;">
        <div style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 9999px; background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.3); margin-bottom: 14px;">
          <span style="font-size: 0.78rem; font-weight: 700; color: #a78bfa; letter-spacing: 0.05em; text-transform: uppercase;">
            Dual Authentication Portal &bull; GRAPHITE 26
          </span>
        </div>
        <h1 style="font-size: 2.6rem; font-weight: 900; color: #fff; margin-bottom: 10px;">
          Access <span class="gradient-text">Campus Event Hub</span>
        </h1>
        <p style="font-size: 1.05rem; color: #94a3b8; max-width: 580px; margin: 0 auto;">
          Choose your dedicated entry portal below. Students discover & join events; organizers submit and manage activities.
        </p>
      </div>

      <!-- Quick 1-Click Demo Accounts Bar (Specially for Hackathon Evaluation) -->
      <div class="glass-panel" style="padding: 18px 24px; border-radius: 16px; margin-bottom: 30px; border-color: rgba(6,182,212,0.3); background: rgba(8,12,32,0.85);">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: flex; width: 10px; height: 10px; border-radius: 50%; background: #22d3ee; box-shadow: 0 0 10px #22d3ee;"></span>
            <span style="font-size: 0.85rem; font-weight: 700; color: #fff;">1-Click Demo Evaluation Accounts:</span>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button id="quick-demo-student" class="btn-secondary" style="font-size: 0.78rem; padding: 6px 12px; border-color: #3b82f6;">
              Student: Aarav
            </button>
            <button id="quick-demo-org" class="btn-secondary" style="font-size: 0.78rem; padding: 6px 12px; border-color: #8b5cf6;">
              Organizer: Priya
            </button>
            <button id="quick-demo-admin" class="btn-secondary" style="font-size: 0.78rem; padding: 6px 12px; border-color: #ec4899;">
              Admin: Dean Vikram
            </button>
          </div>
        </div>
      </div>

      <!-- Dual Auth Outer Tabs (Student Portal vs Organizer/Admin Portal) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-width: 540px; margin: 0 auto 28px; background: rgba(255,255,255,0.05); padding: 5px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08);">
        <button id="tab-btn-student" class="btn-primary" style="padding: 12px; font-size: 0.95rem; border-radius: 10px; justify-content: center;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
          Student Portal
        </button>
        <button id="tab-btn-staff" class="btn-secondary" style="padding: 12px; font-size: 0.95rem; border-radius: 10px; justify-content: center; background: transparent; border: none;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          Organizer / Admin
        </button>
      </div>

      <!-- PORTAL CONTAINER -->
      <div class="glass-card" style="max-width: 540px; margin: 0 auto; padding: 36px 32px; border-radius: 20px;">
        <div id="auth-error-msg" style="display: none; padding: 12px 16px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px; color: #f87171; font-size: 0.88rem; margin-bottom: 20px;"></div>

        <!-- ============================================== -->
        <!-- SECTION A: STUDENT PORTAL (Login & Register) -->
        <!-- ============================================== -->
        <div id="section-student-portal">
          <div style="display: flex; justify-content: center; gap: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 14px; margin-bottom: 24px;">
            <button id="student-mode-login" style="font-weight: 700; font-size: 0.95rem; color: #fff; border-bottom: 2px solid #8b5cf6; padding-bottom: 8px;">
              Student Sign In
            </button>
            <button id="student-mode-reg" style="font-weight: 600; font-size: 0.95rem; color: #94a3b8; border-bottom: 2px solid transparent; padding-bottom: 8px;">
              New Student Registration
            </button>
          </div>

          <!-- Student Login Form -->
          <form id="form-student-login">
            <div class="form-group">
              <label class="form-label">College Email / Username *</label>
              <input type="email" id="stu-login-email" class="form-control" placeholder="student@campus.edu" required />
            </div>

            <div class="form-group">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <label class="form-label">Password *</label>
                <a href="javascript:void(0)" id="stu-forgot-link" style="font-size: 0.78rem; color: #38bdf8;">Forgot Password?</a>
              </div>
              <input type="password" id="stu-login-pwd" class="form-control" placeholder="••••••••" required />
            </div>

            <button type="submit" class="btn-primary" style="width: 100%; margin-top: 14px; padding: 12px;">
              Sign In to Student Dashboard
            </button>
          </form>

          <!-- Student Registration Form -->
          <form id="form-student-reg" style="display: none;">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input type="text" id="stu-reg-name" class="form-control" placeholder="e.g. Aarav Patel" required />
            </div>

            <div class="form-group">
              <label class="form-label">Official College Email *</label>
              <input type="email" id="stu-reg-email" class="form-control" placeholder="aarav.p@campus.edu" required />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="form-group">
                <label class="form-label">Department *</label>
                <input type="text" id="stu-reg-dept" class="form-control" placeholder="e.g. Computer Science" required />
              </div>
              <div class="form-group">
                <label class="form-label">Year of Study</label>
                <select id="stu-reg-year" class="form-select">
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year" selected>3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Password * (Min 6 chars)</label>
              <input type="password" id="stu-reg-pwd" class="form-control" placeholder="••••••••" required minlength="6" />
            </div>

            <div class="form-group">
              <label class="form-label">Confirm Password *</label>
              <input type="password" id="stu-reg-pwd-confirm" class="form-control" placeholder="••••••••" required minlength="6" />
            </div>

            <button type="submit" class="btn-primary" style="width: 100%; margin-top: 14px; padding: 12px;">
              Complete Student Registration
            </button>
          </form>
        </div>

        <!-- ============================================== -->
        <!-- SECTION B: ORGANIZER & ADMIN PORTAL -->
        <!-- ============================================== -->
        <div id="section-staff-portal" style="display: none;">
          <div style="display: flex; justify-content: center; gap: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 14px; margin-bottom: 24px; flex-wrap: wrap;">
            <button id="staff-mode-org-login" style="font-weight: 700; font-size: 0.9rem; color: #fff; border-bottom: 2px solid #8b5cf6; padding-bottom: 8px;">
              Organizer Login
            </button>
            <button id="staff-mode-admin-login" style="font-weight: 600; font-size: 0.9rem; color: #94a3b8; border-bottom: 2px solid transparent; padding-bottom: 8px;">
              Admin Access
            </button>
            <button id="staff-mode-apply" style="font-weight: 600; font-size: 0.9rem; color: #94a3b8; border-bottom: 2px solid transparent; padding-bottom: 8px;">
              Request Access
            </button>
          </div>

          <!-- Organizer Login Form -->
          <form id="form-org-login">
            <div class="form-group">
              <label class="form-label">Organizer Email *</label>
              <input type="email" id="org-login-email" class="form-control" placeholder="organizer@campus.edu" required />
            </div>

            <div class="form-group">
              <label class="form-label">Password *</label>
              <input type="password" id="org-login-pwd" class="form-control" placeholder="••••••••" required />
            </div>

            <button type="submit" class="btn-primary" style="width: 100%; margin-top: 14px; padding: 12px;">
              Sign In to Organizer Studio
            </button>
          </form>

          <!-- Admin Login Form -->
          <form id="form-admin-login" style="display: none;">
            <div style="padding: 12px; background: rgba(236,72,153,0.1); border: 1px solid rgba(236,72,153,0.3); border-radius: 10px; margin-bottom: 16px; font-size: 0.8rem; color: #f472b6; line-height: 1.5;">
              <strong>Institutional Security Notice:</strong> Administrative privileges are protected and granted only to authorized university deans and system administrators.
            </div>

            <div class="form-group">
              <label class="form-label">Administrator Account *</label>
              <input type="email" id="admin-login-email" class="form-control" placeholder="admin@campus.edu" required />
            </div>

            <div class="form-group">
              <label class="form-label">Admin Security Key / Password *</label>
              <input type="password" id="admin-login-pwd" class="form-control" placeholder="••••••••" required />
            </div>

            <button type="submit" class="btn-cyan" style="width: 100%; margin-top: 14px; padding: 12px;">
              Authenticate Administrative Session
            </button>
          </form>

          <!-- Request Organizer Access Form -->
          <form id="form-org-apply" style="display: none;">
            <div style="padding: 12px; background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.3); border-radius: 10px; margin-bottom: 16px; font-size: 0.8rem; color: #38bdf8; line-height: 1.5;">
              Submit your organization details to request event publishing credentials. Reviewed by the Dean of Student Affairs.
            </div>

            <div class="form-group">
              <label class="form-label">Representative Name *</label>
              <input type="text" id="apply-name" class="form-control" placeholder="e.g. Priya Sharma" required />
            </div>

            <div class="form-group">
              <label class="form-label">Official College Email *</label>
              <input type="email" id="apply-email" class="form-control" placeholder="priya.s@campus.edu" required />
            </div>

            <div class="form-group">
              <label class="form-label">Student Organization / Club Name *</label>
              <input type="text" id="apply-club" class="form-control" placeholder="e.g. Turing Computing Society / Robotics Club" required />
            </div>

            <div class="form-group">
              <label class="form-label">Department & Advisor Name</label>
              <input type="text" id="apply-dept" class="form-control" placeholder="e.g. Computer Science Dept, Prof. Rao" />
            </div>

            <div class="form-group">
              <label class="form-label">Set Account Password * (Min 6 chars)</label>
              <input type="password" id="apply-pwd" class="form-control" placeholder="••••••••" required minlength="6" />
            </div>

            <button type="submit" class="btn-primary" style="width: 100%; margin-top: 14px; padding: 12px;">
              Submit Organizer Credentials Application
            </button>
          </form>
        </div>

        <!-- ============================================== -->
        <!-- FORGOT PASSWORD MODAL/OVERLAY CONTAINER -->
        <!-- ============================================== -->
        <div id="forgot-password-panel" style="display: none; margin-top: 20px; padding: 20px; background: rgba(14,18,42,0.9); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px;">
          <h4 style="font-size: 1.05rem; font-weight: 700; color: #fff; margin-bottom: 8px;">Reset Password</h4>
          <p style="font-size: 0.82rem; color: #94a3b8; margin-bottom: 14px;">Enter your registered email address to receive password reset verification.</p>
          
          <div class="form-group">
            <input type="email" id="reset-email-input" class="form-control" placeholder="student@campus.edu" />
          </div>

          <div id="reset-token-step" style="display: none; margin-bottom: 14px;">
            <div style="font-size: 0.8rem; color: #34d399; margin-bottom: 8px;" id="reset-msg"></div>
            <div class="form-group">
              <label class="form-label">New Password</label>
              <input type="password" id="reset-new-pwd" class="form-control" placeholder="Min 6 characters" />
            </div>
            <button type="button" id="btn-confirm-reset" class="btn-primary" style="width: 100%; padding: 10px;">Save New Password</button>
          </div>

          <div style="display: flex; gap: 8px;" id="reset-initial-btns">
            <button type="button" id="btn-send-reset" class="btn-primary" style="flex: 1; padding: 8px;">Send Reset Link</button>
            <button type="button" id="btn-cancel-reset" class="btn-secondary" style="padding: 8px 14px;">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const errorMsg = container.querySelector('#auth-error-msg');

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
  }

  function clearError() {
    errorMsg.style.display = 'none';
    errorMsg.textContent = '';
  }

  // Quick Demo Buttons Handler
  container.querySelector('#quick-demo-student').addEventListener('click', async () => {
    try {
      clearError();
      await api.login('student@campus.edu', 'Student@123');
      showToast('Welcome back, Aarav! Logged in as Student.', 'success');
      window.location.hash = '#student-dashboard';
    } catch (err) { showError(err.message); }
  });

  container.querySelector('#quick-demo-org').addEventListener('click', async () => {
    try {
      clearError();
      await api.login('organizer@campus.edu', 'Organizer@123');
      showToast('Welcome back, Priya! Logged in as Organizer.', 'success');
      window.location.hash = '#organizer-dashboard';
    } catch (err) { showError(err.message); }
  });

  container.querySelector('#quick-demo-admin').addEventListener('click', async () => {
    try {
      clearError();
      await api.login('admin@campus.edu', 'Admin@123');
      showToast('Welcome Dr. Vikram Malhotra! Logged in as Admin.', 'success');
      window.location.hash = '#admin-dashboard';
    } catch (err) { showError(err.message); }
  });

  // Switch between Student Portal and Staff Portal
  const tabStudent = container.querySelector('#tab-btn-student');
  const tabStaff = container.querySelector('#tab-btn-staff');
  const sectionStudent = container.querySelector('#section-student-portal');
  const sectionStaff = container.querySelector('#section-staff-portal');

  tabStudent.addEventListener('click', () => {
    clearError();
    tabStudent.className = 'btn-primary';
    tabStudent.style.background = '';
    tabStaff.className = 'btn-secondary';
    tabStaff.style.background = 'transparent';
    tabStaff.style.border = 'none';
    sectionStudent.style.display = 'block';
    sectionStaff.style.display = 'none';
  });

  tabStaff.addEventListener('click', () => {
    clearError();
    tabStaff.className = 'btn-primary';
    tabStaff.style.background = '';
    tabStudent.className = 'btn-secondary';
    tabStudent.style.background = 'transparent';
    tabStudent.style.border = 'none';
    sectionStaff.style.display = 'block';
    sectionStudent.style.display = 'none';
  });

  // Student Sub-tabs: Login vs Register
  const stuModeLogin = container.querySelector('#student-mode-login');
  const stuModeReg = container.querySelector('#student-mode-reg');
  const formStuLogin = container.querySelector('#form-student-login');
  const formStuReg = container.querySelector('#form-student-reg');

  stuModeLogin.addEventListener('click', () => {
    clearError();
    stuModeLogin.style.color = '#fff';
    stuModeLogin.style.borderBottomColor = '#8b5cf6';
    stuModeReg.style.color = '#94a3b8';
    stuModeReg.style.borderBottomColor = 'transparent';
    formStuLogin.style.display = 'block';
    formStuReg.style.display = 'none';
  });

  stuModeReg.addEventListener('click', () => {
    clearError();
    stuModeReg.style.color = '#fff';
    stuModeReg.style.borderBottomColor = '#8b5cf6';
    stuModeLogin.style.color = '#94a3b8';
    stuModeLogin.style.borderBottomColor = 'transparent';
    formStuReg.style.display = 'block';
    formStuLogin.style.display = 'none';
  });

  // Staff Sub-tabs: Organizer Login vs Admin Login vs Request Access
  const staffModeOrg = container.querySelector('#staff-mode-org-login');
  const staffModeAdmin = container.querySelector('#staff-mode-admin-login');
  const staffModeApply = container.querySelector('#staff-mode-apply');
  const formOrgLogin = container.querySelector('#form-org-login');
  const formAdminLogin = container.querySelector('#form-admin-login');
  const formOrgApply = container.querySelector('#form-org-apply');

  function resetStaffTabs() {
    [staffModeOrg, staffModeAdmin, staffModeApply].forEach(b => {
      b.style.color = '#94a3b8';
      b.style.borderBottomColor = 'transparent';
    });
    [formOrgLogin, formAdminLogin, formOrgApply].forEach(f => f.style.display = 'none');
  }

  staffModeOrg.addEventListener('click', () => {
    clearError();
    resetStaffTabs();
    staffModeOrg.style.color = '#fff';
    staffModeOrg.style.borderBottomColor = '#8b5cf6';
    formOrgLogin.style.display = 'block';
  });

  staffModeAdmin.addEventListener('click', () => {
    clearError();
    resetStaffTabs();
    staffModeAdmin.style.color = '#fff';
    staffModeAdmin.style.borderBottomColor = '#06b6d4';
    formAdminLogin.style.display = 'block';
  });

  staffModeApply.addEventListener('click', () => {
    clearError();
    resetStaffTabs();
    staffModeApply.style.color = '#fff';
    staffModeApply.style.borderBottomColor = '#8b5cf6';
    formOrgApply.style.display = 'block';
  });

  // FORM SUBMISSION HANDLERS

  // 1. Student Login
  formStuLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const email = container.querySelector('#stu-login-email').value.trim();
    const password = container.querySelector('#stu-login-pwd').value;
    try {
      await api.login(email, password);
      showToast('Student sign in successful!', 'success');
      window.location.hash = '#student-dashboard';
    } catch (err) { showError(err.message); }
  });

  // 2. Student Registration
  formStuReg.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const fullName = container.querySelector('#stu-reg-name').value.trim();
    const email = container.querySelector('#stu-reg-email').value.trim();
    const department = container.querySelector('#stu-reg-dept').value.trim();
    const yearOfStudy = container.querySelector('#stu-reg-year').value;
    const password = container.querySelector('#stu-reg-pwd').value;
    const confirm = container.querySelector('#stu-reg-pwd-confirm').value;

    if (password !== confirm) {
      showError('Passwords do not match. Please verify.');
      return;
    }

    try {
      await api.registerStudent({ fullName, email, department, yearOfStudy, password });
      showToast('Registration successful! Welcome to Campus Event Hub.', 'success');
      window.location.hash = '#student-dashboard';
    } catch (err) { showError(err.message); }
  });

  // 3. Organizer Login
  formOrgLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const email = container.querySelector('#org-login-email').value.trim();
    const password = container.querySelector('#org-login-pwd').value;
    try {
      const res = await api.login(email, password, 'staff');
      showToast('Organizer access authenticated!', 'success');
      window.location.hash = res.user.role === 'admin' ? '#admin-dashboard' : '#organizer-dashboard';
    } catch (err) { showError(err.message); }
  });

  // 4. Admin Login
  formAdminLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const email = container.querySelector('#admin-login-email').value.trim();
    const password = container.querySelector('#admin-login-pwd').value;
    try {
      const res = await api.login(email, password, 'staff');
      if (res.user.role !== 'admin') {
        showError('Access denied: Account is not recognized as a Campus Administrator.');
        return;
      }
      showToast('Administrative privileges verified.', 'success');
      window.location.hash = '#admin-dashboard';
    } catch (err) { showError(err.message); }
  });

  // 5. Organizer Access Request
  formOrgApply.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const fullName = container.querySelector('#apply-name').value.trim();
    const email = container.querySelector('#apply-email').value.trim();
    const clubName = container.querySelector('#apply-club').value.trim();
    const department = container.querySelector('#apply-dept').value.trim();
    const password = container.querySelector('#apply-pwd').value;

    try {
      await api.registerOrganizer({ fullName, email, clubName, department, password });
      showToast('Organizer registration approved for demo! You are now logged in.', 'success');
      window.location.hash = '#organizer-dashboard';
    } catch (err) { showError(err.message); }
  });

  // Forgot password interactions
  const forgotPanel = container.querySelector('#forgot-password-panel');
  container.querySelector('#stu-forgot-link').addEventListener('click', () => {
    forgotPanel.style.display = 'block';
  });
  container.querySelector('#btn-cancel-reset').addEventListener('click', () => {
    forgotPanel.style.display = 'none';
  });

  let resetEmailTarget = '';
  container.querySelector('#btn-send-reset').addEventListener('click', async () => {
    const email = container.querySelector('#reset-email-input').value.trim();
    if (!email) { showToast('Please enter your email', 'error'); return; }
    try {
      const res = await api.forgotPassword(email);
      resetEmailTarget = email;
      container.querySelector('#reset-msg').textContent = res.message;
      container.querySelector('#reset-token-step').style.display = 'block';
      container.querySelector('#reset-initial-btns').style.display = 'none';
    } catch (err) { showToast(err.message, 'error'); }
  });

  container.querySelector('#btn-confirm-reset').addEventListener('click', async () => {
    const newPassword = container.querySelector('#reset-new-pwd').value;
    if (!newPassword || newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      return;
    }
    try {
      const res = await api.resetPassword(resetEmailTarget, newPassword);
      showToast(res.message, 'success');
      forgotPanel.style.display = 'none';
    } catch (err) { showToast(err.message, 'error'); }
  });
}
