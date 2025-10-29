import React, { useState } from 'react';
import { Card, Row, Col, Button, Form, Image, Badge } from 'react-bootstrap';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../utils/format';

const CartItem = ({ item, onUpdate, onRemove }) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const { updateCartItem, removeFromCart } = useCart();

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1 || newQuantity > 99) return;
    
    setIsUpdating(true);
    setQuantity(newQuantity);
    
    try {
      await updateCartItem(item.product._id, item.variant?._id, newQuantity);
      onUpdate && onUpdate();
    } catch (error) {
      console.error('Error updating cart item:', error);
      setQuantity(item.quantity); // Revert on error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    try {
      await removeFromCart(item.product._id, item.variant?._id);
      onRemove && onRemove();
    } catch (error) {
      console.error('Error removing cart item:', error);
    }
  };

  const getItemPrice = () => {
    // Use variant price if exists, otherwise use product basePrice
    return item.variant?.price || item.product?.basePrice || item.price || 0;
  };

  const getItemTotal = () => {
    return getItemPrice() * quantity;
  };

  const getVariantName = () => {
    if (item.variant) {
      return item.variant.name;
    }
    return 'Default';
  };

  const getStockStatus = () => {
    const stock = item.variant ? item.variant.stock : item.product?.totalStock || 0;
    if (stock === 0) {
      return <Badge bg="danger">Out of Stock</Badge>;
    } else if (stock < 10) {
      return <Badge bg="warning">Low Stock</Badge>;
    }
    return null;
  };

  return (
    <Card className="mb-3">
      <Card.Body>
        <Row className="align-items-center">
          <Col md={3}>
            <Link to={`/products/${item.product._id}`}>
              <Image
                src={item.product.images && item.product.images.length > 0 
                  ? item.product.images[0].url || item.product.images[0]
                  : '/placeholder-product.jpg'}
                alt={item.product.name}
                fluid
                style={{ height: '80px', objectFit: 'cover' }}
                className="rounded"
              />
            </Link>
          </Col>
          
          <Col md={6}>
            <div>
              <Link 
                to={`/products/${item.product._id}`}
                className="text-decoration-none text-dark fw-bold"
              >
                {item.product.name}
              </Link>
              {item.variant && (
                <div className="text-muted small">
                  Variant: {getVariantName()}
                </div>
              )}
              <div className="mt-1">
                {getStockStatus()}
              </div>
            </div>
          </Col>
          
          {/* <Col md={2}>
            <div className="text-center">
              <div className="fw-bold">{formatPrice(getItemPrice())}</div>
              <small className="text-muted">per unit</small>
            </div>
          </Col> */}
          
          <Col md={2}>
            <div className="d-flex align-items-center justify-content-center">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1 || isUpdating}
                className="rounded-circle"
                style={{ width: '32px', height: '32px' }}
              >
                <FaMinus size={10} />
              </Button>
              
              <Form.Control
                type="number"
                min="1"
                max="99"
                value={quantity}
                onChange={(e) => {
                  const newQty = parseInt(e.target.value) || 1;
                  handleQuantityChange(newQty);
                }}
                className="mx-2 text-center"
                style={{ width: '60px' }}
                disabled={isUpdating}
              />
              
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= 99 || isUpdating}
                className="rounded-circle"
                style={{ width: '32px', height: '32px' }}
              >
                <FaPlus size={10} />
              </Button>
            </div>
          </Col>
          
          {/* <Col md={1}>
            <div className="text-center">
              <div className="fw-bold text-primary">
                {formatPrice(getItemTotal())}
              </div>
            </div>
          </Col> */}
          
          <Col md={1}>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleRemove}
              className="rounded-circle"
              style={{ width: '32px', height: '32px' }}
              title="Remove item"
            >
              <FaTrash size={10} />
            </Button>
          </Col>
        </Row>
        <Row md={2}>
          <Col md={6}>
              <div className="text-start">
                <div className="fw-bold">{formatPrice(getItemPrice())}</div>
                <small className="text-muted">per unit</small>
              </div>
          </Col>
              <Col md={6} className="text-end">
                <div className="text-end">
                  <div className="fw-bold text-primary">
                    {formatPrice(getItemTotal())}
                  </div>
                </div>
            </Col>
          </Row>
      </Card.Body>
    </Card>
  );
};

export default CartItem;
