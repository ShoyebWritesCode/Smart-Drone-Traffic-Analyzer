import React, { useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Download, PlayCircle, Eye, Clock, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Use direct backend URL to bypass Vite proxy for heavy video streaming
const API_BASE = "http://127.0.0.1:8000"; 

export default function ResultsDashboard({ data }) {
  const { counts, processed_video_url, csv_report_url, excel_report_url, processing_time, backend_type, events = [] } = data;
  const playerRef = useRef(null);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  
  const totalVehicles = Object.values(counts).reduce((a, b) => a + b, 0);

  const formatClassName = (id) => {
    const map = { '2': 'Cars', '3': 'Motorcycles', '5': 'Buses', '7': 'Trucks' };
    return map[id] || `Class ${id}`;
  };

  const jumpToTime = (time) => {
    if (playerRef.current) {
      setIsPlaying(false);
      playerRef.current.pause();
      playerRef.current.currentTime = time;
      // Scroll to player
      const element = document.getElementById('pro-player-container');
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const formatMilliseconds = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  return (
    <div className="flex flex-col gap-8 w-full mt-8">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8 w-full">
        {/* Video Player Section */}
        <Card id="pro-player-container" className="p-4 border-accent-cyan/20 bg-slate-950/40 relative group">
          <CardHeader className="p-0 mb-4 flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-muted-foreground text-lg uppercase tracking-wider">
              <Activity size={20} className="text-accent-cyan animate-pulse" /> 
              PRECISION ANALYSIS FEED
            </CardTitle>
            <div className="flex gap-4 text-[10px] font-mono">
              <div className="px-3 py-1 rounded bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan">
                {backend_type || "YOLO"}
              </div>
              <div className="px-3 py-1 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400">
                AI TIME: {processing_time}s
              </div>
            </div>
          </CardHeader>

          {/* Advanced Player Wrapper */}
          <div className="relative w-full rounded-xl overflow-hidden border border-white/10 shadow-2xl aspect-video bg-black">
            <video 
              ref={playerRef}
              className="w-full h-full" 
              controls 
              autoPlay 
              playsInline
              src={`${API_BASE}${processed_video_url}`}
              onTimeUpdate={(e) => setPlayedSeconds(e.target.currentTime)}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
            >
              Your browser does not support the video tag.
            </video>
            
            {/* Millisecond HUD Overlay */}
            <div className="absolute top-4 right-4 pointer-events-none z-10">
              <div className="bg-black/60 backdrop-blur-md border border-accent-cyan/30 px-4 py-2 rounded-lg flex items-center gap-3 shadow-lg">
                <Clock size={14} className="text-accent-cyan" />
                <span className="text-xl font-mono font-black text-white tracking-tighter">
                  {formatMilliseconds(playedSeconds)}
                </span>
              </div>
            </div>

            {/* Status Overlay */}
            {!isPlaying && (
              <div className="absolute top-4 left-4 z-10">
                <div className="bg-orange-500/80 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest animate-pulse">
                  Precision Paused
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Analytics Section */}
        <Card className="flex flex-col h-full border-accent-cyan/20 bg-slate-950/40">
          <CardHeader>
            <CardTitle className="text-accent-cyan text-xl uppercase tracking-widest flex justify-between">
              ANALYTICS <span>v2.0</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1">
            <div className="space-y-4">
              <div className="p-6 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-transparent border border-accent-cyan/30 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-20"><Activity size={40} /></div>
                <span className="text-accent-cyan text-xs font-bold uppercase tracking-widest opacity-70">Total Traffic Count</span>
                <div className="text-6xl font-black text-foreground mt-2 font-mono tracking-tighter">
                  {totalVehicles}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {Object.entries(counts).map(([cls, count]) => (
                  <div 
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/60 border border-white/5 hover:border-accent-cyan/40 transition-all cursor-default group" 
                    key={cls}
                  >
                    <span className="text-muted-foreground text-sm font-medium group-hover:text-foreground">{formatClassName(cls)}</span>
                    <span className="text-xl font-bold font-mono text-foreground group-hover:text-accent-cyan">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-8">
              <Button asChild variant="futuristic" className="w-full gap-2 py-6 shadow-lg shadow-accent-cyan/10">
                <a href={`${API_BASE}${excel_report_url}`} download>
                  <Download size={18} /> FULL EXCEL DATA
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full gap-2 opacity-70 hover:opacity-100">
                <a href={`${API_BASE}${csv_report_url}`} download>
                  <Download size={18} /> RAW CSV
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Section: Individual Detection Table */}
      <Card className="w-full border-accent-cyan/10 bg-slate-950/50 backdrop-blur-md">
        <CardHeader className="border-b border-white/5">
          <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
            Interactive Frame-Accurate Log
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-xs text-muted-foreground italic mb-4 flex items-center gap-2">
            <Eye size={12} className="text-accent-cyan" />
            Click any detection to jump to its millisecond-accurate frame.
          </div>
          <div className="relative overflow-x-auto rounded-lg border border-slate-800 max-h-[400px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-muted-foreground uppercase sticky top-0 z-20">
                <tr>
                  <th className="px-6 py-3">Timestamp (ms)</th>
                  <th className="px-6 py-3">Frame Index</th>
                  <th className="px-6 py-3">Classification</th>
                  <th className="px-6 py-3">Unique ID</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {events.length > 0 ? (
                  events.slice().reverse().map((event, idx) => (
                    <tr 
                      key={idx} 
                      className="hover:bg-accent-cyan/10 cursor-pointer transition-colors group"
                      onClick={() => jumpToTime(event.timestamp)}
                    >
                      <td className="px-6 py-4 text-accent-cyan font-black">{formatMilliseconds(event.timestamp)}</td>
                      <td className="px-6 py-4 text-slate-400">F-{event.frame.toString().padStart(5, '0')}</td>
                      <td className="px-6 py-4"><span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">{formatClassName(event.class_id)}</span></td>
                      <td className="px-6 py-4 text-slate-500 tracking-tighter">TRK-{event.track_id}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] bg-accent-cyan/20 text-accent-cyan px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlayCircle size={10} /> INSPECT
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground italic">
                      No detection events logged. Run a scan to populate.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
