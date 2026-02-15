import React, { Suspense, lazy } from 'react';
import { AuthProvider } from '../../context/AuthContext';
import { ClinicalProvider } from '../../context/ClinicalContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { LanguageProvider } from '../../context/LanguageContext';

// MainContent is lazy-loaded INSIDE the provider tree
const MainContent = lazy(() => import('./MainContent'));

export default function AppShell() {
    return (
        <LanguageProvider>
            <AuthProvider>
                <ClinicalProvider>
                    <ThemeProvider>
                        <Suspense fallback={<div className="loading-screen">Clinical environment loading...</div>}>
                            <MainContent />
                        </Suspense>
                    </ThemeProvider>
                </ClinicalProvider>
            </AuthProvider>
        </LanguageProvider>
    );
}
