import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="w-full max-w-[600px] mx-auto border-destructive/50 bg-destructive/5 p-12 text-center">
          <AlertTriangle size={64} className="text-destructive mx-auto mb-6 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
          <h2 className="text-destructive text-2xl font-bold mb-4 uppercase tracking-wider text-red-500">SYSTEM MALFUNCTION</h2>
          <p className="text-destructive/80 mb-8">
            {this.state.error?.message || "An unexpected critical error occurred in the UI."}
          </p>
          <Button variant="destructive" onClick={() => window.location.reload()} className="gap-2">
            <RefreshCcw size={18} /> REBOOT SYSTEM
          </Button>
        </Card>
      );
    }
    return this.props.children;
  }
}
