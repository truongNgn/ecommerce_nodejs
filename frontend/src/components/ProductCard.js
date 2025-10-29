import React from 'react';
import { Card, Badge, Button, Row, Col } from 'react-bootstrap';
import { FaStar, FaShoppingCart, FaEye } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../utils/format';

const ProductCard = ({ product, showAddToCart = true }) => {
  const { addToCart } = useCart();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.variants && product.variants.length > 0) {
      // If product has variants, add the first variant by default
      const variant = product.variants[0];
      await addToCart(product, variant, 1);
    } else {
      await addToCart(product, null, 1);
    }
  };

  const getMinPrice = () => {
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map(variant => variant.price);
      return Math.min(...prices);
    }
    return product.basePrice || 0;
  };

  const getMaxPrice = () => {
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map(variant => variant.price);
      return Math.max(...prices);
    }
    return product.basePrice || 0;
  };

  const renderPrice = () => {
    const minPrice = getMinPrice();
    const maxPrice = getMaxPrice();
    
    if (minPrice === maxPrice) {
      return formatPrice(minPrice);
    } else {
      return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
    }
  };

  const renderStockStatus = () => {
    const totalStock = product.totalStock || 0;
    if (totalStock === 0) {
      return <Badge bg="danger">Out of Stock</Badge>;
    } else if (totalStock < 10) {
      return <Badge bg="warning">Low Stock</Badge>;
    }
    return null;
  };

  return (
    <Card className="h-100 shadow-sm product-card">
      <div className="position-relative">
        <Link to={`/products/${product._id}`}>
          <Card.Img
            variant="top"
            src={product.images && product.images.length > 0 ? product.images[0].url : '/placeholder-product.jpg'}
            alt={product.name}
            style={{ height: '200px', objectFit: 'cover' }}
          />
        </Link>
        {renderStockStatus()}
        <div className="position-absolute top-0 end-0 p-2">
          <Button
            variant="light"
            size="sm"
            as={Link}
            to={`/products/${product._id}`}
            className="rounded-circle shadow-sm"
            style={{ width: '40px', height: '40px' }}
          >
            <FaEye />
          </Button>
        </div>
      </div>
      
      <Card.Body className="d-flex flex-column">
        <div className="mb-2">
          <Badge bg="secondary" className="mb-2">{product.category}</Badge>
          <Badge bg="info" className="mb-2">{product.brand}</Badge>
        </div>
        
        <Card.Title className="h6 mb-2" style={{ minHeight: '2.5rem' }}>
          <Link 
            to={`/products/${product._id}`} 
            className="text-decoration-none text-dark"
          >
            {product.name}
          </Link>
        </Card.Title>
        
        <Card.Text className="text-muted small mb-3" style={{ minHeight: '3rem' }}>
          {product.shortDescription || (product.description && product.description.length > 100 
            ? `${product.description.substring(0, 100)}...` 
            : product.description)}
        </Card.Text>
        
        <div className="mb-3">
          <div className="d-flex align-items-center mb-1">
            <div className="d-flex align-items-center me-2">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={i < Math.floor(product.averageRating || 0) ? 'text-warning' : 'text-muted'}
                  size={12}
                />
              ))}
            </div>
            <small className="text-muted">
              ({product.reviewCount || 0} reviews)
            </small>
          </div>
        </div>
        
        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="h5 mb-0 text-primary fw-bold">
              {renderPrice()}
            </div>
            {product.variants && product.variants.length > 1 && (
              <small className="text-muted">
                {product.variants.length} variants
              </small>
            )}
          </div>
          
          {showAddToCart && (
            <Row className="g-2">
              <Col>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-100"
                  onClick={handleAddToCart}
                  disabled={product.totalStock === 0}
                >
                  <FaShoppingCart className="me-1" />
                  Add to Cart
                </Button>
              </Col>
              <Col xs="auto">
                <Button
                  variant="outline-primary"
                  size="sm"
                  as={Link}
                  to={`/products/${product._id}`}
                >
                  <FaEye />
                </Button>
              </Col>
            </Row>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
