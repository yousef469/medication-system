import React from 'react';

const AdminDashboard = () => {
  const stats = [
    { label: "Total Hospitals", value: "12", trend: "+1 this month" },
    { label: "Active Doctors", value: "148", trend: "+12 new" },
    { label: "Total Patients", value: "45.2K", trend: "City-wide" },
    { label: "Monthly Appointments", value: "8.4K", trend: "98% success" },
  ];

  return (
    <div className="admin-container">
      <header className="page-header">
        <h1 className="text-gradient">City Health Administration</h1>
        <p className="subtitle">Global control and analytics for the municipal medical network</p>
      </header>

      <div className="admin-stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-card stat-card">
            <span className="stat-label">{stat.label}</span>
            <span className="stat-value">{stat.value}</span>
            <span className="stat-trend">{stat.trend}</span>
          </div>
        ))}
      </div>

      <div className="admin-management-grid">
        <section className="management-section">
          <div className="glass-card section-card">
            <h3>Registered Hospitals</h3>
            <div className="hospital-list">
              {[1, 2, 3].map(i => (
                <div key={i} className="hospital-item glass-card">
                  <div className="hospital-info">
                    <span className="hospital-name">Central City General {i}</span>
                    <span className="hospital-meta">Primary Care • Emergency Center</span>
                  </div>
                  <button className="btn-secondary btn-sm">Manage</button>
                </div>
              ))}
            </div>
            <button className="btn-primary w-full mt-1">Register New Hospital</button>
          </div>
        </section>

        <section className="analytics-section">
          <div className="glass-card section-card">
            <h3>System Revenue & Usage</h3>
            <div className="chart-placeholder">
              <div className="bar-chart">
                <div className="bar" style={{ height: '60%' }}></div>
                <div className="bar" style={{ height: '85%' }}></div>
                <div className="bar" style={{ height: '45%' }}></div>
                <div className="bar" style={{ height: '95%' }}></div>
                <div className="bar" style={{ height: '70%' }}></div>
              </div>
            </div>
            <div className="analytics-meta">
              <p>Top Performing: District 4 Medical Center</p>
              <p>Critical Alert: Resource shortage in Sector 2</p>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .admin-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }

        .stat-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
        }

        .stat-label { color: var(--text-muted); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
        .stat-value { font-size: 1.75rem; font-weight: 700; margin: 0.5rem 0; }
        .stat-trend { color: var(--secondary); font-size: 0.75rem; }

        .admin-management-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .section-card { padding: 1.5rem; }

        .hospital-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin: 1.5rem 0;
        }

        .hospital-item {
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--glass-highlight);
        }

        .hospital-name { font-weight: 600; display: block; }
        .hospital-meta { font-size: 0.75rem; color: var(--text-muted); }

        .chart-placeholder {
          height: 200px;
          background: rgba(0,0,0,0.2);
          border-radius: var(--radius-md);
          margin: 1.5rem 0;
          display: flex;
          align-items: flex-end;
          padding: 1rem;
        }

        .bar-chart {
          display: flex;
          align-items: flex-end;
          gap: 1rem;
          height: 100%;
          width: 100%;
          justify-content: space-around;
        }

        .bar {
          width: 30px;
          background: linear-gradient(to top, var(--primary), var(--secondary));
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
          box-shadow: 0 0 15px var(--primary-glow);
        }

        .analytics-meta {
          font-size: 0.875rem;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .w-full { width: 100%; }
        .mt-1 { margin-top: 1rem; }
        .btn-sm { padding: 0.4rem 0.8rem; font-size: 0.825rem; }

        @media (max-width: 1024px) {
          .admin-stats-grid { grid-template-columns: 1fr 1fr; }
          .admin-management-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
