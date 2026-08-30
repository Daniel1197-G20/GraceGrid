import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import './ErrorBoundary.css';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring services in production
    console.error('GraceGrid Section Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-container" role="alert" aria-live="assertive">
          <div className="error-boundary-card">
            <div className="error-icon-halo">
              <AlertTriangle size={28} />
            </div>
            <span className="error-eyebrow">TEMPORARY INTERRUPTION</span>
            <h3 className="error-title">Unable to display this section</h3>
            <p className="error-description">
              “Peace I leave with you; my peace I give you.” A temporary issue prevented this content from loading.
            </p>
            <div className="error-actions">
              <button 
                type="button" 
                className="btn-error-retry"
                onClick={this.handleRetry}
              >
                <RefreshCw size={16} />
                <span>Retry Loading</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
