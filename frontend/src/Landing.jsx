import { useState } from 'react';

export default function Landing({ onAuthSuccess }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/auth';
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Authentication failed');
      }

      const data = await response.json();
      onAuthSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="glass-panel" style={{ maxWidth: '800px', margin: '40px auto' }} role="main">
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#fbbf24', fontSize: '3rem', marginBottom: '10px' }}>
          Needy Brain 🧠
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#94a3b8' }}>
          Stop ghosting your habit trackers. Let your personalized AI hold you accountable.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        <section aria-label="App features">
          <h2 style={{ marginBottom: '20px' }}>Why Needy Brain?</h2>
          <ul style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
            <li><strong>Desi CBT Interventions:</strong> Get roasted (lovingly) by an AI persona that understands you when you&apos;re about to slip up.</li>
            <li><strong>Urge Surfing Vault:</strong> Earn coins to unlock our 60-second visual breather to delay your cravings.</li>
            <li><strong>Earn Rewards:</strong> Get 🪙 50 coins just for setting up your profile, and 🪙 10 coins every time you survive an urge.</li>
          </ul>
        </section>

        <section aria-label="Login or register">
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '30px', borderRadius: '15px' }}>
            <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Login / Register</h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', textAlign: 'center', marginBottom: '20px' }}>
              If your number doesn&apos;t exist, we&apos;ll create a new account for you instantly.
            </p>
            <form onSubmit={handleSubmit} noValidate aria-label="Authentication form">
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="phone-input">Phone Number</label>
                <input
                  id="phone-input"
                  type="tel"
                  required
                  autoComplete="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10,15}"
                  placeholder="e.g., 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-describedby={error ? 'auth-error' : undefined}
                  aria-required="true"
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="password-input">Password</label>
                <input
                  id="password-input"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-required="true"
                />
              </div>
              {error && (
                <div
                  id="auth-error"
                  role="alert"
                  aria-live="polite"
                  style={{ color: 'var(--danger-primary)', marginBottom: '16px' }}
                >
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%' }}
                aria-busy={loading}
              >
                {loading ? 'Authenticating...' : 'Enter Needy Brain'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
