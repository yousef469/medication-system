import React, { Suspense, lazy } from 'react';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';

// The entire provider tree + main content is lazy-loaded
// This ensures zero context imports in the entry chunk
const AppShell = lazy(() => import('./components/layout/AppShell'));

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<div className="loading-screen">Clinical modules loading...</div>}>
          <AppShell />
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
