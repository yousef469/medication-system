import React, { useState, useEffect, useCallback } from 'react';
import Humanoid3D from '../visual/Humanoid3D';

/**
 * MobileAnatomyBridge
 * 
 * Optimized 3D visualizer for Android WebView.
 * Exposes a 'window.AndroidBridge' to allow Kotlin -> JS communication.
 * Triggers 'window.AndroidApp' to allow JS -> Kotlin communication.
 */
const MobileAnatomyBridge = () => {
    const [markers, setMarkers] = useState([]);
    const [highlights, setHighlights] = useState([]);
    const [role, setRole] = useState('PATIENT');

    // 1. Expose API to Android Native
    useEffect(() => {
        window.updateAnatomy = (markerData, highlightData) => {
            try {
                if (markerData) setMarkers(JSON.parse(markerData));
                if (highlightData) setHighlights(JSON.parse(highlightData));
            } catch (e) {
                console.error("Bridge Sync Error:", e);
            }
        };

        window.setAnatomyRole = (newRole) => {
            setRole(newRole || 'PATIENT');
        };

        // Notify Android that we are ready
        if (window.AndroidApp) {
            window.AndroidApp.onBridgeReady();
        }

        return () => {
            delete window.updateAnatomy;
            delete window.setAnatomyRole;
        };
    }, []);

    // 2. Report selections back to Android
    const handleSelection = useCallback((meshName) => {
        if (window.AndroidApp) {
            window.AndroidApp.onMeshSelected(meshName);
        }
    }, []);

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            background: '#020617',
            overflow: 'hidden'
        }}>
            <Humanoid3D
                markers={markers}
                highlightedParts={highlights}
                role={role}
                onMeshClick={handleSelection}
            />

            {/* Minimal Overlay for Debugging (Optional) */}
            <div style={{
                position: 'fixed',
                bottom: '10px',
                right: '10px',
                fontSize: '8px',
                color: 'rgba(255,255,255,0.2)',
                pointerEvents: 'none'
            }}>
                3D MOBILE BRIDGE v1.0
            </div>
        </div>
    );
};

export default MobileAnatomyBridge;
