// server.js
const http = require('node:http');
const url = require('node:url');
const fs = require('node:fs');
const path = require('node:path');

const { initializeDatabase } = require('./src/db/database.js');
const authService = require('./src/services/authService.js');
const eventService = require('./src/services/eventService.js');
const rsvpService = require('./src/services/rsvpService.js');
const notificationService = require('./src/services/notificationService.js');
const reminderService = require('./src/services/reminderService.js');
const auditService = require('./src/services/auditService.js');

// Initialize database schema and seed data
initializeDatabase();

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// JSON response helper
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Parse request body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Extract authenticated user
function authenticate(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.*)$/i);
  if (!match) return null;
  const token = match[1];
  return authService.getUserFromToken(token);
}

// Periodic Reminder Background Scanner
setInterval(() => {
  try {
    reminderService.runReminderScan();
  } catch (err) {
    console.error('Background reminder scanner error:', err);
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Main HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const user = authenticate(req);

  try {
    // ==========================================
    // API ROUTES
    // ==========================================

    // 1. AUTH ROUTES
    if (pathname === '/api/auth/register-student' && req.method === 'POST') {
      const body = await parseBody(req);
      const result = authService.registerStudent(body);
      return sendJson(res, 201, { success: true, ...result });
    }

    if (pathname === '/api/auth/register-organizer' && req.method === 'POST') {
      const body = await parseBody(req);
      const result = authService.registerOrganizer(body);
      return sendJson(res, 201, { success: true, ...result });
    }

    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await parseBody(req);
      const result = authService.login(body);
      return sendJson(res, 200, { success: true, ...result });
    }

    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      const authHeader = req.headers['authorization'];
      const match = authHeader && authHeader.match(/^Bearer\s+(.*)$/i);
      if (match) {
        authService.destroySession(match[1]);
      }
      return sendJson(res, 200, { success: true, message: 'Logged out successfully' });
    }

    if (pathname === '/api/auth/me' && req.method === 'GET') {
      if (!user) return sendJson(res, 401, { error: 'Not authenticated' });
      return sendJson(res, 200, { success: true, user });
    }

    if (pathname === '/api/auth/forgot-password' && req.method === 'POST') {
      const body = await parseBody(req);
      const result = authService.requestPasswordReset(body.email);
      return sendJson(res, 200, result);
    }

    if (pathname === '/api/auth/reset-password' && req.method === 'POST') {
      const body = await parseBody(req);
      const result = authService.resetPassword(body);
      return sendJson(res, 200, result);
    }

    if (pathname === '/api/auth/profile' && req.method === 'PUT') {
      if (!user) return sendJson(res, 401, { error: 'Not authenticated' });
      const body = await parseBody(req);
      const updated = authService.updateProfile(user.id, body);
      return sendJson(res, 200, { success: true, user: updated });
    }

    // 2. PUBLIC & STUDENT EVENTS ROUTES
    if (pathname === '/api/events' && req.method === 'GET') {
      const { search, category, dateFilter, limit, offset } = parsedUrl.query;
      const events = eventService.getApprovedEvents({
        search,
        category,
        dateFilter,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0
      });
      return sendJson(res, 200, { success: true, events });
    }

    // Match /api/events/:id
    const eventDetailMatch = pathname.match(/^\/api\/events\/([a-zA-Z0-9_-]+)$/);
    if (eventDetailMatch && req.method === 'GET') {
      const eventId = eventDetailMatch[1];
      const event = eventService.getEventById(eventId, user ? user.id : null);
      if (!event) return sendJson(res, 404, { error: 'Event not found' });
      return sendJson(res, 200, { success: true, event });
    }

    // Create Event (Organizer or Admin)
    if (pathname === '/api/events' && req.method === 'POST') {
      if (!user) return sendJson(res, 401, { error: 'Authentication required' });
      if (user.role !== 'organizer' && user.role !== 'admin') {
        return sendJson(res, 403, { error: 'Only authorized organizers or admins can submit events' });
      }
      const body = await parseBody(req);
      const newEvent = eventService.createEvent(user.id, body);
      return sendJson(res, 201, { success: true, event: newEvent });
    }

    // Update Event
    if (eventDetailMatch && req.method === 'PUT') {
      if (!user) return sendJson(res, 401, { error: 'Authentication required' });
      const eventId = eventDetailMatch[1];
      const body = await parseBody(req);
      const updated = eventService.updateEvent(eventId, user.id, user.role, body);
      return sendJson(res, 200, { success: true, event: updated });
    }

    // Cancel Event
    if (eventDetailMatch && req.method === 'DELETE') {
      if (!user) return sendJson(res, 401, { error: 'Authentication required' });
      const eventId = eventDetailMatch[1];
      const result = eventService.cancelEvent(eventId, user);
      return sendJson(res, 200, result);
    }

    // 3. RSVP ROUTES
    const rsvpMatch = pathname.match(/^\/api\/events\/([a-zA-Z0-9_-]+)\/rsvp$/);
    if (rsvpMatch && req.method === 'POST') {
      if (!user) return sendJson(res, 401, { error: 'Please log in to RSVP for campus events' });
      const eventId = rsvpMatch[1];
      const body = await parseBody(req);
      const result = rsvpService.toggleRsvp(user.id, eventId, body.notes);
      return sendJson(res, 200, { success: true, ...result });
    }

    if (pathname === '/api/rsvps/my' && req.method === 'GET') {
      if (!user) return sendJson(res, 401, { error: 'Authentication required' });
      const filter = parsedUrl.query.filter || 'all';
      const rsvps = rsvpService.getUserRsvps(user.id, filter);
      return sendJson(res, 200, { success: true, rsvps });
    }

    // Attendee List (Organizer of this event or Admin)
    const attendeesMatch = pathname.match(/^\/api\/events\/([a-zA-Z0-9_-]+)\/attendees$/);
    if (attendeesMatch && req.method === 'GET') {
      if (!user) return sendJson(res, 401, { error: 'Authentication required' });
      const eventId = attendeesMatch[1];
      const attendees = rsvpService.getEventAttendees(eventId, user);
      return sendJson(res, 200, { success: true, ...attendees });
    }

    // 4. ORGANIZER ROUTES
    if (pathname === '/api/organizer/events' && req.method === 'GET') {
      if (!user) return sendJson(res, 401, { error: 'Authentication required' });
      if (user.role !== 'organizer' && user.role !== 'admin') {
        return sendJson(res, 403, { error: 'Organizer access required' });
      }
      const events = eventService.getOrganizerEvents(user.id);
      return sendJson(res, 200, { success: true, events });
    }

    // 5. ADMIN ROUTES
    if (pathname === '/api/admin/pending' && req.method === 'GET') {
      if (!user || user.role !== 'admin') return sendJson(res, 403, { error: 'Admin access required' });
      const pendingEvents = eventService.getAdminPendingQueue();
      return sendJson(res, 200, { success: true, events: pendingEvents });
    }

    const adminApproveMatch = pathname.match(/^\/api\/admin\/events\/([a-zA-Z0-9_-]+)\/approve$/);
    if (adminApproveMatch && req.method === 'POST') {
      if (!user || user.role !== 'admin') return sendJson(res, 403, { error: 'Admin access required' });
      const eventId = adminApproveMatch[1];
      const approved = eventService.approveEvent(eventId, user);
      return sendJson(res, 200, { success: true, event: approved, message: 'Event successfully approved' });
    }

    const adminRejectMatch = pathname.match(/^\/api\/admin\/events\/([a-zA-Z0-9_-]+)\/reject$/);
    if (adminRejectMatch && req.method === 'POST') {
      if (!user || user.role !== 'admin') return sendJson(res, 403, { error: 'Admin access required' });
      const eventId = adminRejectMatch[1];
      const body = await parseBody(req);
      const rejected = eventService.rejectEvent(eventId, body.reason, user);
      return sendJson(res, 200, { success: true, event: rejected, message: 'Event rejected with feedback' });
    }

    if (pathname === '/api/admin/events' && req.method === 'GET') {
      if (!user || user.role !== 'admin') return sendJson(res, 403, { error: 'Admin access required' });
      const { status, category, search } = parsedUrl.query;
      const allEvents = eventService.getAllEventsAdmin({ status, category, search });
      return sendJson(res, 200, { success: true, events: allEvents });
    }

    if (pathname === '/api/admin/stats' && req.method === 'GET') {
      if (!user || user.role !== 'admin') return sendJson(res, 403, { error: 'Admin access required' });
      const stats = eventService.getSystemStats();
      return sendJson(res, 200, { success: true, stats });
    }

    if (pathname === '/api/admin/audit-logs' && req.method === 'GET') {
      if (!user || user.role !== 'admin') return sendJson(res, 403, { error: 'Admin access required' });
      const limit = parsedUrl.query.limit ? parseInt(parsedUrl.query.limit, 10) : 100;
      const logs = auditService.getAuditLogs(limit);
      return sendJson(res, 200, { success: true, logs });
    }

    if (pathname === '/api/admin/organizer-applications' && req.method === 'GET') {
      if (!user || user.role !== 'admin') return sendJson(res, 403, { error: 'Admin access required' });
      const status = parsedUrl.query.status || 'all';
      const apps = auditService.getOrganizerApplications(status);
      return sendJson(res, 200, { success: true, applications: apps });
    }

    const reviewAppMatch = pathname.match(/^\/api\/admin\/organizer-applications\/([a-zA-Z0-9_-]+)\/review$/);
    if (reviewAppMatch && req.method === 'POST') {
      if (!user || user.role !== 'admin') return sendJson(res, 403, { error: 'Admin access required' });
      const appId = reviewAppMatch[1];
      const body = await parseBody(req);
      const result = auditService.reviewOrganizerApplication(appId, body.status, user);
      return sendJson(res, 200, result);
    }

    if (pathname === '/api/admin/users' && req.method === 'GET') {
      if (!user || user.role !== 'admin') return sendJson(res, 403, { error: 'Admin access required' });
      const { search, role, limit } = parsedUrl.query;
      const users = auditService.getAllUsers({ search, role, limit: limit ? parseInt(limit, 10) : 100 });
      return sendJson(res, 200, { success: true, users });
    }

    const userRoleMatch = pathname.match(/^\/api\/admin\/users\/([a-zA-Z0-9_-]+)\/role$/);
    if (userRoleMatch && req.method === 'POST') {
      if (!user || user.role !== 'admin') return sendJson(res, 403, { error: 'Admin access required' });
      const targetUserId = userRoleMatch[1];
      const body = await parseBody(req);
      const result = auditService.updateUserRole(targetUserId, body.role, user);
      return sendJson(res, 200, result);
    }

    // 6. NOTIFICATIONS ROUTES
    if (pathname === '/api/notifications' && req.method === 'GET') {
      if (!user) return sendJson(res, 401, { error: 'Authentication required' });
      const limit = parsedUrl.query.limit ? parseInt(parsedUrl.query.limit, 10) : 50;
      const notifications = notificationService.getUserNotifications(user.id, limit);
      return sendJson(res, 200, { success: true, notifications });
    }

    if (pathname === '/api/notifications/unread-count' && req.method === 'GET') {
      if (!user) return sendJson(res, 200, { count: 0 });
      const count = notificationService.getUnreadCount(user.id);
      return sendJson(res, 200, { count });
    }

    const notifReadMatch = pathname.match(/^\/api\/notifications\/([a-zA-Z0-9_-]+)\/read$/);
    if (notifReadMatch && req.method === 'POST') {
      if (!user) return sendJson(res, 401, { error: 'Authentication required' });
      const notifId = notifReadMatch[1];
      const result = notificationService.markAsRead(notifId, user.id);
      return sendJson(res, 200, result);
    }

    if (pathname === '/api/notifications/read-all' && req.method === 'POST') {
      if (!user) return sendJson(res, 401, { error: 'Authentication required' });
      const result = notificationService.markAllAsRead(user.id);
      return sendJson(res, 200, result);
    }

    if (pathname === '/api/notifications' && req.method === 'DELETE') {
      if (!user) return sendJson(res, 401, { error: 'Authentication required' });
      const result = notificationService.clearAllNotifications(user.id);
      return sendJson(res, 200, result);
    }

    // 7. REMINDERS ROUTES
    if (pathname === '/api/reminders/preferences' && req.method === 'GET') {
      if (!user) return sendJson(res, 401, { error: 'Authentication required' });
      const prefs = reminderService.getPreferences(user.id);
      return sendJson(res, 200, { success: true, preferences: prefs });
    }

    if (pathname === '/api/reminders/preferences' && req.method === 'POST') {
      if (!user) return sendJson(res, 401, { error: 'Authentication required' });
      const body = await parseBody(req);
      const prefs = reminderService.updatePreferences(user.id, body);
      return sendJson(res, 200, { success: true, preferences: prefs });
    }

    // Manual Trigger for Reminder Scanner (Admin or Test)
    if (pathname === '/api/reminders/scan' && req.method === 'POST') {
      const report = reminderService.runReminderScan();
      return sendJson(res, 200, { success: true, report });
    }

    // ==========================================
    // STATIC FILE SERVING
    // ==========================================
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
    
    // Security check: ensure path is within PUBLIC_DIR
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      return res.end('Access Denied');
    }

    // If file doesn't exist, fallback to index.html for SPA client-side routing
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('open', () => {
      res.writeHead(200, { 'Content-Type': contentType });
      fileStream.pipe(res);
    });
    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
    });

  } catch (err) {
    console.error('API Error:', err);
    return sendJson(res, 400, { error: err.message || 'Internal Server Error' });
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(` Campus Event Hub — GRAPHITE 26 PS 18`);
  console.log(` Server active on: http://localhost:${PORT}`);
  console.log(` Database: Persistent SQLite (campus_hub.db)`);
  console.log(` Background Reminder Worker: Running every 5 mins`);
  console.log(`======================================================\n`);
});
