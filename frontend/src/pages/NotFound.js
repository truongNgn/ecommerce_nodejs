import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FaHome, FaArrowLeft, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleSearch = () => {
    navigate('/products');
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} className="text-center">
          <div className="mb-5">
            <h1 className="display-1 text-primary mb-4">404</h1>
            <h2 className="mb-3">Page Not Found</h2>
            <p className="lead text-muted mb-4">
              Sorry, the page you are looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="mb-5">
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleGoHome}
                className="d-flex align-items-center"
              >
                <FaHome className="me-2" />
                Go Home
              </Button>
              
              <Button 
                variant="outline-secondary" 
                size="lg" 
                onClick={handleGoBack}
                className="d-flex align-items-center"
              >
                <FaArrowLeft className="me-2" />
                Go Back
              </Button>
              
              <Button 
                variant="outline-primary" 
                size="lg" 
                onClick={handleSearch}
                className="d-flex align-items-center"
              >
                <FaSearch className="me-2" />
                Browse Products
              </Button>
            </div>
          </div>

          <div className="text-muted">
            <p className="mb-2">Here are some helpful links:</p>
            <div className="d-flex justify-content-center gap-4 flex-wrap">
              <a href="/" className="text-decoration-none">Home</a>
              <a href="/products" className="text-decoration-none">Products</a>
              <a href="/cart" className="text-decoration-none">Cart</a>
              <a href="/login" className="text-decoration-none">Login</a>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFound;
