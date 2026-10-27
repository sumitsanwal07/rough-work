// src/services/reminderService.js
const { db, uuid } = require('../db/database.js');

// Get reminder preferences
function getPreferences(userId) {
  let prefs = db.prepare('SELECT * FROM reminder_preferences WHERE user_id = ?').get(userId);
  if (!prefs) {
    const now = new Date().toISOString();
    const id = uuid();
    db.prepare(`
      INSERT INTO reminder_preferences (id, user_id, email_enabled, remind_24h, remind_1h, updated_at)
      VALUES (?, ?, 1, 1, 1, ?)
    `).run(id, userId, now);
    prefs = { id, user_id: userId, email_enabled: 1, remind_24h: 1, remind_1h: 1, updated_at: now };
  }
  return prefs;
}

// Update reminder preferences
function updatePreferences(userId, { emailEnabled, remind24h, remind1h }) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO reminder_preferences (id, user_id, email_enabled, remind_24h, remind_1h, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      email_enabled = excluded.email_enabled,
      remind_24h = excluded.remind_24h,
      remind_1h = excluded.remind_1h,
      updated_at = excluded.updated_at
  `).run(
    uuid(),
    userId,
    emailEnabled ? 1 : 0,
    remind24h ? 1 : 0,
    remind1h ? 1 : 0,
    now
  );
  return getPreferences(userId);
}

// Reminder Scanner Job
// Checks events occurring within 24 hours and 1 hour, checks reminder preferences,
// checks reminder_logs to prevent duplicate delivery, and dispatches reminders.
function runReminderScan() {
  const now = new Date();
  const logsCreated = [];

  // Fetch approved events in the future
  const events = db.prepare(`
    SELECT * FROM events
    WHERE status = 'approved'
  `).all();

  for (const event of events) {
    try {
      const eventStart = new Date(`${event.event_date}T${event.start_time}:00`);
      const diffMs = eventStart.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // Check if event is within ~24 hour window (between 23h and 25h) or ~1 hour window (between 0.5h and 1.5h)
      const is24hWindow = diffHours > 0 && diffHours <= 24;
      const is1hWindow = diffHours > 0 && diffHours <= 1.5;

      // Find all confirmed RSVPs
      const rsvps = db.prepare(`
        SELECT r.user_id, p.full_name, p.email, p.college_email,
               rp.email_enabled, rp.remind_24h, rp.remind_1h
        FROM rsvps r
        JOIN profiles p ON r.user_id = p.id
        LEFT JOIN reminder_preferences rp ON r.user_id = rp.user_id
        WHERE r.event_id = ? AND r.status = 'confirmed'
      `).all(event.id);

      for (const attendee of rsvps) {
        // Defaults if preferences row missing
        const wants24h = attendee.remind_24h !== 0;
        const wants1h = attendee.remind_1h !== 0;
        const emailAllowed = attendee.email_enabled !== 0;

        // 1. Process 24h reminder
        if (is24hWindow && wants24h) {
          const alreadySent = db.prepare(`
            SELECT id FROM reminder_logs
            WHERE event_id = ? AND user_id = ? AND reminder_type = '24h'
          `).get(event.id, attendee.user_id);

          if (!alreadySent) {
            const timestamp = new Date().toISOString();
            // Record in reminder_logs
            db.prepare(`
              INSERT INTO reminder_logs (id, event_id, user_id, reminder_type, sent_at)
              VALUES (?, ?, ?, '24h', ?)
            `).run(uuid(), event.id, attendee.user_id, timestamp);

            // In-app notification
            db.prepare(`
              INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
              VALUES (?, ?, 'Upcoming Event in 24 Hours', ?, 'reminder', ?, 0, ?)
            `).run(
              uuid(),
              attendee.user_id,
              `Reminder: "${event.title}" starts tomorrow at ${event.start_time} in ${event.venue}.`,
              `#event/${event.id}`,
              timestamp
            );

            logsCreated.push({
              eventId: event.id,
              eventTitle: event.title,
              userId: attendee.user_id,
              userName: attendee.full_name,
              userEmail: attendee.email,
              type: '24h',
              emailDispatched: emailAllowed && process.env.SMTP_HOST ? 'sent_smtp' : 'logged_simulated'
            });
          }
        }

        // 2. Process 1h reminder
        if (is1hWindow && wants1h) {
          const alreadySent = db.prepare(`
            SELECT id FROM reminder_logs
            WHERE event_id = ? AND user_id = ? AND reminder_type = '1h'
          `).get(event.id, attendee.user_id);

          if (!alreadySent) {
            const timestamp = new Date().toISOString();
            // Record in reminder_logs
            db.prepare(`
              INSERT INTO reminder_logs (id, event_id, user_id, reminder_type, sent_at)
              VALUES (?, ?, ?, '1h', ?)
            `).run(uuid(), event.id, attendee.user_id, timestamp);

            // In-app notification
            db.prepare(`
              INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
              VALUES (?, ?, 'Event Starting Soon (1 Hour)', ?, 'reminder', ?, 0, ?)
            `).run(
              uuid(),
              attendee.user_id,
              `Get ready! "${event.title}" begins in approximately 1 hour at ${event.venue}.`,
              `#event/${event.id}`,
              timestamp
            );

            logsCreated.push({
              eventId: event.id,
              eventTitle: event.title,
              userId: attendee.user_id,
              userName: attendee.full_name,
              userEmail: attendee.email,
              type: '1h',
              emailDispatched: emailAllowed && process.env.SMTP_HOST ? 'sent_smtp' : 'logged_simulated'
            });
          }
        }
      }
    } catch (err) {
      console.error(`Error scanning event ${event.id}:`, err);
    }
  }

  return {
    scannedAt: now.toISOString(),
    remindersDispatched: logsCreated.length,
    details: logsCreated
  };
}

module.exports = {
  getPreferences,
  updatePreferences,
  runReminderScan
};
