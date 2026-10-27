// src/services/auditService.js
const { db, uuid } = require('../db/database.js');

function logAction(userId, userName, action, targetType, targetId, details) {
  const id = uuid();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, user_name, action, target_type, target_id, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId || null, userName || 'System', action, targetType, targetId || null, details, now);
  return id;
}

function getAuditLogs(limit = 100, offset = 0) {
  return db.prepare(`
    SELECT * FROM audit_logs
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
}

function getOrganizerApplications(status = 'all') {
  let query = `
    SELECT 
      a.*,
      p.full_name AS applicant_name,
      p.email AS applicant_email,
      p.avatar_url AS applicant_avatar,
      rev.full_name AS reviewer_name
    FROM organizer_applications a
    JOIN profiles p ON a.user_id = p.id
    LEFT JOIN profiles rev ON a.reviewed_by = rev.id
  `;
  const params = [];

  if (status && status !== 'all') {
    query += ` WHERE a.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY a.created_at DESC`;

  return db.prepare(query).all(...params);
}

function reviewOrganizerApplication(appId, newStatus, adminUser) {
  if (adminUser.role !== 'admin') throw new Error('Admin authorization required');
  if (!['approved', 'rejected'].includes(newStatus)) throw new Error('Invalid status');

  const app = db.prepare('SELECT * FROM organizer_applications WHERE id = ?').get(appId);
  if (!app) throw new Error('Application not found');

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE organizer_applications
    SET status = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ?
    WHERE id = ?
  `).run(newStatus, adminUser.id, now, now, appId);

  // Update applicant profile if approved
  if (newStatus === 'approved') {
    db.prepare(`
      UPDATE profiles
      SET role = 'organizer', organizer_status = 'approved', updated_at = ?
      WHERE id = ?
    `).run(now, app.user_id);

    // Notification to user
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
      VALUES (?, ?, 'Organizer Privileges Granted!', ?, 'system', '#organizer-dashboard', 0, ?)
    `).run(
      uuid(),
      app.user_id,
      `Congratulations! Your application to represent "${app.club_name}" has been approved. You can now submit campus events.`,
      now
    );

    logAction(
      adminUser.id,
      adminUser.full_name,
      'ORGANIZER_APPROVED',
      'organizer_application',
      appId,
      `Approved organizer status for user ${app.user_id} (${app.club_name})`
    );
  } else {
    db.prepare(`
      UPDATE profiles
      SET organizer_status = 'rejected', updated_at = ?
      WHERE id = ?
    `).run(now, app.user_id);

    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
      VALUES (?, ?, 'Organizer Application Update', ?, 'system', '#profile', 0, ?)
    `).run(
      uuid(),
      app.user_id,
      `Your application for organizer access was reviewed and declined. Contact Student Affairs for more details.`,
      now
    );

    logAction(
      adminUser.id,
      adminUser.full_name,
      'ORGANIZER_REJECTED',
      'organizer_application',
      appId,
      `Rejected organizer application for user ${app.user_id} (${app.club_name})`
    );
  }

  return { success: true, message: `Application ${newStatus}` };
}

function getAllUsers({ search = '', role = 'all', limit = 100 } = {}) {
  let query = `
    SELECT id, email, full_name, role, college_email, department, year_of_study, bio, avatar_url, organizer_status, created_at
    FROM profiles
    WHERE 1=1
  `;
  const params = [];

  if (role && role !== 'all') {
    query += ` AND role = ?`;
    params.push(role);
  }

  if (search && search.trim().length > 0) {
    query += ` AND (full_name LIKE ? OR email LIKE ? OR department LIKE ?)`;
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  query += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);

  return db.prepare(query).all(...params);
}

function updateUserRole(targetUserId, newRole, adminUser) {
  if (adminUser.role !== 'admin') throw new Error('Admin authorization required');
  if (!['student', 'organizer', 'admin'].includes(newRole)) throw new Error('Invalid role');

  const target = db.prepare('SELECT * FROM profiles WHERE id = ?').get(targetUserId);
  if (!target) throw new Error('User not found');

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE profiles
    SET role = ?, updated_at = ?
    WHERE id = ?
  `).run(newRole, now, targetUserId);

  logAction(
    adminUser.id,
    adminUser.full_name,
    'ROLE_UPDATED',
    'profile',
    targetUserId,
    `Changed role of ${target.full_name} (${target.email}) from ${target.role} to ${newRole}`
  );

  return { success: true, message: `Role updated to ${newRole}` };
}

module.exports = {
  logAction,
  getAuditLogs,
  getOrganizerApplications,
  reviewOrganizerApplication,
  getAllUsers,
  updateUserRole
};
