import { useState } from 'react'

function App() {
  const [prompt, setPrompt] = useState('Hello Gemini!')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleTest = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/test-gemini'

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>PromptWars Actual Challenge Baseline</h1>
      <p>Test the end-to-end integration with the Gemini API below.</p>
      
      <form onSubmit={handleTest}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a prompt"
          style={{ padding: '8px', width: '300px', marginRight: '10px' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '8px 16px' }}>
          {loading ? 'Testing...' : 'Run Gemini Test'}
        </button>
      </form>

      {error && (
        <div style={{ color: 'red', marginTop: '20px' }}>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '4px' }}>
          <h3>Success!</h3>
          <p><strong>Backend Message:</strong> {result.message}</p>
          <p><strong>Gemini Response:</strong></p>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>{result.gemini_response}</pre>
        </div>
      )}
    </div>
  )
}

export default App
