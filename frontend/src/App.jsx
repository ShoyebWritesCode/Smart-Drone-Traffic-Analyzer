import React, { useState, useEffect } from 'react';
import Background3D from '@/components/Background3D';
import FileUploader from '@/components/FileUploader';
import StatusIndicator from '@/components/StatusIndicator';
import ResultsDashboard from '@/components/ResultsDashboard';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"

const API_BASE = "/api";

function AppContent() {
  const [state, setState] = useState('IDLE'); // IDLE, UPLOADING, PROCESSING, COMPLETED, ERROR
  const [taskId, setTaskId] = useState(null);
  const [resultsData, setResultsData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (file) => {
    setState('UPLOADING');
    setErrorMsg('');
    setProgress(0);
    
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
        
        if (data.progress !== undefined) {
          setProgress(data.progress);
        }
        
        if (data.status === 'completed') {
          setResultsData(data.data);
          setState('COMPLETED');
          clearInterval(intervalId);
        } else if (data.status === 'failed') {
          throw new Error(data.error || 'ML Pipeline encountered a critical failure.');
        }
      } catch (err) {
        setErrorMsg(err.message || 'Connection to tracking core lost.');
        setState('ERROR');
        clearInterval(intervalId);
      }
    };

    if (state === 'PROCESSING') {
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
      
      {/* Theme Toggle Button */}
      <div className="fixed top-4 right-4 md:top-8 md:right-8 z-50 scale-75 md:scale-100">
        <ModeToggle />
      </div>

      <div className="app-container max-w-[1200px] mx-auto px-4 md:px-8 pb-16 w-full z-10 flex flex-col items-center mt-8 md:mt-0">
        <h1 className="title-glow text-2xl sm:text-4xl md:text-5xl">SMART DRONE TRAFFIC ANALYZER</h1>
        
        {state === 'IDLE' && (
          <FileUploader onFileSelect={handleFileUpload} />
        )}
        
        {(state === 'UPLOADING' || state === 'PROCESSING') && (
          <StatusIndicator status={state} progress={progress} />
        )}
        
        {state === 'COMPLETED' && resultsData && (
          <div className="w-full">
            <Button variant="outline" onClick={resetSystem} className="mb-4 gap-2">
              &larr; SCAN NEW AREA
            </Button>
            <ResultsDashboard data={resultsData} />
          </div>
        )}
        
        {state === 'ERROR' && (
           <Card className="w-full max-w-[600px] border-destructive/50 bg-destructive/5 p-12 text-center">
             <AlertTriangle size={64} className="text-destructive mx-auto mb-6 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
             <h2 className="text-destructive text-2xl font-bold mb-4 uppercase tracking-wider">CONNECTION LOST</h2>
             <p className="text-destructive/80 mb-8">{errorMsg}</p>
             <Button variant="destructive" onClick={resetSystem} className="gap-2">
               <RefreshCcw size={18} /> RETRY TRANSMISSION
             </Button>
           </Card>
        )}
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="drone-analyzer-theme">
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
