import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Table } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaShoppingBag, FaClock, FaTruck, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { formatPrice, formatDate } from '../utils/format';

const Orders = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadOrders();
  }, [isAuthenticated, filter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/orders/my', { params });
      const ordersData = response.data.data || response.data || [];
      
      console.log('📦 Frontend received orders:', {
        count: ordersData.length,
        orders: ordersData.map(order => ({
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          hasOrderNumber: !!order.orderNumber,
          hasStatus: !!order.status
        }))
      });
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setError('Failed to load orders');
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
        return <FaShoppingBag className="text-info" />;
      case 'processing':
        return <FaTruck className="text-primary" />;
      case 'shipped':
        return <FaTruck className="text-success" />;
      case 'delivered':
        return <FaCheckCircle className="text-success" />;
      case 'cancelled':
        return <FaTimesCircle className="text-danger" />;
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

  const getItemCount = (order) => {
    if (!order || !order.items || !Array.isArray(order.items)) {
      return 0;
    }
    return order.items.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  const canCancel = (order) => {
    return order && order.status && ['pending', 'confirmed'].includes(order.status);
  };

  const canReturn = (order) => {
    return order && 
           order.status === 'delivered' && 
           order.actualDelivery && 
           (Date.now() - new Date(order.actualDelivery).getTime()) <= (7 * 24 * 60 * 60 * 1000);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      const response = await api.put(`/orders/${orderId}/status`, { 
        status: 'cancelled',
        note: 'Cancelled by customer'
      });
      
      if (response.data.success) {
        loadOrders();
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

  const handleReturnOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to return this order?')) return;
    
    try {
      const response = await api.put(`/orders/${orderId}/status`, { 
        status: 'returned',
        note: 'Returned by customer'
      });
      
      if (response.data.success) {
        loadOrders();
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
    return <LoadingSpinner message="Loading orders..." />;
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <h4>Error Loading Orders</h4>
          <p>{error}</p>
          <Button variant="primary" onClick={loadOrders}>
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold mb-0">My Orders</h2>
            <div className="d-flex gap-2">
              <Button
                variant={filter === 'all' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All Orders
              </Button>
              <Button
                variant={filter === 'pending' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => setFilter('pending')}
              >
                Pending
              </Button>
              <Button
                variant={filter === 'delivered' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => setFilter('delivered')}
              >
                Delivered
              </Button>
            </div>
          </div>

          {orders.length === 0 ? (
            <Card className="text-center py-5">
              <Card.Body>
                <FaShoppingBag size={48} className="text-muted mb-3" />
                <h4>No Orders Found</h4>
                <p className="text-muted mb-4">
                  {filter === 'all' 
                    ? "You haven't placed any orders yet." 
                    : `No ${filter} orders found.`
                  }
                </p>
                <Button variant="primary" as={Link} to="/products">
                  Start Shopping
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <div className="orders-list">
              {orders.map((order) => {
                // Safety check for order data
                if (!order || !order._id || !order.orderNumber) {
                  console.log('⚠️ Skipping invalid order:', {
                    order: order,
                    hasId: !!order?._id,
                    hasOrderNumber: !!order?.orderNumber,
                    isNull: order === null,
                    isUndefined: order === undefined
                  });
                  return null;
                }
                
                return (
                <Card key={order._id} className="mb-3">
                  <Card.Body>
                    <Row className="align-items-center">
                      <Col md={3}>
                        <div className="d-flex align-items-center">
                          {getStatusIcon(order.status)}
                          <div className="ms-2">
                            <h6 className="mb-1">Order #{order.orderNumber}</h6>
                            <small className="text-muted">
                              {formatDate(order.createdAt)}
                            </small>
                          </div>
                        </div>
                      </Col>
                      
                      <Col md={2}>
                        <div>
                          <small className="text-muted">Items</small>
                          <div className="fw-bold">{getItemCount(order)}</div>
                        </div>
                      </Col>
                      
                      <Col md={2}>
                        <div>
                          <small className="text-muted">Total</small>
                          <div className="fw-bold text-primary">
                            {formatPrice(order.total)}
                          </div>
                        </div>
                      </Col>
                      
                      <Col md={2}>
                        <div>
                          <small className="text-muted">Status</small>
                          <div>{getStatusBadge(order.status)}</div>
                        </div>
                      </Col>
                      
                      <Col md={3}>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            as={Link}
                            to={`/orders/${order._id}`}
                          >
                            <FaEye className="me-1" />
                            View Details
                          </Button>
                          
                          {canCancel(order) && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleCancelOrder(order._id)}
                            >
                              Cancel
                            </Button>
                          )}
                          
                          {canReturn(order) && (
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => handleReturnOrder(order._id)}
                            >
                              Return
                            </Button>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
                );
              })}
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Orders;
