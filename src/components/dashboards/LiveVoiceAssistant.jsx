import React, { useState, useEffect, useRef } from 'react';

const LiveVoiceAssistant = ({ isActive, onStop, onStatusChange }) => {
    const wsRef = useRef(null);
    const audioContextRef = useRef(null);
    const micStreamRef = useRef(null);
    const processorRef = useRef(null);

    // Dynamic WebSocket URL
    const getWsUrl = () => {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const tunnelHost = "medical-hub-brain.loca.lt";

        if (isLocal) {
            return `ws://localhost:8001/api/ws/ai_voice`;
        } else {
            return `wss://${tunnelHost}/api/ws/ai_voice`;
        }
    };

    const startSession = async () => {
        try {
            onStatusChange?.('Connecting...');

            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });

            const wsUrl = getWsUrl();
            console.log("[Voice] Connecting to:", wsUrl);
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                onStatusChange?.('Live');
                startMic();
            };

            wsRef.current.onmessage = async (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'audio') {
                        playPcm(data.data);
                    } else if (data.type === 'error') {
                        onStatusChange?.(`Error: ${data.message}`);
                    }
                } catch (e) {
                    console.error("[Voice] Message Parse Error:", e);
                }
            };

            wsRef.current.onclose = () => {
                stopSession();
                onStatusChange?.('Off');
            };

            wsRef.current.onerror = (err) => {
                console.error("[Voice] WS Error:", err);
                onStatusChange?.('Error');
            };

        } catch (err) {
            console.error("Failed to start voice session:", err);
            onStatusChange?.('Failed');
        }
    };

    const startMic = async () => {
        try {
            micStreamRef.current = await navigator.mediaDevices.getUserMedia({
                audio: { channelCount: 1, sampleRate: 16000 }
            });

            const source = audioContextRef.current.createMediaStreamSource(micStreamRef.current);
            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            source.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);

            processorRef.current.onaudioprocess = (e) => {
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const pcm16 = floatTo16BitPCM(inputData);
                    const base64 = btoa(uint8ArrayToString(pcm16));
                    wsRef.current.send(JSON.stringify({ type: 'audio', data: base64 }));
                }
            };
        } catch (err) {
            console.error("[Voice] Mic Error:", err);
            onStatusChange?.('Mic Error');
        }
    };

    const playPcm = (base64) => {
        if (!audioContextRef.current) return;
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const int16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768.0;
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
        onStop?.();
    };

    const floatTo16BitPCM = (input) => {
        let output = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            let s = Math.max(-1, Math.min(1, input[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return new Uint8Array(output.buffer);
    };

    const uint8ArrayToString = (u8a) => {
        let CHUNK_SZ = 0x8000;
        let c = [];
        for (let i = 0; i < u8a.length; i += CHUNK_SZ) {
            c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ)));
        }
        return c.join("");
    };

    useEffect(() => {
        if (isActive) startSession();
        else stopSession();
    }, [isActive]);

    useEffect(() => {
        return () => stopSession();
    }, []);

    if (!isActive) return null;

    return (
        <div className="voice-visualizer-inline">
            <div className="pulse-dot"></div>
            <style>{`
                .voice-visualizer-inline {
                    position: absolute;
                    right: 80px;
                    bottom: 25px;
                    width: 12px;
                    height: 12px;
                    z-index: 10;
                }
                .pulse-dot {
                    width: 100%;
                    height: 100%;
                    background: #10b981;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #10b981;
                    animation: blink 1s ease-in-out infinite;
                }
                @keyframes blink { 0% { opacity: 0.4; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0.4; transform: scale(0.8); } }
            `}</style>
        </div>
    );
};

export default LiveVoiceAssistant;
