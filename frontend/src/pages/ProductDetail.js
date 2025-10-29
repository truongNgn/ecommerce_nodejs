import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Tabs, Tab, Form, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaShoppingCart, FaHeart, FaShare, FaMinus, FaPlus, FaCheck } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';
import { formatPrice, formatDate } from '../utils/format';
import { validateForm, reviewValidationRules } from '../utils/validation';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { socket, joinProductRoom, leaveProductRoom } = useSocket();
  
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Product state
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  
  // Review state - Separate comment and rating
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  
  // Anonymous comment form (no login required)
  const [commentForm, setCommentForm] = useState({
    anonymousName: '',
    anonymousEmail: '',
    comment: '',
    title: ''
  });
  
  // Rating form (login required)
  const [ratingForm, setRatingForm] = useState({
    rating: 0,
    comment: '',
    title: ''
  });
  
  const [reviewErrors, setReviewErrors] = useState({});
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (id) {
      loadProduct();
      loadReviews();
      
      // Join WebSocket room for real-time updates
      if (joinProductRoom) {
        joinProductRoom(id);
      }
    }

    return () => {
      // Leave room when component unmounts
      if (leaveProductRoom) {
        leaveProductRoom(id);
      }
    };
  }, [id, joinProductRoom, leaveProductRoom]);

  // WebSocket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Listen for new reviews
    const handleNewReview = (data) => {
      if (data.productId === id) {
        console.log('📝 New review received:', data.review);
        setReviews(prev => [data.review, ...prev]);
      }
    };

    // Listen for updated rating
    const handleUpdatedRating = (data) => {
      if (data.productId === id) {
        console.log('⭐ Rating updated:', data);
        setProduct(prev => ({
          ...prev,
          averageRating: data.averageRating,
          reviewCount: data.reviewCount
        }));
      }
    };

    socket.on('new-review', handleNewReview);
    socket.on('updated-rating', handleUpdatedRating);

    return () => {
      socket.off('new-review', handleNewReview);
      socket.off('updated-rating', handleUpdatedRating);
    };
  }, [socket, id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${id}`);
      const productData = response.data.data.product;
      setProduct(productData);
      
      // Set default variant
      if (productData.variants && productData.variants.length > 0) {
        setSelectedVariant(productData.variants[0]);
      }
      
    } catch (error) {
      console.error('Failed to load product:', error);
      setError('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await api.get(`/products/${id}/reviews`);
      setReviews(response.data.data?.reviews || []);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant && product.variants && product.variants.length > 0) {
      alert('Please select a variant');
      return;
    }

    try {
      await addToCart(product, selectedVariant, quantity);
      alert('Added to cart successfully!');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add to cart');
    }
  };

  const handleQuantityChange = (newQuantity) => {
    const maxStock = getCurrentStock();
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      setQuantity(newQuantity);
    }
  };

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    setQuantity(1);
  };

  // Submit anonymous comment (no login required)
  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!commentForm.anonymousName || !commentForm.comment) {
      setReviewErrors({ 
        anonymousName: !commentForm.anonymousName ? 'Name is required' : '',
        comment: !commentForm.comment ? 'Comment is required' : ''
      });
      return;
    }

    try {
      setSubmittingReview(true);
      await api.post(`/reviews/${id}/comment`, commentForm);
      
      // Reset form
      setCommentForm({ anonymousName: '', anonymousEmail: '', comment: '', title: '' });
      setShowCommentModal(false);
      setReviewErrors({});
      // No need to reload - WebSocket will update automatically
      
    } catch (error) {
      console.error('Failed to submit comment:', error);
      alert(error.response?.data?.message || 'Failed to submit comment');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Submit rating (login required)
  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!ratingForm.rating || ratingForm.rating < 1) {
      setReviewErrors({ rating: 'Please select a rating' });
      return;
    }

    try {
      setSubmittingReview(true);
      await api.post(`/reviews/${id}/rating`, ratingForm);
      
      // Reset form
      setRatingForm({ rating: 0, comment: '', title: '' });
      setShowRatingModal(false);
      setReviewErrors({});
      // No need to reload - WebSocket will update automatically
      
    } catch (error) {
      console.error('Failed to submit rating:', error);
      alert(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getCurrentPrice = () => {
    if (selectedVariant) {
      return selectedVariant.price;
    }
    return product.basePrice;
  };

  const getCurrentStock = () => {
    if (selectedVariant) {
      return selectedVariant.stock;
    }
    return product.totalStock || 0;
  };

  const renderStars = (rating, interactive = false, onRatingChange = null) => {
    return (
      <div className="d-flex align-items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`${star <= rating ? 'text-warning' : 'text-muted'} ${
              interactive ? 'cursor-pointer' : ''
            }`}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading product details..." />;
  }

  if (error || !product) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <h4>Product Not Found</h4>
          <p>{error || 'The product you are looking for does not exist.'}</p>
          <Button variant="primary" onClick={() => navigate('/products')}>
            Back to Products
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        {/* Product Images */}
        <Col md={6}>
          <div className="product-images">
            <div className="main-image mb-3">
              <img
                src={product.images[selectedImage]?.url || '/placeholder-product.jpg'}
                alt={product.images[selectedImage]?.alt || product.name}
                className="img-fluid rounded"
                style={{ height: '400px', objectFit: 'cover', width: '100%' }}
              />
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="thumbnail-images d-flex gap-2">
                {product.images.map((image, index) => (
                  <img
                    key={index}
                    src={image.url || '/placeholder-product.jpg'}
                    alt={image.alt || `${product.name} ${index + 1}`}
                    className={`img-thumbnail ${selectedImage === index ? 'border-primary' : ''}`}
                    style={{ width: '80px', height: '80px', objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </Col>

        {/* Product Info */}
        <Col md={6}>
          <div className="product-info">
            <div className="mb-3">
              <Badge bg="secondary" className="me-2">{product.category}</Badge>
              <Badge bg="info">{product.brand}</Badge>
            </div>
            
            <h1 className="h2 fw-bold mb-3">{product.name}</h1>
            
            <div className="d-flex align-items-center mb-3">
              {renderStars(product.averageRating || 0)}
              <span className="ms-2 text-muted">
                ({product.reviewCount || 0} reviews)
              </span>
            </div>
            
            <div className="price-section mb-4">
              <div className="h3 text-primary fw-bold">
                {formatPrice(getCurrentPrice())}
              </div>
              {selectedVariant && selectedVariant.originalPrice && selectedVariant.originalPrice > selectedVariant.price && (
                <div className="text-muted small text-decoration-line-through">
                  Original price: {formatPrice(selectedVariant.originalPrice)}
                </div>
              )}
            </div>
            
            <div className="description mb-4">
              <p className="text-muted fw-bold">{product.shortDescription}</p>
              <p className="text-muted small">{product.description}</p>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="variants mb-4">
                <h6 className="fw-bold mb-3">Available Variants:</h6>
                <div className="d-flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <Button
                      key={variant._id}
                      variant={selectedVariant?._id === variant._id ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => handleVariantSelect(variant)}
                      disabled={variant.stock === 0}
                    >
                      {variant.name}
                      {variant.stock === 0 && ' (Out of Stock)'}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="quantity-cart mb-4">
              <div className="d-flex align-items-center mb-3">
                <label className="form-label me-3 mb-0">Quantity:</label>
                <div className="d-flex align-items-center">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <FaMinus />
                  </Button>
                  <Form.Control
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="mx-2 text-center"
                    style={{ width: '80px' }}
                    min="1"
                    max={getCurrentStock()}
                  />
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= getCurrentStock()}
                  >
                    <FaPlus />
                  </Button>
                </div>
                <span className="ms-3 text-muted">
                  {getCurrentStock()} in stock
                </span>
              </div>
              
              <div className="d-flex gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={getCurrentStock() === 0}
                  className="flex-fill"
                >
                  <FaShoppingCart className="me-2" />
                  Add to Cart
                </Button>
                {/* <Button variant="outline-secondary" size="lg">
                  <FaHeart />
                </Button>
                <Button variant="outline-secondary" size="lg">
                  <FaShare />
                </Button> */}
              </div>
            </div>

            {/* Stock Status */}
            <div className="stock-status">
              {getCurrentStock() === 0 ? (
                <Badge bg="danger" className="fs-6">Out of Stock</Badge>
              ) : getCurrentStock() < 10 ? (
                <Badge bg="warning" className="fs-6">Only {getCurrentStock()} left!</Badge>
              ) : (
                <Badge bg="success" className="fs-6">In Stock</Badge>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Product Details Tabs */}
      <Row className="mt-5">
        <Col>
          <Tabs defaultActiveKey="reviews" className="mb-4">
            <Tab eventKey="description" title="Description">
              <Card>
                <Card.Body>
                  <h5>Product Description</h5>
                  <p className="mb-0">{product.description}</p>
                </Card.Body>
              </Card>
            </Tab>
            
            <Tab eventKey="specifications" title="Specifications">
              <Card>
                <Card.Body>
                  <h5>Basic Information</h5>
                  <Row className="mb-4">
                    <Col md={6}>
                      <dl className="row">
                        <dt className="col-sm-4">Category:</dt>
                        <dd className="col-sm-8">{product.category}</dd>
                        <dt className="col-sm-4">Brand:</dt>
                        <dd className="col-sm-8">{product.brand}</dd>
                        <dt className="col-sm-4">SKU:</dt>
                        <dd className="col-sm-8">{selectedVariant?.sku || 'N/A'}</dd>
                      </dl>
                    </Col>
                    <Col md={6}>
                      <dl className="row">
                        <dt className="col-sm-4">Price:</dt>
                        <dd className="col-sm-8">{formatPrice(getCurrentPrice())}</dd>
                        <dt className="col-sm-4">Stock:</dt>
                        <dd className="col-sm-8">{getCurrentStock()} units</dd>
                        <dt className="col-sm-4">Rating:</dt>
                        <dd className="col-sm-8">
                          {renderStars(product.averageRating || 0)} ({product.reviewCount || 0} reviews)
                        </dd>
                      </dl>
                    </Col>
                  </Row>
                  
                  {product.specifications && Object.keys(product.specifications).length > 0 && (
                    <>
                      <h5 className="mt-4">Technical Specifications</h5>
                      <Row>
                        <Col md={12}>
                          <dl className="row">
                            {Object.entries(product.specifications).map(([key, value]) => (
                              value && (
                                <React.Fragment key={key}>
                                  <dt className="col-sm-3 text-capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</dt>
                                  <dd className="col-sm-9">
                                    {Array.isArray(value) ? value.join(', ') : value}
                                  </dd>
                                </React.Fragment>
                              )
                            ))}
                          </dl>
                        </Col>
                      </Row>
                    </>
                  )}
                  
                  {selectedVariant?.attributes && Object.keys(selectedVariant.attributes).length > 0 && (
                    <>
                      <h5 className="mt-4">Variant Specifications</h5>
                      <Row>
                        <Col md={12}>
                          <dl className="row">
                            {Object.entries(selectedVariant.attributes).map(([key, value]) => (
                              value && (
                                <React.Fragment key={key}>
                                  <dt className="col-sm-3 text-capitalize">{key}:</dt>
                                  <dd className="col-sm-9">
                                    {Array.isArray(value) ? value.join(', ') : value}
                                  </dd>
                                </React.Fragment>
                              )
                            ))}
                          </dl>
                        </Col>
                      </Row>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Tab>
            
            <Tab eventKey="reviews" title={`Reviews (${reviews.length})`}>
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5>Customer Reviews</h5>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-primary" 
                        onClick={() => setShowCommentModal(true)}
                      >
                        Add Comment
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={() => isAuthenticated ? setShowRatingModal(true) : navigate('/login')}
                      >
                        Rate Product
                      </Button>
                    </div>
                  </div>
                  
                  {reviews.length === 0 ? (
                    <p className="text-muted">No reviews yet. Be the first to review this product!</p>
                  ) : (
                    <div className="reviews-list">
                      {reviews.map((review) => (
                        <div key={review._id} className="review-item border-bottom pb-3 mb-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="mb-1">
                                {review.user?.fullName || review.anonymousUser?.name || 'Anonymous'}
                              </h6>
                              <div className="d-flex align-items-center">
                                {review.rating && review.rating > 0 ? renderStars(review.rating) : (
                                  <Badge bg="secondary">Comment</Badge>
                                )}
                                <span className="ms-2 text-muted small">
                                  {formatDate(review.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          {review.title && <h6 className="mb-2">{review.title}</h6>}
                          <p className="mb-0">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>
      </Row>

      {/* Anonymous Comment Modal */}
      <Modal show={showCommentModal} onHide={() => setShowCommentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Comment</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCommentSubmit}>
          <Modal.Body>
            <Alert variant="info">
              <small>You can leave a comment without logging in!</small>
            </Alert>
            
            <Form.Group className="mb-3">
              <Form.Label>Your Name *</Form.Label>
              <Form.Control
                type="text"
                value={commentForm.anonymousName}
                onChange={(e) => setCommentForm({ ...commentForm, anonymousName: e.target.value })}
                placeholder="Enter your name"
                isInvalid={!!reviewErrors.anonymousName}
              />
              <Form.Control.Feedback type="invalid">
                {reviewErrors.anonymousName}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Email (Optional)</Form.Label>
              <Form.Control
                type="email"
                value={commentForm.anonymousEmail}
                onChange={(e) => setCommentForm({ ...commentForm, anonymousEmail: e.target.value })}
                placeholder="your.email@example.com"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Title (Optional)</Form.Label>
              <Form.Control
                type="text"
                value={commentForm.title}
                onChange={(e) => setCommentForm({ ...commentForm, title: e.target.value })}
                placeholder="Summarize your comment"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Comment *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={commentForm.comment}
                onChange={(e) => setCommentForm({ ...commentForm, comment: e.target.value })}
                placeholder="Share your thoughts about this product..."
                isInvalid={!!reviewErrors.comment}
              />
              <Form.Control.Feedback type="invalid">
                {reviewErrors.comment}
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCommentModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submittingReview}>
              {submittingReview ? 'Submitting...' : 'Submit Comment'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Rating Modal (Login Required) */}
      <Modal show={showRatingModal} onHide={() => setShowRatingModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Rate This Product</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRatingSubmit}>
          <Modal.Body>
            <Alert variant="primary">
              <small>Logged in as: <strong>{user?.fullName}</strong></small>
            </Alert>
            
            <div className="mb-3">
              <label className="form-label">Rating *</label>
              <div className="d-flex align-items-center">
                {renderStars(ratingForm.rating, true, (rating) => 
                  setRatingForm({ ...ratingForm, rating })
                )}
                <span className="ms-2 text-muted">
                  {ratingForm.rating > 0 ? `${ratingForm.rating} star${ratingForm.rating > 1 ? 's' : ''}` : 'Select rating'}
                </span>
              </div>
              {reviewErrors.rating && (
                <div className="text-danger small">{reviewErrors.rating}</div>
              )}
            </div>
            
            <Form.Group className="mb-3">
              <Form.Label>Title (Optional)</Form.Label>
              <Form.Control
                type="text"
                value={ratingForm.title}
                onChange={(e) => setRatingForm({ ...ratingForm, title: e.target.value })}
                placeholder="Summarize your review"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Comment (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={ratingForm.comment}
                onChange={(e) => setRatingForm({ ...ratingForm, comment: e.target.value })}
                placeholder="Tell us about your experience with this product..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowRatingModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submittingReview}>
              {submittingReview ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ProductDetail;
