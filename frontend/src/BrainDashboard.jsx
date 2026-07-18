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
        setShowVault(true); // Open it immediately upon unlock
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
      <div className="glass-panel">
        <BreathingVisualizer onComplete={() => setShowVault(false)} />
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ maxWidth: '800px', margin: '20px auto' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, color: '#fbbf24' }}>Needy Brain 🧠</h2>
        <div className="wallet-badge">
          🪙 {walletBalance} Coins
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('sos')}
          className={activeTab === 'sos' ? 'btn-primary' : 'btn-secondary'}
          style={{ flex: 1 }}
        >
          🚨 SOS Intervention
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}
          style={{ flex: 1 }}
        >
          👤 My CBT Profile
        </button>
      </div>

      {/* SOS Tab */}
      {activeTab === 'sos' && (
        <div className="fade-in">
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="persona-badge">
              Persona: <strong>{userProfile.assigned_persona}</strong>
            </span>
            
            {/* Vault Controls */}
            {!vaultUnlocked ? (
              <button onClick={handleUnlockVault} disabled={loading || walletBalance < 50} className="btn-vault-unlock">
                🔒 Unlock Vault (50 🪙)
              </button>
            ) : (
              <button onClick={() => setShowVault(true)} className="btn-vault-open">
                🌊 Open Urge Surfing Vault
              </button>
            )}
          </div>

          <div className="dialogue-box">
            <p className="dialogue-text">"{dialogue}"</p>
            {challenge && (
              <div className="challenge-box">
                <span className="challenge-title">Active Challenge:</span>
                {challenge}
              </div>
            )}
          </div>

          {!showInput ? (
            <button onClick={handleSosClick} className="btn-danger">
              🚨 I'm Experiencing an Urge 🚨
            </button>
          ) : (
            <form onSubmit={handleIntervene} style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ marginBottom: '16px' }}>
                <label>What are you feeling right now?</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={currentFeeling}
                  onChange={(e) => setCurrentFeeling(e.target.value)}
                  placeholder="e.g. I had a stressful meeting and want to bite my nails..."
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 0 }}>
                  {loading ? 'Consulting...' : 'Tell the Brain (+10 🪙)'}
                </button>
                <button type="button" onClick={() => setShowInput(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          )}
          {error && <div style={{ color: 'var(--danger-primary)', marginTop: '16px' }}>{error}</div>}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="fade-in" style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '10px' }}>
          <h3 style={{ marginBottom: '20px' }}>Your CBT Insights</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <strong style={{ color: '#94a3b8' }}>Target Habit:</strong>
            <p>{userProfile.target_habit}</p>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong style={{ color: '#94a3b8' }}>Common Triggers:</strong>
            <p>{userProfile.habit_triggers}</p>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong style={{ color: '#94a3b8' }}>Underlying Emotion:</strong>
            <p>{userProfile.underlying_emotion}</p>
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <strong style={{ color: '#94a3b8' }}>Future Motivation:</strong>
            <p>{userProfile.future_motivation}</p>
          </div>

          <h3 style={{ marginBottom: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
            AI-Recommended Interventions
          </h3>
          <ul style={{ paddingLeft: '20px', color: '#cbd5e1' }}>
            {userProfile.interventions && userProfile.interventions.map((intervention, i) => (
              <li key={i} style={{ marginBottom: '8px' }}>{intervention}</li>
            ))}
          </ul>
        </div>
      )}
      
    </div>
  );
}
