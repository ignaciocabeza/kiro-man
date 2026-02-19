import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Game Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1a1a2e',
            color: 'white',
            fontFamily: '"Courier New", monospace',
            textAlign: 'center',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <h1 style={{ color: '#e94560' }}>Something went wrong</h1>
          <p>Please refresh the page.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 30px',
              background: 'transparent',
              border: '1px solid #e94560',
              color: '#e94560',
              cursor: 'pointer',
              fontFamily: '"Courier New", monospace',
              fontSize: '1rem',
            }}
          >
            REFRESH
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
