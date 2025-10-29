import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Table, ProgressBar } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaTruck, FaCheckCircle, FaClock, FaMapMarkerAlt, FaCreditCard } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { formatPrice, formatDate } from '../utils/format';

const OrderDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadOrder();
  }, [id, isAuthenticated]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📦 Loading order with ID:', id);
      
      const response = await api.get(`/orders/${id}`);
      
      console.log('📦 Full API response:', {
        status: response.status,
        data: response.data,
        success: response.data?.success,
        hasData: !!response.data?.data,
        hasOrder: !!response.data?.data?.order
      });
      
      const orderData = response.data.data?.order || response.data.data || response.data;
      
      console.log('📦 Extracted order data:', {
        orderId: orderData?._id,
        orderNumber: orderData?.orderNumber,
        status: orderData?.status,
        hasOrderNumber: !!orderData?.orderNumber,
        hasStatus: !!orderData?.status,
        isNull: orderData === null,
        isUndefined: orderData === undefined
      });
      
      if (!orderData) {
        setError('Order not found or invalid response');
        return;
      }
      
      setOrder(orderData);
    } catch (error) {
      console.error('Failed to load order:', error);
      setError(`Failed to load order: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    if (!status) {
      return <FaClock className="text-muted" />;
    }
    
    switch (status) {
      case 'pending':
        return <FaClock className="text-warning" />;
      case 'confirmed':
        return <FaCheckCircle className="text-info" />;
      case 'processing':
        return <FaTruck className="text-primary" />;
      case 'shipped':
        return <FaTruck className="text-success" />;
      case 'delivered':
        return <FaCheckCircle className="text-success" />;
      case 'cancelled':
        return <FaClock className="text-danger" />;
      default:
        return <FaClock className="text-muted" />;
    }
  };

  const getStatusBadge = (status) => {
    // Handle undefined/null status
    if (!status) {
      return (
        <Badge bg="secondary">
          Unknown
        </Badge>
      );
    }
    
    const variants = {
      pending: 'warning',
      confirmed: 'info',
      processing: 'primary',
      shipped: 'success',
      delivered: 'success',
      cancelled: 'danger',
      returned: 'secondary'
    };
    
    return (
      <Badge bg={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusProgress = (status) => {
    if (!status) return 0;
    
    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(status);
    return currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0;
  };

  const getStatusSteps = () => {
    return [
      { status: 'pending', label: 'Order Placed', icon: <FaClock /> },
      { status: 'confirmed', label: 'Confirmed', icon: <FaCheckCircle /> },
      { status: 'processing', label: 'Processing', icon: <FaTruck /> },
      { status: 'shipped', label: 'Shipped', icon: <FaTruck /> },
      { status: 'delivered', label: 'Delivered', icon: <FaCheckCircle /> }
    ];
  };

  const canCancel = () => {
    return order && order.status && ['pending', 'confirmed'].includes(order.status);
  };

  const canReturn = () => {
    return order && 
           order.status === 'delivered' && 
           order.actualDelivery && 
           (Date.now() - new Date(order.actualDelivery).getTime()) <= (7 * 24 * 60 * 60 * 1000);
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      const response = await api.put(`/orders/${id}/status`, { 
        status: 'cancelled',
        note: 'Cancelled by customer'
      });
      
      if (response.data.success) {
        loadOrder();
        alert('Order cancelled successfully');
      } else {
        alert(response.data.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      const errorMessage = error.response?.data?.message || 'Failed to cancel order';
      alert(errorMessage);
    }
  };

  const handleReturnOrder = async () => {
    if (!window.confirm('Are you sure you want to return this order?')) return;
    
    try {
      const response = await api.put(`/orders/${id}/status`, { 
        status: 'returned',
        note: 'Returned by customer'
      });
      
      if (response.data.success) {
        loadOrder();
        alert('Order return request submitted successfully');
      } else {
        alert(response.data.message || 'Failed to return order');
      }
    } catch (error) {
      console.error('Failed to return order:', error);
      const errorMessage = error.response?.data?.message || 'Failed to return order';
      alert(errorMessage);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading order details..." />;
  }

  if (error || !order) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <h4>Order Not Found</h4>
          <p>{error || 'The order you are looking for does not exist.'}</p>
          <Button variant="primary" onClick={() => navigate('/orders')}>
            Back to Orders
          </Button>
        </Alert>
      </Container>
    );
  }

  // Safety check for order data
  if (!order || !order.orderNumber || !order.status) {
    console.log('⚠️ Order data validation failed:', {
      order: order,
      orderNumber: order?.orderNumber,
      status: order?.status,
      orderId: order?._id,
      hasOrderNumber: !!order?.orderNumber,
      hasStatus: !!order?.status,
      isNull: order === null,
      isUndefined: order === undefined
    });
    
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <h4>Invalid Order Data</h4>
          <p>The order data is incomplete or corrupted.</p>
          <p><strong>Debug Info:</strong></p>
          <ul>
            <li>Order Object: {order ? 'Present' : 'Missing'}</li>
            <li>Order Number: {order?.orderNumber || 'Missing'}</li>
            <li>Status: {order?.status || 'Missing'}</li>
            <li>Order ID: {order?._id || 'Missing'}</li>
          </ul>
          <Button variant="primary" onClick={() => navigate('/orders')}>
            Back to Orders
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <div className="d-flex align-items-center mb-4">
            <Button
              variant="outline-secondary"
              onClick={() => navigate('/orders')}
              className="me-3"
            >
              <FaArrowLeft />
            </Button>
            <div>
              <h2 className="fw-bold mb-0">Order #{order.orderNumber}</h2>
              <small className="text-muted">
                Placed on {formatDate(order.createdAt)}
              </small>
            </div>
          </div>

          <Row>
            {/* Order Status */}
            <Col md={8}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">
                    {getStatusIcon(order.status)}
                    <span className="ms-2">Order Status</span>
                    {getStatusBadge(order.status)}
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <ProgressBar 
                      now={getStatusProgress(order.status)} 
                      variant="success" 
                      className="mb-3"
                    />
                    <div className="d-flex justify-content-between">
                      {getStatusSteps().map((step, index) => (
                        <div key={step.status} className="text-center">
                          <div className={`mb-2 ${order.status === step.status ? 'text-primary' : 'text-muted'}`}>
                            {step.icon}
                          </div>
                          <small className="d-block">{step.label}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {order.statusHistory && Array.isArray(order.statusHistory) && order.statusHistory.length > 0 && (
                    <div>
                      <h6>Status History</h6>
                      <div className="timeline">
                        {order.statusHistory.map((status, index) => (
                          <div key={index} className="d-flex align-items-center mb-2">
                            <div className="me-3">
                              {getStatusIcon(status.status)}
                            </div>
                            <div className="flex-grow-1">
                              <div className="fw-bold">{status.status.charAt(0).toUpperCase() + status.status.slice(1)}</div>
                              <small className="text-muted">
                                {formatDate(status.timestamp)}
                                {status.note && ` - ${status.note}`}
                              </small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Order Items */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Order Items</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Variant</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items && Array.isArray(order.items) ? order.items.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src={item.product?.images?.[0]?.url || '/placeholder-product.jpg'}
                                alt={item.productName}
                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                className="rounded me-3"
                              />
                              <div>
                                <div className="fw-bold">{item.productName}</div>
                                <small className="text-muted">{item.product?.brand}</small>
                              </div>
                            </div>
                          </td>
                          <td>{item.variantName}</td>
                          <td>{item.quantity}</td>
                          <td>{formatPrice(item.price)}</td>
                          <td className="fw-bold">{formatPrice(item.total)}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="text-center text-muted">
                            No items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            {/* Order Summary */}
            <Col md={4}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Order Summary</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal:</span>
                    <span>{formatPrice(order.subtotal || 0)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Tax:</span>
                    <span>{formatPrice(order.tax || 0)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Shipping:</span>
                    <span>{formatPrice(order.shipping || 0)}</span>
                  </div>
                  {(order.discount || 0) > 0 && (
                    <div className="d-flex justify-content-between mb-2 text-success">
                      <span>Discount:</span>
                      <span>-{formatPrice(order.discount)}</span>
                    </div>
                  )}
                  {(order.loyaltyPointsUsed || 0) > 0 && (
                    <div className="d-flex justify-content-between mb-2 text-success">
                      <span>Loyalty Points:</span>
                      <span>-{formatPrice(order.loyaltyPointsUsed)}</span>
                    </div>
                  )}
                  <hr />
                  <div className="d-flex justify-content-between fw-bold">
                    <span>Total:</span>
                    <span className="text-primary">{formatPrice(order.total || 0)}</span>
                  </div>
                </Card.Body>
              </Card>

              {/* Shipping Address */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">
                    <FaMapMarkerAlt className="me-2" />
                    Shipping Address
                  </h5>
                </Card.Header>
                <Card.Body>
                  {order.shippingAddress ? (
                    <div>
                      <div className="fw-bold">{order.shippingAddress.fullName || 'N/A'}</div>
                      <div>{order.shippingAddress.street || 'N/A'}</div>
                      <div>
                        {order.shippingAddress.city || 'N/A'}, {order.shippingAddress.state || 'N/A'} {order.shippingAddress.zipCode || 'N/A'}
                      </div>
                      <div>{order.shippingAddress.country || 'N/A'}</div>
                      {order.shippingAddress.phone && (
                        <div className="text-muted">{order.shippingAddress.phone}</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted">No shipping address available</div>
                  )}
                </Card.Body>
              </Card>

              {/* Payment Information */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">
                    <FaCreditCard className="me-2" />
                    Payment Information
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Method:</span>
                    <span className="text-capitalize">{order.paymentMethod ? order.paymentMethod.replace('_', ' ') : 'N/A'}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Status:</span>
                    <Badge bg={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                      {order.paymentStatus || 'Unknown'}
                    </Badge>
                  </div>
                  {order.paymentDate && (
                    <div className="d-flex justify-content-between">
                      <span>Paid on:</span>
                      <span>{formatDate(order.paymentDate)}</span>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Action Buttons */}
              <div className="d-grid gap-2">
                {canCancel() && (
                  <Button variant="outline-danger" onClick={handleCancelOrder}>
                    Cancel Order
                  </Button>
                )}
                {canReturn() && (
                  <Button variant="outline-warning" onClick={handleReturnOrder}>
                    Return Order
                  </Button>
                )}
                <Button variant="outline-primary" as={Link} to="/products">
                  Continue Shopping
                </Button>
              </div>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderDetail;
