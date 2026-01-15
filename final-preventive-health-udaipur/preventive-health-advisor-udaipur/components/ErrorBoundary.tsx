import React, { Component, ErrorInfo, ReactNode } from 'react';
import { t } from '../locales/index.ts';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public handleReset = async () => {
    // 1. Clear Local Storage
    try {
        localStorage.removeItem('health-app-step');
        localStorage.removeItem('health-app-data');
    } catch(e) { console.warn("Failed to clear storage"); }

    // 2. Unregister Service Workers (Critical for fixing cache loops)
    if ('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
            }
        } catch(e) { console.warn("Failed to unregister SW"); }
    }
    
    // 3. Hard Reload
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container" style={{
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100vh', 
            padding: '2rem', 
            textAlign: 'center',
            background: '#fff', 
            color: '#263238'
        }}>
            <h1 style={{color: '#e53935', fontSize: '2rem', marginBottom: '1rem'}}>
                Something went wrong
            </h1>
            <p style={{marginBottom: '2rem', color: '#546e7a', maxWidth: '400px'}}>
                We're sorry, the application encountered an unexpected error. 
                This may be due to a temporary glitch or cached data.
            </p>
            <button 
                onClick={this.handleReset}
                style={{
                    padding: '12px 24px',
                    background: '#3949ab',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                }}
            >
                {t('error_try_again') || 'Reload Application'}
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;