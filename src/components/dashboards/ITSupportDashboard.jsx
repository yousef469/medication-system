import React, { useState, useEffect } from 'react';
import { useClinical } from '../../context/ClinicalContext';

const ITSupportDashboard = () => {
  const { systemLogs, logEvent } = useClinical();
  const [metrics, setMetrics] = useState({ cpu: 42, memory: 64, latency: 12 });
  const [aiAlerts, setAiAlerts] = useState([]);

  // Simulate real-time system monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: Math.max(10, Math.min(95, prev.cpu + (Math.random() * 10 - 5))),
        memory: Math.max(20, Math.min(90, prev.memory + (Math.random() * 4 - 2))),
        latency: Math.max(5, Math.min(200, prev.latency + (Math.random() * 20 - 10))),
      }));

      // Simulate occasional system anomalies detected by AI
      if (Math.random() > 0.95) {
        const errorMsg = "Anomalous API pattern detected in " + (Math.random() > 0.5 ? "Clinical Discovery" : "Secretary Hub");
        logEvent(errorMsg, 'ERROR');
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [logEvent]);

  // Listen for instant IT alerts from ClinicalContext
  useEffect(() => {
    const handleAlert = (e) => {
      setAiAlerts(prev => [e.detail, ...prev].slice(0, 5));
    };
    window.addEventListener('IT_ALERT', handleAlert);
    return () => window.removeEventListener('IT_ALERT', handleAlert);
  }, []);

  return (
    <div className="it-dashboard">
      <header className="page-header">
        <h1 className="text-gradient">System Engineering Core</h1>
        <p className="subtitle">Real-time AI diagnostic monitoring of clinical clinical infrastructure</p>
      </header>

      <div className="it-grid">
        <section className="metrics-column">
          <div className="glass-card metrics-card">
            <h3>Infrastructure Health</h3>
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="m-label">AI Neural Load</span>
                <span className="m-value">{metrics.cpu.toFixed(0)}%</span>
                <div className="m-bar"><div className="m-fill" style={{ width: `${metrics.cpu}%`, background: metrics.cpu > 80 ? '#ef4444' : 'var(--primary)' }}></div></div>
              </div>
              <div className="metric-item">
                <span className="m-label">Database Sync</span>
                <span className="m-value">{metrics.memory.toFixed(0)}%</span>
                <div className="m-bar"><div className="m-fill" style={{ width: `${metrics.memory}%` }}></div></div>
              </div>
              <div className="metric-item">
                <span className="m-label">API Latency</span>
                <span className="m-value">{metrics.latency.toFixed(0)} ms</span>
                <div className="m-bar"><div className="m-fill" style={{ width: `${Math.min(100, metrics.latency / 2)}%`, background: metrics.latency > 150 ? '#f59e0b' : 'var(--secondary)' }}></div></div>
              </div>
            </div>
          </div>

          <div className="glass-card alert-card mt-2">
            <h3>Instant AI Alerts</h3>
            <div className="alert-list">
              {aiAlerts.length === 0 ? (
                <p className="empty-alert">System stable. No anomalies detected.</p>
              ) : (
                aiAlerts.map(alert => (
                  <div key={alert.id} className="alert-item pulse-error">
                    <span className="alert-time">[{alert.time}]</span>
                    <span className="alert-msg">{alert.message}</span>
                    <span className="alert-source">AI_ENGINE_01</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="logs-column glass-card overflow-hidden">
          <div className="log-header">
            <h3>Analytic Event Stream</h3>
            <button className="tool-btn" onClick={() => logEvent('IT: Manual System Flush initiated', 'INFO')}>Flush Buffer</button>
          </div>
          <div className="log-terminal">
            {systemLogs.map(log => (
              <div key={log.id} className={`log-entry ${log.level.toLowerCase()}`}>
                <span className="log-time">[{log.time}]</span>
                <span className="log-lvl">{log.level}</span>
                <span className="log-msg">{log.message}</span>
                {log.analyzedByAI && <span className="ai-tag">AI</span>}
              </div>
            ))}
            <div className="log-cursor">_</div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .it-dashboard { display: flex; flex-direction: column; gap: 2rem; }
        .it-grid { display: grid; grid-template-columns: 380px 1fr; gap: 2rem; }
        
        .metrics-grid { display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1.5rem; }
        .m-label { font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; }
        .m-value { float: right; font-family: 'Outfit', sans-serif; font-weight: 700; color: white; }
        .m-bar { height: 6px; background: var(--glass-highlight); border-radius: 3px; margin-top: 0.5rem; overflow: hidden; }
        .m-fill { height: 100%; transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); }

        .alert-list { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.25rem; }
        .alert-item { 
          background: rgba(239, 68, 68, 0.1); 
          border: 1px solid rgba(239, 68, 68, 0.2); 
          padding: 0.75rem; 
          border-radius: var(--radius-md);
          font-family: monospace;
          font-size: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .alert-time { color: #f87171; }
        .alert-msg { color: white; }
        .alert-source { color: #ef444466; font-size: 0.6rem; align-self: flex-end; }

        .pulse-error { border-color: #ef4444; animation: borderPulse 2s infinite; }
        @keyframes borderPulse {
          0% { border-color: rgba(239, 68, 68, 0.2); }
          50% { border-color: rgba(239, 68, 68, 1); }
          100% { border-color: rgba(239, 68, 68, 0.2); }
        }

        .log-terminal {
          background: rgba(0, 0, 0, 0.3);
          height: 500px;
          padding: 1.25rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          border-radius: var(--radius-md);
        }

        .log-entry { display: flex; gap: 0.75rem; align-items: baseline; }
        .log-time { color: var(--text-muted); min-width: 80px; }
        .log-lvl { font-weight: 800; min-width: 50px; }
        .log-msg { color: var(--text-secondary); }
        
        .log-entry.error .log-lvl { color: #ef4444; }
        .log-entry.error .log-msg { color: #f87171; }
        .log-entry.info .log-lvl { color: var(--secondary); }

        .ai-tag { 
          font-size: 0.6rem; 
          background: var(--primary); 
          color: white; 
          padding: 0 0.3rem; 
          border-radius: 3px; 
          font-weight: 900; 
        }

        .log-cursor { color: var(--primary); animation: blink 1s infinite; }
        @keyframes blink { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }

        .log-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .tool-btn { font-size: 0.7rem; background: var(--glass-highlight); border: 1px solid var(--glass-border); color: white; padding: 0.25rem 0.6rem; border-radius: var(--radius-full); cursor: pointer; }
        .empty-alert { color: var(--text-muted); font-size: 0.8rem; font-style: italic; text-align: center; padding: 2rem; }
        .mt-2 { margin-top: 2rem; }
        .overflow-hidden { overflow: hidden; }
      `}</style>
    </div>
  );
};

export default ITSupportDashboard;
