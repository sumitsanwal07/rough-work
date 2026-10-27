// public/js/components/approvalModal.js
import { api, showToast } from '../api.js';

export function openApprovalModal(event, onDecisionMade = null) {
  const existing = document.getElementById('approval-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'approval-modal';
  modal.className = 'modal-backdrop';

  // Common preset rejection reasons for college events
  const presetReasons = [
    'Venue scheduling conflict with varsity sports or exams',
    'Incomplete event agenda and safety documentation',
    'Event timing extends past authorized campus curfew hours (10:00 PM)',
    'Rooftop / elevated zone usage violates campus safety regulations',
    'High-decibel sound permits not requested for this outdoor location'
  ];

  modal.innerHTML = `
    <div class="modal-content-wrap glass-modal" style="max-width: 680px; padding: 28px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(245,158,11,0.2); border: 1px solid rgba(245,158,11,0.4); display: flex; align-items: center; justify-content: center; color: #fbbf24;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
          </div>
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: #fff;">Admin Review & Approval Queue</h2>
            <p style="font-size: 0.8rem; color: #94a3b8;">Review submission details before granting campus accreditation</p>
          </div>
        </div>
        <button id="modal-close-x" style="color: #94a3b8; font-size: 1.5rem; line-height: 1;">&times;</button>
      </div>

      <!-- Event Summary Card -->
      <div style="background: rgba(14, 18, 42, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 10px;">
          <div>
            <span class="badge badge-${event.category}" style="margin-bottom: 6px;">${event.category}</span>
            <h3 style="font-size: 1.2rem; font-weight: 700; color: #fff; line-height: 1.3;">${event.title}</h3>
          </div>
          <span class="status-badge status-pending">Pending Review</span>
        </div>

        <p style="font-size: 0.9rem; color: #cbd5e1; line-height: 1.6; margin-bottom: 14px;">${event.description}</p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; font-size: 0.82rem; color: #94a3b8; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px;">
          <div><strong style="color: #cbd5e1;">Organizer:</strong> ${event.organizer_name} (${event.organizer_dept || 'Lead'})</div>
          <div><strong style="color: #cbd5e1;">Date:</strong> ${event.event_date}</div>
          <div><strong style="color: #cbd5e1;">Timing:</strong> ${event.start_time} - ${event.end_time}</div>
          <div><strong style="color: #cbd5e1;">Venue:</strong> ${event.venue}</div>
          <div><strong style="color: #cbd5e1;">Capacity:</strong> ${event.capacity} seats</div>
        </div>
      </div>

      <!-- Rejection Feedback Section (Shown when rejecting) -->
      <div id="rejection-section" style="display: none; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <label style="font-size: 0.85rem; font-weight: 700; color: #f87171; display: block; margin-bottom: 8px;">
          Provide Constructive Feedback / Reason for Rejection *
        </label>
        <textarea id="rejection-reason-input" class="form-control" rows="3" placeholder="Explain what the organizer needs to modify or why the event cannot proceed..."></textarea>
        
        <div style="margin-top: 10px;">
          <span style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 6px;">Quick Presets:</span>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            ${presetReasons.map(r => `
              <button type="button" class="preset-reason-btn" data-reason="${r}" style="text-align: left; font-size: 0.78rem; padding: 4px 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; color: #cbd5e1;">
                &bull; ${r}
              </button>
            `).join('')}
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px;">
          <button type="button" id="cancel-rejection-btn" class="btn-secondary" style="padding: 6px 14px; font-size: 0.82rem;">Cancel</button>
          <button type="button" id="confirm-rejection-btn" class="btn-danger" style="padding: 6px 16px; font-size: 0.82rem;">Confirm Rejection</button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div id="decision-actions" style="display: flex; align-items: center; justify-content: flex-end; gap: 14px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 18px;">
        <button type="button" id="start-reject-btn" class="btn-danger" style="padding: 10px 22px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          Reject Event
        </button>

        <button type="button" id="confirm-approve-btn" class="btn-success" style="padding: 10px 26px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          Approve & Publish Live
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close listeners
  modal.querySelector('#modal-close-x').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  const rejSection = modal.querySelector('#rejection-section');
  const decisionActions = modal.querySelector('#decision-actions');
  const rejInput = modal.querySelector('#rejection-reason-input');

  // Approve action
  modal.querySelector('#confirm-approve-btn').addEventListener('click', async () => {
    try {
      await api.approveEvent(event.id);
      showToast(`"${event.title}" has been approved and published!`, 'success');
      modal.remove();
      if (onDecisionMade) onDecisionMade();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Start reject flow
  modal.querySelector('#start-reject-btn').addEventListener('click', () => {
    rejSection.style.display = 'block';
    decisionActions.style.display = 'none';
  });

  modal.querySelector('#cancel-rejection-btn').addEventListener('click', () => {
    rejSection.style.display = 'none';
    decisionActions.style.display = 'flex';
  });

  // Preset click
  modal.querySelectorAll('.preset-reason-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      rejInput.value = btn.getAttribute('data-reason');
    });
  });

  // Confirm rejection
  modal.querySelector('#confirm-rejection-btn').addEventListener('click', async () => {
    const reason = rejInput.value.trim();
    if (!reason) {
      showToast('Please provide a reason for the rejection', 'error');
      return;
    }
    try {
      await api.rejectEvent(event.id, reason);
      showToast('Event rejected and feedback sent to organizer', 'info');
      modal.remove();
      if (onDecisionMade) onDecisionMade();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
