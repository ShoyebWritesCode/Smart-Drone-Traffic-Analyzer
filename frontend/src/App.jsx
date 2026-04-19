import React, { useState, useEffect } from 'react';
import Background3D from './components/Background3D';
import FileUploader from './components/FileUploader';
import StatusIndicator from './components/StatusIndicator';
import ResultsDashboard from './components/ResultsDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { AlertTriangle } from 'lucide-react';

// Using proxy in vite config, so API base is just relative
const API_BASE = "/api";

function App() {
  const [state, setState] = useState('IDLE'); // IDLE, UPLOADING, PROCESSING, COMPLETED, ERROR
  const [taskId, setTaskId] = useState(null);
  const [resultsData, setResultsData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = async (file) => {
    setState('UPLOADING');
    setErrorMsg('');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }
      
      const data = await response.json();
      setTaskId(data.task_id);
      setState('PROCESSING');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to communicate with core network.');
      setState('ERROR');
    }
  };

  useEffect(() => {
    let intervalId;

    const checkStatus = async () => {
      if (!taskId) return;
      
      try {
        const response = await fetch(`${API_BASE}/status/${taskId}`);
        if (!response.ok) throw new Error('Status check failed.');
        
        const data = await response.json();
        
        if (data.status === 'completed') {
          setResultsData(data.data);
          setState('COMPLETED');
          clearInterval(intervalId);
        } else if (data.status === 'failed') {
          throw new Error(data.error || 'ML Pipeline encountered a critical failure.');
        }
        // If 'processing' or 'pending', do nothing, let interval continue
      } catch (err) {
        setErrorMsg(err.message || 'Connection to tracking core lost.');
        setState('ERROR');
        clearInterval(intervalId);
      }
    };

    if (state === 'PROCESSING') {
      // Poll every 3 seconds
      intervalId = setInterval(checkStatus, 3000);
    }

    return () => clearInterval(intervalId);
  }, [state, taskId]);

  const resetSystem = () => {
    setState('IDLE');
    setTaskId(null);
    setResultsData(null);
    setErrorMsg('');
  };

  return (
    <ErrorBoundary>
      <Background3D />
      
      <div className="app-container">
        <h1 className="title-glow">SMART DRONE ANALYZER</h1>
        
        {state === 'IDLE' && (
          <FileUploader onFileSelect={handleFileUpload} />
        )}
        
        {(state === 'UPLOADING' || state === 'PROCESSING') && (
          <StatusIndicator status={state} />
        )}
        
        {state === 'COMPLETED' && resultsData && (
          <div style={{ width: '100%' }}>
            <button className="btn" onClick={resetSystem} style={{ marginBottom: '1rem' }}>
              &larr; SCAN NEW AREA
            </button>
            <ResultsDashboard data={resultsData} />
          </div>
        )}
        
        {state === 'ERROR' && (
           <div className="glass-panel error-box" style={{ maxWidth: '600px', width: '100%' }}>
           <AlertTriangle size={64} className="error-icon" />
           <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>CONNECTION LOST</h2>
           <p className="error-text">{errorMsg}</p>
           <button className="btn" onClick={resetSystem}>
             RETRY TRANSMISSION
           </button>
         </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
