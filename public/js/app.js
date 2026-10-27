// public/js/app.js - Main SPA Application & Router
import { api, showToast } from './api.js';
import { renderNavbar } from './components/navbar.js';
import { renderFooter } from './components/footer.js';
import { openReminderModal } from './components/reminderModal.js';
import { openProfileModal } from './components/profileModal.js';
import { openEventDetailModal } from './components/eventDetailModal.js';

import { renderLandingPage } from './pages/landingPage.js';
import { renderEventsPage } from './pages/eventsPage.js';
import { renderAuthPage } from './pages/authPage.js';
import { renderStudentDashboard } from './pages/studentDash.js';
import { renderOrganizerDashboard } from './pages/organizerDash.js';
import { renderAdminDashboard } from './pages/adminDash.js';
import { renderMyEventsPage } from './pages/myEventsPage.js';
import { renderNotificationsPage } from './pages/notificationsPage.js';
import { renderNotFoundPage } from './pages/notFoundPage.js';

class App {
  constructor() {
    this.navContainer = document.getElementById('navbar-root');
    this.mainContainer = document.getElementById('app-root');
    this.footerContainer = document.getElementById('footer-root');
  }

  async init() {
    // 1. Verify existing session if token exists
    if (api.token) {
      await api.fetchMe();
    }

    // 2. Render static layout
    this.updateNavbar();
    renderFooter(this.footerContainer);

    // 3. Subscribe to auth changes
    api.onAuthChange(() => {
      this.updateNavbar();
    });

    // 4. Listen to global modals
    window.addEventListener('open-reminder-modal', () => {
      openReminderModal();
    });
    window.addEventListener('open-profile-modal', () => {
      openProfileModal();
    });

    // 5. Initialize router
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  }

  updateNavbar() {
    renderNavbar(this.navContainer);
  }

  async handleRoute() {
    const rawHash = window.location.hash || '#';
    const hash = rawHash.split('?')[0]; // strip query string for routing

    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Handle single event direct route: #event/:id
    const eventMatch = hash.match(/^#event\/([a-zA-Z0-9_-]+)$/);
    if (eventMatch) {
      const eventId = eventMatch[1];
      try {
        const res = await api.getEventById(eventId);
        if (res.event) {
          openEventDetailModal(res.event, () => {
            if (window.location.hash.startsWith('#event/')) {
              window.location.hash = '#events';
            }
          });
        }
      } catch (err) {
        showToast('Event not found', 'error');
      }
      return;
    }

    // Route matching
    switch (hash) {
      case '#':
      case '':
        await renderLandingPage(this.mainContainer);
        break;

      case '#events':
        await renderEventsPage(this.mainContainer);
        break;

      case '#calendar':
        await renderEventsPage(this.mainContainer);
        // Switch to calendar tab
        setTimeout(() => {
          const calBtn = document.getElementById('view-calendar-btn');
          if (calBtn) calBtn.click();
        }, 50);
        break;

      case '#login':
      case '#register':
        renderAuthPage(this.mainContainer);
        break;

      case '#student-dashboard':
        if (!api.currentUser) {
          showToast('Please sign in to access your student dashboard', 'info');
          window.location.hash = '#login';
          return;
        }
        await renderStudentDashboard(this.mainContainer);
        break;

      case '#organizer-dashboard':
        if (!api.currentUser) {
          showToast('Please sign in to access organizer studio', 'info');
          window.location.hash = '#login';
          return;
        }
        if (api.currentUser.role !== 'organizer' && api.currentUser.role !== 'admin') {
          showToast('Organizer access required', 'error');
          window.location.hash = '#student-dashboard';
          return;
        }
        await renderOrganizerDashboard(this.mainContainer);
        break;

      case '#admin-dashboard':
        if (!api.currentUser || api.currentUser.role !== 'admin') {
          showToast('Administrator clearance required', 'error');
          window.location.hash = '#login';
          return;
        }
        await renderAdminDashboard(this.mainContainer);
        break;

      case '#my-events':
        if (!api.currentUser) {
          showToast('Please sign in to view your joined events', 'info');
          window.location.hash = '#login';
          return;
        }
        await renderMyEventsPage(this.mainContainer);
        break;

      case '#notifications':
        if (!api.currentUser) {
          showToast('Please sign in to view notifications', 'info');
          window.location.hash = '#login';
          return;
        }
        await renderNotificationsPage(this.mainContainer);
        break;

      case '#profile':
        if (!api.currentUser) {
          showToast('Please sign in to edit your profile', 'info');
          window.location.hash = '#login';
          return;
        }
        openProfileModal(() => this.updateNavbar());
        break;

      default:
        renderNotFoundPage(this.mainContainer);
        break;
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
