import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-5 mt-5">
      <Container>
        <Row>
          <Col md={4} className="mb-4">
            <h5 className="fw-bold mb-3">🖥️ TechStore</h5>
            <p className="text-muted">
              Your trusted partner for computers and computer components. 
              We provide high-quality products with competitive prices and excellent customer service.
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="text-light"><FaFacebook size={20} /></a>
              <a href="#" className="text-light"><FaTwitter size={20} /></a>
              <a href="#" className="text-light"><FaInstagram size={20} /></a>
              <a href="#" className="text-light"><FaLinkedin size={20} /></a>
            </div>
          </Col>
          
          <Col md={2} className="mb-4">
            <h6 className="fw-bold mb-3">Quick Links</h6>
            <ul className="list-unstyled">
              <li><a href="/" className="text-muted text-decoration-none">Home</a></li>
              <li><a href="/products" className="text-muted text-decoration-none">Products</a></li>
              <li><a href="/about" className="text-muted text-decoration-none">About Us</a></li>
              <li><a href="/contact" className="text-muted text-decoration-none">Contact</a></li>
            </ul>
          </Col>
          
          <Col md={2} className="mb-4">
            <h6 className="fw-bold mb-3">Categories</h6>
            <ul className="list-unstyled">
              <li><a href="/products?category=laptops" className="text-muted text-decoration-none">Laptops</a></li>
              <li><a href="/products?category=desktops" className="text-muted text-decoration-none">Desktops</a></li>
              <li><a href="/products?category=processors" className="text-muted text-decoration-none">Processors</a></li>
              <li><a href="/products?category=graphics-cards" className="text-muted text-decoration-none">Graphics Cards</a></li>
            </ul>
          </Col>
          
          <Col md={2} className="mb-4">
            <h6 className="fw-bold mb-3">Support</h6>
            <ul className="list-unstyled">
              <li><a href="/help" className="text-muted text-decoration-none">Help Center</a></li>
              <li><a href="/shipping" className="text-muted text-decoration-none">Shipping Info</a></li>
              <li><a href="/returns" className="text-muted text-decoration-none">Returns</a></li>
              <li><a href="/warranty" className="text-muted text-decoration-none">Warranty</a></li>
            </ul>
          </Col>
          
          <Col md={2} className="mb-4">
            <h6 className="fw-bold mb-3">Contact Info</h6>
            <ul className="list-unstyled">
              <li className="d-flex align-items-center mb-2">
                <FaMapMarkerAlt className="me-2" />
                <span className="text-muted">123 Tech Street, Ho Chi Minh City</span>
              </li>
              <li className="d-flex align-items-center mb-2">
                <FaPhone className="me-2" />
                <span className="text-muted">+84 123 456 789</span>
              </li>
              <li className="d-flex align-items-center mb-2">
                <FaEnvelope className="me-2" />
                <span className="text-muted">info@techstore.com</span>
              </li>
            </ul>
          </Col>
        </Row>
        
        <hr className="my-4" />
        
        <Row className="align-items-center">
          <Col md={6}>
            <p className="text-muted mb-0">
              © 2024 TechStore. All rights reserved.
            </p>
          </Col>
          <Col md={6} className="text-md-end">
            <div className="d-flex justify-content-md-end gap-3">
              <a href="/privacy" className="text-muted text-decoration-none">Privacy Policy</a>
              <a href="/terms" className="text-muted text-decoration-none">Terms of Service</a>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
