import React from 'react';
import { Download, PlayCircle } from 'lucide-react';

const API_BASE = "http://127.0.0.1:8000";

export default function ResultsDashboard({ data }) {
  const { counts, processed_video_url, csv_report_url, excel_report_url } = data;
  
  // Mapping YOLOv8 classes to readable names if needed, though they already come as IDs or from the backend.
  // The backend might send class IDs instead of names depending on the reporting module, 
  // but if it sends a dictionary {2: count, 3: count}, we format it.
  const formatClassName = (id) => {
    const map = { '2': 'Cars', '3': 'Motorcycles', '5': 'Buses', '7': 'Trucks' };
    return map[id] || `Class ${id}`;
  };

  return (
    <div className="results-grid">
      {/* Video Player Section */}
      <div className="glass-panel" style={{ padding: '1rem' }}>
        <h2 className="stat-label" style={{ marginBottom: '1rem' }}>
          <PlayCircle size={20} className="uploader-icon" /> 
          PROCESSED FEED
        </h2>
        <div className="video-container">
          <video 
            className="video-player" 
            controls 
            autoPlay 
            loop 
            src={`${API_BASE}${processed_video_url}`}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="glass-panel">
        <h2 className="stat-label" style={{ marginBottom: '1.5rem', color: '#22d3ee' }}>
          AI ANALYSIS RESULTS
        </h2>
        
        <div className="stats-container">
          {Object.entries(counts).map(([cls, count]) => (
            <div className="stat-card" key={cls}>
              <span className="stat-label">{formatClassName(cls)}</span>
              <span className="stat-value">{count}</span>
            </div>
          ))}
        </div>

        <div className="actions-row">
          <a href={`${API_BASE}${csv_report_url}`} className="btn btn-primary" download>
            <Download size={18} /> CSV
          </a>
          <a href={`${API_BASE}${excel_report_url}`} className="btn" download>
            <Download size={18} /> Excel
          </a>
        </div>
      </div>
    </div>
  );
}
