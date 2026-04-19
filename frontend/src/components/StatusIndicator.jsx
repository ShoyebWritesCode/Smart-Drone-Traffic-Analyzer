import React from 'react';

export default function StatusIndicator({ status }) {
  let message = "Initializing...";
  
  if (status === 'UPLOADING') message = "UPLOADING VIDEO TO CORE...";
  if (status === 'PROCESSING') message = "ANALYZING TRAFFIC DATA...";

  return (
    <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
      <div className="status-container">
        <div className="radar-spinner"></div>
        <h3 className="status-text">{message}</h3>
        <p className="uploader-subtext" style={{ marginTop: '1rem' }}>
          This process requires heavy neural network computation.<br/>Please do not close this window.
        </p>
      </div>
    </div>
  );
}
