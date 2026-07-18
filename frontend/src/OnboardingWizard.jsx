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

  const STEP_IDS = ['habit-input', 'triggers-input', 'emotion-input', 'motivation-input'];

  return (
    <main className="glass-panel" style={{ maxWidth: '600px', margin: '40px auto' }} role="main">
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#fbbf24' }}>Setup Your Brain</h1>
        <div className="wallet-badge" style={{ display: 'inline-block', marginTop: '10px' }}>
          Reward: Earn 🪙 50 Coins
        </div>
        <p style={{ color: '#94a3b8', marginTop: '15px' }} aria-live="polite">
          Step {step} of 4: Let&apos;s understand your habit deeply using CBT principles.
        </p>
      </header>

      <form onSubmit={handleSubmit} aria-label="CBT onboarding questionnaire">
        {step === 1 && (
          <div className="fade-in">
            <label htmlFor={STEP_IDS[0]}>1. What specific habit are you trying to break?</label>
            <input
              id={STEP_IDS[0]}
              type="text"
              required
              autoFocus
              aria-required="true"
              value={targetHabit}
              onChange={(e) => setTargetHabit(e.target.value)}
              placeholder="e.g., Doomscrolling Instagram, Binge eating junk"
            />
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <label htmlFor={STEP_IDS[1]}>2. What are the common triggers or situations for this habit?</label>
            <input
              id={STEP_IDS[1]}
              type="text"
              required
              autoFocus
              aria-required="true"
              value={habitTriggers}
              onChange={(e) => setHabitTriggers(e.target.value)}
              placeholder="e.g., Lying in bed at night, Stressful meetings"
            />
          </div>
        )}

        {step === 3 && (
          <div className="fade-in">
            <label htmlFor={STEP_IDS[2]}>3. What underlying emotion are you usually trying to escape?</label>
            <input
              id={STEP_IDS[2]}
              type="text"
              required
              autoFocus
              aria-required="true"
              value={underlyingEmotion}
              onChange={(e) => setUnderlyingEmotion(e.target.value)}
              placeholder="e.g., Boredom, Anxiety, Loneliness"
            />
          </div>
        )}

        {step === 4 && (
          <div className="fade-in">
            <label htmlFor={STEP_IDS[3]}>4. If you successfully resist this urge long-term, how will your life improve?</label>
            <textarea
              id={STEP_IDS[3]}
              required
              autoFocus
              rows="3"
              aria-required="true"
              value={futureMotivation}
              onChange={(e) => setFutureMotivation(e.target.value)}
              placeholder="e.g., I will have more energy to play with my kids and sleep better."
            />
          </div>
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

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="btn-secondary"
              aria-label={`Go back to step ${step - 1}`}
            >
              Back
            </button>
          ) : <div />}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            aria-busy={loading}
          >
            {loading ? 'Analyzing your brain...' : step < 4 ? 'Next Step' : 'Generate My AI Persona (+50 🪙)'}
          </button>
        </div>
      </form>
    </main>
  );
}
