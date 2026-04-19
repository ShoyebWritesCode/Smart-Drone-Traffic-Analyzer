import React, { useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Download, PlayCircle, Eye, Clock, Activity, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Use direct backend URL to bypass Vite proxy for heavy video streaming
const API_BASE = "http://127.0.0.1:8000";

export default function ResultsDashboard({ data }) {
  const { counts, processed_video_url, csv_report_url, excel_report_url, processing_time, backend_type, events = [], video_dimensions = { width: 640, height: 360 } } = data;
  const playerRef = useRef(null);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [focusEvent, setFocusEvent] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

  const totalVehicles = Object.values(counts).reduce((a, b) => a + b, 0);

  const formatClassName = (id) => {
    const map = { '2': 'Cars', '3': 'Motorcycles', '5': 'Buses', '7': 'Trucks' };
    return map[id] || `Class ${id}`;
  };

  const jumpToTime = (event) => {
    if (playerRef.current) {
      setIsPlaying(false);
      playerRef.current.pause();
      playerRef.current.currentTime = event.timestamp;
      setFocusEvent(event);
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

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedEvents = () => {
    let sortableEvents = [...events];
    if (sortConfig !== null) {
      sortableEvents.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (aValue === undefined || aValue === null) aValue = '';
        if (bValue === undefined || bValue === null) bValue = '';
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableEvents;
  };

  const sortedEvents = getSortedEvents();

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={12} className="opacity-30" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-accent-cyan" /> : <ChevronDown size={12} className="text-accent-cyan" />;
  };

  return (
    <div className="flex flex-col gap-8 w-full mt-8">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8 w-full">
        {/* Video Player Section */}
        <Card id="pro-player-container" className="p-4 border-accent-cyan/20 bg-white/40 dark:bg-slate-950/40 relative group">
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
              onPlay={() => { setIsPlaying(true); setFocusEvent(null); }}
            >
              Your browser does not support the video tag.
            </video>

            {/* Focus Mode SVG Overlay */}
            {focusEvent && focusEvent.bbox && (
              <div className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300">
                <svg width="100%" height="100%">
                  <defs>
                    <mask id="focus-hole">
                      <rect width="100%" height="100%" fill="white" />
                      <rect
                        x={`calc(${(focusEvent.bbox[0] / video_dimensions.width) * 100}% - 5%)`}
                        y={`calc(${(focusEvent.bbox[1] / video_dimensions.height) * 100}% - 5%)`}
                        width={`calc(${((focusEvent.bbox[2] - focusEvent.bbox[0]) / video_dimensions.width) * 100}% + 10%)`}
                        height={`calc(${((focusEvent.bbox[3] - focusEvent.bbox[1]) / video_dimensions.height) * 100}% + 10%)`}
                        fill="black"
                      />
                    </mask>
                  </defs>
                  <rect width="100%" height="100%" fill="rgba(0,0,0,0.85)" mask="url(#focus-hole)" />
                </svg>
                {/* Target Label */}
                <div
                  className="absolute text-accent-cyan font-bold font-mono text-[10px] bg-black/80 px-2 py-1 border border-accent-cyan/50 rounded-t shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                  style={{
                    left: `calc(${(focusEvent.bbox[0] / video_dimensions.width) * 100}% - 5%)`,
                    bottom: `calc(${100 - (focusEvent.bbox[1] / video_dimensions.height) * 100}% + 5%)`,
                  }}
                >
                  TARGET: TRK-{focusEvent.track_id}
                </div>
              </div>
            )}

            {/* Millisecond HUD Overlay */}
            <div className="absolute top-4 right-4 pointer-events-none z-10">
              <div className="bg-white/80 dark:bg-black/60 backdrop-blur-md border border-accent-cyan/30 px-4 py-2 rounded-lg flex items-center gap-3 shadow-lg">
                <Clock size={14} className="text-accent-cyan" />
                <span className="text-xl font-mono font-black text-foreground dark:text-white tracking-tighter">
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
        <Card className="flex flex-col h-full border-accent-cyan/20 bg-white/40 dark:bg-slate-950/40">
          <CardHeader>
            <CardTitle className="text-accent-cyan text-xl uppercase tracking-widest flex justify-between">
              ANALYTICS
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
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 hover:border-accent-cyan/40 transition-all cursor-default group"
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
      <Card className="w-full border-accent-cyan/10 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md">
        <CardHeader className="border-b border-slate-200 dark:border-white/5">
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
          <div className="relative overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 max-h-[400px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 dark:bg-slate-900 text-muted-foreground uppercase sticky top-0 z-20">
                <tr>
                  <th className="px-6 py-3 cursor-pointer hover:text-foreground hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors group" onClick={() => requestSort('timestamp')}>
                    <div className="flex items-center gap-2">Timestamp (ms) <SortIcon columnKey="timestamp" /></div>
                  </th>
                  <th className="px-6 py-3 cursor-pointer hover:text-foreground hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors group" onClick={() => requestSort('frame')}>
                    <div className="flex items-center gap-2">Frame Index <SortIcon columnKey="frame" /></div>
                  </th>
                  <th className="px-6 py-3 cursor-pointer hover:text-foreground hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors group" onClick={() => requestSort('class_id')}>
                    <div className="flex items-center gap-2">Classification <SortIcon columnKey="class_id" /></div>
                  </th>
                  <th className="px-6 py-3 cursor-pointer hover:text-foreground hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors group" onClick={() => requestSort('track_id')}>
                    <div className="flex items-center gap-2">Unique ID <SortIcon columnKey="track_id" /></div>
                  </th>
                  <th className="px-6 py-3 cursor-pointer hover:text-foreground hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors group" onClick={() => requestSort('confidence')}>
                    <div className="flex items-center gap-2">Confidence <SortIcon columnKey="confidence" /></div>
                  </th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {sortedEvents.length > 0 ? (
                  sortedEvents.map((event, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-accent-cyan/10 cursor-pointer transition-colors group"
                      onClick={() => jumpToTime(event)}
                    >
                      <td className="px-6 py-4 text-accent-cyan font-black">{formatMilliseconds(event.timestamp)}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">F-{event.frame.toString().padStart(5, '0')}</td>
                      <td className="px-6 py-4"><span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-slate-200">{formatClassName(event.class_id)}</span></td>
                      <td className="px-6 py-4 text-slate-500 tracking-tighter">TRK-{event.track_id}</td>
                      <td className="px-6 py-4 text-accent-cyan/80 font-mono text-[10px]">{event.confidence ? `${event.confidence}%` : 'N/A'}</td>
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
