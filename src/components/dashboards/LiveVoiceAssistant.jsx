import React, { useState, useEffect, useRef } from 'react';

const LiveVoiceAssistant = ({ isOpen, onClose }) => {
    const [isActive, setIsActive] = useState(false);
    const [status, setStatus] = useState('Ready');
    const wsRef = useRef(null);
    const audioContextRef = useRef(null);
    const micStreamRef = useRef(null);
    const processorRef = useRef(null);

    // Dynamic WebSocket URL
    const getWsUrl = () => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // In dev, usually localhost:5173 -> localhost:8001
        // In prod (tunnel), medical-hub-brain.loca.lt
        let host = window.location.host;

        // Handle local dev port mismatch if needed (Vite 5173 -> Backend 8001)
        if (host.includes('localhost:5173')) host = 'localhost:8001';

        return `${protocol}//${host}/api/ws/ai_voice`;
    };

    const startSession = async () => {
        try {
            setStatus('Connecting...');

            // 1. Setup Audio Context
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });

            // 2. Open WebSocket
            const wsUrl = getWsUrl();
            console.log("[Voice] Connecting to:", wsUrl);
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                setStatus('Connected');
                startMic();
            };

            wsRef.current.onmessage = async (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'audio') {
                        playPcm(data.data);
                    } else if (data.type === 'text') {
                        console.log("[AI Voice Text]:", data.text);
                    } else if (data.type === 'error') {
                        setStatus(`Error: ${data.message}`);
                    }
                } catch (e) {
                    console.error("[Voice] Message Parse Error:", e);
                }
            };

            wsRef.current.onclose = () => {
                stopSession();
                setStatus('Disconnected');
            };

            wsRef.current.onerror = (err) => {
                console.error("[Voice] WS Error:", err);
                setStatus('Connection Error');
            };

        } catch (err) {
            console.error("Failed to start voice session:", err);
            setStatus('Permission Denied');
        }
    };

    const startMic = async () => {
        try {
            micStreamRef.current = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000
                }
            });

            const source = audioContextRef.current.createMediaStreamSource(micStreamRef.current);

            // Using ScriptProcessor for compatibility (Worklets are better but more setup)
            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            source.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);

            processorRef.current.onaudioprocess = (e) => {
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const pcm16 = floatTo16BitPCM(inputData);

                    // Base64 encode PCM
                    const base64 = btoa(uint8ArrayToString(pcm16));
                    wsRef.current.send(JSON.stringify({
                        type: 'audio',
                        data: base64
                    }));
                }
            };

            setIsActive(true);
            setStatus('Listening...');
        } catch (err) {
            console.error("[Voice] Mic Error:", err);
            setStatus('Mic Access Error');
        }
    };

    const playPcm = (base64) => {
        if (!audioContextRef.current) return;

        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        const int16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
            float32[i] = int16[i] / 32768.0;
        }

        const buffer = audioContextRef.current.createBuffer(1, float32.length, 16000);
        buffer.getChannelData(0).set(float32);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.start();
    };

    const stopSession = () => {
        wsRef.current?.close();
        micStreamRef.current?.getTracks().forEach(t => t.stop());
        if (processorRef.current) {
            processorRef.current.onaudioprocess = null;
            processorRef.current.disconnect();
        }
        setIsActive(false);
        setStatus('Ready');
    };

    // Helper: Convert Float32 to Int16 (Little Endian)
    const floatTo16BitPCM = (input) => {
        let output = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            let s = Math.max(-1, Math.min(1, input[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return new Uint8Array(output.buffer);
    };

    // Helper: Chunked String convert for large arrays
    const uint8ArrayToString = (u8a) => {
        let CHUNK_SZ = 0x8000;
        let c = [];
        for (let i = 0; i < u8a.length; i += CHUNK_SZ) {
            c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ)));
        }
        return c.join("");
    };

    useEffect(() => {
        return () => stopSession();
    }, []);

    if (!isOpen) return null;

    return (
        <div className="voice-dialog-overlay" onClick={onClose}>
            <div className="voice-dialog-card glass-card fade-in" onClick={e => e.stopPropagation()}>
                <div className={`voice-visualizer ${isActive ? 'active' : ''}`}>
                    <div className="pulse-ring"></div>
                    <div className="pulse-ring delay-1"></div>
                    <div className="voice-icon-inner">🎙️</div>
                </div>

                <div className="voice-info">
                    <h2>Gemini Voice Assistant</h2>
                    <p className={`status-pill ${status.toLowerCase().replace(' ', '-')}`}>
                        {status}
                    </p>
                    <p className="hint">Talk naturally. Gemini will detect your speech.</p>
                </div>

                <div className="voice-controls">
                    {!isActive ? (
                        <button className="btn-primary start-call" onClick={startSession}>
                            Start Voice Session
                        </button>
                    ) : (
                        <button className="btn-secondary end-call" onClick={stopSession}>
                            End Conversation
                        </button>
                    )}
                    <button className="btn-close" onClick={onClose}>Dismiss</button>
                </div>

                <style>{`
                    .voice-dialog-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(2, 6, 23, 0.9);
                        backdrop-filter: blur(10px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 9999;
                        animation: fadeIn 0.3s ease;
                    }

                    .voice-dialog-card {
                        width: 90%;
                        max-width: 450px;
                        padding: 3rem 2rem;
                        text-align: center;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 2rem;
                        border: 1px solid var(--primary-glow);
                        box-shadow: 0 0 50px rgba(99, 102, 241, 0.2);
                    }

                    .voice-visualizer {
                        position: relative;
                        width: 120px;
                        height: 120px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 1rem;
                    }

                    .voice-icon-inner {
                        font-size: 4rem;
                        z-index: 2;
                        filter: drop-shadow(0 0 10px var(--primary-glow));
                    }

                    .pulse-ring {
                        position: absolute;
                        width: 100%;
                        height: 100%;
                        border-radius: 50%;
                        background: var(--primary);
                        opacity: 0;
                        z-index: 1;
                    }

                    .voice-visualizer.active .pulse-ring {
                        animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                    }

                    .pulse-ring.delay-1 { animation-delay: 0.5s; }

                    @keyframes ping {
                        0% { transform: scale(1); opacity: 0.4; }
                        100% { transform: scale(2.5); opacity: 0; }
                    }

                    .status-pill {
                        display: inline-block;
                        padding: 0.4rem 1.2rem;
                        border-radius: 50px;
                        background: rgba(255,255,255,0.05);
                        font-size: 0.9rem;
                        font-weight: 700;
                        color: #94a3b8;
                        margin: 1rem 0;
                        letter-spacing: 0.05em;
                        text-transform: uppercase;
                    }

                    .status-pill.connected, .status-pill.listening... {
                        background: rgba(16, 185, 129, 0.1);
                        color: #10b981;
                    }

                    .voice-info h2 { font-size: 1.8rem; margin: 0; color: white; }
                    .hint { font-size: 0.85rem; color: #64748b; }

                    .voice-controls {
                        display: flex;
                        flex-direction: column;
                        gap: 1rem;
                        width: 100%;
                    }

                    .btn-primary.start-call {
                        width: 100%;
                        background: linear-gradient(135deg, var(--primary), #4f46e5);
                        font-size: 1.1rem;
                    }

                    .end-call {
                        width: 100%;
                        background: rgba(239, 68, 68, 0.1);
                        border: 1px solid #ef4444;
                        color: #ef4444;
                    }
                    .end-call:hover { background: #ef4444; color: white; }

                    .btn-close {
                        background: transparent;
                        border: none;
                        color: #64748b;
                        cursor: pointer;
                        font-weight: 600;
                        text-decoration: underline;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default LiveVoiceAssistant;
