import { useState } from 'react';
import BreathingVisualizer from './BreathingVisualizer';
import './index.css';

export default function BrainDashboard({ userProfile }) {
  const [currentFeeling, setCurrentFeeling] = useState('');
  const [dialogue, setDialogue] = useState(`Hello. I am your new ${userProfile.assigned_persona}. I see you're trying to quit a habit. Cute. Let's see how long this lasts.`);
  const [challenge, setChallenge] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInput, setShowInput] = useState(false);
  
  // Wallet State
  const [walletBalance, setWalletBalance] = useState(userProfile.wallet_balance || 0);
  const [vaultUnlocked, setVaultUnlocked] = useState(userProfile.vault_unlocked || false);
  const [showVault, setShowVault] = useState(false);

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

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

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
    <div className="glass-panel">
      {/* Header & Wallet Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>Needy Brain</h2>
        <div className="wallet-badge">
          🪙 {walletBalance} Coins
        </div>
      </div>
      
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="persona-badge">
          Persona: <strong>{userProfile.assigned_persona}</strong>
        </span>
        
        {/* Vault Controls */}
        {!vaultUnlocked ? (
          <button 
            onClick={handleUnlockVault} 
            disabled={loading || walletBalance < 50}
            className="btn-vault-unlock"
          >
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
          🚨 SOS: I'm Experiencing an Urge 🚨
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
              placeholder="e.g. I had a stressful day..."
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 0 }}>
              {loading ? 'Consulting the Brain...' : 'Tell the Brain (+10 🪙)'}
            </button>
            <button type="button" onClick={() => setShowInput(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && <div style={{ color: 'var(--danger-primary)', marginTop: '16px', fontWeight: 'bold' }}>{error}</div>}
    </div>
  );
}
