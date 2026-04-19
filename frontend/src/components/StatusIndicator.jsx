import React from 'react';
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"

export default function StatusIndicator({ status, progress }) {
  let message = "Initializing...";
  
  if (status === 'UPLOADING') message = "UPLOADING VIDEO TO CORE...";
  if (status === 'PROCESSING') message = "ANALYZING TRAFFIC DATA...";

  return (
    <Card className="w-full max-w-[600px] mx-auto">
      <div className="status-container flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="radar-spinner mb-8"></div>
        <h3 className="status-text text-accent-cyan text-2xl uppercase tracking-[2px] animate-pulse">
          {message}
        </h3>
        
        {status === 'PROCESSING' && (
          <div className="w-full mt-8">
            <Progress value={progress} className="h-2" />
            <p className="mt-3 font-mono text-sm text-accent-cyan tracking-wider font-semibold">
              {progress}% COMPLETE
            </p>
          </div>
        )}

        <p className="text-muted-foreground text-sm mt-6">
          This process requires heavy neural network computation.<br/>Please do not close this window.
        </p>
      </div>
    </Card>
  );
}
