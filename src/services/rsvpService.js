// src/services/rsvpService.js
const { db, uuid } = require('../db/database.js');

// Toggle or Create RSVP
function toggleRsvp(userId, eventId, notes = '') {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  if (!event) throw new Error('Event not found');

  if (event.status !== 'approved') {
    throw new Error('RSVP is only available for approved events');
  }

  const existing = db.prepare('SELECT * FROM rsvps WHERE event_id = ? AND user_id = ?').get(eventId, userId);
  const now = new Date().toISOString();

  if (existing) {
    if (existing.status === 'confirmed') {
      // Cancel RSVP
      db.prepare(`
        UPDATE rsvps
        SET status = 'cancelled', updated_at = ?
        WHERE id = ?
      `).run(now, existing.id);

      // Notification
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
        VALUES (?, ?, 'RSVP Cancelled', ?, 'rsvp_confirm', ?, 0, ?)
      `).run(
        uuid(),
        userId,
        `Your RSVP for "${event.title}" has been cancelled.`,
        `#event/${event.id}`,
        now
      );

      return { status: 'cancelled', message: 'Your RSVP has been cancelled.' };
    } else {
      // Re-confirm: check capacity
      const currentCount = db.prepare(`SELECT COUNT(*) as c FROM rsvps WHERE event_id = ? AND status = 'confirmed'`).get(eventId).c;
      if (event.capacity && currentCount >= event.capacity) {
        throw new Error('This event has reached full capacity.');
      }

      db.prepare(`
        UPDATE rsvps
        SET status = 'confirmed', notes = COALESCE(?, notes), updated_at = ?
        WHERE id = ?
      `).run(notes || null, now, existing.id);

      // Notification
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
        VALUES (?, ?, 'RSVP Re-confirmed!', ?, 'rsvp_confirm', ?, 0, ?)
      `).run(
        uuid(),
        userId,
        `You have re-registered for "${event.title}" on ${event.event_date} at ${event.venue}.`,
        `#event/${event.id}`,
        now
      );

      return { status: 'confirmed', message: 'Your RSVP has been re-confirmed.' };
    }
  }

  // Check capacity
  const currentCount = db.prepare(`SELECT COUNT(*) as c FROM rsvps WHERE event_id = ? AND status = 'confirmed'`).get(eventId).c;
  if (event.capacity && currentCount >= event.capacity) {
    throw new Error('This event has reached full capacity.');
  }

  const rsvpId = uuid();
  db.prepare(`
    INSERT INTO rsvps (id, event_id, user_id, status, notes, created_at, updated_at)
    VALUES (?, ?, ?, 'confirmed', ?, ?, ?)
  `).run(rsvpId, eventId, userId, notes || '', now, now);

  // Send confirmation in-app notification
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
    VALUES (?, ?, 'RSVP Confirmed!', ?, 'rsvp_confirm', ?, 0, ?)
  `).run(
    uuid(),
    userId,
    `You are registered for "${event.title}" on ${event.event_date} at ${event.venue}. See you there!`,
    `#event/${event.id}`,
    now
  );

  return { status: 'confirmed', message: 'You have successfully RSVP\'d to this event!' };
}

// Get user's RSVPs with event details
function getUserRsvps(userId, filter = 'all') {
  let query = `
    SELECT 
      r.id AS rsvp_id,
      r.status AS rsvp_status,
      r.notes AS rsvp_notes,
      r.created_at AS rsvp_created_at,
      e.*,
      p.full_name AS organizer_name
    FROM rsvps r
    JOIN events e ON r.event_id = e.id
    JOIN profiles p ON e.organizer_id = p.id
    WHERE r.user_id = ?
  `;
  const params = [userId];

  const todayStr = new Date().toISOString().split('T')[0];

  if (filter === 'confirmed') {
    query += ` AND r.status = 'confirmed'`;
  } else if (filter === 'upcoming') {
    query += ` AND r.status = 'confirmed' AND e.event_date >= ?`;
    params.push(todayStr);
  } else if (filter === 'past') {
    query += ` AND e.event_date < ?`;
    params.push(todayStr);
  }

  query += ` ORDER BY e.event_date ASC, e.start_time ASC`;

  return db.prepare(query).all(...params);
}

// Get event attendees (authorized for organizer of that event or admin)
function getEventAttendees(eventId, requestingUser) {
  const event = db.prepare('SELECT organizer_id, title FROM events WHERE id = ?').get(eventId);
  if (!event) throw new Error('Event not found');

  if (requestingUser.role !== 'admin' && event.organizer_id !== requestingUser.id) {
    throw new Error('Not authorized to view attendee roster for this event');
  }

  const attendees = db.prepare(`
    SELECT 
      r.id AS rsvp_id,
      r.status,
      r.notes,
      r.created_at AS registered_at,
      p.id AS user_id,
      p.full_name,
      p.email,
      p.college_email,
      p.department,
      p.year_of_study,
      p.avatar_url
    FROM rsvps r
    JOIN profiles p ON r.user_id = p.id
    WHERE r.event_id = ? AND r.status = 'confirmed'
    ORDER BY r.created_at ASC
  `).all(eventId);

  return {
    eventTitle: event.title,
    count: attendees.length,
    attendees
  };
}

module.exports = {
  toggleRsvp,
  getUserRsvps,
  getEventAttendees
};
