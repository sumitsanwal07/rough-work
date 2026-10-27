// public/js/components/footer.js

export function renderFooter(container) {
  container.innerHTML = `
    <footer style="background: rgba(4, 6, 16, 0.95); border-top: 1px solid rgba(255,255,255,0.08); padding: 50px 20px 30px; margin-top: auto;">
      <div class="container">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 36px; margin-bottom: 40px;">
          <!-- Col 1: Brand -->
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
              <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #7c3aed, #06b6d4); display: flex; align-items: center; justify-content: center;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <span style="font-weight: 800; font-size: 1.1rem; color: #fff;">Campus Event Hub</span>
            </div>
            <p style="font-size: 0.85rem; color: #94a3b8; line-height: 1.6; margin-bottom: 16px;">
              The centralized, verified digital platform for college students, student clubs, and university administration. Built for GRAPHITE 26 PS 18.
            </p>
            <span class="badge badge-Technical" style="font-size: 0.72rem;">Live Hackathon Project</span>
          </div>

          <!-- Col 2: Navigation -->
          <div>
            <h4 style="font-size: 0.9rem; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 14px;">Event Portals</h4>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; color: #94a3b8;">
              <li><a href="#events" style="transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">Public Discovery Feed</a></li>
              <li><a href="#events?category=Hackathons" style="transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">Hackathons & Sprints</a></li>
              <li><a href="#events?category=Cultural" style="transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">Cultural Fests & Galas</a></li>
              <li><a href="#events?category=Workshops" style="transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">Workshops & Masterclasses</a></li>
            </ul>
          </div>

          <!-- Col 3: Role Portals -->
          <div>
            <h4 style="font-size: 0.9rem; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 14px;">Access Portals</h4>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; color: #94a3b8;">
              <li><a href="#student-dashboard" style="transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">Student Dashboard</a></li>
              <li><a href="#organizer-dashboard" style="transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">Organizer Studio</a></li>
              <li><a href="#admin-dashboard" style="transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">Admin Governance Hub</a></li>
              <li><a href="#notifications" style="transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">Notifications Center</a></li>
            </ul>
          </div>

          <!-- Col 4: Campus Support -->
          <div>
            <h4 style="font-size: 0.9rem; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 14px;">Campus Administration</h4>
            <p style="font-size: 0.85rem; color: #94a3b8; line-height: 1.6; margin-bottom: 10px;">
              Dean of Student Affairs Office<br />
              Administration Block &bull; Floor 2<br />
              Email: <code>admin@campus.edu</code>
            </p>
            <div style="font-size: 0.75rem; color: #64748b;">
              Server & Database: Active SQLite Persistent Storage
            </div>
          </div>
        </div>

        <!-- Copyright -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 24px; font-size: 0.8rem; color: #64748b; flex-wrap: wrap; gap: 12px;">
          <div>&copy; 2026 Campus Event Hub. All rights reserved. GRAPHITE 26 PS 18.</div>
          <div style="display: flex; gap: 16px;">
            <a href="#events" style="color: #94a3b8;">Explore</a>
            <a href="#login" style="color: #94a3b8;">Dual Auth</a>
            <a href="#profile" style="color: #94a3b8;">Settings</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}
