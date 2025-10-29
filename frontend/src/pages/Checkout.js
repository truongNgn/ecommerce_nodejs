import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaCreditCard, FaLock, FaCheck, FaArrowLeft } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';
import { formatPrice } from '../utils/format';
import { validateForm, orderValidationRules } from '../utils/validation';

const Checkout = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { 
    cart, 
    getCartItems, 
    getCartTotal, 
    getCartSubtotal,
    getDiscountAmount,
    getLoyaltyPointsUsed,
    getShippingCost,
    getTaxAmount,
    clearCart
  } = useCart();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    shippingAddress: '',
    paymentMethod: 'cod',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  
  // Payment methods
  const paymentMethods = [
    { id: 'cod', name: 'Cash on Delivery', icon: '💰' },
    { id: 'credit_card', name: 'Credit Card', icon: '💳' },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: '🏦' }
  ];

  useEffect(() => {
    // Check if cart is empty
    if (!cart || getCartItems().length === 0) {
      navigate('/cart');
      return;
    }
    
    // Pre-fill user info if authenticated
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        fullName: user.fullName || '',
        phone: user.phone || '',
        shippingAddress: user.addresses?.[0]?.address || user.addresses?.[0]?.street || ''
      }));
    }
  }, [isAuthenticated, user, cart, navigate, getCartItems]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateForm(formData, orderValidationRules);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const orderData = {
        items: getCartItems(),
        shippingAddress: formData.shippingAddress,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        total: getCartTotal(),
        subtotal: getCartSubtotal(),
        discount: getDiscountAmount(),
        loyaltyPointsUsed: getLoyaltyPointsUsed(),
        shipping: getShippingCost(),
        tax: getTaxAmount()
      };

      // Add guest info if not authenticated
      if (!isAuthenticated) {
        orderData.guestInfo = {
          email: formData.email,
          fullName: formData.fullName,
          phone: formData.phone
        };
      }

      const response = await api.post('/orders', orderData);
      
      // Clear cart
      await clearCart();
      
      setOrderId(response.data.data._id);
      setSuccess(true);
      
    } catch (error) {
      console.error('Checkout failed:', error);
      setError(error.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };


  const handleBackToCart = () => {
    navigate('/cart');
  };

  const handleContinueShopping = () => {
    navigate('/products');
  };

  if (loading) {
    return <LoadingSpinner message="Processing your order..." />;
  }

  if (success) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="mb-4">
            <FaCheck size={64} className="text-success mb-3" />
            <h2 className="text-success">Order Placed Successfully!</h2>
            <p className="lead">Thank you for your purchase. Your order has been confirmed.</p>
          </div>
          
          <Card className="mb-4">
            <Card.Body>
              <h5>Order Details</h5>
              <p><strong>Order ID:</strong> {orderId}</p>
              <p><strong>Total Amount:</strong> {formatPrice(getCartTotal())}</p>
              <p><strong>Payment Method:</strong> {paymentMethods.find(pm => pm.id === formData.paymentMethod)?.name}</p>
              <p><strong>Shipping Address:</strong> {formData.shippingAddress}</p>
            </Card.Body>
          </Card>
          
          <div className="d-flex gap-3 justify-content-center">
            <Button variant="primary" onClick={handleContinueShopping}>
              Continue Shopping
            </Button>
            <Button variant="outline-primary" onClick={() => navigate('/orders')}>
              View My Orders
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  const cartItems = getCartItems();
  const subtotal = getCartSubtotal();
  const discount = getDiscountAmount();
  const loyaltyPointsUsed = getLoyaltyPointsUsed();
  const shipping = getShippingCost();
  const tax = getTaxAmount();
  const total = getCartTotal();

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center mb-4">
        <Button 
          variant="outline-secondary" 
          onClick={handleBackToCart}
          className="me-3"
        >
          <FaArrowLeft className="me-2" />
          Back to Cart
        </Button>
        <h2 className="mb-0">Checkout</h2>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Row>
        {/* Checkout Form */}
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Shipping Information</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                {/* Guest user fields */}
                {!isAuthenticated && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>Email *</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your.email@example.com"
                        isInvalid={!!errors.email}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Full Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Nguyen Van A"
                        isInvalid={!!errors.fullName}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.fullName}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Phone *</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="0912345678"
                        isInvalid={!!errors.phone}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.phone}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Shipping Address *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleChange}
                    placeholder="Enter your complete shipping address"
                    isInvalid={!!errors.shippingAddress}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.shippingAddress}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Payment Method *</Form.Label>
                  <div className="row g-3">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="col-md-4">
                        <Form.Check
                          type="radio"
                          id={method.id}
                          name="paymentMethod"
                          value={method.id}
                          checked={formData.paymentMethod === method.id}
                          onChange={handleChange}
                          label={
                            <div className="d-flex align-items-center">
                              <span className="me-2">{method.icon}</span>
                              <span>{method.name}</span>
                            </div>
                          }
                        />
                      </div>
                    ))}
                  </div>
                </Form.Group>

                {/* Applied Discount and Loyalty Points Info */}
                {(cart?.discountCode || cart?.loyaltyPointsUsed > 0) && (
                  <div className="mb-3">
                    <h6>Applied Discounts & Points</h6>
                    {cart?.discountCode && (
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Badge bg="success">
                          Discount: {cart.discountCode}
                        </Badge>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 text-danger"
                          onClick={() => navigate('/cart')}
                        >
                          Edit in Cart
                        </Button>
                      </div>
                    )}
                    {cart?.loyaltyPointsUsed > 0 && (
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Badge bg="info">
                          Loyalty Points: {cart.loyaltyPointsUsed} used
                        </Badge>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 text-danger"
                          onClick={() => navigate('/cart')}
                        >
                          Edit in Cart
                        </Button>
                      </div>
                    )}
                    <small className="text-muted">
                      To modify discounts or loyalty points, please go back to your cart.
                    </small>
                  </div>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Order Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Any special instructions for your order"
                  />
                </Form.Group>

              <div className="d-flex justify-content-between">
                <Button 
                  variant="outline-secondary" 
                  onClick={handleBackToCart}
                >
                  <FaArrowLeft className="me-1" />
                  Back to Cart
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </Button>
              </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Order Summary */}
        <Col lg={4}>
          <Card className="sticky-top" style={{ top: '100px' }}>
            <Card.Header className="bg-light">
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              {/* Order Items */}
              <div className="mb-3">
                <h6>Items ({cartItems.length})</h6>
                {cartItems.map((item) => (
                  <div key={`${item.product._id}-${item.variant?._id || 'default'}`} className="d-flex justify-content-between mb-2">
                    <div className="small">
                      <div className="fw-bold">{item.product.name}</div>
                      {item.variant && (
                        <div className="text-muted">{item.variant.name}</div>
                      )}
                      <div className="text-muted">Qty: {item.quantity}</div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold fs-6">{formatPrice((item.product.basePrice + (item.variant?.additionalPrice || 0)) * item.quantity)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <hr />

              {/* Price Breakdown */}
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span className="fw-bold">{formatPrice(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Discount ({cart?.discountCode}):</span>
                  <span className="fw-bold">-{formatPrice(discount)}</span>
                </div>
              )}

              {loyaltyPointsUsed > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Loyalty Points Used:</span>
                  <span className="fw-bold">-{formatPrice(loyaltyPointsUsed)}</span>
                </div>
              )}

              <div className="d-flex justify-content-between mb-2">
                <span>Shipping:</span>
                <span className="fw-bold">{shipping > 0 ? formatPrice(shipping) : 'Free'}</span>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span>Tax:</span>
                <span className="fw-bold">{formatPrice(tax)}</span>
              </div>

              <hr />

              <div className="d-flex justify-content-between mb-4">
                <strong className="fs-5">Total:</strong>
                <strong className="text-primary fs-5">{formatPrice(total)}</strong>
              </div>

              {/* Security Badge */}
              <div className="text-center">
                <small className="text-muted">
                  <FaLock className="me-1" />
                  Secure checkout • SSL encrypted
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Checkout;
