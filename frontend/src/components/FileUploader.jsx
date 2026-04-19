import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';

export default function FileUploader({ onFileSelect }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        onFileSelect(file);
      } else {
        alert('Please upload a valid video file.');
      }
    }
  }, [onFileSelect]);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="glass-panel" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div 
        className={`uploader-box ${isDragging ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('video-upload').click()}
      >
        <UploadCloud size={64} className="uploader-icon" />
        <h3 className="uploader-text">Drag & Drop your Drone Video here</h3>
        <p className="uploader-subtext">or click to browse (.mp4, .avi, .mov)</p>
        <input 
          id="video-upload" 
          type="file" 
          accept="video/*" 
          style={{ display: 'none' }} 
          onChange={handleChange} 
        />
      </div>
    </div>
  );
}
