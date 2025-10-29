import React from 'react';
import { Container, Alert, Button } from 'react-bootstrap';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console or error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container className="py-5">
          <div className="text-center">
            <FaExclamationTriangle size={64} className="text-danger mb-4" />
            <h2 className="text-danger mb-3">Oops! Something went wrong</h2>
            <p className="text-muted mb-4">
              We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
            </p>
            
            <Alert variant="danger" className="text-start">
              <Alert.Heading>Error Details:</Alert.Heading>
              <p className="mb-0">
                <strong>Error:</strong> {this.state.error?.toString()}
              </p>
              {this.state.errorInfo && (
                <details className="mt-2">
                  <summary>Stack Trace</summary>
                  <pre className="mt-2 small">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </Alert>
            
            <div className="mt-4">
              <Button 
                variant="primary" 
                onClick={this.handleReload}
                className="me-3"
              >
                <FaRedo className="me-2" />
                Reload Page
              </Button>
              <Button 
                variant="outline-primary" 
                onClick={this.handleReset}
              >
                Try Again
              </Button>
            </div>
          </div>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
