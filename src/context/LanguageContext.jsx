/* eslint-disable react-refresh/only-export-components */
import React, { useContext, useState, useEffect } from 'react';
import { getLanguageContext } from './ContextRegistry';
import { translations } from '../data/translations';

const LanguageContext = getLanguageContext();

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('ar');
    const isRTL = language === 'ar';

    useEffect(() => {
        document.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
    }, [language, isRTL]);

    const t = (key) => {
        return translations[language][key] || translations['en'][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be used within LanguageProvider');
    return context;
}
