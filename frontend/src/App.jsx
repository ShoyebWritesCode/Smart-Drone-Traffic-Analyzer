import React, { useState, useEffect } from 'react';
import Background3D from '@/components/Background3D';
import FileUploader from '@/components/FileUploader';
import StatusIndicator from '@/components/StatusIndicator';
import ResultsDashboard from '@/components/ResultsDashboard';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AlertTriangle, RefreshCcw, History, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { Toaster, toast } from 'sonner';

const API_BASE = "/api";

function AppContent() {
  const [state, setState] = useState('IDLE'); // IDLE, UPLOADING, PROCESSING, COMPLETED, ERROR
  const [taskId, setTaskId] = useState(null);
  const [resultsData, setResultsData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState(null);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistoryList(data);
      } else {
        toast.error("Failed to load history data.");
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
      toast.error("Cannot connect to server to load history.");
    }
  };

  const openHistory = () => {
    fetchHistory();
    setShowHistory(true);
  };

  const closeHistory = () => {
    setShowHistory(false);
  };

  const loadHistoryItem = (data) => {
    setResultsData(data);
    setState('COMPLETED');
    setShowHistory(false);
  };

  const deleteHistoryItem = async (taskId) => {
    try {
      const response = await fetch(`${API_BASE}/history/${taskId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success("Analysis permanently deleted.");
        fetchHistory(); // refresh the list
      } else {
        toast.error("Failed to delete record.");
      }
    } catch (err) {
      console.error("Failed to delete record:", err);
      toast.error("Network error while deleting record.");
    }
  };

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

        {state === 'IDLE' && !showHistory && (
          <div className="w-full flex flex-col items-center">
            <FileUploader onFileSelect={handleFileUpload} />
            <Button variant="outline" className="mt-8 gap-2 border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/10" onClick={openHistory}>
              <History size={18} /> VIEW PAST ANALYSES
            </Button>
          </div>
        )}

        {showHistory && (
          <Card className="w-full max-w-[800px] border-accent-cyan/20 bg-white/40 dark:bg-slate-950/40 p-6">
            <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-bold tracking-widest text-foreground flex items-center gap-2">
                <History className="text-accent-cyan" /> History
              </h2>
              <Button variant="ghost" onClick={closeHistory}>BACK TO SCANNER</Button>
            </div>

            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {historyList.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground italic">No past analyses found.</div>
              ) : (
                historyList.map(item => (
                  <div key={item.task_id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-lg group hover:border-accent-cyan/50 transition-colors">
                    <div className="mb-4 md:mb-0">
                      <div className="font-bold text-foreground mb-1">{item.original_filename}</div>
                      <div className="text-xs text-muted-foreground flex gap-4">
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                        <span className="text-accent-cyan">Total Vehicles: {item.total_vehicles}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto justify-end">
                      <Button variant="destructive" size="icon" onClick={() => setDeleteConfirmationId(item.task_id)}>
                        <Trash2 size={16} />
                      </Button>
                      <Button variant="default" className="gap-2 bg-accent-cyan text-slate-950 hover:bg-accent-cyan/80" onClick={() => loadHistoryItem(item.data)}>
                        LOAD <ArrowRight size={16} />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Delete Confirmation Modal */}
            {deleteConfirmationId && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <Card className="w-[400px] border-destructive/50 bg-slate-950 p-6 shadow-2xl shadow-destructive/20 relative">
                  <h3 className="text-xl font-bold text-destructive flex items-center gap-2 mb-4">
                    <AlertTriangle /> Confirm Deletion
                  </h3>
                  <p className="text-slate-300 mb-6">
                    Are you sure you want to permanently delete this analysis record? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setDeleteConfirmationId(null)}>Cancel</Button>
                    <Button variant="destructive" onClick={() => {
                      deleteHistoryItem(deleteConfirmationId);
                      setDeleteConfirmationId(null);
                    }}>
                      Delete
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </Card>
        )}

        {(state === 'UPLOADING' || state === 'PROCESSING') && (
          <StatusIndicator status={state} progress={progress} />
        )}

        {state === 'COMPLETED' && resultsData && (
          <div className="w-full">
            <Button variant="outline" onClick={resetSystem} className="mb-4 gap-2">
              <ArrowLeft size={16} /> SCAN NEW AREA
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
      <Toaster position="top-center" richColors theme="system" />
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
