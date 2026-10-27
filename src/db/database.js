// src/db/database.js
const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const path = require('node:path');

const DB_PATH = path.join(process.cwd(), 'campus_hub.db');
const db = new DatabaseSync(DB_PATH);

// Helper for generating UUID v4
function uuid() {
  return crypto.randomUUID();
}

// Password hashing helper using PBKDF2
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const testHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return testHash === hash;
}

// Initialize tables
function initializeDatabase() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'organizer', 'admin')),
      college_email TEXT,
      department TEXT,
      year_of_study TEXT,
      bio TEXT,
      avatar_url TEXT,
      organizer_status TEXT DEFAULT 'none' CHECK(organizer_status IN ('none', 'pending', 'approved', 'rejected')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      organizer_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('Technical', 'Cultural', 'Sports', 'Workshops', 'Seminars', 'Hackathons', 'Other')),
      venue TEXT NOT NULL,
      event_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      image_url TEXT,
      capacity INTEGER DEFAULT 100,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('draft', 'pending', 'approved', 'rejected', 'cancelled')),
      rejection_reason TEXT,
      featured INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rsvps (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'cancelled')),
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(event_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('rsvp_confirm', 'event_update', 'event_approved', 'event_rejected', 'reminder', 'system')),
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reminder_preferences (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      email_enabled INTEGER DEFAULT 1,
      remind_24h INTEGER DEFAULT 1,
      remind_1h INTEGER DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reminder_logs (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      reminder_type TEXT NOT NULL CHECK(reminder_type IN ('24h', '1h')),
      sent_at TEXT NOT NULL,
      UNIQUE(event_id, user_id, reminder_type)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      user_name TEXT,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS organizer_applications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      club_name TEXT NOT NULL,
      department TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      reviewed_by TEXT REFERENCES profiles(id),
      reviewed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_events_status_date ON events(status, event_date);
    CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
    CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
    CREATE INDEX IF NOT EXISTS idx_rsvps_user ON rsvps(user_id);
    CREATE INDEX IF NOT EXISTS idx_rsvps_event ON rsvps(event_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  `);

  seedDataIfEmpty();
}

// Seed Initial Data
function seedDataIfEmpty() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM profiles').get().count;
  if (userCount > 0) return;

  const now = new Date().toISOString();

  // 1. Seed Users
  // Super Admin
  const adminSalt = crypto.randomBytes(16).toString('hex');
  const adminHash = hashPassword('Admin@123', adminSalt).hash;
  const adminId = 'u_admin_001';

  // Lead Organizer
  const orgSalt = crypto.randomBytes(16).toString('hex');
  const orgHash = hashPassword('Organizer@123', orgSalt).hash;
  const orgId = 'u_org_001';

  // Second Organizer
  const org2Salt = crypto.randomBytes(16).toString('hex');
  const org2Hash = hashPassword('Organizer@123', org2Salt).hash;
  const org2Id = 'u_org_002';

  // Student
  const studentSalt = crypto.randomBytes(16).toString('hex');
  const studentHash = hashPassword('Student@123', studentSalt).hash;
  const studentId = 'u_student_001';

  // Second Student
  const student2Salt = crypto.randomBytes(16).toString('hex');
  const student2Hash = hashPassword('Student@123', student2Salt).hash;
  const student2Id = 'u_student_002';

  const insertProfile = db.prepare(`
    INSERT INTO profiles (
      id, email, password_hash, salt, full_name, role,
      college_email, department, year_of_study, bio,
      avatar_url, organizer_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertProfile.run(
    adminId,
    'admin@campus.edu',
    adminHash,
    adminSalt,
    'Dr. Vikram Malhotra (Dean of Student Affairs)',
    'admin',
    'admin@campus.edu',
    'Administration',
    'Faculty',
    'Campus Dean overseeing student activities, event accreditations, and community compliance.',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'approved',
    now,
    now
  );

  insertProfile.run(
    orgId,
    'organizer@campus.edu',
    orgHash,
    orgSalt,
    'Priya Sharma (Tech Club Lead)',
    'organizer',
    'priya.s@campus.edu',
    'Computer Science & Engineering',
    '4th Year',
    'Lead Coordinator of Turing Computing Society & GRAPHITE Hackathon Core Committee.',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'approved',
    now,
    now
  );

  insertProfile.run(
    org2Id,
    'cultural@campus.edu',
    org2Hash,
    org2Salt,
    'Rohan Varma (Cultural Secretary)',
    'organizer',
    'rohan.v@campus.edu',
    'Media & Design',
    '3rd Year',
    'Convenor of Campus Arts & Music Guild. Organizing Aura 2026 and campus fest showcases.',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'approved',
    now,
    now
  );

  insertProfile.run(
    studentId,
    'student@campus.edu',
    studentHash,
    studentSalt,
    'Aarav Patel',
    'student',
    'aarav.p@campus.edu',
    'Information Technology',
    '3rd Year',
    'Competitive programmer, AI enthusiast, and active campus sports participant.',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    'none',
    now,
    now
  );

  insertProfile.run(
    student2Id,
    'ananya@campus.edu',
    student2Hash,
    student2Salt,
    'Ananya Sen',
    'student',
    'ananya.s@campus.edu',
    'Electronics & Communication',
    '2nd Year',
    'Robotics enthusiast and debate team member.',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'none',
    now,
    now
  );

  // 2. Reminder preferences
  const insertPrefs = db.prepare(`
    INSERT INTO reminder_preferences (id, user_id, email_enabled, remind_24h, remind_1h, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertPrefs.run(uuid(), adminId, 1, 1, 1, now);
  insertPrefs.run(uuid(), orgId, 1, 1, 1, now);
  insertPrefs.run(uuid(), org2Id, 1, 1, 1, now);
  insertPrefs.run(uuid(), studentId, 1, 1, 1, now);
  insertPrefs.run(uuid(), student2Id, 1, 1, 1, now);

  // Calculate dynamic dates relative to current execution
  const baseDate = new Date();
  const formatOffsetDate = (daysAhead) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  // 3. Seed Events
  const insertEvent = db.prepare(`
    INSERT INTO events (
      id, organizer_id, title, description, category, venue,
      event_date, start_time, end_time, image_url, capacity,
      status, rejection_reason, featured, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const events = [
    {
      id: 'evt_001',
      organizer_id: orgId,
      title: 'GRAPHITE 26 Hackathon: Code the Future',
      description: 'The flagship 36-hour collegiate hackathon bringing together over 300 developers, designers, and innovators. Compete for $15,000+ in prizes, network with tier-1 tech recruiters, and pitch to leading VC mentors. Hardware kits, free cloud credits, midnight pizzas, and swag packs provided.',
      category: 'Hackathons',
      venue: 'Main Auditorium & Innovation Lab Complex',
      event_date: formatOffsetDate(2),
      start_time: '09:00',
      end_time: '21:00',
      image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1000&auto=format&fit=crop&q=80',
      capacity: 350,
      status: 'approved',
      rejection_reason: null,
      featured: 1
    },
    {
      id: 'evt_002',
      organizer_id: org2Id,
      title: 'Aura 2026: Campus Battle of the Bands & DJ Night',
      description: 'The biggest musical night of the semester! Witness 8 collegiate rock, indie, and fusion bands battle it out on stage, followed by an electrifying sunset EDM set by DJ Zenith. Food trucks, neon installations, and student artisan stalls on site.',
      category: 'Cultural',
      venue: 'Open Air Amphitheatre',
      event_date: formatOffsetDate(4),
      start_time: '17:30',
      end_time: '23:00',
      image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1000&auto=format&fit=crop&q=80',
      capacity: 600,
      status: 'approved',
      rejection_reason: null,
      featured: 1
    },
    {
      id: 'evt_003',
      organizer_id: orgId,
      title: 'Deep Learning & LLM Fine-Tuning Workshop',
      description: 'A hands-on masterclass on building generative AI pipelines, LoRA fine-tuning for open-source models (Llama 3 / Mistral), and vector database integration using LangChain. Bring your laptop. GPU instances provided by our cloud sponsor.',
      category: 'Workshops',
      venue: 'Turing Computer Lab 3B',
      event_date: formatOffsetDate(1),
      start_time: '14:00',
      end_time: '18:00',
      image_url: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1000&auto=format&fit=crop&q=80',
      capacity: 80,
      status: 'approved',
      rejection_reason: null,
      featured: 1
    },
    {
      id: 'evt_004',
      organizer_id: orgId,
      title: 'Inter-Collegiate Basketball Championship 2026',
      description: 'Catch the thrilling quarter-finals, semi-finals, and championship showdown between 16 varsity teams. High-energy courtside music, halftime slam dunk exhibition, and official trophies awarded by the Athletic Director.',
      category: 'Sports',
      venue: 'Indoor Sports Arena - Court 1',
      event_date: formatOffsetDate(3),
      start_time: '10:00',
      end_time: '18:30',
      image_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1000&auto=format&fit=crop&q=80',
      capacity: 250,
      status: 'approved',
      rejection_reason: null,
      featured: 0
    },
    {
      id: 'evt_005',
      organizer_id: orgId,
      title: 'Quantum Computing: Beyond the Binary Frontier',
      description: 'Distinguished guest lecture by Dr. Elena Rostova on quantum superposition, entanglement, and real-world quantum algorithms on superconducting qubits. Followed by a Q&A and networking high tea.',
      category: 'Seminars',
      venue: 'Physics Seminar Hall 101',
      event_date: formatOffsetDate(5),
      start_time: '15:00',
      end_time: '17:00',
      image_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1000&auto=format&fit=crop&q=80',
      capacity: 120,
      status: 'approved',
      rejection_reason: null,
      featured: 0
    },
    {
      id: 'evt_006',
      organizer_id: orgId,
      title: 'RoboWars 2026: Combat Robotics Championship',
      description: 'Featherweight and lightweight combat robots clash inside a reinforced steel cage arena. Sparks, spinning blades, pneumatic flippers, and tactical maneuvers. Open to student engineering teams and enthusiasts.',
      category: 'Technical',
      venue: 'Mechanical Workshop Arena',
      event_date: formatOffsetDate(6),
      start_time: '11:00',
      end_time: '17:00',
      image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1000&auto=format&fit=crop&q=80',
      capacity: 300,
      status: 'approved',
      rejection_reason: null,
      featured: 1
    },
    {
      id: 'evt_007',
      organizer_id: org2Id,
      title: 'Campus Indie Film Festival & Director Q&A',
      description: 'Showcasing 10 shortlisted student short films spanning sci-fi, drama, animation, and investigative documentary. Audience choice award voting live on Campus Event Hub.',
      category: 'Cultural',
      venue: 'Media Center Screening Theater',
      event_date: formatOffsetDate(7),
      start_time: '18:00',
      end_time: '21:30',
      image_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1000&auto=format&fit=crop&q=80',
      capacity: 150,
      status: 'approved',
      rejection_reason: null,
      featured: 0
    },
    {
      id: 'evt_008',
      organizer_id: orgId,
      title: 'Cybersecurity CTF: Campus Defense Challenge',
      description: 'Test your reverse engineering, web exploitation, binary analysis, and cryptography skills in a 12-hour Jeopardy-style Capture The Flag competition. Beginners and advanced tracks available.',
      category: 'Hackathons',
      venue: 'Cyber Security Lab - Block D',
      event_date: formatOffsetDate(8),
      start_time: '08:00',
      end_time: '20:00',
      image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1000&auto=format&fit=crop&q=80',
      capacity: 160,
      status: 'approved',
      rejection_reason: null,
      featured: 0
    },
    {
      id: 'evt_009',
      organizer_id: orgId,
      title: 'UI/UX Design Sprint: Crafting World-Class Interfaces',
      description: 'Intensive design thinking and Figma workshop. Learn micro-interactions, responsive design systems, accessibility guidelines, and user testing methodologies from industry product designers.',
      category: 'Workshops',
      venue: 'Design Studio 402',
      event_date: formatOffsetDate(9),
      start_time: '13:00',
      end_time: '17:00',
      image_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1000&auto=format&fit=crop&q=80',
      capacity: 75,
      status: 'approved',
      rejection_reason: null,
      featured: 0
    },
    {
      id: 'evt_010',
      organizer_id: orgId,
      title: 'Autonomous Drone Racing Grand Prix',
      description: 'Custom FPV and autonomous obstacle-course navigation through illuminated indoor hoops. High speed telemetry, AI vision navigation, and live broadcast on giant displays.',
      category: 'Technical',
      venue: 'Robotics Hangar & Sports Turf',
      event_date: formatOffsetDate(12),
      start_time: '10:00',
      end_time: '16:00',
      image_url: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=1000&auto=format&fit=crop&q=80',
      capacity: 200,
      status: 'pending', // PENDING IN ADMIN QUEUE
      rejection_reason: null,
      featured: 0
    },
    {
      id: 'evt_011',
      organizer_id: org2Id,
      title: 'TEDxCampus: Breaking Frontiers & Uncharted Horizons',
      description: 'Curated symposium of 6 visionary speakers including deep-tech founders, social entrepreneurs, and student innovators sharing ideas worth spreading.',
      category: 'Seminars',
      venue: 'Executive Convention Hall',
      event_date: formatOffsetDate(14),
      start_time: '13:30',
      end_time: '18:00',
      image_url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1000&auto=format&fit=crop&q=80',
      capacity: 220,
      status: 'pending', // PENDING IN ADMIN QUEUE
      rejection_reason: null,
      featured: 0
    },
    {
      id: 'evt_012',
      organizer_id: orgId,
      title: 'Midnight Stargazing & Astrophotography Camp',
      description: 'Telescopic observation of Saturn rings, Jupiter moons, and deep-sky nebulae. Astrophotography workshop with mirrorless cameras and sky-trackers.',
      category: 'Other',
      venue: 'Observatory Terrace & North Grounds',
      event_date: formatOffsetDate(15),
      start_time: '21:00',
      end_time: '02:00',
      image_url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1000&auto=format&fit=crop&q=80',
      capacity: 60,
      status: 'draft', // DRAFT FOR ORGANIZER
      rejection_reason: null,
      featured: 0
    },
    {
      id: 'evt_013',
      organizer_id: orgId,
      title: 'Unsanctioned Rooftop Fireworks & Neon Party',
      description: 'Rooftop party with music and pyrotechnics.',
      category: 'Cultural',
      venue: 'Old Library Rooftop',
      event_date: formatOffsetDate(16),
      start_time: '22:00',
      end_time: '03:00',
      image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&auto=format&fit=crop&q=80',
      capacity: 50,
      status: 'rejected', // REJECTED WITH EXPLICIT FEEDBACK
      rejection_reason: 'Rooftop events violate campus fire safety codes and lack structural approval. Please submit with an authorized ground venue.',
      featured: 0
    }
  ];

  for (const e of events) {
    insertEvent.run(
      e.id, e.organizer_id, e.title, e.description, e.category,
      e.venue, e.event_date, e.start_time, e.end_time, e.image_url,
      e.capacity, e.status, e.rejection_reason, e.featured, now, now
    );
  }

  // 4. Seed initial RSVPs
  const insertRsvp = db.prepare(`
    INSERT INTO rsvps (id, event_id, user_id, status, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertRsvp.run(uuid(), 'evt_001', studentId, 'confirmed', 'Looking forward to the hackathon sprint!', now, now);
  insertRsvp.run(uuid(), 'evt_002', studentId, 'confirmed', 'Excited for battle of the bands!', now, now);
  insertRsvp.run(uuid(), 'evt_003', studentId, 'confirmed', 'Ready for hands-on fine-tuning.', now, now);
  insertRsvp.run(uuid(), 'evt_001', student2Id, 'confirmed', 'Joined hardware track.', now, now);
  insertRsvp.run(uuid(), 'evt_004', student2Id, 'confirmed', 'Cheering for varsity team.', now, now);

  // 5. Seed Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotif.run(
    uuid(),
    studentId,
    'RSVP Confirmed: GRAPHITE 26 Hackathon',
    'Your registration for GRAPHITE 26 Hackathon has been confirmed. Check in at Main Auditorium at 09:00 AM.',
    'rsvp_confirm',
    '#event/evt_001',
    0,
    now
  );

  insertNotif.run(
    uuid(),
    studentId,
    'Upcoming Event Reminder (24h)',
    'Deep Learning & LLM Fine-Tuning Workshop starts tomorrow at 02:00 PM in Turing Lab 3B.',
    'reminder',
    '#event/evt_003',
    0,
    now
  );

  insertNotif.run(
    uuid(),
    orgId,
    'Event Submission Rejected',
    'Your submission "Unsanctioned Rooftop Fireworks" was rejected: Rooftop events violate campus fire safety codes.',
    'event_rejected',
    '#organizer-dashboard',
    0,
    now
  );

  insertNotif.run(
    uuid(),
    adminId,
    'Pending Approval Queue: 2 Events Awaiting Review',
    'Autonomous Drone Racing Grand Prix and TEDxCampus have been submitted for your review.',
    'system',
    '#admin-dashboard',
    0,
    now
  );

  // 6. Seed Organizer Application
  const insertApp = db.prepare(`
    INSERT INTO organizer_applications (id, user_id, club_name, department, reason, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertApp.run(
    uuid(),
    student2Id,
    'Campus Robotics & Mechatronics Society',
    'Electronics & Communication',
    'I am the elected Vice President of the Robotics Society and wish to organize technical workshops and arena exhibitions on campus.',
    'pending',
    now,
    now
  );

  // 7. Seed Initial Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, user_id, user_name, action, target_type, target_id, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run(
    uuid(),
    adminId,
    'Dr. Vikram Malhotra',
    'EVENT_APPROVED',
    'event',
    'evt_001',
    'Approved "GRAPHITE 26 Hackathon: Code the Future" for public publication',
    now
  );

  insertAudit.run(
    uuid(),
    adminId,
    'Dr. Vikram Malhotra',
    'EVENT_REJECTED',
    'event',
    'evt_013',
    'Rejected "Unsanctioned Rooftop Fireworks": Fire safety violation',
    now
  );

  insertAudit.run(
    uuid(),
    adminId,
    'Dr. Vikram Malhotra',
    'ROLE_GRANTED',
    'profile',
    orgId,
    'Granted Organizer credentials to Priya Sharma (Tech Club Lead)',
    now
  );

  console.log('Database seeded successfully with initial users, events, and sample data.');
}

// Export database and helper methods
module.exports = {
  db,
  uuid,
  hashPassword,
  verifyPassword,
  initializeDatabase
};
