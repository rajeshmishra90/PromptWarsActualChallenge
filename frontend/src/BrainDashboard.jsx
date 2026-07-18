import { useState } from 'react';
import BreathingVisualizer from './BreathingVisualizer';
import './index.css';

export default function BrainDashboard({ userProfile }) {
  const [currentFeeling, setCurrentFeeling] = useState('');
  const [dialogue, setDialogue] = useState(`Namaste. I am your new ${userProfile.assigned_persona}. Let's see if you have the discipline to stick to your goals, or if you're going to disappoint me again.`);
  const [challenge, setChallenge] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInput, setShowInput] = useState(false);

  // Wallet State
  const [walletBalance, setWalletBalance] = useState(userProfile.wallet_balance || 0);
  const [vaultUnlocked, setVaultUnlocked] = useState(userProfile.vault_unlocked || false);
  const [showVault, setShowVault] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState('sos'); // 'sos' or 'profile'

  const handleSosClick = () => {
    setShowInput(true);
  };

  const handleIntervene = async (e) => {
    e.preventDefault();
    if (!currentFeeling.trim()) return;

    setLoading(true);
    setError(null);

    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/intervene';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userProfile.user_id,
          current_feeling: currentFeeling,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setDialogue(data.brain_dialogue);
      setChallenge(data.cbt_challenge);
      setWalletBalance(data.wallet_balance);
      setVaultUnlocked(data.vault_unlocked);
      setShowInput(false);
      setCurrentFeeling('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockVault = async () => {
    setLoading(true);
    setError(null);
    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/unlock-vault';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userProfile.user_id }),
      });

      const data = await response.json();
      if (data.success) {
        setWalletBalance(data.wallet_balance);
        setVaultUnlocked(data.vault_unlocked);
        setShowVault(true);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (showVault) {
    return (
      <main className="glass-panel" role="main" aria-label="Urge surfing vault">
        <BreathingVisualizer onComplete={() => setShowVault(false)} />
      </main>
    );
  }

  return (
    <main className="glass-panel" style={{ maxWidth: '800px', margin: '20px auto' }} role="main">

      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
        <h1 style={{ margin: 0, color: '#fbbf24', fontSize: '1.5rem' }}>Needy Brain 🧠</h1>
        <div className="wallet-badge" aria-label={`Wallet balance: ${walletBalance} coins`}>
          🪙 {walletBalance} Coins
        </div>
      </header>

      {/* Tab Navigation */}
      <nav role="tablist" aria-label="Dashboard sections" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          role="tab"
          aria-selected={activeTab === 'sos'}
          aria-controls="sos-panel"
          id="sos-tab"
          onClick={() => setActiveTab('sos')}
          className={activeTab === 'sos' ? 'btn-primary' : 'btn-secondary'}
          style={{ flex: 1 }}
        >
          🚨 SOS Intervention
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'profile'}
          aria-controls="profile-panel"
          id="profile-tab"
          onClick={() => setActiveTab('profile')}
          className={activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}
          style={{ flex: 1 }}
        >
          👤 My CBT Profile
        </button>
      </nav>

      {/* SOS Tab */}
      {activeTab === 'sos' && (
        <section
          id="sos-panel"
          role="tabpanel"
          aria-labelledby="sos-tab"
          className="fade-in"
        >
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="persona-badge" aria-label={`Active persona: ${userProfile.assigned_persona}`}>
              Persona: <strong>{userProfile.assigned_persona}</strong>
            </span>

            {/* Vault Controls */}
            {!vaultUnlocked ? (
              <button
                onClick={handleUnlockVault}
                disabled={loading || walletBalance < 50}
                className="btn-vault-unlock"
                aria-label={`Unlock vault for 50 coins. You have ${walletBalance} coins.`}
                aria-disabled={walletBalance < 50}
              >
                🔒 Unlock Vault (50 🪙)
              </button>
            ) : (
              <button
                onClick={() => setShowVault(true)}
                className="btn-vault-open"
                aria-label="Open urge surfing vault"
              >
                🌊 Open Urge Surfing Vault
              </button>
            )}
          </div>

          <article className="dialogue-box" aria-live="polite" aria-label="Brain dialogue">
            <p className="dialogue-text">&quot;{dialogue}&quot;</p>
            {challenge && (
              <div className="challenge-box" role="status">
                <span className="challenge-title">Active Challenge:</span>
                {challenge}
              </div>
            )}
          </article>

          {!showInput ? (
            <button
              onClick={handleSosClick}
              className="btn-danger"
              aria-label="I am experiencing an urge - get help now"
            >
              🚨 I&apos;m Experiencing an Urge 🚨
            </button>
          ) : (
            <form onSubmit={handleIntervene} style={{ animation: 'fadeIn 0.3s ease-out' }} aria-label="Describe your current feeling">
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="current-feeling-input">What are you feeling right now?</label>
                <input
                  id="current-feeling-input"
                  type="text"
                  required
                  autoFocus
                  aria-required="true"
                  value={currentFeeling}
                  onChange={(e) => setCurrentFeeling(e.target.value)}
                  placeholder="e.g. I had a stressful meeting and want to bite my nails..."
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ marginTop: 0 }}
                  aria-busy={loading}
                >
                  {loading ? 'Consulting...' : 'Tell the Brain (+10 🪙)'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInput(false)}
                  className="btn-secondary"
                  aria-label="Cancel urge reporting"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              style={{ color: 'var(--danger-primary)', marginTop: '16px' }}
            >
              {error}
            </div>
          )}
        </section>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <section
          id="profile-panel"
          role="tabpanel"
          aria-labelledby="profile-tab"
          className="fade-in"
          style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '10px' }}
        >
          <h2 style={{ marginBottom: '20px' }}>Your CBT Insights</h2>

          <dl>
            <dt style={{ color: '#94a3b8', fontWeight: 'bold' }}>Target Habit</dt>
            <dd style={{ marginBottom: '15px', marginLeft: 0 }}>{userProfile.target_habit}</dd>

            <dt style={{ color: '#94a3b8', fontWeight: 'bold' }}>Common Triggers</dt>
            <dd style={{ marginBottom: '15px', marginLeft: 0 }}>{userProfile.habit_triggers}</dd>

            <dt style={{ color: '#94a3b8', fontWeight: 'bold' }}>Underlying Emotion</dt>
            <dd style={{ marginBottom: '15px', marginLeft: 0 }}>{userProfile.underlying_emotion}</dd>

            <dt style={{ color: '#94a3b8', fontWeight: 'bold' }}>Future Motivation</dt>
            <dd style={{ marginBottom: '25px', marginLeft: 0 }}>{userProfile.future_motivation}</dd>
          </dl>

          <h2 style={{ marginBottom: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
            AI-Recommended Interventions
          </h2>
          <ol style={{ paddingLeft: '20px', color: '#cbd5e1' }} aria-label="Your personalized CBT interventions">
            {userProfile.interventions && userProfile.interventions.map((intervention, i) => (
              <li key={i} style={{ marginBottom: '8px' }}>{intervention}</li>
            ))}
          </ol>
        </section>
      )}

    </main>
  );
}
