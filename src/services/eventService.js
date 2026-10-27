// src/services/eventService.js
const { db, uuid } = require('../db/database.js');

// List approved events for public/student discovery
function getApprovedEvents({ search = '', category = '', dateFilter = '', limit = 50, offset = 0 } = {}) {
  let query = `
    SELECT 
      e.*,
      p.full_name AS organizer_name,
      p.avatar_url AS organizer_avatar,
      (SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id AND r.status = 'confirmed') AS rsvp_count
    FROM events e
    JOIN profiles p ON e.organizer_id = p.id
    WHERE e.status = 'approved'
  `;
  const params = [];

  if (category && category !== 'All') {
    query += ` AND e.category = ?`;
    params.push(category);
  }

  if (search && search.trim().length > 0) {
    query += ` AND (e.title LIKE ? OR e.description LIKE ? OR e.venue LIKE ?)`;
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  if (dateFilter === 'today') {
    query += ` AND e.event_date = ?`;
    params.push(todayStr);
  } else if (dateFilter === 'this_week') {
    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    query += ` AND e.event_date >= ? AND e.event_date <= ?`;
    params.push(todayStr, endOfWeek.toISOString().split('T')[0]);
  } else if (dateFilter === 'this_month') {
    const endOfMonth = new Date();
    endOfMonth.setDate(endOfMonth.getDate() + 30);
    query += ` AND e.event_date >= ? AND e.event_date <= ?`;
    params.push(todayStr, endOfMonth.toISOString().split('T')[0]);
  } else if (dateFilter === 'upcoming') {
    query += ` AND e.event_date >= ?`;
    params.push(todayStr);
  }

  query += ` ORDER BY e.featured DESC, e.event_date ASC, e.start_time ASC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  return db.prepare(query).all(...params);
}

// Get single event by ID with attendee count & user RSVP status
function getEventById(eventId, currentUserId = null) {
  const event = db.prepare(`
    SELECT 
      e.*,
      p.full_name AS organizer_name,
      p.avatar_url AS organizer_avatar,
      p.email AS organizer_email,
      p.department AS organizer_dept,
      (SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id AND r.status = 'confirmed') AS rsvp_count
    FROM events e
    JOIN profiles p ON e.organizer_id = p.id
    WHERE e.id = ?
  `).get(eventId);

  if (!event) return null;

  let userRsvp = null;
  if (currentUserId) {
    userRsvp = db.prepare(`
      SELECT status, notes, created_at FROM rsvps
      WHERE event_id = ? AND user_id = ?
    `).get(eventId, currentUserId);
  }

  return {
    ...event,
    userRsvp: userRsvp ? userRsvp.status : null,
    userRsvpData: userRsvp
  };
}

// Create new event
function createEvent(organizerId, data) {
  const {
    title,
    description,
    category,
    venue,
    eventDate,
    startTime,
    endTime,
    imageUrl,
    capacity = 100,
    status = 'pending' // can be 'draft' or 'pending'
  } = data;

  if (!title || !description || !category || !venue || !eventDate || !startTime || !endTime) {
    throw new Error('Please fill in all required event details');
  }

  const validCategories = ['Technical', 'Cultural', 'Sports', 'Workshops', 'Seminars', 'Hackathons', 'Other'];
  if (!validCategories.includes(category)) {
    throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
  }

  const now = new Date().toISOString();
  const eventId = uuid();

  const finalStatus = status === 'draft' ? 'draft' : 'pending';

  db.prepare(`
    INSERT INTO events (
      id, organizer_id, title, description, category, venue,
      event_date, start_time, end_time, image_url, capacity,
      status, rejection_reason, featured, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?, ?)
  `).run(
    eventId,
    organizerId,
    title.trim(),
    description.trim(),
    category,
    venue.trim(),
    eventDate,
    startTime,
    endTime,
    imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80',
    parseInt(capacity, 10) || 100,
    finalStatus,
    now,
    now
  );

  // If submitted as pending, notify admins
  if (finalStatus === 'pending') {
    const admins = db.prepare(`SELECT id FROM profiles WHERE role = 'admin'`).all();
    for (const admin of admins) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
        VALUES (?, ?, 'New Event Pending Approval', ?, 'system', '#admin-dashboard', 0, ?)
      `).run(
        uuid(),
        admin.id,
        `Organizer submitted "${title}". Review and approve in admin dashboard.`,
        now
      );
    }
  }

  return getEventById(eventId, organizerId);
}

// Update existing event
function updateEvent(eventId, userId, userRole, data) {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  if (!event) throw new Error('Event not found');

  // Permissions: Admin can edit anything; Organizer can only edit their own drafts/pending/approved
  if (userRole !== 'admin' && event.organizer_id !== userId) {
    throw new Error('You do not have permission to edit this event');
  }

  const {
    title,
    description,
    category,
    venue,
    eventDate,
    startTime,
    endTime,
    imageUrl,
    capacity,
    status
  } = data;

  const now = new Date().toISOString();

  // If organizer edits a rejected event or draft and sets to pending
  let newStatus = event.status;
  if (userRole === 'admin') {
    if (status) newStatus = status;
  } else {
    // If organizer resubmits draft or rejected event
    if (status === 'pending') {
      newStatus = 'pending';
    } else if (status === 'draft') {
      newStatus = 'draft';
    }
  }

  db.prepare(`
    UPDATE events
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        venue = COALESCE(?, venue),
        event_date = COALESCE(?, event_date),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        image_url = COALESCE(?, image_url),
        capacity = COALESCE(?, capacity),
        status = ?,
        rejection_reason = CASE WHEN ? = 'pending' THEN NULL ELSE rejection_reason END,
        updated_at = ?
    WHERE id = ?
  `).run(
    title,
    description,
    category,
    venue,
    eventDate,
    startTime,
    endTime,
    imageUrl,
    capacity ? parseInt(capacity, 10) : event.capacity,
    newStatus,
    newStatus,
    now,
    eventId
  );

  return getEventById(eventId, userId);
}

// Admin: Get Pending Approval Queue
function getAdminPendingQueue() {
  return db.prepare(`
    SELECT 
      e.*,
      p.full_name AS organizer_name,
      p.email AS organizer_email,
      p.department AS organizer_dept
    FROM events e
    JOIN profiles p ON e.organizer_id = p.id
    WHERE e.status = 'pending'
    ORDER BY e.created_at ASC
  `).all();
}

// Admin: Approve Event
function approveEvent(eventId, adminUser) {
  if (adminUser.role !== 'admin') throw new Error('Admin authorization required');

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  if (!event) throw new Error('Event not found');

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE events
    SET status = 'approved', rejection_reason = NULL, updated_at = ?
    WHERE id = ?
  `).run(now, eventId);

  // Notify organizer
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
    VALUES (?, ?, 'Event Approved!', ?, 'event_approved', ?, 0, ?)
  `).run(
    uuid(),
    event.organizer_id,
    `Your event "${event.title}" has been approved and is now live on the campus discovery feed!`,
    `#event/${event.id}`,
    now
  );

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, user_name, action, target_type, target_id, details, created_at)
    VALUES (?, ?, ?, 'EVENT_APPROVED', 'event', ?, ?, ?)
  `).run(
    uuid(),
    adminUser.id,
    adminUser.full_name,
    eventId,
    `Approved event "${event.title}"`,
    now
  );

  return getEventById(eventId, adminUser.id);
}

// Admin: Reject Event with Reason
function rejectEvent(eventId, rejectionReason, adminUser) {
  if (adminUser.role !== 'admin') throw new Error('Admin authorization required');
  if (!rejectionReason || rejectionReason.trim().length === 0) {
    throw new Error('Rejection reason must be provided');
  }

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  if (!event) throw new Error('Event not found');

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE events
    SET status = 'rejected', rejection_reason = ?, updated_at = ?
    WHERE id = ?
  `).run(rejectionReason.trim(), now, eventId);

  // Notify organizer
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
    VALUES (?, ?, 'Event Submission Update (Needs Changes)', ?, 'event_rejected', '#organizer-dashboard', 0, ?)
  `).run(
    uuid(),
    event.organizer_id,
    `Your event "${event.title}" was not approved. Feedback: ${rejectionReason.trim()}`,
    now
  );

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, user_name, action, target_type, target_id, details, created_at)
    VALUES (?, ?, ?, 'EVENT_REJECTED', 'event', ?, ?, ?)
  `).run(
    uuid(),
    adminUser.id,
    adminUser.full_name,
    eventId,
    `Rejected event "${event.title}". Reason: ${rejectionReason.trim()}`,
    now
  );

  return getEventById(eventId, adminUser.id);
}

// Cancel Event (Admin or Organizer)
function cancelEvent(eventId, user) {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  if (!event) throw new Error('Event not found');

  if (user.role !== 'admin' && event.organizer_id !== user.id) {
    throw new Error('Not authorized to cancel this event');
  }

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE events
    SET status = 'cancelled', updated_at = ?
    WHERE id = ?
  `).run(now, eventId);

  // Notify confirmed attendees
  const attendees = db.prepare(`
    SELECT user_id FROM rsvps WHERE event_id = ? AND status = 'confirmed'
  `).all(eventId);

  for (const att of attendees) {
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
      VALUES (?, ?, 'Event Cancelled', ?, 'event_update', '#events', 0, ?)
    `).run(
      uuid(),
      att.user_id,
      `Notice: "${event.title}" has been cancelled by the organizer.`,
      now
    );
  }

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, user_name, action, target_type, target_id, details, created_at)
    VALUES (?, ?, ?, 'EVENT_CANCELLED', 'event', ?, ?, ?)
  `).run(
    uuid(),
    user.id,
    user.full_name,
    eventId,
    `Cancelled event "${event.title}"`,
    now
  );

  return { success: true, message: 'Event marked as cancelled' };
}

// Organizer: Get my created events
function getOrganizerEvents(organizerId) {
  return db.prepare(`
    SELECT 
      e.*,
      (SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id AND r.status = 'confirmed') AS rsvp_count
    FROM events e
    WHERE e.organizer_id = ?
    ORDER BY e.created_at DESC
  `).all(organizerId);
}

// Admin: Get all events across all organizers with filters
function getAllEventsAdmin({ status = '', category = '', search = '' } = {}) {
  let query = `
    SELECT 
      e.*,
      p.full_name AS organizer_name,
      p.email AS organizer_email,
      (SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id AND r.status = 'confirmed') AS rsvp_count
    FROM events e
    JOIN profiles p ON e.organizer_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'all') {
    query += ` AND e.status = ?`;
    params.push(status);
  }

  if (category && category !== 'all') {
    query += ` AND e.category = ?`;
    params.push(category);
  }

  if (search && search.trim().length > 0) {
    query += ` AND (e.title LIKE ? OR e.venue LIKE ? OR p.full_name LIKE ?)`;
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  query += ` ORDER BY e.created_at DESC`;

  return db.prepare(query).all(...params);
}

// System / Admin Stats
function getSystemStats() {
  const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
  const approvedEvents = db.prepare(`SELECT COUNT(*) as count FROM events WHERE status = 'approved'`).get().count;
  const pendingApprovals = db.prepare(`SELECT COUNT(*) as count FROM events WHERE status = 'pending'`).get().count;
  const totalStudents = db.prepare(`SELECT COUNT(*) as count FROM profiles WHERE role = 'student'`).get().count;
  const totalOrganizers = db.prepare(`SELECT COUNT(*) as count FROM profiles WHERE role = 'organizer'`).get().count;
  const totalRsvps = db.prepare(`SELECT COUNT(*) as count FROM rsvps WHERE status = 'confirmed'`).get().count;

  return {
    totalEvents,
    approvedEvents,
    pendingApprovals,
    totalStudents,
    totalOrganizers,
    totalRsvps
  };
}

module.exports = {
  getApprovedEvents,
  getEventById,
  createEvent,
  updateEvent,
  getAdminPendingQueue,
  approveEvent,
  rejectEvent,
  cancelEvent,
  getOrganizerEvents,
  getAllEventsAdmin,
  getSystemStats
};
