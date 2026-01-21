import React, { useState, useRef, useEffect } from 'react';
import { useClinical } from '../../context/ClinicalContext';
import { useLanguage } from '../../context/LanguageContext';

const AIAssistant = () => {
    const { aiConsultation, isBackendOnline } = useClinical();
    const { t, isRTL } = useLanguage();

    // Initial message based on current language
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        setMessages([
            { role: 'assistant', text: t('ai_welcome') }
        ]);
    }, [t]);

    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = async (text = inputValue) => {
        if (!text.trim()) return;

        const userMsg = { role: 'user', text };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsThinking(true);

        try {
            const response = await aiConsultation(text);

            // Enforce Safety Disclaimer if it's a medical query and not just costs
            let safeAnswer = response.answer;
            if (response.type !== 'COST_QUERY') {
                safeAnswer = `${t('ai_safety_disclaimer')}\n\n${response.answer}`;
            }

            const assistantMsg = {
                role: 'assistant',
                text: safeAnswer,
                type: response.type,
                suggestion: response.suggestion
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', text: "Connection error. Trying offline mode..." }]);
        } finally {
            setIsThinking(false);
        }
    };

    const toggleVoice = () => {
        setIsRecording(!isRecording);
        if (!isRecording) {
            setTimeout(() => {
                setIsRecording(false);
                handleSend(t('voice_start'));
            }, 3000);
        }
    };

    return (
        <div className={`ai-page-container fade-in ${isRTL ? 'rtl' : 'ltr'}`}>
            <div className="ai-chat-window glass-card">
                <div className="chat-header">
                    <div className="avatar__wrapper">
                        <div className="status-dot" style={{
                            background: isBackendOnline ? '#10b981' : '#ef4444',
                            boxShadow: isBackendOnline ? '0 0 10px #10b981' : '0 0 10px #ef4444'
                        }}></div>
                        <span className="ai-avatar">🤖</span>
                    </div>
                    <div className="header-info">
                        <h3>{t('ai_assistant')}</h3>
                        <span className="mode-badge">{t('gemini_cloud_tag')}</span>
                    </div>
                </div>

                <div className="chat-messages" ref={scrollRef}>
                    {messages.map((m, i) => (
                        <div key={i} className={`message ${m.role}`}>
                            <div className="message-content">
                                <div className="bubble">
                                    {m.text}
                                </div>
                                <div className="meta-tags">
                                    <span className="source-tag gemini">{t('gemini_cloud_tag')}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                        <div className="message assistant">
                            <div className="bubble thinking">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="chat-input-area">
                    <button className={`voice-btn ${isRecording ? 'recording' : ''}`} onClick={toggleVoice}>
                        {isRecording ? t('voice_stop') : t('voice_start')}
                    </button>
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button className="send-btn" onClick={() => handleSend()}>{t('send')} ➔</button>
                </div>
            </div>

            <style>{`
                .rtl { direction: rtl; }
                .ltr { direction: ltr; }
                
                .ai-page-container {
                    padding: clamp(0.5rem, 2vw, 2rem);
                    display: flex;
                    justify-content: center;
                    height: calc(100vh - 80px); /* Tighter for mobile */
                }

                @media (max-width: 768px) {
                    .ai-page-container { height: calc(100vh - 140px); }
                    .chat-messages { padding: 1rem !important; }
                    .chat-input-area { padding: 1rem !important; flex-wrap: wrap; }
                    .message-content { max-width: 90%; }
                }

                .ai-chat-window {
                    width: 100%;
                    max-width: 900px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    border: 1px solid var(--primary-glow);
                    background: rgba(15, 23, 42, 0.85);
                }

                .chat-header {
                    padding: 1.5rem 2rem;
                    background: var(--glass-highlight);
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    border-bottom: 1px solid var(--glass-border);
                }
                
                .message.assistant .bubble { 
                    white-space: pre-wrap; 
                }

                /* RTL Specifics */
                .rtl .chat-input-area { gap: 1rem; }
                .rtl .send-btn { transform: scaleX(-1); }
                
                .avatar__wrapper {
                    position: relative;
                    width: 48px;
                    height: 48px;
                    background: var(--primary-glow);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid var(--primary);
                }
                .ai-avatar { font-size: 1.5rem; }
                .status-dot { 
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 12px; 
                    height: 12px; 
                    background: #10b981; 
                    border-radius: 50%; 
                    box-shadow: 0 0 10px #10b981;
                    border: 2px solid var(--bg-dark);
                }
                .header-info h3 { margin: 0; font-size: 1.25rem; }
                .mode-badge { 
                    font-size: 0.75rem; 
                    text-transform: uppercase; 
                    letter-spacing: 0.05em; 
                    background: rgba(16, 185, 129, 0.1); 
                    color: #10b981;
                    padding: 0.2rem 0.8rem; 
                    border-radius: 12px; 
                    display: inline-block;
                    margin-top: 0.25rem;
                }
                .chat-messages {
                    flex: 1;
                    padding: 2rem;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .message { display: flex; width: 100%; }
                .message.user { justify-content: flex-end; }
                .message.assistant { justify-content: flex-start; }
                .message-content {
                    max-width: 70%;
                    display: flex;
                    flex-direction: column;
                }
                .message.user .message-content { align-items: flex-end; }
                .bubble {
                    padding: 1rem 1.5rem;
                    border-radius: 18px;
                    font-size: 1rem;
                    line-height: 1.6;
                    position: relative;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                .message.assistant .bubble { 
                    background: var(--glass-highlight); 
                    border: 1px solid var(--glass-border); 
                    border-top-left-radius: 4px;
                    color: var(--text-primary);
                }
                .message.user .bubble { 
                    background: linear-gradient(135deg, var(--primary), #0284c7); 
                    color: white; 
                    border-bottom-right-radius: 4px; 
                    box-shadow: 0 4px 15px var(--primary-glow);
                }
                .meta-tags {
                    margin-top: 0.5rem;
                    display: flex;
                    justify-content: flex-start;
                }
                .message.user .meta-tags { justify-content: flex-end; }
                .source-tag {
                    font-size: 0.65rem;
                    color: var(--text-muted);
                    font-weight: 700;
                    text-transform: uppercase;
                    background: rgba(0,0,0,0.2);
                    padding: 2px 8px;
                    border-radius: 4px;
                }
                .source-tag.gemini { color: var(--accent); }
                .chat-input-area {
                    padding: 2rem;
                    background: var(--glass-highlight);
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    border-top: 1px solid var(--glass-border);
                }
                .chat-input-area input {
                    flex: 1;
                    background: var(--bg-dark);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-full);
                    padding: 1rem 1.5rem;
                    color: white;
                    outline: none;
                    font-size: 1rem;
                    transition: border-color 0.2s;
                }
                .chat-input-area input:focus { border-color: var(--primary); }
                .voice-btn, .send-btn {
                    padding: 0 1.5rem;
                    height: 50px;
                    border-radius: var(--radius-full);
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }
                .voice-btn {
                    background: var(--glass-highlight);
                    border: 1px solid var(--glass-border);
                    color: var(--text-primary);
                }
                .voice-btn:hover { background: rgba(255,255,255,0.1); }
                .voice-btn.recording { 
                    background: #ef4444; 
                    border-color: #ef4444; 
                    color: white;
                    animation: pulse 1.5s infinite; 
                }
                .send-btn {
                    background: var(--primary);
                    border: none;
                    color: white;
                }
                .send-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px var(--primary-glow); }
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
                .thinking span {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    background: var(--text-muted);
                    border-radius: 50%;
                    margin-right: 6px;
                    animation: dash 1s infinite;
                }
                .thinking span:nth-child(2) { animation-delay: 0.2s; }
                .thinking span:nth-child(3) { animation-delay: 0.4s; }
                @keyframes dash { 0% { transform: translateY(0); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default AIAssistant;
