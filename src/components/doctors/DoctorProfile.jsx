import React from 'react';
import ProfessionalProfile from '../shared/ProfessionalProfile';

const DoctorProfile = ({ doctor }) => {
    // In this view, the doctor is always the owner of the profile being displayed
    return (
        <div className="doctor-dashboard-container">
            <ProfessionalProfile
                profile={doctor}
                isOwner={true}
                showFeed={true}
            />

            <style>{`
                .doctor-dashboard-container {
                    padding-bottom: 5rem;
                }
            `}</style>
        </div>
    );
};

export default DoctorProfile;
