import { useState } from 'react';
import './index.css';

export default function OnboardingWizard({ onComplete }) {
  const [habit, setHabit] = useState('');
  const [dangerTime, setDangerTime] = useState('');
  const [motivation, setMotivation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/onboard';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_habit: habit,
          danger_zone_time: dangerTime,
          future_motivation: motivation,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      onComplete(data);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel">
      <h2>Initialize Your Needy Brain</h2>
      <p>Let's configure your AI companion to help you break bad habits before they start.</p>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label>Target Habit to Break</label>
          <input
            type="text"
            required
            value={habit}
            onChange={(e) => setHabit(e.target.value)}
            placeholder="e.g., Late night phone scrolling in bed"
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label>Danger Zone Time</label>
          <input
            type="text"
            required
            value={dangerTime}
            onChange={(e) => setDangerTime(e.target.value)}
            placeholder="e.g., 11:00 PM"
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label>Future Motivation</label>
          <textarea
            required
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            placeholder="e.g., Get 8 hours of sleep to perform better at my new job"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Wiring synaptic pathways...' : 'Initialize Brain'}
        </button>
      </form>

      {error && <div style={{ color: 'var(--danger-primary)', marginTop: '16px', fontWeight: 'bold' }}>{error}</div>}
    </div>
  );
}
