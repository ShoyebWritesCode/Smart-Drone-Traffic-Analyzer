import React from 'react';

export default function StatusIndicator({ status, progress }) {
  let message = "Initializing...";
  
  if (status === 'UPLOADING') message = "UPLOADING VIDEO TO CORE...";
  if (status === 'PROCESSING') message = "ANALYZING TRAFFIC DATA...";

  return (
    <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
      <div className="status-container">
        <div className="radar-spinner"></div>
        <h3 className="status-text">{message}</h3>
        
        {status === 'PROCESSING' && (
          <div style={{ width: '100%', marginTop: '2rem' }}>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="progress-percentage">{progress}% COMPLETE</p>
          </div>
        )}

        <p className="uploader-subtext" style={{ marginTop: '1.5rem' }}>
          This process requires heavy neural network computation.<br/>Please do not close this window.
        </p>
      </div>
    </div>
  );
}
