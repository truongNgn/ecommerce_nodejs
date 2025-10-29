import React from 'react';
import { Spinner, Container } from 'react-bootstrap';

const LoadingSpinner = ({ 
  size = 'md', 
  message = 'Loading...', 
  centered = true, 
  className = '' 
}) => {
  const spinnerSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : undefined;
  
  const spinnerElement = (
    <div className={`d-flex flex-column align-items-center ${className}`}>
      <Spinner 
        animation="border" 
        role="status" 
        size={spinnerSize}
        className="mb-3"
      >
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      {message && (
        <div className="text-muted">
          {message}
        </div>
      )}
    </div>
  );

  if (centered) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        {spinnerElement}
      </Container>
    );
  }

  return spinnerElement;
};

export default LoadingSpinner;
