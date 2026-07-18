import { useState } from 'react';

export default function OnboardingWizard({ userId, onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // CBT focused questions
  const [targetHabit, setTargetHabit] = useState('');
  const [habitTriggers, setHabitTriggers] = useState('');
  const [underlyingEmotion, setUnderlyingEmotion] = useState('');
  const [futureMotivation, setFutureMotivation] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 4) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    setError(null);
    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/onboard';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          target_habit: targetHabit,
          habit_triggers: habitTriggers,
          underlying_emotion: underlyingEmotion,
          future_motivation: futureMotivation,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate AI profile');
      const data = await response.json();
      
      // Pass the full profile data back up
      onComplete({
        user_id: userId,
        target_habit: targetHabit,
        habit_triggers: habitTriggers,
        underlying_emotion: underlyingEmotion,
        future_motivation: futureMotivation,
        assigned_persona: data.assigned_persona,
        interventions: data.interventions,
        wallet_balance: data.wallet_balance,
        vault_unlocked: data.vault_unlocked
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '600px', margin: '40px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#fbbf24' }}>Setup Your Brain</h2>
        <div className="wallet-badge" style={{ display: 'inline-block', marginTop: '10px' }}>
          Reward: Earn 🪙 50 Coins
        </div>
        <p style={{ color: '#94a3b8', marginTop: '15px' }}>
          Step {step} of 4: Let's understand your habit deeply using CBT principles.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="fade-in">
            <label>1. What specific habit are you trying to break?</label>
            <input
              type="text"
              required
              autoFocus
              value={targetHabit}
              onChange={(e) => setTargetHabit(e.target.value)}
              placeholder="e.g., Doomscrolling Instagram, Binge eating junk"
            />
          </div>
        )}
        
        {step === 2 && (
          <div className="fade-in">
            <label>2. What are the common triggers or situations for this habit?</label>
            <input
              type="text"
              required
              autoFocus
              value={habitTriggers}
              onChange={(e) => setHabitTriggers(e.target.value)}
              placeholder="e.g., Lying in bed at night, Stressful meetings"
            />
          </div>
        )}

        {step === 3 && (
          <div className="fade-in">
            <label>3. What underlying emotion are you usually trying to escape?</label>
            <input
              type="text"
              required
              autoFocus
              value={underlyingEmotion}
              onChange={(e) => setUnderlyingEmotion(e.target.value)}
              placeholder="e.g., Boredom, Anxiety, Loneliness"
            />
          </div>
        )}

        {step === 4 && (
          <div className="fade-in">
            <label>4. If you successfully resist this urge long-term, how will your life improve?</label>
            <textarea
              required
              autoFocus
              rows="3"
              value={futureMotivation}
              onChange={(e) => setFutureMotivation(e.target.value)}
              placeholder="e.g., I will have more energy to play with my kids and sleep better."
            />
          </div>
        )}

        {error && <div style={{ color: 'var(--danger-primary)', marginTop: '16px' }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
          {step > 1 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="btn-secondary">
              Back
            </button>
          ) : <div></div>}
          
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Analyzing your brain...' : step < 4 ? 'Next Step' : 'Generate My AI Persona (+50 🪙)'}
          </button>
        </div>
      </form>
    </div>
  );
}
