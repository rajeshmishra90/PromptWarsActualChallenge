import { useState } from 'react';
import OnboardingWizard from './OnboardingWizard';
import BrainDashboard from './BrainDashboard';
import './index.css';

function App() {
  const [userProfile, setUserProfile] = useState(null);

  const handleOnboardingComplete = (profile) => {
    setUserProfile(profile);
  };

  return (
    <>
      {!userProfile ? (
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      ) : (
        <BrainDashboard userProfile={userProfile} />
      )}
    </>
  );
}

export default App;
