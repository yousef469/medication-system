import React from 'react';

// Error Boundary for Mobile Recovery
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, errorInfo) { console.error("[PWA Recovery] Caught error:", error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', textAlign: 'center', background: '#020617', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Clinical Hub Recovery</h1>
                    <p style={{ opacity: 0.8, maxWidth: '400px', margin: '0 auto 2rem' }}>
                        The app encountered a synchronization error (likely a stale cache). We need to perform a hard reset.
                    </p>
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '1rem', borderRadius: '12px', fontSize: '0.8rem', color: '#fca5a5', marginBottom: '2rem' }}>
                        {this.state.error?.message}
                    </div>
                    <button
                        onClick={() => {
                            if (window.confirm("This will clear local session storage and force a full reload. Continue?")) {
                                localStorage.clear();
                                sessionStorage.clear();
                                // Clear service workers
                                if ('serviceWorker' in navigator) {
                                    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
                                }
                                setTimeout(() => window.location.reload(true), 500);
                            }
                        }}
                        style={{ padding: '1rem 2rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 0 20px rgba(124, 58, 237, 0.4)' }}
                    >
                        NUCLEAR RESET & FIX APP
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
