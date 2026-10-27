// public/js/components/calendarView.js

export class CalendarView {
  constructor(container, events = [], onEventSelect = null) {
    this.container = container;
    this.events = events;
    this.onEventSelect = onEventSelect;
    this.currentDate = new Date();
  }

  setEvents(events) {
    this.events = events;
    this.render();
  }

  render() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // First day of month & total days
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Map events by date string "YYYY-MM-DD"
    const eventMap = {};
    for (const evt of this.events) {
      if (!eventMap[evt.event_date]) {
        eventMap[evt.event_date] = [];
      }
      eventMap[evt.event_date].push(evt);
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    let daysHtml = '';

    // Empty cells before first day
    for (let i = 0; i < firstDayIndex; i++) {
      daysHtml += `<div class="calendar-day empty"></div>`;
    }

    // Days of current month
    for (let day = 1; day <= totalDays; day++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateKey = `${year}-${monthStr}-${dayStr}`;

      const isToday = dateKey === todayStr;
      const dayEvents = eventMap[dateKey] || [];

      let eventsListHtml = '';
      for (const e of dayEvents) {
        eventsListHtml += `
          <div class="calendar-event-pill badge-${e.category}" data-event-id="${e.id}" title="${e.title} (${e.start_time})">
            ${e.start_time} ${e.title}
          </div>
        `;
      }

      // Mobile dots
      const mobileDotHtml = dayEvents.length > 0 ? `<div class="calendar-day-dot"></div>` : '';

      daysHtml += `
        <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateKey}">
          <div class="calendar-day-num">${day}</div>
          <div style="flex: 1; overflow: hidden;">
            ${eventsListHtml}
            ${mobileDotHtml}
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="calendar-container">
        <!-- Calendar Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 800; color: #fff;">
              ${monthNames[month]} <span style="color: #a78bfa;">${year}</span>
            </h2>
            <p style="font-size: 0.85rem; color: #94a3b8;">Click any event pill to view details & RSVP</p>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <button id="cal-today-btn" class="btn-secondary" style="padding: 6px 14px; font-size: 0.8rem;">Today</button>
            <button id="cal-prev-btn" class="btn-secondary" style="padding: 6px 10px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button id="cal-next-btn" class="btn-secondary" style="padding: 6px 10px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>

        <!-- Weekday Headers -->
        <div class="calendar-grid" style="margin-bottom: 8px;">
          <div class="calendar-weekday">Sun</div>
          <div class="calendar-weekday">Mon</div>
          <div class="calendar-weekday">Tue</div>
          <div class="calendar-weekday">Wed</div>
          <div class="calendar-weekday">Thu</div>
          <div class="calendar-weekday">Fri</div>
          <div class="calendar-weekday">Sat</div>
        </div>

        <!-- Day Cells -->
        <div class="calendar-grid">
          ${daysHtml}
        </div>
      </div>
    `;

    // Attach listeners
    this.container.querySelector('#cal-prev-btn').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.render();
    });

    this.container.querySelector('#cal-next-btn').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.render();
    });

    this.container.querySelector('#cal-today-btn').addEventListener('click', () => {
      this.currentDate = new Date();
      this.render();
    });

    // Event pill clicks
    const pills = this.container.querySelectorAll('.calendar-event-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        const eventId = pill.getAttribute('data-event-id');
        const selected = this.events.find(x => x.id === eventId);
        if (selected && this.onEventSelect) {
          this.onEventSelect(selected);
        }
      });
    });
  }
}
