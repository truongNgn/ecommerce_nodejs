import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaTrash, FaArrowLeft, FaPercent, FaGift } from 'react-icons/fa';
import CartItem from '../components/CartItem';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../utils/format';

const Cart = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { 
    cart, 
    loading, 
    error, 
    applyDiscountCode, 
    removeDiscountCode, 
    applyLoyaltyPoints,
    getCartItems,
    getCartTotal,
    getCartSubtotal,
    getDiscountAmount,
    getLoyaltyPointsUsed,
    getShippingCost,
    getTaxAmount,
    isEmpty,
    loadCart
  } = useCart();
  
  const [discountCode, setDiscountCode] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [usingLoyalty, setUsingLoyalty] = useState(false);
  const [discountError, setDiscountError] = useState('');

  useEffect(() => {
    if (cart?.discountCode) {
      setDiscountCode(cart.discountCode);
    }
    if (cart?.loyaltyPointsUsed) {
      setLoyaltyPoints(cart.loyaltyPointsUsed);
    }
  }, [cart]);

  const handleApplyDiscount = async (e) => {
    e.preventDefault();
    if (!discountCode.trim()) return;

    try {
      setApplyingDiscount(true);
      setDiscountError('');
      await applyDiscountCode(discountCode.trim());
    } catch (error) {
      setDiscountError(error.message || 'Invalid discount code');
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = async () => {
    try {
      await removeDiscountCode();
      setDiscountCode('');
    } catch (error) {
      console.error('Failed to remove discount:', error);
    }
  };

  const handleUseLoyaltyPoints = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !user?.loyaltyPoints) return;

    try {
      setUsingLoyalty(true);
      await applyLoyaltyPoints(loyaltyPoints);
    } catch (error) {
      console.error('Failed to use loyalty points:', error);
    } finally {
      setUsingLoyalty(false);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  const getMaxLoyaltyPoints = () => {
    if (!user?.loyaltyPoints) return 0;
    const subtotal = getCartSubtotal();
    // Formula: 100 points = 100,000 VND → max points = subtotal / 1000
    const maxPointsForSubtotal = Math.floor(subtotal / 1000);
    return Math.min(user.loyaltyPoints, maxPointsForSubtotal);
  };

  if (loading) {
    return <LoadingSpinner message="Loading cart..." />;
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <h4>Error Loading Cart</h4>
          <p>{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  if (isEmpty()) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <FaShoppingCart size={64} className="text-muted mb-4" />
          <h2 className="text-muted mb-3">Your cart is empty</h2>
          <p className="text-muted mb-4">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Button as={Link} to="/products" variant="primary" size="lg">
            Start Shopping
          </Button>
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
          onClick={() => navigate(-1)}
          className="me-3"
        >
          <FaArrowLeft className="me-2" />
          Back
        </Button>
        <h2 className="mb-0">
          <FaShoppingCart className="me-2" />
          Shopping Cart ({cartItems.length} items)
        </h2>
      </div>

      <Row>
        {/* Cart Items */}
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Cart Items</h5>
            </Card.Header>
            <Card.Body>
              {cartItems.map((item) => (
                <CartItem
                  key={`${item.product._id}-${item.variant?._id || 'default'}`}
                  item={item}
                  onUpdate={loadCart}
                  onRemove={loadCart}
                />
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Order Summary */}
        <Col lg={4}>
          <Card className="sticky-top" style={{ top: '20px' }}>
            <Card.Header>
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              {/* Subtotal */}
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {/* Discount Code */}
              <div className="mb-3">
                <Form onSubmit={handleApplyDiscount}>
                  <div className="input-group">
                    <Form.Control
                      type="text"
                      placeholder="Discount code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      disabled={applyingDiscount}
                    />
                    {cart?.discountCode ? (
                      <Button 
                        variant="outline-danger" 
                        onClick={handleRemoveDiscount}
                        disabled={applyingDiscount}
                      >
                        <FaTrash />
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        variant="outline-primary"
                        disabled={applyingDiscount || !discountCode.trim()}
                      >
                        {applyingDiscount ? 'Applying...' : 'Apply'}
                      </Button>
                    )}
                  </div>
                </Form>
                {discountError && (
                  <Alert variant="danger" className="mt-2 small">
                    {discountError}
                  </Alert>
                )}
                {cart?.discountCode && (
                  <div className="mt-2">
                    <Badge bg="success">
                      <FaPercent className="me-1" />
                      {cart.discountCode} applied
                    </Badge>
                  </div>
                )}
              </div>

              {/* Loyalty Points */}
              {isAuthenticated && user?.loyaltyPoints > 0 && (
                <div className="mb-3">
                  <Form onSubmit={handleUseLoyaltyPoints}>
                    <div className="input-group">
                      <Form.Control
                        type="number"
                        placeholder="Loyalty points"
                        value={loyaltyPoints}
                        onChange={(e) => setLoyaltyPoints(parseInt(e.target.value) || 0)}
                        min="0"
                        max={getMaxLoyaltyPoints()}
                        disabled={usingLoyalty}
                      />
                      <Button 
                        type="submit" 
                        variant="outline-primary"
                        disabled={usingLoyalty || loyaltyPoints <= 0}
                      >
                        {usingLoyalty ? 'Using...' : 'Use'}
                      </Button>
                    </div>
                    <small className="text-muted d-block">
                      Available: {user.loyaltyPoints} points (≈ {formatPrice(user.loyaltyPoints * 1000)})
                    </small>
                    <small className="text-muted d-block">
                      Max usable: {getMaxLoyaltyPoints()} points for this order
                    </small>
                  </Form>
                </div>
              )}

              {/* Applied Discount */}
              {discount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Discount:</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}

              {/* Applied Loyalty Points */}
              {loyaltyPointsUsed > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Loyalty Points:</span>
                  <span>-{formatPrice(loyaltyPointsUsed)}</span>
                </div>
              )}

              {/* Shipping */}
              <div className="d-flex justify-content-between mb-2">
                <span>Shipping:</span>
                <span>{shipping > 0 ? formatPrice(shipping) : 'Free'}</span>
              </div>

              {/* Tax */}
              <div className="d-flex justify-content-between mb-2">
                <span>Tax:</span>
                <span>{formatPrice(tax)}</span>
              </div>

              <hr />

              {/* Total */}
              <div className="d-flex justify-content-between mb-4">
                <strong>Total:</strong>
                <strong className="text-primary">{formatPrice(total)}</strong>
              </div>

              {/* Checkout Button */}
              <Button 
                variant="primary" 
                size="lg" 
                className="w-100 mb-3"
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>

              {/* Continue Shopping */}
              <Button 
                as={Link} 
                to="/products" 
                variant="outline-primary" 
                className="w-100"
              >
                Continue Shopping
              </Button>

              {/* Security Badge */}
              <div className="text-center mt-3">
                <small className="text-muted">
                  <FaGift className="me-1" />
                  Secure checkout • Free shipping on orders over 500,000₫
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Cart;
