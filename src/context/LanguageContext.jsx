import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
    ar: {
        app_name: "مركزك الطبي العالمي",
        triage_hub: "مركز التشخيص",
        medication_hub: "دليل الأدوية",
        hospitals: "المستشفيات",
        appointments: "مواعيدي",
        ai_assistant: "المساعد الذكي",
        hospital_network: "شبكة المستشفيات",
        sign_in: "تسجيل الدخول",
        guest: "زائر",
        sos: "طوارئ",
        search_placeholder: "ابحث عن تشخيص، علاج، أو مستشفى...",
        ai_welcome: "مرحباً. أنا مساعدك الطبي الذكي. يمكنني مساعدتك في العثور على المستشفى المناسب، أو معرفة تكاليف العلاج. كيف يمكنني مساعدتك اليوم؟",
        ai_safety_disclaimer: "",
        local_offline_tag: "النظام الأساسي",
        gemini_cloud_tag: "ذكاء اصطناعي فائق",
        voice_start: "تحدث الآن",
        voice_stop: "توقف",
        send: "إرسال",
        emergency_title: "هل تحتاج مساعدة عاجلة؟",
        emergency_desc: "ضغطة واحدة ستقوم بإبلاغ أقرب منشأة طبية وإرسال سيارة إسعاف لموقعك الحالي.",
        call_ambulance: "طلب إسعاف فوراً",
        cancel: "إلغاء",
        establishing_connection: "جاري الاتصال...",
        locating_facility: "تحديد أقرب منشأة ومشاركة الملف الطبي...",
        help_on_way: "المساعدة في الطريق!",
        ambulance_dispatched: "تم إرسال سيارة إسعاف من",
        eta: "وقت الوصول المتوقع",
        minutes: "دقيقة",
        done: "تم",
        cost_free: "مجاني / مدعوم",
        cost_economy: "اقتصادي (عام)",
        cost_premium: "متميز (خاص)",
        contact: "اتصال",
        request_treatment: "طلب هذا العلاج",
        no_results: "لا توجد نتائج. جرب البحث عن 'قلب'، 'أورام'، أو 'جراحة مخ'.",
        welcome_hero: "مستقبل الرعاية الصحية الذكية",
        hero_subtitle: "ذكاء اصطناعي متطور. معايير طبية عالمية.",
        explore_hub: "استكشف الخدمات",
        view_network: "شبكة المستشفيات"
    },
    en: {
        app_name: "MediHealth Global",
        triage_hub: "Triage Hub",
        medication_hub: "Medication Info",
        hospitals: "Hospitals",
        appointments: "Appointments",
        ai_assistant: "AI Assistant",
        hospital_network: "The Network",
        sign_in: "Sign In",
        guest: "Guest",
        sos: "SOS",
        search_placeholder: "Search for diagnosis, treatment, or hospital...",
        ai_welcome: "Hello. I am your medical assistant. I can help you find the right hospital or check treatment costs. How can I help you today?",
        ai_safety_disclaimer: "",
        local_offline_tag: "Standard Mode",
        gemini_cloud_tag: "Gemini AI",
        voice_start: "Voice",
        voice_stop: "Stop",
        send: "Send",
        emergency_title: "Immediate Assistance?",
        emergency_desc: "One tap will alert the nearest medical facility and route an ambulance to your current location.",
        call_ambulance: "CALL AMBULANCE NOW",
        cancel: "Cancel",
        establishing_connection: "Establishing Connection...",
        locating_facility: "Locating nearest facility and sharing your medical profile.",
        help_on_way: "Help is on the way!",
        ambulance_dispatched: "An ambulance has been dispatched from",
        eta: "ETA",
        minutes: "minutes",
        done: "Done",
        cost_free: "Free/Subsidized",
        cost_economy: "Economy (Public)",
        cost_premium: "Premium (Private)",
        contact: "Contact",
        request_treatment: "Request This Treatment",
        no_results: "No matches found. Try searching for 'Heart', 'Cancer', or 'Brain Surgery'.",
        welcome_hero: "The Future of Digital Healthcare",
        hero_subtitle: "Advanced AI Diagnostics. Global Clinical Standards.",
        explore_hub: "Explore Hub",
        view_network: "View Network"
    }
    // Add fr, es, de placeholders if needed, defaulting to EN logic for now
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('ar');
    const [isRTL, setIsRTL] = useState(true);

    useEffect(() => {
        setIsRTL(language === 'ar');
        document.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
    }, [language]);

    const t = (key) => {
        return translations[language][key] || translations['en'][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be used within LanguageProvider');
    return context;
};
