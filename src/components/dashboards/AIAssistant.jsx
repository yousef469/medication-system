import React, { useState, useRef, useEffect } from 'react';
import { useClinical } from '../../context/ClinicalContext';

const AIAssistant = () => {
    const { aiConsultation } = useClinical();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hello! I am your medical assistant. I can help you find the right hospital, check treatment costs, or analyze your symptoms. How can I help you today?' }
    ]);
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
            const assistantMsg = {
                role: 'assistant',
                text: response.answer,
                type: response.type,
                suggestion: response.suggestion
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', text: "I'm having trouble connecting right now. Please try again." }]);
        } finally {
            setIsThinking(false);
        }
    };

    const toggleVoice = () => {
        setIsRecording(!isRecording);
        if (!isRecording) {
            // Simulate voice-to-text accuracy (Whisper)
            setTimeout(() => {
                setIsRecording(false);
                handleSend("I need to find a hospital for my child with better costs than Al-Salam.");
            }, 3000);
        }
    };

    return (
        <>
            <button className={`ai-trigger ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? '✕' : '🤖'}
            </button>

            {isOpen && (
                <div className="ai-chat-window glass-card fade-in">
                    <div className="chat-header">
                        <div className="status-dot"></div>
                        <h3>Clinical AI Assistant</h3>
                        <span className="mode-badge">Hybrid Local/Gemini</span>
                    </div>

                    <div className="chat-messages" ref={scrollRef}>
                        {messages.map((m, i) => (
                            <div key={i} className={`message ${m.role}`}>
                                <div className="bubble">
                                    {m.text}
                                    {m.type === 'LOCAL' && <span className="source-tag">Local Offline</span>}
                                    {m.type === 'GEMINI' && <span className="source-tag gemini">Gemini Cloud</span>}
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
                            {isRecording ? '⏹' : '🎤'}
                        </button>
                        <input
                            type="text"
                            placeholder="Ask about costs, hospitals, or symptoms..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button className="send-btn" onClick={() => handleSend()}>➔</button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .ai-trigger {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--primary), #0284c7);
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    z-index: 1000;
                    box-shadow: 0 10px 25px var(--primary-glow);
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .ai-trigger:hover { transform: scale(1.1) rotate(5deg); }
                .ai-trigger.active { background: #1a1a2e; }

                .ai-chat-window {
                    position: fixed;
                    bottom: 6rem;
                    right: 2rem;
                    width: 400px;
                    height: 550px;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    border: 1px solid var(--primary-glow);
                }

                .chat-header {
                    padding: 1.5rem;
                    background: var(--glass-highlight);
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    border-bottom: 1px solid var(--glass-border);
                }
                .status-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; }
                .mode-badge { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.05em; background: var(--glass-highlight); padding: 0.2rem 0.6rem; border-radius: 10px; color: var(--text-muted); margin-left: auto; }

                .chat-messages {
                    flex: 1;
                    padding: 1.5rem;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .message { display: flex; }
                .message.user { justify-content: flex-end; }
                .bubble {
                    max-width: 80%;
                    padding: 0.8rem 1.2rem;
                    border-radius: 18px;
                    font-size: 0.95rem;
                    line-height: 1.5;
                    position: relative;
                }
                .message.assistant .bubble { background: var(--glass-highlight); border: 1px solid var(--glass-border); border-bottom-left-radius: 4px; }
                .message.user .bubble { background: var(--primary); color: white; border-bottom-right-radius: 4px; }

                .source-tag {
                    display: block;
                    font-size: 0.6rem;
                    margin-top: 0.5rem;
                    color: var(--text-muted);
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .source-tag.gemini { color: var(--primary); }

                .chat-input-area {
                    padding: 1.5rem;
                    background: var(--glass-highlight);
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }
                .chat-input-area input {
                    flex: 1;
                    background: var(--bg-dark);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-full);
                    padding: 0.8rem 1.2rem;
                    color: white;
                    outline: none;
                }
                .voice-btn, .send-btn {
                    background: var(--glass-highlight);
                    border: 1px solid var(--glass-border);
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .voice-btn.recording { background: #ef4444; border-color: #ef4444; animation: pulse 1.5s infinite; }
                
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

                .thinking span {
                    display: inline-block;
                    width: 6px;
                    height: 6px;
                    background: var(--text-muted);
                    border-radius: 50%;
                    margin-right: 4px;
                    animation: dash 1s infinite;
                }
                .thinking span:nth-child(2) { animation-delay: 0.2s; }
                .thinking span:nth-child(3) { animation-delay: 0.4s; }
                @keyframes dash { 0% { transform: translateY(0); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0); } }
            `}</style>
        </>
    );
};

export default AIAssistant;
