import React, { Suspense } from 'react';
import Humanoid3D from '../visual/Humanoid3D';

/**
 * HumanoidVisualizer (v2)
 * High-fidelity 3D replacement for the legacy 2D SVG visualizer.
 * Now proxies directly to the surgical-grade Humanoid3D engine.
 */
const HumanoidVisualizer = ({ markers = [], highlightedParts = [], role = 'PATIENT' }) => {
    return (
        <div className="humanoid-3d-wrapper" style={{
            width: '100%',
            height: role === 'DOCTOR' ? '500px' : '350px',
            borderRadius: '24px',
            overflow: 'hidden',
            border: '1px solid rgba(124, 68, 237, 0.2)',
            background: '#020617'
        }}>
            <Suspense fallback={<div style={{ color: '#a78bfa', fontSize: '0.7rem', textAlign: 'center', padding: '2rem' }}>INITIALIZING 3D BIOMETRICS...</div>}>
                <Humanoid3D
                    markers={markers}
                    highlightedParts={highlightedParts}
                    role={role}
                />
            </Suspense>
        </div>
    );
};

export default HumanoidVisualizer;
