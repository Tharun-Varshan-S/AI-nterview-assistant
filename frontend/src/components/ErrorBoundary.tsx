import { Component, ReactNode } from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

/**
 * Error Boundary component to catch React errors
 * Prevents entire app from crashing on component errors
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('❌ Error caught by Error Boundary:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);

    // Update error count
    this.setState((prevState) => ({
      errorCount: prevState.errorCount + 1,
    }));
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorCount: 0,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 mx-auto mb-6">
              <AlertCircle className="text-rose-600" size={24} />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Something went wrong
            </h1>

            <p className="text-gray-600 text-center mb-4">
              We encountered an unexpected error. Please try refreshing the page.
            </p>

            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-mono text-rose-800 break-words">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>

            {this.state.errorCount > 2 && (
              <p className="text-xs text-gray-500 text-center mb-4 pb-4 border-b">
                If this keeps happening, please clear your browser cache or contact support.
              </p>
            )}

            <button
              onClick={this.handleReset}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCw size={18} />
              Try Again
            </button>

            <button
              onClick={() => (window.location.href = '/')}
              className="w-full mt-3 bg-gray-200 text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
