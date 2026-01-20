import React, { useMemo, Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float, useGLTF, Environment, useTexture } from '@react-three/drei';
import { useClinical } from '../../context/ClinicalContext';
import * as THREE from 'three';

const MAPPING = {
    'Head': [0, 2.22, 0.05],
    'Chest': [0, 1.45, 0.22],
    'Abdomen': [0, 0.85, 0.22],
    'Neck': [0, 1.85, 0.08],
    'Left Arm': [0.52, 1.38, 0.05],
    'Right Arm': [-0.52, 1.38, 0.05],
    'Left Leg': [0.22, -0.35, 0.05],
    'Right Leg': [-0.22, -0.35, 0.05],
    'Back': [0, 1.45, -0.25]
};

const VERSION = Date.now();

const PARTS = {
    SKULL: `/skeleton_parts/skull.glb?v=${VERSION}`,
    VERTEBRAE: `/skeleton_parts/vertebrae.glb?v=${VERSION}`,
    CENTRAL: `/skeleton_parts/central_skeleton.glb?v=${VERSION}`,
    ARM: `/skeleton_parts/arm_left.glb?v=${VERSION}`,
    LEG: `/skeleton_parts/leg_left.glb?v=${VERSION}`,
    HAND: `/skeleton_parts/hand_left.glb?v=${VERSION}`,
    // NEW DETAILED SKULL ASSETS
    SKULL_COLORED: `/skeleton_parts/skull_detailed/overview-colored-skull.glb?v=${VERSION}`,
    SKULL_BASE: `/skeleton_parts/skull_detailed/colored-skull-base.glb?v=${VERSION}`
};

const BodyMarker = ({ position, status }) => {
    const color = status === 'RED' ? '#ef4444' : status === 'ORANGE' ? '#f59e0b' : '#22c55e';
    return (
        <mesh position={position}>
            <sphereGeometry args={[0.065, 16, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={6} transparent opacity={0.95} />
            <pointLight color={color} intensity={1.5} distance={1.5} />
        </mesh>
    );
};

// REMOVED onMeshFound prop and logic
// BonePart component supporting White Skeleton vs Red Muscle modes
const BonePart = ({ url, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], prefix = "", texture, highlightTexture, materialType = 'muscle', excludeNames = [], highlightedParts = [], visualMode = 'WHITE_SKELETON', showVessels = true, onMeshClick }) => {
    const { scene } = useGLTF(url);
    const model = useMemo(() => {
        window.__SCENE__ = scene; // TEMPORARY DEBUG
        const c = scene.clone();
        c.traverse((child) => {
            if (child.isMesh) {
                // HANDLE HIDDEN LAYERS
                const isVein = child.name.toLowerCase().includes('vein');
                if (isVein && (visualMode !== 'RED_MUSCLE' || !showVessels)) {
                    child.visible = false;
                    return;
                }
                if (excludeNames.includes(child.name)) {
                    child.visible = false;
                    return;
                }

                // MATERIAL DEFINITIONS
                const redDyeMaterial = new THREE.MeshStandardMaterial({
                    color: '#991b1b', // DEEP ANATOMICAL RED
                    emissive: '#991b1b',
                    emissiveIntensity: 0.1,
                    roughness: 0.4,
                    metalness: 0.2,
                });

                // BLUE VEIN MATERIAL
                const veinMaterial = new THREE.MeshStandardMaterial({
                    color: '#2563eb', // ANATOMICAL BLUE
                    emissive: '#1e3a8a',
                    emissiveIntensity: 0.3,
                    roughness: 0.3,
                    metalness: 0.6,
                });

                // 0. PRESERVE ORIGINAL: For high-fidelity skulls in Muscle mode
                if (materialType === 'preserve') {
                    // Check if skull part should be highlighted too
                    const isHighlighted = highlightedParts.some(hp => {
                        const target = hp.split(': ').pop().toLowerCase();
                        const mesh = child.name.toLowerCase();
                        return mesh.includes(target) || target.includes(mesh);
                    });
                    if (isHighlighted) {
                        child.material = redDyeMaterial;
                    }
                    return;
                }

                // 1. ANATOMICAL SPECIALS: Veins
                if (child.name.toLowerCase().includes('vein')) {
                    child.material = veinMaterial;
                    child.visible = true;
                    return;
                }

                // 2. RED MUSCLE MODE: Vibrant high-fidelity reveal
                if (visualMode === 'RED_MUSCLE') {
                    child.material = new THREE.MeshStandardMaterial({
                        map: highlightTexture || texture || null,
                        color: '#991b1b',      // LIGHTER RED (from #7f1d1d)
                        emissive: '#7f1d1d',   // WARM GLOW
                        emissiveIntensity: 0.2,
                        roughness: 0.4,
                        metalness: 0.1,
                    });
                    child.visible = true;

                    // BUT override with Bright Red if specifically diagnosed
                    const isHighlighted = highlightedParts.some(hp => {
                        const targetString = typeof hp === 'object' ? (hp.part_id || hp.name || hp.part || "") : hp;
                        if (!targetString) return false;
                        const target = targetString.toLowerCase()
                            .replace('left', 'l').replace('right', 'r')
                            .replace(/_/g, ' ').trim();
                        const meshRaw = child.name.toLowerCase().replace(/_/g, ' ').trim();
                        return meshRaw.includes(target) || target.includes(meshRaw);
                    });
                    if (isHighlighted) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: '#ef4444',
                            emissive: '#ef4444',
                            emissiveIntensity: 0.8,
                            roughness: 0.2,
                        });
                    }
                    return;
                }

                // 3. WHITE SKELETON MODE: Plain white with surgical red highlights
                const isHighlighted = highlightedParts.some(hp => {
                    // Extract name from object if it's an ID-centric highlight or AI marker
                    const targetString = typeof hp === 'object' ? (hp.part_id || hp.name || hp.part || "") : hp;
                    if (!targetString) return false;

                    // Normalize: "Left Arm" -> "l arm", "arml_humerus" -> "arml humerus"
                    const target = targetString.toLowerCase()
                        .replace('left', 'l').replace('right', 'r')
                        .replace(/_/g, ' ').trim();
                    const meshRaw = child.name.toLowerCase().replace(/_/g, ' ').trim();

                    return meshRaw.includes(target) || target.includes(meshRaw);
                });

                if (isHighlighted) {
                    child.material = redDyeMaterial;
                    child.visible = true;
                    return;
                }

                // Default White Bone look for Skeleton mode
                child.material = new THREE.MeshStandardMaterial({
                    color: '#f8fafc',
                    roughness: 0.8,
                    metalness: 0.05,
                });
            }
        });
        return c;
    }, [scene, texture, highlightTexture, materialType, excludeNames, highlightedParts, prefix, visualMode]);

    return (
        <primitive
            object={model}
            position={position}
            rotation={rotation}
            scale={scale}
            onClick={(e) => {
                e.stopPropagation();
                if (onMeshClick) onMeshClick(e.object.name);
            }}
        />
    );
};

const AnatomySystem = ({
    skullScale,
    skullY,
    skullZ,
    skullRotY = 0,
    markers = [],
    highlightedParts = [],
    visualMode = 'WHITE_SKELETON',
    showVessels = true,
    onMeshClick
}) => {
    const muscleTextures = useTexture({
        base: '/textures/muscle/muscle_tiles.png',
        plain: '/textures/muscle/muscle_tiles_plain.png',
        tendons: '/textures/muscle/muscle_tendons.png',
        trapezius: '/textures/muscle/muscle_trapezius.png'
    });

    useMemo(() => {
        Object.values(muscleTextures).forEach(tex => {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(2, 2);
            tex.colorSpace = THREE.SRGBColorSpace;
        });
    }, [muscleTextures]);

    // MARKERS
    const markerPositions = useMemo(() => {
        const _markers = markers || [];
        return _markers.map(m => ({
            ...m,
            pos: MAPPING[m.part] || [0, 0, 0]
        }));
    }, [markers]);

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 1, 6.5]} />
            <ambientLight intensity={1.5} />
            <hemisphereLight skyColor={0xffffff} groundColor={0x444444} intensity={1.0} />
            <directionalLight position={[5, 10, 5]} intensity={1.5} />

            <Environment preset="city" />

            <Float speed={1.0} rotationIntensity={0.1} floatIntensity={0.2}>
                <group position={[0, -0.65, 0]}>

                    {/* Torso & Spinal Column - Double layered for full mesh coverage */}
                    <BonePart
                        url={PARTS.CENTRAL}
                        prefix="Torso"
                        position={[0, 0, 0]}
                        texture={muscleTextures.trapezius}
                        highlightTexture={muscleTextures.base}
                        highlightedParts={highlightedParts}
                        visualMode={visualMode}
                        showVessels={showVessels}
                        onMeshClick={onMeshClick}
                        excludeNames={[
                            "Frontal_bone", "Parietal_bone_left", "Parietal_bone_right", "Occipital_bone",
                            "Sphenoid_bone", "Ethmoid_Bone", "Temporal_boner", "Nasal_boner", "Maxilla_boner",
                            "Zygomatic_boner", "Mandible_bone", "Vomer", "Lacrimal_boner", "Palatine_boner",
                            "Inferior_nasal_concha_boner", "Upper_caniner", "Upper_first_molar_toothr",
                            "Upper_first_premolarr", "Upper_lateral_incisorr", "Upper_medial_incisorr",
                            "Upper_second_molar_toothr", "Upper_second_premolarr", "Lower_caniner",
                            "Lower_first_molar_toothr", "Lower_first_premolarr", "Lower_lateral_incisorr",
                            "Lower_medial_incisorr", "Lower_second_molar_toothr", "Lower_second_premolarr"
                        ]}
                    />

                    <BonePart
                        url={PARTS.CENTRAL}
                        prefix="Torso"
                        position={[0, 0, 0]}
                        scale={[-1, 1, 1]}
                        texture={muscleTextures.trapezius}
                        highlightTexture={muscleTextures.base}
                        highlightedParts={highlightedParts}
                        visualMode={visualMode}
                        showVessels={showVessels}
                        excludeNames={[
                            "Frontal_bone", "Parietal_bone_left", "Parietal_bone_right", "Occipital_bone",
                            "Sphenoid_bone", "Ethmoid_Bone", "Temporal_boner", "Nasal_boner", "Maxilla_boner",
                            "Zygomatic_boner", "Mandible_bone", "Vomer", "Lacrimal_boner", "Palatine_boner",
                            "Inferior_nasal_concha_boner", "Upper_caniner", "Upper_first_molar_toothr",
                            "Upper_first_premolarr", "Upper_lateral_incisorr", "Upper_medial_incisorr",
                            "Upper_second_molar_toothr", "Upper_second_premolarr", "Lower_caniner",
                            "Lower_first_molar_toothr", "Lower_first_premolarr", "Lower_lateral_incisorr",
                            "Lower_medial_incisorr", "Lower_second_molar_toothr", "Lower_second_premolarr"
                        ]}
                    />

                    <BonePart
                        url={PARTS.VERTEBRAE}
                        prefix="Vertebrae"
                        position={[0, 0, 0]}
                        texture={muscleTextures.trapezius}
                        highlightTexture={muscleTextures.base}
                        highlightedParts={highlightedParts}
                        visualMode={visualMode}
                        showVessels={showVessels}
                        onMeshClick={onMeshClick}
                    />

                    {/* DYNAMIC SKULL SYSTEM */}
                    {visualMode === 'RED_MUSCLE' ? (
                        <>
                            {/* Detailed 4-Colored Skull for Muscle Mode */}
                            <BonePart
                                url={PARTS.SKULL_COLORED}
                                prefix="Torso"
                                position={[0, skullY, skullZ]}
                                scale={[skullScale, skullScale, skullScale]}
                                rotation={[0, skullRotY, 0]}
                                materialType="preserve"
                                highlightedParts={highlightedParts}
                                visualMode={visualMode}
                                onMeshClick={onMeshClick}
                            />
                            <BonePart
                                url={PARTS.SKULL_BASE}
                                prefix="Torso"
                                position={[0, skullY, skullZ]}
                                scale={[skullScale, skullScale, skullScale]}
                                rotation={[0, skullRotY, 0]}
                                materialType="preserve"
                                visualMode={visualMode}
                                onMeshClick={onMeshClick}
                            />
                        </>
                    ) : (
                        /* Plain Clinical Skull for Skeleton Mode */
                        <BonePart
                            url={PARTS.SKULL_BASE}
                            prefix="Torso"
                            position={[0, skullY, skullZ]}
                            scale={[skullScale, skullScale, skullScale]}
                            rotation={[0, skullRotY, 0]}
                            materialType="bone"
                            visualMode={visualMode}
                            onMeshClick={onMeshClick}
                        />
                    )}

                    {/* Limbs & Hands with Muscular Mapping */}
                    <BonePart url={PARTS.ARM} prefix="ArmL" texture={muscleTextures.plain} highlightTexture={muscleTextures.base} highlightedParts={highlightedParts} visualMode={visualMode} showVessels={showVessels} onMeshClick={onMeshClick} />
                    <BonePart url={PARTS.LEG} prefix="LegL" texture={muscleTextures.plain} highlightTexture={muscleTextures.base} highlightedParts={highlightedParts} visualMode={visualMode} showVessels={showVessels} onMeshClick={onMeshClick} />
                    <BonePart url={PARTS.HAND} prefix="HandL" texture={muscleTextures.tendons} highlightTexture={muscleTextures.base} highlightedParts={highlightedParts} visualMode={visualMode} showVessels={showVessels} onMeshClick={onMeshClick} />

                    <BonePart url={PARTS.ARM} prefix="ArmR" scale={[-1, 1, 1]} texture={muscleTextures.plain} highlightTexture={muscleTextures.base} highlightedParts={highlightedParts} visualMode={visualMode} showVessels={showVessels} onMeshClick={onMeshClick} />
                    <BonePart url={PARTS.LEG} prefix="LegR" scale={[-1, 1, 1]} texture={muscleTextures.plain} highlightTexture={muscleTextures.base} highlightedParts={highlightedParts} visualMode={visualMode} showVessels={showVessels} onMeshClick={onMeshClick} />
                    <BonePart url={PARTS.HAND} prefix="HandR" scale={[-1, 1, 1]} texture={muscleTextures.tendons} highlightTexture={muscleTextures.base} highlightedParts={highlightedParts} visualMode={visualMode} showVessels={showVessels} onMeshClick={onMeshClick} />

                    {markerPositions.map((m, idx) => (
                        <BodyMarker key={idx} position={m.pos} status={m.status} />
                    ))}
                </group>
            </Float>
            <OrbitControls enablePan={false} minDistance={2} maxDistance={12} autoRotate autoRotateSpeed={0.5} makeDefault />

            {/* Stable floor plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
                <planeGeometry args={[40, 40]} />
                <shadowMaterial opacity={0.2} color="#000000" />
            </mesh>
            <gridHelper args={[40, 40, 0x8b5cf6, 0x020617]} position={[0, -2.48, 0]} />
        </>
    );
};

const Humanoid3D = ({ markers = [], highlightedParts = [], role = 'PATIENT', onMeshClick }) => {
    const { submitRequest, hospitals } = useClinical();

    // INTERNAL STATE: Merge markers into highlights for the visual meshes
    const integratedHighlights = useMemo(() => {
        const fromMarkers = markers.map(m => m.part).filter(Boolean);
        return [...new Set([...highlightedParts, ...fromMarkers])];
    }, [markers, highlightedParts]);

    // LAYERS HUD STATE - Auto-switch to Red Muscle for specialists reviewing 3D cases
    const [visualMode, setVisualMode] = useState((role === 'DOCTOR' || role === 'NURSE') && markers.length > 0 ? 'RED_MUSCLE' : 'WHITE_SKELETON');
    const [showVessels, setShowVessels] = useState(true);
    const [showReferralModal, setShowReferralModal] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    // FINAL TRANSFORM VALUES (Fixed by User)
    const [skullScale] = useState(1.0);
    const [skullY] = useState(0.00);
    const [skullZ] = useState(-0.02);
    const [skullRotY] = useState(0);

    const isRed = visualMode === 'RED_MUSCLE';

    return (
        <div style={{
            width: '100%',
            height: '100%',
            minHeight: '600px',
            background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
            borderRadius: '28px',
            overflow: 'hidden',
            border: '1px solid rgba(124, 68, 237, 0.4)',
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)',
            position: 'relative'
        }}>
            {/* Role-Specific Controls */}
            {role === 'DOCTOR' && (
                <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: '800', marginBottom: '-5px', textAlign: 'right', textTransform: 'uppercase' }}>Advanced Layer Controls</div>
                    <button
                        onClick={() => setVisualMode(isRed ? 'WHITE_SKELETON' : 'RED_MUSCLE')}
                        style={{
                            background: isRed ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                            border: `1px solid ${isRed ? '#ef4444' : 'rgba(255,255,255,0.3)'}`,
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontWeight: '900',
                            fontSize: '0.75rem',
                            backdropFilter: 'blur(15px)',
                            boxShadow: isRed ? '0 0 20px rgba(239, 68, 68, 0.4)' : 'none',
                            transition: 'all 0.3s ease',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}
                    >
                        {isRed ? '🔴 LAYER: MUSCULAR' : '⚪ LAYER: SKELETAL'}
                    </button>
                    <button
                        onClick={() => setShowVessels(!showVessels)}
                        style={{
                            background: showVessels ? 'rgba(37, 99, 235, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                            border: `1px solid ${showVessels ? '#3b82f6' : 'rgba(255,255,255,0.3)'}`,
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontWeight: '900',
                            fontSize: '0.75rem',
                            backdropFilter: 'blur(15px)',
                            boxShadow: showVessels ? '0 0 20px rgba(37, 99, 235, 0.4)' : 'none',
                            transition: 'all 0.3s ease',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}
                    >
                        {showVessels ? '🔵 LAYER: VASCULAR' : '🔘 LAYER: VASCULAR (HIDDEN)'}
                    </button>
                </div>
            )}

            {/* Referral / Sharing UI for Patients/Nurses */}
            {(role === 'PATIENT' || role === 'NURSE') && (
                <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
                    <button
                        onClick={() => setShowReferralModal(true)}
                        style={{
                            background: 'linear-gradient(45deg, #7c44ed 0%, #4f46e5 100%)',
                            border: 'none',
                            color: 'white',
                            padding: '12px 30px',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            fontWeight: '800',
                            fontSize: '0.9rem',
                            boxShadow: '0 10px 30px rgba(124, 68, 237, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <span>📤 SEND TO SPECIALIST / HOSPITAL</span>
                    </button>
                </div>
            )}

            {/* Simplified Patient/Nurse Label */}
            {role !== 'DOCTOR' && (
                <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1000 }}>
                    <div style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        padding: '12px 20px',
                        borderRadius: '16px',
                        border: '1px solid rgba(124, 68, 237, 0.3)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <div style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 10px #22c55e' }} />
                        <span style={{ color: 'white', fontWeight: '800', fontSize: '0.8rem', letterSpacing: '1px' }}>
                            {role === 'PATIENT' ? 'PATIENT PORTAL: LIVE ANATOMY' : 'NURSE STATION: CARE VISUALIZER'}
                        </span>
                    </div>
                </div>
            )}

            {/* Hospital Selection Overlay */}
            {showReferralModal && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(2, 6, 23, 0.95)',
                    backdropFilter: 'blur(20px)',
                    zIndex: 2000,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px'
                }}>
                    <div style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
                        <h2 style={{ color: 'white', fontSize: '1.8rem', fontWeight: '900', marginBottom: '10px' }}>Select Target Hospital</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '30px' }}>This will share your full 3D diagnostic history and AI reports with the selected medical institution.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px' }}>
                            {hospitals.map(h => (
                                <button
                                    key={h.id}
                                    disabled={isSharing}
                                    onClick={async () => {
                                        setIsSharing(true);
                                        try {
                                            const content = `[REFERRAL] Patient shared 3D anatomical profile for specialized review. Highlights: ${highlightedParts.join(', ')}`;
                                            await submitRequest(
                                                "Patient Referral",
                                                h.id,
                                                content,
                                                'SCHEDULED',
                                                'text',
                                                null, // file
                                                null, // voiceUrl
                                                null, // preferredDoctorId
                                                highlightedParts
                                            );
                                            alert(`Analysis and 3D Model shared with ${h.name} successfully! Our coordinator will contact you.`);
                                            setShowReferralModal(false);
                                        } catch (err) {
                                            alert("Failed to share referral: " + err.message);
                                        } finally {
                                            setIsSharing(false);
                                        }
                                    }}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(124, 68, 237, 0.4)',
                                        color: 'white',
                                        padding: '15px',
                                        borderRadius: '12px',
                                        textAlign: 'left',
                                        fontWeight: '700',
                                        cursor: isSharing ? 'not-allowed' : 'pointer',
                                        opacity: isSharing ? 0.5 : 1
                                    }}
                                >
                                    🏢 {h.name}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowReferralModal(false)}
                            style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}
                        >
                            CANCEL
                        </button>
                    </div>
                </div>
            )}

            <Canvas dpr={[1, 2]}>
                <Suspense fallback={null}>
                    <AnatomySystem
                        markers={markers}
                        highlightedParts={integratedHighlights}
                        visualMode={visualMode}
                        showVessels={showVessels}
                        skullScale={skullScale}
                        skullY={skullY}
                        skullZ={skullZ}
                        skullRotY={skullRotY}
                        onMeshClick={onMeshClick}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
};

export default Humanoid3D;
