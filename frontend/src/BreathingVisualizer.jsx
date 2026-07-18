import { useState, useEffect } from 'react';
import './index.css';

export default function BreathingVisualizer({ onComplete }) {
  const [phase, setPhase] = useState('Breathe In');
  
  useEffect(() => {
    let currentPhase = 0;
    const phases = ['Breathe In', 'Hold', 'Breathe Out', 'Hold'];
    
    const interval = setInterval(() => {
      currentPhase = (currentPhase + 1) % phases.length;
      setPhase(phases[currentPhase]);
    }, 4000); // 4 seconds per phase (box breathing)

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="breathing-container">
      <h3 style={{ color: '#34d399', marginBottom: '20px' }}>Urge Surfing Vault</h3>
      <p style={{ color: '#94a3b8', marginBottom: '30px', textAlign: 'center' }}>
        Watch the circle. Match your breath. Let the craving pass.
      </p>
      
      <div className={`breathing-circle phase-${phase.replace(' ', '-').toLowerCase()}`}>
        <span className="breathing-text">{phase}</span>
      </div>

      <button onClick={onComplete} className="btn-secondary" style={{ marginTop: '40px' }}>
        I'm feeling better now
      </button>
    </div>
  );
}
