import { icpilot_backend } from 'declarations/icpilot_backend';
import { useState, useEffect } from 'react';

function App() {
  const [canisters, setCanisters] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch user's canisters on component mount
  useEffect(() => {
    fetchCanisters();
  }, []);

  async function fetchCanisters() {
    try {
      const userCanisters = await icpilot_backend.get_caller_canisters();
      setCanisters(userCanisters);
    } catch (error) {
      console.error("Error fetching canisters:", error);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await icpilot_backend.create_canister("My Canister", "This is a description of my canister");
      
      if ("ok" in result) {
        // Success case
        const canisterId = result.ok;
        setMessage({ type: 'success', text: `Successfully created canister: ${canisterId}` });
        // Refresh the canister list
        fetchCanisters();
      } else {
        // Error case
        setMessage({ type: 'error', text: `Failed to create canister: ${result.err}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
    
    return false;
  }

  return (
    <main>
      <img src="/logo2.svg" alt="DFINITY logo" />
      <br />
      <br />
      
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="manager-toggle">
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Creating...' : 'Create Canister'}
        </button>
      </div>

      {canisters.length > 0 && (
        <div className="canister-list">
          <h3>Your Canisters</h3>
          <ul>
            {canisters.map((canister, index) => (
              <li key={index}>
                <strong>{canister.metadata.name}</strong> ({canister.id})
                <p>{canister.metadata.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

export default App;
