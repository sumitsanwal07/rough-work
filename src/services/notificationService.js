// src/services/notificationService.js
const { db, uuid } = require('../db/database.js');

function getUserNotifications(userId, limit = 50) {
  return db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(userId, limit);
}

function getUnreadCount(userId) {
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM notifications
    WHERE user_id = ? AND is_read = 0
  `).get(userId);
  return result ? result.count : 0;
}

function markAsRead(notificationId, userId) {
  db.prepare(`
    UPDATE notifications
    SET is_read = 1
    WHERE id = ? AND user_id = ?
  `).run(notificationId, userId);
  return { success: true };
}

function markAllAsRead(userId) {
  db.prepare(`
    UPDATE notifications
    SET is_read = 1
    WHERE user_id = ?
  `).run(userId);
  return { success: true };
}

function clearAllNotifications(userId) {
  db.prepare(`
    DELETE FROM notifications
    WHERE user_id = ?
  `).run(userId);
  return { success: true };
}

function createNotification(userId, title, message, type = 'system', link = null) {
  const notifId = uuid();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `).run(notifId, userId, title, message, type, link, now);
  return { id: notifId, success: true };
}

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  createNotification
};
