# Campus Event Hub — GRAPHITE 26 PS 18

A modern, full-stack, responsive web application for university event discovery, student engagement, organizer management, administrative accreditation, RSVPs, and automated reminders.

---

## 🌟 Key Highlights & Architecture

- **Visual Design & Branding:** Cinematic dark navy/black background (`#070814`) with purple (`#8b5cf6`), blue (`#3b82f6`), and cyan (`#06b6d4`) glowing gradients, glassmorphism cards (`backdrop-filter: blur`), responsive layout, and typography.
- **Cinematic Video Experiences:**
  - **Before Login (Landing Page):** Looping, muted background video depicting campus life and students, dark overlay, "Your Campus. Your Events. Your Community." title, "Explore Events" & "Get Started" CTAs, sound toggle, and fallback HTML5 canvas generative nebula visualizer.
  - **After Login (Dashboard Welcome):** Distinct campus montage featuring workshops, hackathons, and cultural fests, personalized student greeting ("Welcome back, {user.name}!"), and "Discover Events" action.
  - **Web Audio Ambient Synthesizer:** When unmuted, dynamically generates ambient chords using the browser's Web Audio API with an animated equalizer visualizer.
- **Dual Authentication System:**
  - **Student Portal:** Student registration (college email, department, year of study), password reset flow, and student dashboard redirection.
  - **Organizer / Admin Portal:** Distinct login tab, organizer access application form, protected admin login (no self-registration as admin; prevents unauthorized privilege escalation).
  - **1-Click Demo Evaluation:** Instant login buttons for Student, Organizer, and Admin for live hackathon presentations.
- **Student Dashboard & Unified Discovery Feed:**
  - Grid View and Interactive Calendar View (month matrix with category pills).
  - Search by title, description, or venue.
  - Filter by Category (Technical, Cultural, Sports, Workshops, Seminars, Hackathons, Other) and Date (Today, This Week, This Month, Upcoming).
  - Detailed modal view with capacity progress bar, organizer info, Google Calendar export, and RSVP action.
  - "My Events" section with 1-click RSVP cancellation.
- **Organizer Dashboard & Studio:**
  - Submit new campus events with client & server-side validation.
  - Draft mode & Submit for Admin Approval.
  - View event statuses (Approved, Pending, Draft, Rejected, Cancelled).
  - Direct rejection feedback card displaying the Dean's specific reason for rejection.
  - Attendee roster modal with 1-click CSV export.
  - Organizers cannot approve their own events or tamper with other clubs.
- **Admin Dashboard & Approval Queue:**
  - Executive KPIs (Total Events, Pending Reviews, Approved, Students, RSVPs, Clubs).
  - Pending Approval Queue with live preview, 1-click Approval (instantly publishes to public feed), and Rejection modal with presets and custom feedback.
  - All Events Directory with unpublish and cancel capabilities.
  - Club leadership application review.
  - User and role governance (promote/demote roles).
  - Timestamped Audit Activity Trail.
- **RSVP & Automated Reminder System:**
  - Prevent duplicate RSVPs.
  - In-app notification center (read, unread count, mark all read).
  - Customizable reminder preferences (Email toggle, 24 Hours prior, 1 Hour prior).
  - Background scheduler running every 5 minutes with strict duplicate prevention via `reminder_logs`.
  - Manual "Run Test Scan Now" trigger in the admin console.

---

## 👥 Pre-Configured Demo Credentials

For immediate evaluation during GRAPHITE 26 PS 18 presentations:

| Role | Name | Email | Password |
|---|---|---|---|
| **Campus Admin (Dean)** | Dr. Vikram Malhotra | `admin@campus.edu` | `Admin@123` |
| **Club Organizer** | Priya Sharma | `organizer@campus.edu` | `Organizer@123` |
| **Student** | Aarav Patel | `student@campus.edu` | `Student@123` |

*(You can also use the 1-click Demo buttons on the `/login` page or register brand new student and organizer accounts.)*

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js v20+ or v24+ (Node 24 with built-in `node:sqlite` is already supported out-of-the-box with zero npm install needed!).

### 1. Clone the repository
```bash
git clone https://github.com/your-repo/campus-event-hub.git
cd campus-event-hub
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Start the Server
```bash
node server.js
```
*(On Windows environments using the included wrapper: `./node.cmd server.js`)*

The server will automatically initialize `campus_hub.db`, apply schema migrations, seed sample campus events, and start listening on:
```
http://localhost:3000
```

Open your browser and navigate to `http://localhost:3000`.

---

## 🗄️ Database Schema & Row Level Security (RLS)

Campus Event Hub is built with a relational architecture.

### Tables
1. **`profiles`**: User accounts, hashed passwords with salt (PBKDF2), role (`student`, `organizer`, `admin`), college email, department, year of study, bio, and avatar.
2. **`events`**: Events created by organizers, including category, venue, date, start/end time, capacity, status (`draft`, `pending`, `approved`, `rejected`, `cancelled`), and rejection reason.
3. **`rsvps`**: Event RSVPs with `UNIQUE(event_id, user_id)` constraint, preventing duplicate registrations.
4. **`notifications`**: In-app notifications with types (`rsvp_confirm`, `event_approved`, `event_rejected`, `reminder`, `system`).
5. **`reminder_preferences`**: User preferences for email alerts, 24-hour reminders, and 1-hour reminders.
6. **`reminder_logs`**: Tracks sent reminders (`event_id`, `user_id`, `reminder_type`) with unique constraints to ensure reminders are never duplicated.
7. **`audit_logs`**: Logs all administrative actions (event approvals, rejections, cancellations, role changes).
8. **`organizer_applications`**: Applications submitted by students requesting official club leadership credentials.
9. **`sessions`**: Secure server-side sessions with cryptographic tokens.

### Supabase / PostgreSQL Deployment
A complete PostgreSQL migration script with full Row Level Security (RLS) policies, indexes, and triggers is provided in:
```
src/db/supabase_schema.sql
```
To deploy to Supabase:
1. Create a project in [Supabase](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Paste the contents of `src/db/supabase_schema.sql` and run it.

---

## ⏰ Reminder System & External Services Configuration

### How It Works:
1. Students enable or disable reminders in the **Reminder Settings** modal.
2. The background reminder worker runs periodically (every 5 minutes in `server.js`).
3. For events starting within 24 hours or 1 hour:
   - It checks confirmed RSVPs.
   - It queries `reminder_logs` for `(event_id, user_id, '24h')` and `('1h')`.
   - If not yet sent, it creates an in-app notification, records the delivery in `reminder_logs`, and logs the dispatch.

### External Email / SMTP Provider Configuration:
To send real transactional emails through Resend, SendGrid, Amazon SES, or Gmail SMTP, set the following environment variables in `.env`:

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here
SMTP_FROM="Campus Event Hub <events@campus.edu>"
```

*Note: If SMTP credentials are not configured, the system logs the simulated email delivery, updates `reminder_logs`, and delivers in-app notifications without pretending emails were dispatched externally.*

---

## 📁 Project Structure

```
graphite/
├── server.js                        # Node.js HTTP server & REST API
├── package.json                     # Project manifest & run scripts
├── .env.example                     # Environment template
├── campus_hub.db                    # Persistent SQLite database
├── src/
│   ├── db/
│   │   ├── database.js              # Database initialization, schema & seed data
│   │   └── supabase_schema.sql      # Supabase/PostgreSQL schema with RLS policies
│   └── services/
│       ├── authService.js           # PBKDF2 hashing, dual auth, sessions, RBAC
│       ├── eventService.js          # Event CRUD, approval queue, filtering
│       ├── rsvpService.js           # RSVP toggle, duplicate prevention, attendee lists
│       ├── notificationService.js   # In-app notification center
│       ├── reminderService.js       # 24h & 1h reminder runner with duplicate check
│       └── auditService.js          # Institutional audit trail & user governance
└── public/
    ├── index.html                   # HTML5 single-page application entrypoint
    ├── css/
    │   └── style.css                # Custom glassmorphism design system & responsive styles
    └── js/
        ├── app.js                   # Client SPA router & state coordinator
        ├── api.js                   # API client & session manager
        ├── components/
        │   ├── navbar.js            # Responsive navigation, role badge, notifications bell
        │   ├── footer.js            # Footer with links and hackathon branding
        │   ├── landingHero.js       # Pre-login campus video hero with audio toggle
        │   ├── dashboardHero.js     # Post-login event montage video hero
        │   ├── videoEngine.js       # HTML5 Canvas generative fallback & Web Audio synth
        │   ├── eventCard.js         # Glassmorphic event cards with RSVP actions
        │   ├── calendarView.js      # Interactive monthly calendar view
        │   ├── eventDetailModal.js  # Event details, Google Calendar export, RSVP modal
        │   ├── submitEventModal.js  # Organizer event submission & editing form
        │   ├── approvalModal.js     # Admin approve & reject modal with feedback
        │   ├── attendeeModal.js     # Attendee list modal with CSV export
        │   ├── reminderModal.js     # Reminder preferences & manual scan trigger
        │   └── profileModal.js      # Student/Organizer profile editor
        └── pages/
            ├── landingPage.js       # Hero, featured events, categories, platform highlights
            ├── eventsPage.js        # Search, category pills, date filters, grid & calendar
            ├── authPage.js          # Dual auth (Student vs Organizer/Admin) & 1-click demo
            ├── studentDash.js       # Post-login video hero, my passes, recommended feed
            ├── organizerDash.js     # Event management console, rejection feedback, stats
            ├── adminDash.js         # KPIs, approval queue, event directory, audit logs
            ├── myEventsPage.js      # Registered event passes with cancellation
            ├── notificationsPage.js # Notifications center with filter & bulk actions
            └── notFoundPage.js      # Custom 404 page
```

---

## 🏆 GRAPHITE 26 PS 18 Compliance Checklist

- [x] **Cinematic Landing Page:** Full-screen hero video, college life visuals, "Your Campus. Your Events. Your Community.", CTAs, sound control, and canvas fallback.
- [x] **Dual Authentication:** Separate Student Portal and Organizer/Admin Portal, password reset, protected admin access, role redirection.
- [x] **Post-Login Video Welcome:** Distinct montage video in hero section, personalized greeting with student's name, "Discover Events" action.
- [x] **Student Dashboard:** Grid view & interactive Calendar view, category & date filters, event details modal, RSVP button, duplicate prevention, cancellation.
- [x] **Organizer Studio:** Event submission form, draft mode, validation, rejection feedback visibility, attendee list with CSV export.
- [x] **Admin Approval Queue:** Metrics, review queue with preview, approve/reject with feedback reason, all events management table, audit trail.
- [x] **RSVP & Reminder System:** In-app notifications, 24h & 1h reminder preferences, duplicate prevention with `reminder_logs`, background runner.
- [x] **Persistent Database & RLS:** Persistent SQLite database + full Supabase PostgreSQL schema with Row Level Security policies.
- [x] **1-Click Demo Evaluation:** Ready for live hackathon demonstration.
