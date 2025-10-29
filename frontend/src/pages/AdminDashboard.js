import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Alert, Tab, Tabs, Modal, Form, Pagination } from 'react-bootstrap';
import { FaUsers, FaShoppingBag, FaChartLine, FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';
import { formatPrice, formatDate, formatOrderStatus, getStatusColor } from '../utils/format';

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState({});
  const [advancedDashboardData, setAdvancedDashboardData] = useState({});
  const [dashboardTimeframe, setDashboardTimeframe] = useState('yearly');
  const [dashboardFilters, setDashboardFilters] = useState({
    startDate: '',
    endDate: '',
    year: new Date().getFullYear(),
    quarter: 1,
    month: 1,
    week: 1
  });
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderPagination, setOrderPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [orderFilters, setOrderFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: ''
  });
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  
  // Loading states
  const [usersLoading, setUsersLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [discountsLoading, setDiscountsLoading] = useState(false);
  
  // Product management states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    shortDescription: '',
    brand: '',
    category: '',
    basePrice: '',
    variants: [
      { name: '', price: '', stock: '', sku: '', attributes: {} },
      { name: '', price: '', stock: '', sku: '', attributes: {} }
    ],
    images: [
      { url: '', alt: '', isPrimary: true },
      { url: '', alt: '', isPrimary: false },
      { url: '', alt: '', isPrimary: false }
    ],
    specifications: {}
  });
  const [productFormErrors, setProductFormErrors] = useState({});
  
  // Order management states
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [showOrderStatusModal, setShowOrderStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderStatusForm, setOrderStatusForm] = useState({
    status: '',
    note: ''
  });
  
  // Discount management states
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showDiscountDetailsModal, setShowDiscountDetailsModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [discountForm, setDiscountForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    maxUses: 10,
    minOrderAmount: 0,
    maxDiscountAmount: '',
    applicableCategories: [],
    isActive: true,
    isPublic: true
  });
  const [discountFormErrors, setDiscountFormErrors] = useState({});

  useEffect(() => {
    if (!isAdmin) {
      window.location.href = '/';
      return;
    }
    
    loadDashboardData();
    loadOrders();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadAdvancedDashboard = async () => {
    try {
      const params = new URLSearchParams({
        timeframe: dashboardTimeframe,
        ...dashboardFilters
      });
      
      const response = await api.get(`/admin/dashboard/advanced?${params}`);
      setAdvancedDashboardData(response.data.data);
    } catch (error) {
      console.error('Failed to load advanced dashboard data:', error);
      setError('Failed to load advanced dashboard data');
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadOrders = async (page = 1, filters = {}) => {
    try {
      setOrdersLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...filters
      });
      
      const response = await api.get(`/admin/orders?${params}`);
      setOrders(response.data.data);
      setOrderPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await api.get('/admin/products');
      setProducts(response.data.data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadDiscounts = async () => {
    try {
      setDiscountsLoading(true);
      const response = await api.get('/admin/discounts');
      setDiscounts(response.data.data);
    } catch (error) {
      console.error('Failed to load discounts:', error);
    } finally {
      setDiscountsLoading(false);
    }
  };

  // User Management Handlers
  const handleToggleUserStatus = async (userId) => {
    try {
      const response = await api.put(`/admin/users/${userId}/toggle-status`);
      await loadUsers();
      alert(response.data.message);
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      alert(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      const response = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      await loadUsers();
      alert(response.data.message);
    } catch (error) {
      console.error('Failed to change user role:', error);
      alert(error.response?.data?.message || 'Failed to change user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This will mark them as inactive.')) {
      return;
    }

    try {
      const response = await api.delete(`/admin/users/${userId}`);
      await loadUsers();
      alert(response.data.message);
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  // Product Management Handlers
  const handleOpenProductModal = (product = null) => {
    if (product) {
      // Edit mode
      setEditingProduct(product);
      setProductForm({
        name: product.name || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        brand: product.brand || '',
        category: product.category || '',
        basePrice: product.basePrice || '',
        variants: product.variants && product.variants.length >= 2 ? product.variants : [
          { name: '', price: '', stock: '', sku: '', attributes: {} },
          { name: '', price: '', stock: '', sku: '', attributes: {} }
        ],
        images: product.images && product.images.length >= 3 ? product.images : [
          { url: '', alt: '', isPrimary: true },
          { url: '', alt: '', isPrimary: false },
          { url: '', alt: '', isPrimary: false }
        ],
        specifications: product.specifications || {}
      });
    } else {
      // Add mode
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        shortDescription: '',
        brand: '',
        category: '',
        basePrice: '',
        variants: [
          { name: '', price: '', stock: '', sku: '', attributes: {} },
          { name: '', price: '', stock: '', sku: '', attributes: {} }
        ],
        images: [
          { url: '', alt: '', isPrimary: true },
          { url: '', alt: '', isPrimary: false },
          { url: '', alt: '', isPrimary: false }
        ],
        specifications: {}
      });
    }
    setProductFormErrors({});
    setShowProductModal(true);
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    setProductFormErrors({});
  };

  const handleProductFormChange = (field, value) => {
    setProductForm(prev => ({
      ...prev,
      [field]: value
    }));
    if (productFormErrors[field]) {
      setProductFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...productForm.variants];
    newVariants[index] = {
      ...newVariants[index],
      [field]: value
    };
    setProductForm(prev => ({
      ...prev,
      variants: newVariants
    }));
  };

  const handleAddVariant = () => {
    setProductForm(prev => ({
      ...prev,
      variants: [...prev.variants, { name: '', price: '', stock: '', sku: '', attributes: {} }]
    }));
  };

  const handleRemoveVariant = (index) => {
    if (productForm.variants.length <= 2) {
      alert('Product must have at least 2 variants');
      return;
    }
    const newVariants = productForm.variants.filter((_, i) => i !== index);
    setProductForm(prev => ({
      ...prev,
      variants: newVariants
    }));
  };

  const handleImageChange = (index, field, value) => {
    const newImages = [...productForm.images];
    newImages[index] = {
      ...newImages[index],
      [field]: value
    };
    setProductForm(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const handleAddImage = () => {
    setProductForm(prev => ({
      ...prev,
      images: [...prev.images, { url: '', alt: '', isPrimary: false }]
    }));
  };

  const handleRemoveImage = (index) => {
    if (productForm.images.length <= 3) {
      alert('Product must have at least 3 images');
      return;
    }
    const newImages = productForm.images.filter((_, i) => i !== index);
    setProductForm(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const validateProductForm = () => {
    const errors = {};
    
    if (!productForm.name || productForm.name.trim().length < 3) {
      errors.name = 'Product name is required (min 3 characters)';
    }
    if (!productForm.description || productForm.description.trim().length < 50) {
      errors.description = 'Description is required (min 50 characters)';
    }
    if (!productForm.shortDescription || productForm.shortDescription.trim().length < 10) {
      errors.shortDescription = 'Short description is required (min 10 characters)';
    }
    if (!productForm.brand || productForm.brand.trim().length < 2) {
      errors.brand = 'Brand is required';
    }
    if (!productForm.category) {
      errors.category = 'Category is required';
    }
    if (!productForm.basePrice || parseFloat(productForm.basePrice) <= 0) {
      errors.basePrice = 'Base price must be greater than 0';
    }
    
    // Validate variants
    if (productForm.variants.length < 2) {
      errors.variants = 'Product must have at least 2 variants';
    } else {
      productForm.variants.forEach((variant, index) => {
        if (!variant.name || !variant.price || !variant.stock || !variant.sku) {
          errors[`variant_${index}`] = `Variant ${index + 1}: All fields are required`;
        }
      });
    }
    
    // Validate images
    if (productForm.images.length < 3) {
      errors.images = 'Product must have at least 3 images';
    } else {
      productForm.images.forEach((image, index) => {
        if (!image.url || image.url.trim() === '') {
          errors[`image_${index}`] = `Image ${index + 1}: URL is required`;
        }
      });
    }
    
    return errors;
  };

  const handleProductSubmit = async () => {
    const errors = validateProductForm();
    if (Object.keys(errors).length > 0) {
      setProductFormErrors(errors);
      alert('Please fix all validation errors');
      return;
    }

    try {
      setLoading(true);
      
      const productData = {
        ...productForm,
        basePrice: parseFloat(productForm.basePrice),
        variants: productForm.variants.map(v => ({
          ...v,
          price: parseFloat(v.price),
          stock: parseInt(v.stock)
        }))
      };

      if (editingProduct) {
        // Update
        await api.put(`/admin/products/${editingProduct._id}`, productData);
        alert('Product updated successfully');
      } else {
        // Create
        await api.post('/admin/products', productData);
        alert('Product created successfully');
      }

      await loadProducts();
      handleCloseProductModal();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert(error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await api.delete(`/admin/products/${productId}`);
      setProducts(products.filter(p => p._id !== productId));
      alert('Product deleted successfully');
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product');
    }
  };

  const handleToggleProductStatus = async (productId) => {
    try {
      await api.put(`/admin/products/${productId}/toggle-status`);
      await loadProducts();
      alert('Product status updated successfully');
    } catch (error) {
      console.error('Failed to toggle product status:', error);
      alert('Failed to update product status');
    }
  };

  // Discount Management Handlers
  const handleOpenDiscountModal = (discount = null) => {
    if (discount) {
      // Edit mode
      setEditingDiscount(discount);
      setDiscountForm({
        code: discount.code || '',
        description: discount.description || '',
        discountType: discount.discountType || 'percentage',
        discountValue: discount.discountValue || '',
        maxUses: discount.maxUses || 10,
        minOrderAmount: discount.minOrderAmount || 0,
        maxDiscountAmount: discount.maxDiscountAmount || '',
        applicableCategories: discount.applicableCategories || [],
        isActive: discount.isActive !== undefined ? discount.isActive : true,
        isPublic: discount.isPublic !== undefined ? discount.isPublic : true
      });
    } else {
      // Add mode
      setEditingDiscount(null);
      setDiscountForm({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        maxUses: 10,
        minOrderAmount: 0,
        maxDiscountAmount: '',
        applicableCategories: [],
        isActive: true,
        isPublic: true
      });
    }
    setDiscountFormErrors({});
    setShowDiscountModal(true);
  };

  const handleCloseDiscountModal = () => {
    setShowDiscountModal(false);
    setEditingDiscount(null);
    setDiscountFormErrors({});
  };

  const handleDiscountFormChange = (field, value) => {
    setDiscountForm(prev => ({
      ...prev,
      [field]: value
    }));
    if (discountFormErrors[field]) {
      setDiscountFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateDiscountForm = () => {
    const errors = {};
    
    if (!discountForm.code || discountForm.code.trim().length !== 5) {
      errors.code = 'Discount code must be exactly 5 characters';
    }
    if (!discountForm.description || discountForm.description.trim().length < 5) {
      errors.description = 'Description is required (min 5 characters)';
    }
    if (!discountForm.discountValue || parseFloat(discountForm.discountValue) <= 0) {
      errors.discountValue = 'Discount value must be greater than 0';
    }
    if (discountForm.discountType === 'percentage' && parseFloat(discountForm.discountValue) > 100) {
      errors.discountValue = 'Percentage discount cannot exceed 100%';
    }
    if (!discountForm.maxUses || parseInt(discountForm.maxUses) < 1 || parseInt(discountForm.maxUses) > 10) {
      errors.maxUses = 'Max uses must be between 1 and 10';
    }
    
    return errors;
  };

  const handleDiscountSubmit = async () => {
    const errors = validateDiscountForm();
    if (Object.keys(errors).length > 0) {
      setDiscountFormErrors(errors);
      alert('Please fix all validation errors');
      return;
    }

    try {
      setLoading(true);
      
      const discountData = {
        ...discountForm,
        code: discountForm.code.toUpperCase(),
        discountValue: parseFloat(discountForm.discountValue),
        maxUses: parseInt(discountForm.maxUses),
        minOrderAmount: parseFloat(discountForm.minOrderAmount) || 0,
        maxDiscountAmount: discountForm.maxDiscountAmount ? parseFloat(discountForm.maxDiscountAmount) : undefined
      };

      let response;
      if (editingDiscount) {
        // Update
        console.log('Updating discount with ID:', editingDiscount._id);
        console.log('Update data:', discountData);
        response = await api.put(`/admin/discounts/${editingDiscount._id}`, discountData);
        console.log('Update response:', response.data);
        if (response.data.success) {
          alert('Discount code updated successfully');
        } else {
          alert(response.data.message || 'Failed to update discount code');
          return;
        }
      } else {
        // Create
        console.log('Creating new discount with data:', discountData);
        response = await api.post('/admin/discounts', discountData);
        console.log('Create response:', response.data);
        if (response.data.success) {
          alert('Discount code created successfully');
        } else {
          alert(response.data.message || 'Failed to create discount code');
          return;
        }
      }

      await loadDiscounts();
      handleCloseDiscountModal();
    } catch (error) {
      console.error('Failed to save discount:', error);
      alert(error.response?.data?.message || 'Failed to save discount code');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDiscount = async (discountId) => {
    if (!window.confirm('Are you sure you want to delete this discount code?')) {
      return;
    }

    try {
      setLoading(true);
      console.log('Deleting discount with ID:', discountId);
      const response = await api.delete(`/admin/discounts/${discountId}`);
      console.log('Delete response:', response.data);
      
      if (response.data.success) {
        setDiscounts(discounts.filter(d => d._id !== discountId));
        alert('Discount code deleted successfully');
      } else {
        alert(response.data.message || 'Failed to delete discount code');
      }
    } catch (error) {
      console.error('Failed to delete discount:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to delete discount code';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Order Management Handlers
  const handleViewOrderDetails = async (orderId) => {
    try {
      const response = await api.get(`/admin/orders/${orderId}`);
      setSelectedOrder(response.data.data.order);
      setShowOrderDetailsModal(true);
    } catch (error) {
      console.error('Failed to load order details:', error);
      setError('Failed to load order details');
    }
  };

  const handleOpenOrderStatusModal = (order) => {
    setSelectedOrder(order);
    setOrderStatusForm({
      status: order.status,
      note: ''
    });
    setShowOrderStatusModal(true);
  };

  const handleOrderStatusSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.put(`/admin/orders/${selectedOrder._id}/status`, orderStatusForm);
      await loadOrders(orderPagination.currentPage, orderFilters);
      setShowOrderStatusModal(false);
      setSelectedOrder(null);
      setOrderStatusForm({ status: '', note: '' });
      setError('');
    } catch (error) {
      console.error('Failed to update order status:', error);
      setError('Failed to update order status');
    }
  };

  const handleOrderFilterChange = (field, value) => {
    const newFilters = { ...orderFilters, [field]: value };
    setOrderFilters(newFilters);
    loadOrders(1, newFilters);
  };

  const handleOrderPageChange = (page) => {
    loadOrders(page, orderFilters);
  };

  // Dashboard Handlers
  const handleDashboardTimeframeChange = (timeframe) => {
    setDashboardTimeframe(timeframe);
    // Don't auto-load, let user click "Load Analytics" button
  };

  const handleDashboardFilterChange = (field, value) => {
    const newFilters = { ...dashboardFilters, [field]: value };
    setDashboardFilters(newFilters);
    // Don't auto-load, let user click "Load Analytics" button
  };

  const handleViewDiscountDetails = (discount) => {
    setSelectedDiscount(discount);
    setShowDiscountDetailsModal(true);
  };

  const handleTabSelect = (key) => {
    switch (key) {
      case 'users':
        loadUsers();
        break;
      case 'orders':
        loadOrders();
        break;
      case 'products':
        loadProducts();
        break;
      case 'discounts':
        loadDiscounts();
        break;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <h4>Error Loading Dashboard</h4>
          <p>{error}</p>
          <Button variant="primary" onClick={loadDashboardData}>
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center mb-4">
        <h2 className="mb-0">
          <FaChartLine className="me-2" />
          Admin Dashboard
        </h2>
      </div>

      {/* Dashboard Overview */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaUsers size={32} className="text-primary mb-2" />
              <h4>{dashboardData.stats?.totalUsers || 0}</h4>
              <p className="text-muted mb-0">Total Users</p>
              <small className="text-success">+{dashboardData.stats?.newUsers || 0} new</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaShoppingBag size={32} className="text-success mb-2" />
              <h4>{dashboardData.stats?.totalOrders || 0}</h4>
              <p className="text-muted mb-0">Total Orders</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaChartLine size={32} className="text-warning mb-2" />
              <h4>{formatPrice(dashboardData.stats?.revenue || 0)}</h4>
              <p className="text-muted mb-0">Total Revenue</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaChartLine size={32} className="text-info mb-2" />
              <h4>{dashboardData.stats?.totalProducts || 0}</h4>
              <p className="text-muted mb-0">Total Products</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Advanced Dashboard Controls */}
      <Row className="mb-4">
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Advanced Analytics</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Form.Select
                    value={dashboardTimeframe}
                    onChange={(e) => handleDashboardTimeframeChange(e.target.value)}
                  >
                    <option value="yearly">Yearly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom Date Range</option>
                  </Form.Select>
                </Col>
                {dashboardTimeframe === 'yearly' && (
                  <Col md={3}>
                    <Form.Control
                      type="number"
                      placeholder="Year"
                      value={dashboardFilters.year}
                      onChange={(e) => handleDashboardFilterChange('year', parseInt(e.target.value))}
                    />
                  </Col>
                )}
                {dashboardTimeframe === 'quarterly' && (
                  <>
                    <Col md={2}>
                      <Form.Control
                        type="number"
                        placeholder="Year"
                        value={dashboardFilters.year}
                        onChange={(e) => handleDashboardFilterChange('year', parseInt(e.target.value))}
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Select
                        value={dashboardFilters.quarter}
                        onChange={(e) => handleDashboardFilterChange('quarter', parseInt(e.target.value))}
                      >
                        <option value={1}>Q1</option>
                        <option value={2}>Q2</option>
                        <option value={3}>Q3</option>
                        <option value={4}>Q4</option>
                      </Form.Select>
                    </Col>
                  </>
                )}
                {dashboardTimeframe === 'monthly' && (
                  <>
                    <Col md={2}>
                      <Form.Control
                        type="number"
                        placeholder="Year"
                        value={dashboardFilters.year}
                        onChange={(e) => handleDashboardFilterChange('year', parseInt(e.target.value))}
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Select
                        value={dashboardFilters.month}
                        onChange={(e) => handleDashboardFilterChange('month', parseInt(e.target.value))}
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <option key={month} value={month}>
                            {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </>
                )}
                {dashboardTimeframe === 'weekly' && (
                  <>
                    <Col md={2}>
                      <Form.Control
                        type="number"
                        placeholder="Year"
                        value={dashboardFilters.year}
                        onChange={(e) => handleDashboardFilterChange('year', parseInt(e.target.value))}
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Control
                        type="number"
                        placeholder="Week"
                        value={dashboardFilters.week}
                        onChange={(e) => handleDashboardFilterChange('week', parseInt(e.target.value))}
                      />
                    </Col>
                  </>
                )}
                {dashboardTimeframe === 'custom' && (
                  <>
                    <Col md={2}>
                      <Form.Control
                        type="date"
                        placeholder="Start Date"
                        value={dashboardFilters.startDate}
                        onChange={(e) => handleDashboardFilterChange('startDate', e.target.value)}
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Control
                        type="date"
                        placeholder="End Date"
                        value={dashboardFilters.endDate}
                        onChange={(e) => handleDashboardFilterChange('endDate', e.target.value)}
                      />
                    </Col>
                  </>
                )}
                <Col md={2}>
                  <Button variant="primary" onClick={loadAdvancedDashboard}>
                    Load Analytics
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="overview" onSelect={handleTabSelect}>
        {/* Overview Tab */}
        <Tab eventKey="overview" title="Overview">
          <Row>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Recent Orders</h5>
                </Card.Header>
                <Card.Body>
                  {dashboardData.recentOrders && dashboardData.recentOrders.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {dashboardData.recentOrders.map((order) => (
                        <div key={order._id} className="list-group-item d-flex justify-content-between align-items-center">
                          <div>
                            <strong>#{order.orderNumber}</strong>
                            <br />
                            <small className="text-muted">
                              {order.user?.fullName || 'Guest'} - {formatPrice(order.total)}
                            </small>
                          </div>
                          <Badge bg={getStatusColor(order.status)}>
                            {formatOrderStatus(order.status)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted">No recent orders</p>
                      <Button variant="outline-primary" onClick={() => handleTabSelect('orders')}>
                        View All Orders
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Best Selling Products</h5>
                </Card.Header>
                <Card.Body>
                  {dashboardData.bestSellingProducts && dashboardData.bestSellingProducts.length > 0 ? (
                    <>
                      {/* Simple Bar Chart for Best Selling Products */}
                      <div className="mb-3">
                        <h6>Sales Chart</h6>
                        <div className="d-flex align-items-end" style={{ height: '150px' }}>
                          {dashboardData.bestSellingProducts.map((product, index) => {
                            const maxSales = Math.max(...dashboardData.bestSellingProducts.map(p => p.salesCount || 0));
                            const height = ((product.salesCount || 0) / maxSales) * 100;
                            return (
                              <div key={index} className="d-flex flex-column align-items-center me-2" style={{ flex: 1 }}>
                                <div 
                                  className="bg-success rounded-top" 
                                  style={{ 
                                    height: `${height}%`, 
                                    minHeight: '10px',
                                    width: '100%',
                                    transition: 'height 0.3s ease'
                                  }}
                                  title={`${product.salesCount || 0} sold`}
                                ></div>
                                <small className="mt-1 text-center" style={{ fontSize: '8px' }}>
                                  {product.name.substring(0, 8)}...
                                </small>
                                <small className="text-muted" style={{ fontSize: '9px' }}>
                                  {product.salesCount || 0}
                                </small>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="list-group list-group-flush">
                        {dashboardData.bestSellingProducts.map((product, index) => (
                          <div key={product._id} className="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                              <strong>{product.name}</strong>
                              <br />
                              <small className="text-muted">
                                {formatPrice(product.basePrice)} - {product.salesCount || 0} sold
                              </small>
                            </div>
                            <Badge bg="success">#{index + 1}</Badge>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-muted">No sales data available</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* Analytics Tab */}
        <Tab eventKey="analytics" title="Analytics">
          {advancedDashboardData.analytics ? (
            <Row>
              <Col md={6}>
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Orders Analytics</h6>
                  </Card.Header>
                  <Card.Body>
                    {advancedDashboardData.analytics.orders && advancedDashboardData.analytics.orders.length > 0 ? (
                      <>
                        {/* Simple Bar Chart for Orders */}
                        <div className="mb-3">
                          <h6>Orders Chart</h6>
                          <div className="d-flex align-items-end" style={{ height: '200px' }}>
                            {advancedDashboardData.analytics.orders.map((item, index) => {
                              const maxOrders = Math.max(...advancedDashboardData.analytics.orders.map(i => i.count));
                              const height = (item.count / maxOrders) * 100;
                              return (
                                <div key={index} className="d-flex flex-column align-items-center me-2" style={{ flex: 1 }}>
                                  <div 
                                    className="bg-primary rounded-top" 
                                    style={{ 
                                      height: `${height}%`, 
                                      minHeight: '10px',
                                      width: '100%',
                                      transition: 'height 0.3s ease'
                                    }}
                                    title={`${item.count} orders`}
                                  ></div>
                                  <small className="mt-1 text-center" style={{ fontSize: '10px' }}>
                                    {item._id.year}
                                    {item._id.month && `-${item._id.month}`}
                                    {item._id.quarter && ` Q${item._id.quarter}`}
                                    {item._id.week && ` W${item._id.week}`}
                                  </small>
                                  <small className="text-muted" style={{ fontSize: '9px' }}>
                                    {item.count}
                                  </small>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        <Table responsive>
                          <thead>
                            <tr>
                              <th>Period</th>
                              <th>Orders</th>
                              <th>Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {advancedDashboardData.analytics.orders.map((item, index) => (
                              <tr key={index}>
                                <td>
                                  {item._id.year}
                                  {item._id.month && `-${item._id.month}`}
                                  {item._id.quarter && ` Q${item._id.quarter}`}
                                  {item._id.week && ` W${item._id.week}`}
                                </td>
                                <td>{item.count}</td>
                                <td>{formatPrice(item.totalRevenue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </>
                    ) : (
                      <p className="text-muted">No orders data for selected period</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Revenue Analytics</h6>
                  </Card.Header>
                  <Card.Body>
                    {advancedDashboardData.analytics.revenue && advancedDashboardData.analytics.revenue.length > 0 ? (
                      <>
                        {/* Simple Line Chart for Revenue */}
                        <div className="mb-3">
                          <h6>Revenue Chart</h6>
                          <div className="d-flex align-items-end" style={{ height: '200px' }}>
                            {advancedDashboardData.analytics.revenue.map((item, index) => {
                              const maxRevenue = Math.max(...advancedDashboardData.analytics.revenue.map(i => i.revenue));
                              const height = (item.revenue / maxRevenue) * 100;
                              return (
                                <div key={index} className="d-flex flex-column align-items-center me-2" style={{ flex: 1 }}>
                                  <div 
                                    className="bg-success rounded-top" 
                                    style={{ 
                                      height: `${height}%`, 
                                      minHeight: '10px',
                                      width: '100%',
                                      transition: 'height 0.3s ease'
                                    }}
                                    title={`${formatPrice(item.revenue)} revenue`}
                                  ></div>
                                  <small className="mt-1 text-center" style={{ fontSize: '10px' }}>
                                    {item._id.year}
                                    {item._id.month && `-${item._id.month}`}
                                    {item._id.quarter && ` Q${item._id.quarter}`}
                                    {item._id.week && ` W${item._id.week}`}
                                  </small>
                                  <small className="text-muted" style={{ fontSize: '9px' }}>
                                    {formatPrice(item.revenue)}
                                  </small>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        <Table responsive>
                          <thead>
                            <tr>
                              <th>Period</th>
                              <th>Revenue</th>
                              <th>Profit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {advancedDashboardData.analytics.revenue.map((item, index) => (
                              <tr key={index}>
                                <td>
                                  {item._id.year}
                                  {item._id.month && `-${item._id.month}`}
                                  {item._id.quarter && ` Q${item._id.quarter}`}
                                  {item._id.week && ` W${item._id.week}`}
                                </td>
                                <td>{formatPrice(item.revenue)}</td>
                                <td>{formatPrice(item.profit)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </>
                    ) : (
                      <p className="text-muted">No revenue data for selected period</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Top Products</h6>
                  </Card.Header>
                  <Card.Body>
                    {advancedDashboardData.analytics.products && advancedDashboardData.analytics.products.length > 0 ? (
                      <>
                        {/* Simple Bar Chart for Product Sales */}
                        <div className="mb-3">
                          <h6>Product Sales Chart</h6>
                          <div className="d-flex align-items-end" style={{ height: '200px' }}>
                            {advancedDashboardData.analytics.products.slice(0, 5).map((item, index) => {
                              const maxSold = Math.max(...advancedDashboardData.analytics.products.slice(0, 5).map(i => i.totalSold));
                              const height = (item.totalSold / maxSold) * 100;
                              return (
                                <div key={index} className="d-flex flex-column align-items-center me-2" style={{ flex: 1 }}>
                                  <div 
                                    className="bg-warning rounded-top" 
                                    style={{ 
                                      height: `${height}%`, 
                                      minHeight: '10px',
                                      width: '100%',
                                      transition: 'height 0.3s ease'
                                    }}
                                    title={`${item.totalSold} sold`}
                                  ></div>
                                  <small className="mt-1 text-center" style={{ fontSize: '8px' }}>
                                    {item.product.name.substring(0, 10)}...
                                  </small>
                                  <small className="text-muted" style={{ fontSize: '9px' }}>
                                    {item.totalSold}
                                  </small>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        <Table responsive>
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Sold</th>
                              <th>Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {advancedDashboardData.analytics.products.map((item, index) => (
                              <tr key={index}>
                                <td>{item.product.name}</td>
                                <td>{item.totalSold}</td>
                                <td>{formatPrice(item.totalRevenue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </>
                    ) : (
                      <p className="text-muted">No product data for selected period</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Category Analytics</h6>
                  </Card.Header>
                  <Card.Body>
                    {advancedDashboardData.analytics.categories && advancedDashboardData.analytics.categories.length > 0 ? (
                      <>
                        {/* Simple Pie Chart for Categories */}
                        <div className="mb-3">
                          <h6>Category Revenue Chart</h6>
                          <div className="d-flex flex-wrap">
                            {advancedDashboardData.analytics.categories.map((item, index) => {
                              const totalRevenue = advancedDashboardData.analytics.categories.reduce((sum, cat) => sum + cat.totalRevenue, 0);
                              const percentage = (item.totalRevenue / totalRevenue) * 100;
                              const colors = ['bg-primary', 'bg-success', 'bg-warning', 'bg-info', 'bg-danger', 'bg-secondary'];
                              const colorClass = colors[index % colors.length];
                              
                              return (
                                <div key={index} className="d-flex align-items-center me-3 mb-2">
                                  <div 
                                    className={`${colorClass} rounded me-2`}
                                    style={{ 
                                      width: '20px', 
                                      height: '20px' 
                                    }}
                                  ></div>
                                  <small>
                                    {item._id}: {percentage.toFixed(1)}%
                                  </small>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        <Table responsive>
                          <thead>
                            <tr>
                              <th>Category</th>
                              <th>Sold</th>
                              <th>Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {advancedDashboardData.analytics.categories.map((item, index) => (
                              <tr key={index}>
                                <td>{item._id}</td>
                                <td>{item.totalSold}</td>
                                <td>{formatPrice(item.totalRevenue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </>
                    ) : (
                      <p className="text-muted">No category data for selected period</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          ) : (
            <Row>
              <Col md={12}>
                <Card>
                  <Card.Body className="text-center">
                    <h5>No Analytics Data</h5>
                    <p className="text-muted">Select a time period and click "Load Analytics" to view detailed analytics.</p>
                    <Button variant="primary" onClick={loadAdvancedDashboard}>
                      Load Analytics
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Tab>

        {/* Users Tab */}
        <Tab eventKey="users" title="Users">
          <Card>
            <Card.Header>
              <h5 className="mb-0">User Management</h5>
            </Card.Header>
            <Card.Body>
              {usersLoading ? (
                <LoadingSpinner message="Loading users..." />
              ) : (
                <>
                  {users.length === 0 ? (
                    <Alert variant="info">No users found.</Alert>
                  ) : (
                    <Table responsive striped hover>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Loyalty Points</th>
                          <th>Joined</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((currentUser) => (
                          <tr key={currentUser._id}>
                            <td>{currentUser.fullName}</td>
                            <td>{currentUser.email}</td>
                            <td>{currentUser.phone || '-'}</td>
                            <td>
                              <select
                                className="form-select form-select-sm"
                                value={currentUser.role}
                                onChange={(e) => handleChangeUserRole(currentUser._id, e.target.value)}
                                disabled={currentUser._id === user?.id}
                              >
                                <option value="customer">Customer</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td>
                              <Badge 
                                bg={currentUser.isActive ? 'success' : 'danger'}
                                style={{ cursor: currentUser._id !== user?.id ? 'pointer' : 'default' }}
                                onClick={() => {
                                  if (currentUser._id !== user?.id) {
                                    handleToggleUserStatus(currentUser._id);
                                  }
                                }}
                              >
                                {currentUser.isActive ? 'Active' : 'Banned'}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg="info">
                                {currentUser.loyaltyPoints || 0} pts
                              </Badge>
                            </td>
                            <td>{formatDate(currentUser.createdAt)}</td>
                            <td>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleDeleteUser(currentUser._id)}
                                disabled={currentUser._id === user?.id}
                              >
                                <FaTrash />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Orders Tab */}
        <Tab eventKey="orders" title="Orders">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Order Management</h5>
            </Card.Header>
            <Card.Body>
              {/* Order Filters */}
              <Row className="mb-3">
                <Col md={3}>
                  <Form.Select
                    value={orderFilters.status}
                    onChange={(e) => handleOrderFilterChange('status', e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Control
                    type="date"
                    placeholder="From Date"
                    value={orderFilters.dateFrom}
                    onChange={(e) => handleOrderFilterChange('dateFrom', e.target.value)}
                  />
                </Col>
                <Col md={3}>
                  <Form.Control
                    type="date"
                    placeholder="To Date"
                    value={orderFilters.dateTo}
                    onChange={(e) => handleOrderFilterChange('dateTo', e.target.value)}
                  />
                </Col>
                <Col md={3}>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => {
                      setOrderFilters({ status: '', dateFrom: '', dateTo: '' });
                      loadOrders(1, {});
                    }}
                  >
                    Clear Filters
                  </Button>
                </Col>
              </Row>

              {ordersLoading ? (
                <LoadingSpinner message="Loading orders..." />
              ) : (
                <>
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order._id}>
                          <td>#{order.orderNumber}</td>
                          <td>{order.user?.fullName || 'Guest'}</td>
                          <td>{formatPrice(order.total)}</td>
                          <td>
                            <Badge bg={getStatusColor(order.status)}>
                              {formatOrderStatus(order.status)}
                            </Badge>
                          </td>
                          <td>{formatDate(order.createdAt)}</td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleViewOrderDetails(order._id)}
                              className="me-2"
                            >
                              View Details
                            </Button>
                            <Button 
                              variant="outline-warning" 
                              size="sm"
                              onClick={() => handleOpenOrderStatusModal(order)}
                            >
                              Update Status
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {/* Pagination */}
                  {orderPagination.totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-3">
                      <Pagination>
                        <Pagination.Prev 
                          disabled={!orderPagination.hasPrevPage}
                          onClick={() => handleOrderPageChange(orderPagination.currentPage - 1)}
                        />
                        {Array.from({ length: orderPagination.totalPages }, (_, i) => i + 1).map(page => (
                          <Pagination.Item
                            key={page}
                            active={page === orderPagination.currentPage}
                            onClick={() => handleOrderPageChange(page)}
                          >
                            {page}
                          </Pagination.Item>
                        ))}
                        <Pagination.Next 
                          disabled={!orderPagination.hasNextPage}
                          onClick={() => handleOrderPageChange(orderPagination.currentPage + 1)}
                        />
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Products Tab */}
        <Tab eventKey="products" title="Products">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Product Management</h5>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => handleOpenProductModal()}
              >
                <FaPlus className="me-1" />
                Add Product
              </Button>
            </Card.Header>
            <Card.Body>
              {productsLoading ? (
                <LoadingSpinner message="Loading products..." />
              ) : (
                <>
                  {products.length === 0 ? (
                    <Alert variant="info">No products found. Click "Add Product" to create one.</Alert>
                  ) : (
                    <Table responsive striped hover>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Brand</th>
                          <th>Category</th>
                          <th>Base Price</th>
                          <th>Total Stock</th>
                          <th>Variants</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product._id}>
                            <td>
                              <div className="d-flex align-items-center">
                                {product.images && product.images[0] && (
                                  <img 
                                    src={product.images[0].url} 
                                    alt={product.name}
                                    style={{ width: '40px', height: '40px', objectFit: 'cover', marginRight: '10px' }}
                                  />
                                )}
                                <span>{product.name}</span>
                              </div>
                            </td>
                            <td>{product.brand}</td>
                            <td>
                              <Badge bg="secondary">
                                {product.category?.replace(/-/g, ' ').toUpperCase()}
                              </Badge>
                            </td>
                            <td>{formatPrice(product.basePrice)}</td>
                            <td>
                              <Badge bg={product.totalStock > 0 ? 'success' : 'danger'}>
                                {product.totalStock}
                              </Badge>
                            </td>
                            <td>{product.variants?.length || 0}</td>
                            <td>
                              <Badge 
                                bg={product.isActive ? 'success' : 'secondary'}
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleToggleProductStatus(product._id)}
                              >
                                {product.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-2"
                                onClick={() => handleOpenProductModal(product)}
                              >
                                <FaEdit />
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleDeleteProduct(product._id)}
                              >
                                <FaTrash />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Discounts Tab */}
        <Tab eventKey="discounts" title="Discounts">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Discount Management</h5>
              <Button variant="primary" size="sm" onClick={() => handleOpenDiscountModal()}>
                <FaPlus className="me-1" />
                Add Discount
              </Button>
            </Card.Header>
            <Card.Body>
              {discountsLoading ? (
                <LoadingSpinner message="Loading discounts..." />
              ) : (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th>Value</th>
                      <th>Used/Max</th>
                      <th>Created</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discounts.map((discount) => (
                      <tr key={discount._id}>
                        <td><strong>{discount.code}</strong></td>
                        <td>{discount.description || 'No description'}</td>
                        <td>
                          <Badge bg={discount.discountType === 'percentage' ? 'info' : 'warning'}>
                            {discount.discountType === 'percentage' ? '%' : 'VND'}
                          </Badge>
                        </td>
                        <td>
                          {discount.discountType === 'percentage' 
                            ? `${discount.discountValue}%` 
                            : `${formatPrice(discount.discountValue)}`
                          }
                        </td>
                        <td>
                          <span className={discount.usedCount >= discount.maxUses ? 'text-danger' : 'text-success'}>
                            {discount.usedCount}/{discount.maxUses}
                          </span>
                        </td>
                        <td>{formatDate(discount.createdAt)}</td>
                        <td>
                          <Badge bg={discount.isActive ? 'success' : 'secondary'}>
                            {discount.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button 
                            variant="outline-info" 
                            size="sm" 
                            className="me-1"
                            onClick={() => handleViewDiscountDetails(discount)}
                            title="View Details"
                          >
                            <FaChartLine />
                          </Button>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-1"
                            onClick={() => handleOpenDiscountModal(discount)}
                            title="Edit"
                          >
                            <FaEdit />
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDeleteDiscount(discount._id)}
                            title="Delete"
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
      </Tabs>

      {/* Discount Modal */}
      <Modal show={showDiscountModal} onHide={handleCloseDiscountModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingDiscount ? 'Edit Discount Code' : 'Add New Discount Code'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Code * (5 characters)</Form.Label>
                  <Form.Control
                    type="text"
                    value={discountForm.code}
                    onChange={(e) => handleDiscountFormChange('code', e.target.value.toUpperCase())}
                    maxLength={5}
                    isInvalid={!!discountFormErrors.code}
                    placeholder="ABC12"
                  />
                  <Form.Control.Feedback type="invalid">{discountFormErrors.code}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Description *</Form.Label>
                  <Form.Control
                    type="text"
                    value={discountForm.description}
                    onChange={(e) => handleDiscountFormChange('description', e.target.value)}
                    isInvalid={!!discountFormErrors.description}
                    placeholder="Summer Sale 2024"
                  />
                  <Form.Control.Feedback type="invalid">{discountFormErrors.description}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Type *</Form.Label>
                  <Form.Select
                    value={discountForm.discountType}
                    onChange={(e) => handleDiscountFormChange('discountType', e.target.value)}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (VND)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Value *</Form.Label>
                  <Form.Control
                    type="number"
                    value={discountForm.discountValue}
                    onChange={(e) => handleDiscountFormChange('discountValue', e.target.value)}
                    isInvalid={!!discountFormErrors.discountValue}
                    placeholder={discountForm.discountType === 'percentage' ? '10' : '100000'}
                  />
                  <Form.Control.Feedback type="invalid">{discountFormErrors.discountValue}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Uses * (1-10)</Form.Label>
                  <Form.Control
                    type="number"
                    value={discountForm.maxUses}
                    onChange={(e) => handleDiscountFormChange('maxUses', e.target.value)}
                    isInvalid={!!discountFormErrors.maxUses}
                    min="1"
                    max="10"
                  />
                  <Form.Control.Feedback type="invalid">{discountFormErrors.maxUses}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Minimum Order Amount (VND)</Form.Label>
                  <Form.Control
                    type="number"
                    value={discountForm.minOrderAmount}
                    onChange={(e) => handleDiscountFormChange('minOrderAmount', e.target.value)}
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Maximum Discount Amount (VND)</Form.Label>
                  <Form.Control
                    type="number"
                    value={discountForm.maxDiscountAmount}
                    onChange={(e) => handleDiscountFormChange('maxDiscountAmount', e.target.value)}
                    placeholder="Leave empty for no limit"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Active"
                    checked={discountForm.isActive}
                    onChange={(e) => handleDiscountFormChange('isActive', e.target.checked)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Public (visible to customers)"
                    checked={discountForm.isPublic}
                    onChange={(e) => handleDiscountFormChange('isPublic', e.target.checked)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDiscountModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleDiscountSubmit} disabled={loading}>
            {loading ? 'Saving...' : (editingDiscount ? 'Update Discount' : 'Create Discount')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Discount Details Modal */}
      <Modal show={showDiscountDetailsModal} onHide={() => setShowDiscountDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Discount Code Details: {selectedDiscount?.code}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDiscount && (
            <div>
              {/* Basic Information */}
              <Row className="mb-4">
                <Col md={6}>
                  <h6>Basic Information</h6>
                  <p><strong>Code:</strong> {selectedDiscount.code}</p>
                  <p><strong>Description:</strong> {selectedDiscount.description || 'No description'}</p>
                  <p><strong>Type:</strong> 
                    <Badge bg={selectedDiscount.discountType === 'percentage' ? 'info' : 'warning'} className="ms-2">
                      {selectedDiscount.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                    </Badge>
                  </p>
                  <p><strong>Value:</strong> 
                    {selectedDiscount.discountType === 'percentage' 
                      ? `${selectedDiscount.discountValue}%` 
                      : `${formatPrice(selectedDiscount.discountValue)}`
                    }
                  </p>
                </Col>
                <Col md={6}>
                  <h6>Usage Information</h6>
                  <p><strong>Used:</strong> {selectedDiscount.usedCount}/{selectedDiscount.maxUses}</p>
                  <p><strong>Remaining:</strong> {selectedDiscount.maxUses - selectedDiscount.usedCount}</p>
                  <p><strong>Usage Rate:</strong> {Math.round((selectedDiscount.usedCount / selectedDiscount.maxUses) * 100)}%</p>
                  <p><strong>Status:</strong> 
                    <Badge bg={selectedDiscount.isActive ? 'success' : 'secondary'}>
                      {selectedDiscount.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </p>
                </Col>
              </Row>

              {/* Additional Information */}
              <Row className="mb-4">
                <Col md={6}>
                  <h6>Restrictions</h6>
                  <p><strong>Min Order Amount:</strong> {formatPrice(selectedDiscount.minOrderAmount || 0)}</p>
                  <p><strong>Max Discount Amount:</strong> {selectedDiscount.maxDiscountAmount ? formatPrice(selectedDiscount.maxDiscountAmount) : 'No limit'}</p>
                  <p><strong>Public:</strong> {selectedDiscount.isPublic ? 'Yes' : 'No'}</p>
                </Col>
                <Col md={6}>
                  <h6>Timeline</h6>
                  <p><strong>Created:</strong> {formatDate(selectedDiscount.createdAt)}</p>
                  <p><strong>Last Updated:</strong> {formatDate(selectedDiscount.updatedAt)}</p>
                  <p><strong>Created By:</strong> {selectedDiscount.createdBy?.fullName || 'Unknown'}</p>
                </Col>
              </Row>

              {/* Usage History */}
              {selectedDiscount.usageHistory && selectedDiscount.usageHistory.length > 0 && (
                <div>
                  <h6>Usage History</h6>
                  <Table responsive size="sm">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>User</th>
                        <th>Discount Amount</th>
                        <th>Used At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDiscount.usageHistory.map((usage, index) => (
                        <tr key={index}>
                          <td>{usage.order?.orderNumber || 'N/A'}</td>
                          <td>{usage.user?.fullName || 'Guest'}</td>
                          <td>{formatPrice(usage.discountAmount)}</td>
                          <td>{formatDate(usage.usedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}

              {(!selectedDiscount.usageHistory || selectedDiscount.usageHistory.length === 0) && (
                <Alert variant="info">
                  <strong>No usage history found.</strong> This discount code has not been used yet.
                </Alert>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDiscountDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Product Modal */}
      <Modal show={showProductModal} onHide={handleCloseProductModal} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>{editingProduct ? 'Edit Product' : 'Add New Product'}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Basic Information */}
          <h5 className="mb-3">Basic Information</h5>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Product Name *</Form.Label>
                <Form.Control
                  type="text"
                  value={productForm.name}
                  onChange={(e) => handleProductFormChange('name', e.target.value)}
                  isInvalid={!!productFormErrors.name}
                />
                <Form.Control.Feedback type="invalid">{productFormErrors.name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Brand *</Form.Label>
                <Form.Control
                  type="text"
                  value={productForm.brand}
                  onChange={(e) => handleProductFormChange('brand', e.target.value)}
                  isInvalid={!!productFormErrors.brand}
                />
                <Form.Control.Feedback type="invalid">{productFormErrors.brand}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Category *</Form.Label>
                <Form.Select
                  value={productForm.category}
                  onChange={(e) => handleProductFormChange('category', e.target.value)}
                  isInvalid={!!productFormErrors.category}
                >
                  <option value="">Select category...</option>
                  <option value="laptops">Laptops</option>
                  <option value="desktops">Desktops</option>
                  <option value="processors">Processors</option>
                  <option value="graphics-cards">Graphics Cards</option>
                  <option value="memory">Memory</option>
                  <option value="storage">Storage</option>
                  <option value="motherboards">Motherboards</option>
                  <option value="monitors">Monitors</option>
                  <option value="keyboards">Keyboards</option>
                  <option value="mice">Mice</option>
                  <option value="headsets">Headsets</option>
                  <option value="accessories">Accessories</option>
                  <option value="cooling">Cooling</option>
                  <option value="cases">Cases</option>
                  <option value="power-supplies">Power Supplies</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{productFormErrors.category}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Base Price (VND) *</Form.Label>
                <Form.Control
                  type="number"
                  value={productForm.basePrice}
                  onChange={(e) => handleProductFormChange('basePrice', e.target.value)}
                  isInvalid={!!productFormErrors.basePrice}
                />
                <Form.Control.Feedback type="invalid">{productFormErrors.basePrice}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Short Description * (min 10 characters)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={productForm.shortDescription}
              onChange={(e) => handleProductFormChange('shortDescription', e.target.value)}
              isInvalid={!!productFormErrors.shortDescription}
            />
            <Form.Control.Feedback type="invalid">{productFormErrors.shortDescription}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Description * (min 50 characters)</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={productForm.description}
              onChange={(e) => handleProductFormChange('description', e.target.value)}
              isInvalid={!!productFormErrors.description}
            />
            <Form.Control.Feedback type="invalid">{productFormErrors.description}</Form.Control.Feedback>
          </Form.Group>

          {/* Variants */}
          <h5 className="mb-3">Variants (Minimum 2) *</h5>
          {productFormErrors.variants && <Alert variant="danger">{productFormErrors.variants}</Alert>}
          {productForm.variants.map((variant, index) => (
            <Card key={index} className="mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Variant {index + 1}</h6>
                  {productForm.variants.length > 2 && (
                    <Button variant="danger" size="sm" onClick={() => handleRemoveVariant(index)}>
                      <FaTimes /> Remove
                    </Button>
                  )}
                </div>
                {productFormErrors[`variant_${index}`] && (
                  <Alert variant="danger" className="mb-2">{productFormErrors[`variant_${index}`]}</Alert>
                )}
                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-2">
                      <Form.Label>Name *</Form.Label>
                      <Form.Control
                        type="text"
                        value={variant.name}
                        onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                        placeholder="e.g. 8GB RAM"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-2">
                      <Form.Label>Price (VND) *</Form.Label>
                      <Form.Control
                        type="number"
                        value={variant.price}
                        onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-2">
                      <Form.Label>Stock *</Form.Label>
                      <Form.Control
                        type="number"
                        value={variant.stock}
                        onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-2">
                      <Form.Label>SKU *</Form.Label>
                      <Form.Control
                        type="text"
                        value={variant.sku}
                        onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                        placeholder="PROD-001"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
          <Button variant="outline-primary" size="sm" onClick={handleAddVariant} className="mb-4">
            <FaPlus /> Add Variant
          </Button>

          {/* Images */}
          <h5 className="mb-3">Images (Minimum 3) *</h5>
          {productFormErrors.images && <Alert variant="danger">{productFormErrors.images}</Alert>}
          {productForm.images.map((image, index) => (
            <Card key={index} className="mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Image {index + 1} {image.isPrimary && <Badge bg="primary">Primary</Badge>}</h6>
                  {productForm.images.length > 3 && (
                    <Button variant="danger" size="sm" onClick={() => handleRemoveImage(index)}>
                      <FaTimes /> Remove
                    </Button>
                  )}
                </div>
                {productFormErrors[`image_${index}`] && (
                  <Alert variant="danger" className="mb-2">{productFormErrors[`image_${index}`]}</Alert>
                )}
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-2">
                      <Form.Label>Image URL *</Form.Label>
                      <Form.Control
                        type="text"
                        value={image.url}
                        onChange={(e) => handleImageChange(index, 'url', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-2">
                      <Form.Label>Alt Text</Form.Label>
                      <Form.Control
                        type="text"
                        value={image.alt}
                        onChange={(e) => handleImageChange(index, 'alt', e.target.value)}
                        placeholder="Image description"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                {image.url && (
                  <div className="mt-2">
                    <img src={image.url} alt={image.alt} style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover' }} />
                  </div>
                )}
              </Card.Body>
            </Card>
          ))}
          <Button variant="outline-primary" size="sm" onClick={handleAddImage}>
            <FaPlus /> Add Image
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseProductModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleProductSubmit} disabled={loading}>
            {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Order Details Modal */}
      {showOrderDetailsModal && selectedOrder && (
        <Modal show={showOrderDetailsModal} onHide={() => setShowOrderDetailsModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Order Details - #{selectedOrder.orderNumber}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <h6>Customer Information</h6>
                <p><strong>Name:</strong> {selectedOrder.user?.fullName || 'Guest'}</p>
                <p><strong>Email:</strong> {selectedOrder.user?.email || selectedOrder.guestInfo?.email}</p>
                <p><strong>Phone:</strong> {selectedOrder.user?.phone || selectedOrder.guestInfo?.phone}</p>
              </Col>
              <Col md={6}>
                <h6>Order Information</h6>
                <p><strong>Status:</strong> <Badge bg={getStatusColor(selectedOrder.status)}>{formatOrderStatus(selectedOrder.status)}</Badge></p>
                <p><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                <p><strong>Total:</strong> {formatPrice(selectedOrder.total)}</p>
                {selectedOrder.discountCode && (
                  <p><strong>Discount:</strong> {selectedOrder.discountCode} (-{formatPrice(selectedOrder.discount)})</p>
                )}
                {selectedOrder.loyaltyPointsUsed > 0 && (
                  <p><strong>Loyalty Points:</strong> {selectedOrder.loyaltyPointsUsed} points</p>
                )}
              </Col>
            </Row>

            <hr />

            <h6>Shipping Address</h6>
            <p>
              {selectedOrder.shippingAddress?.fullName}<br />
              {selectedOrder.shippingAddress?.street}<br />
              {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode}<br />
              {selectedOrder.shippingAddress?.country}
            </p>

            <hr />

            <h6>Order Items</h6>
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
                {selectedOrder.items?.map((item, index) => (
                  <tr key={index}>
                    <td>{item.product?.name}</td>
                    <td>{item.variant?.name || 'Default'}</td>
                    <td>{item.quantity}</td>
                    <td>{formatPrice(item.price)}</td>
                    <td>{formatPrice(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
              <>
                <hr />
                <h6>Status History</h6>
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.statusHistory.map((status, index) => (
                      <tr key={index}>
                        <td><Badge bg={getStatusColor(status.status)}>{formatOrderStatus(status.status)}</Badge></td>
                        <td>{formatDate(status.date)}</td>
                        <td>{status.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowOrderDetailsModal(false)}>
              Close
            </Button>
            <Button variant="warning" onClick={() => {
              setShowOrderDetailsModal(false);
              handleOpenOrderStatusModal(selectedOrder);
            }}>
              Update Status
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Order Status Update Modal */}
      {showOrderStatusModal && selectedOrder && (
        <Modal show={showOrderStatusModal} onHide={() => setShowOrderStatusModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Update Order Status - #{selectedOrder.orderNumber}</Modal.Title>
          </Modal.Header>
          <form onSubmit={handleOrderStatusSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={orderStatusForm.status}
                  onChange={(e) => setOrderStatusForm({ ...orderStatusForm, status: e.target.value })}
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Note (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={orderStatusForm.note}
                  onChange={(e) => setOrderStatusForm({ ...orderStatusForm, note: e.target.value })}
                  placeholder="Add a note about this status change..."
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowOrderStatusModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Update Status
              </Button>
            </Modal.Footer>
          </form>
        </Modal>
      )}
    </Container>
  );
};

export default AdminDashboard;
