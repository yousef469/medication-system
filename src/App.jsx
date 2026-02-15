import React, { Suspense, lazy } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ClinicalProvider } from './context/ClinicalContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy Loaded Main Application Shell
const MainContent = lazy(() => import('./components/layout/MainContent'));

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <LanguageProvider>
          <AuthProvider>
            <ClinicalProvider>
              <ThemeProvider>
                <Suspense fallback={<div className="loading-screen">Clinical modules loading...</div>}>
                  <MainContent />
                </Suspense>
              </ThemeProvider>
            </ClinicalProvider>
          </AuthProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
