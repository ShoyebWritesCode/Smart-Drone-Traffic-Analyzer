import React from 'react';
import { AlertTriangle } from 'lucide-react';

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
        <div className="glass-panel error-box" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          <AlertTriangle size={64} className="error-icon" />
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>SYSTEM MALFUNCTION</h2>
          <p className="error-text">
            {this.state.error?.message || "An unexpected critical error occurred in the UI."}
          </p>
          <button className="btn" onClick={() => window.location.reload()}>
            REBOOT SYSTEM
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
