import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { Card } from "@/components/ui/card"
import { toast } from 'sonner';

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
        toast.error('Invalid file format. Please upload a .mp4, .avi, or .mov video file.');
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
    <Card className="w-full flex justify-center">
      <div 
        className={`uploader-box w-full max-w-[600px] h-[200px] md:h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-accent-cyan rounded-[20px] cursor-pointer transition-all duration-300 bg-accent-cyan/5 shadow-[inset_0_0_20px_rgba(34,211,238,0.1)] p-4 text-center ${isDragging ? 'bg-accent-cyan/10 scale-[1.02] border-solid shadow-[inset_0_0_30px_rgba(34,211,238,0.3),0_0_10px_rgba(34,211,238,0.5)]' : 'hover:bg-accent-cyan/10 hover:shadow-[inset_0_0_30px_rgba(34,211,238,0.3),0_0_10px_rgba(34,211,238,0.5)] hover:-translate-y-0.5'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('video-upload').click()}
      >
        <UploadCloud size={48} className="md:w-16 md:h-16 text-accent-cyan mb-4 drop-shadow-[0_0_5px_rgba(34,211,238,1)]" />
        <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">Drag & Drop your Drone Video here</h3>
        <p className="text-muted-foreground text-xs md:text-sm">or click to browse (.mp4, .avi, .mov)</p>
        <input 
          id="video-upload" 
          type="file" 
          accept="video/*" 
          style={{ display: 'none' }} 
          onChange={handleChange} 
        />
      </div>
    </Card>
  );
}
