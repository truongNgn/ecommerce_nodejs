import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tab, Tabs, Badge, Table, Modal } from 'react-bootstrap';
import { FaUser, FaMapMarkerAlt, FaKey, FaShoppingBag, FaStar, FaPlus, FaEdit, FaTrash, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';
import { formatPrice, formatDate } from '../utils/format';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Profile form
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phone: ''
  });
  const [profileErrors, setProfileErrors] = useState({});
  
  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  
  // Address management
  const [addresses, setAddresses] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Vietnam',
    phone: '',
    type: 'shipping',
    isDefault: false
  });
  const [addressErrors, setAddressErrors] = useState({});
  
  // Orders
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || ''
      });
      
      loadAddresses();
      loadOrders();
    }
  }, [user]);

  const loadAddresses = async () => {
    try {
      const response = await api.get(api.endpoints.users.addresses.list);
      setAddresses(response.data.data.addresses || []);
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  };

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await api.get('/users/orders');
      setOrders(response.data.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (profileErrors[name]) {
      setProfileErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const result = await updateProfile({
        fullName: profileForm.fullName,
        phone: profileForm.phone
      });
      
      if (result.success) {
        setSuccess('Profile updated successfully');
        setProfileErrors({});
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Custom validation
    const errors = {};
    
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters';
    } else if (passwordForm.newPassword === passwordForm.currentPassword) {
      errors.newPassword = 'New password must be different from current password';
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const result = await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      
      if (result.success) {
        setSuccess('Password changed successfully');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordErrors({});
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // Address Management Functions
  const handleOpenAddressModal = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        fullName: address.fullName || '',
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zipCode || '',
        country: address.country || 'Vietnam',
        phone: address.phone || '',
        type: address.type || 'shipping',
        isDefault: address.isDefault || false
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        fullName: user?.fullName || '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Vietnam',
        phone: user?.phone || '',
        type: 'shipping',
        isDefault: addresses.length === 0
      });
    }
    setAddressErrors({});
    setShowAddressModal(true);
  };

  const handleCloseAddressModal = () => {
    setShowAddressModal(false);
    setEditingAddress(null);
    setAddressErrors({});
  };

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (addressErrors[name]) {
      setAddressErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateAddress = () => {
    const errors = {};
    
    if (!addressForm.fullName || addressForm.fullName.trim().length < 2) {
      errors.fullName = 'Full name is required (min 2 characters)';
    }
    if (!addressForm.street || addressForm.street.trim().length < 5) {
      errors.street = 'Street address is required (min 5 characters)';
    }
    if (!addressForm.city || addressForm.city.trim().length < 2) {
      errors.city = 'City is required';
    }
    if (!addressForm.state || addressForm.state.trim().length < 2) {
      errors.state = 'State/Province is required';
    }
    if (!addressForm.zipCode || addressForm.zipCode.trim().length < 4) {
      errors.zipCode = 'Zip/Postal code is required (min 4 characters)';
    }
    if (!addressForm.country) {
      errors.country = 'Country is required';
    }
    
    return errors;
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateAddress();
    if (Object.keys(errors).length > 0) {
      setAddressErrors(errors);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      if (editingAddress) {
        // Update existing address
        await api.put(api.endpoints.users.addresses.update(editingAddress._id), addressForm);
        setSuccess('Address updated successfully');
      } else {
        // Add new address
        await api.post(api.endpoints.users.addresses.create, addressForm);
        setSuccess('Address added successfully');
      }
      
      await loadAddresses();
      handleCloseAddressModal();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      await api.delete(api.endpoints.users.addresses.delete(addressId));
      setSuccess('Address deleted successfully');
      await loadAddresses();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete address');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center mb-4">
        <h2 className="mb-0">
          <FaUser className="me-2" />
          My Profile
        </h2>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-4" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Loyalty Points Display */}
      {user && user.loyaltyPoints !== undefined && (
        <Card className="mb-4 bg-light">
          <Card.Body>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h5 className="mb-0">
                  <FaStar className="text-warning me-2" />
                  Loyalty Points
                </h5>
                <p className="text-muted mb-0 mt-1">You can use these points on your next purchase</p>
              </div>
              <div className="text-end">
                <h3 className="mb-0 text-primary">{user.loyaltyPoints || 0} points</h3>
                <small className="text-muted">≈ {formatPrice(user.loyaltyPoints || 0)}</small>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      <Tabs defaultActiveKey="profile" className="mb-4">
        {/* Profile Tab */}
        <Tab eventKey="profile" title="Profile Information">
          <Card>
            <Card.Body>
              <Form onSubmit={handleProfileSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={profileForm.fullName}
                    onChange={handleProfileChange}
                    isInvalid={!!profileErrors.fullName}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {profileErrors.fullName}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={profileForm.email}
                    disabled
                    readOnly
                  />
                  <Form.Text className="text-muted">
                    Email cannot be changed
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    isInvalid={!!profileErrors.phone}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {profileErrors.phone}
                  </Form.Control.Feedback>
                </Form.Group>

                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>

        {/* Addresses Tab */}
        <Tab eventKey="address" title="Shipping Addresses">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaMapMarkerAlt className="me-2" />
                My Addresses
              </h5>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => handleOpenAddressModal()}
                disabled={loading}
              >
                <FaPlus className="me-2" />
                Add New Address
              </Button>
            </Card.Header>
            <Card.Body>
              {addresses.length === 0 ? (
                <Alert variant="info">
                  No addresses found. Add your first delivery address to get started.
                </Alert>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Address</th>
                      <th>Phone</th>
                      <th>Type</th>
                      <th>Default</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addresses.map((address) => (
                      <tr key={address._id}>
                        <td>{address.fullName}</td>
                        <td>
                          {address.street}, {address.city}, {address.state} {address.zipCode}, {address.country}
                        </td>
                        <td>{address.phone || '-'}</td>
                        <td>
                          <Badge bg={address.type === 'default' ? 'primary' : 'secondary'}>
                            {address.type}
                          </Badge>
                        </td>
                        <td>
                          {address.isDefault && (
                            <FaCheckCircle className="text-success" />
                          )}
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleOpenAddressModal(address)}
                            disabled={loading}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteAddress(address._id)}
                            disabled={loading || addresses.length === 1}
                            title={addresses.length === 1 ? 'Cannot delete your only address' : 'Delete address'}
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Password Tab */}
        <Tab eventKey="password" title="Change Password">
          <Card>
            <Card.Body>
              <Form onSubmit={handlePasswordSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Current Password *</Form.Label>
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    isInvalid={!!passwordErrors.currentPassword}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {passwordErrors.currentPassword}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>New Password *</Form.Label>
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    isInvalid={!!passwordErrors.newPassword}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {passwordErrors.newPassword}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Confirm New Password *</Form.Label>
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    isInvalid={!!passwordErrors.confirmPassword}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {passwordErrors.confirmPassword}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Show passwords"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                  />
                </Form.Group>

                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Changing...' : 'Change Password'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>

        {/* Orders Tab */}
        <Tab eventKey="orders" title="Order History">
          <Card>
            <Card.Body>
              {ordersLoading ? (
                <LoadingSpinner message="Loading orders..." />
              ) : orders.length === 0 ? (
                <Alert variant="info">No orders found</Alert>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td>#{order.orderNumber}</td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td>{formatPrice(order.total)}</td>
                        <td>
                          <Badge bg={
                            order.status === 'delivered' ? 'success' :
                            order.status === 'cancelled' ? 'danger' :
                            order.status === 'shipping' ? 'info' :
                            'warning'
                          }>
                            {order.status}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            href={`/orders/${order._id}`}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Address Modal */}
      <Modal show={showAddressModal} onHide={handleCloseAddressModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingAddress ? 'Edit Address' : 'Add New Address'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddressSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={addressForm.fullName}
                    onChange={handleAddressChange}
                    isInvalid={!!addressErrors.fullName}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {addressErrors.fullName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={addressForm.phone}
                    onChange={handleAddressChange}
                    disabled={loading}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Street Address *</Form.Label>
              <Form.Control
                type="text"
                name="street"
                value={addressForm.street}
                onChange={handleAddressChange}
                isInvalid={!!addressErrors.street}
                disabled={loading}
              />
              <Form.Control.Feedback type="invalid">
                {addressErrors.street}
              </Form.Control.Feedback>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>City *</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={addressForm.city}
                    onChange={handleAddressChange}
                    isInvalid={!!addressErrors.city}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {addressErrors.city}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>State/Province *</Form.Label>
                  <Form.Control
                    type="text"
                    name="state"
                    value={addressForm.state}
                    onChange={handleAddressChange}
                    isInvalid={!!addressErrors.state}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {addressErrors.state}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Zip/Postal Code *</Form.Label>
                  <Form.Control
                    type="text"
                    name="zipCode"
                    value={addressForm.zipCode}
                    onChange={handleAddressChange}
                    isInvalid={!!addressErrors.zipCode}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {addressErrors.zipCode}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Country *</Form.Label>
                  <Form.Control
                    type="text"
                    name="country"
                    value={addressForm.country}
                    onChange={handleAddressChange}
                    isInvalid={!!addressErrors.country}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {addressErrors.country}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Address Type</Form.Label>
                  <Form.Select
                    name="type"
                    value={addressForm.type}
                    onChange={handleAddressChange}
                    disabled={loading}
                  >
                    <option value="shipping">Shipping</option>
                    <option value="billing">Billing</option>
                    <option value="default">Default</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>&nbsp;</Form.Label>
                  <Form.Check
                    type="checkbox"
                    name="isDefault"
                    label="Set as default address"
                    checked={addressForm.isDefault}
                    onChange={handleAddressChange}
                    disabled={loading}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseAddressModal} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Address'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Profile;
