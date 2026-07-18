import { useState } from 'react';
import Landing from './Landing';
import OnboardingWizard from './OnboardingWizard';
import BrainDashboard from './BrainDashboard';

function App() {
  const [userProfile, setUserProfile] = useState(null);

  const handleAuthSuccess = (data) => {
    // If they have completed onboarding, we skip the wizard
    if (data.onboarding_complete) {
      setUserProfile(data);
    } else {
      // Just set the partial profile (which has user_id) so we can run onboarding
      setUserProfile({ user_id: data.user_id, onboarding_complete: false });
    }
  };

  const handleOnboardingComplete = (profileData) => {
    setUserProfile({ ...profileData, onboarding_complete: true });
  };

  return (
    <div className="container">
      {!userProfile ? (
        <Landing onAuthSuccess={handleAuthSuccess} />
      ) : !userProfile.onboarding_complete ? (
        <OnboardingWizard userId={userProfile.user_id} onComplete={handleOnboardingComplete} />
      ) : (
        <BrainDashboard userProfile={userProfile} />
      )}
    </div>
  );
}

export default App;
