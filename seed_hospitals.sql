-- Seed Real Hospitals into Database
INSERT INTO hospitals (name, description, address, status, specialty_tags, logo_url, cover_image_url)
VALUES 
(
    '57357 Children''s Cancer Hospital', 
    'World-class pediatric oncology center providing free care to children with cancer across the Middle East. Specialized in advanced radiotherapy.', 
    'Sayeda Zeinab, Cairo', 
    'APPROVED', 
    '{"Pediatric Oncology", "Radiotherapy", "Bone Marrow Transplant"}',
    '🧬',
    '/hosp57357_egypt_exterior_1768085195254.png'
),
(
    'Kasr Al-Ainy Hospital', 
    'The historic cornerstone of Egyptian medicine. Afilliated with Cairo University, the largest comprehensive teaching hospital in the region.', 
    'Manial, Cairo', 
    'APPROVED', 
    '{"Emergency", "General Surgery", "Neurology"}',
    '🏥',
    'https://images.unsplash.com/photo-1519494026892-80bbd2d670db?q=80&w=1000&auto=format&fit=crop'
),
(
    'Magdi Yacoub Heart Foundation', 
    'A beacon of hope providing free, state-of-the-art cardiovascular care to underprivileged patients in Aswan and beyond.', 
    'Aswan, Upper Egypt', 
    'APPROVED', 
    '{"Cardiology", "Cardiac Surgery", "Pediatric Heart"}',
    '🫀',
    'https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=1000&auto=format&fit=crop'
)
ON CONFLICT DO NOTHING;
